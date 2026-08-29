"""Google OpenID Connect authentication and CRM session management."""

from __future__ import annotations

import asyncio
import base64
import hashlib
import logging
import os
import re
import secrets
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Optional
from urllib.parse import urlencode

import bcrypt
import jwt
import requests
from fastapi import HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError
from starlette.responses import RedirectResponse

from models import (
    AccountApprovalStatus,
    CustomerType,
    User,
    UserApproval,
    UserCreate,
    UserLogin,
    UserPublic,
    UserRegister,
    UserRole,
    UserUpdate,
)

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_ISSUERS = {"accounts.google.com", "https://accounts.google.com"}
SESSION_COOKIE = "tecservice_session"
OAUTH_STATE_COOKIE = "tecservice_oauth_state"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _now_iso() -> str:
    return _now().isoformat()


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _pkce_challenge(verifier: str) -> str:
    digest = hashlib.sha256(verifier.encode("ascii")).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")


def _env_bool(name: str, default: bool = False) -> bool:
    value = os.environ.get(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class AuthSettings:
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    frontend_url: str
    initial_admin_email: str
    initial_admin_name: str
    session_hours: int
    cookie_secure: bool
    disabled: bool
    initial_admin_password: str = ""

    @classmethod
    def from_environment(cls) -> "AuthSettings":
        backend_url = os.environ.get("BACKEND_URL", "http://localhost:8000").rstrip("/")
        frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000").rstrip(
            "/"
        )
        try:
            session_hours = max(1, min(int(os.environ.get("SESSION_HOURS", "12")), 168))
        except ValueError:
            session_hours = 12
        return cls(
            google_client_id=os.environ.get("GOOGLE_CLIENT_ID", "").strip(),
            google_client_secret=os.environ.get("GOOGLE_CLIENT_SECRET", "").strip(),
            google_redirect_uri=os.environ.get(
                "GOOGLE_REDIRECT_URI", f"{backend_url}/api/auth/google/callback"
            ).strip(),
            frontend_url=frontend_url,
            initial_admin_email=os.environ.get("INITIAL_ADMIN_EMAIL", "")
            .strip()
            .lower(),
            initial_admin_name=os.environ.get(
                "INITIAL_ADMIN_NAME", "Administrator"
            ).strip()
            or "Administrator",
            session_hours=session_hours,
            cookie_secure=_env_bool("COOKIE_SECURE", False),
            disabled=_env_bool("AUTH_DISABLED", False),
            initial_admin_password=os.environ.get("INITIAL_ADMIN_PASSWORD", ""),
        )

    @property
    def google_configured(self) -> bool:
        return bool(self.google_client_id and self.google_client_secret)

    @property
    def bootstrap_configured(self) -> bool:
        return bool(self.initial_admin_email)


def _password_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt(rounds=12)).decode(
        "ascii"
    )


def _password_matches(password: str, password_hash: Optional[str]) -> bool:
    if not password_hash:
        return False
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("ascii"))
    except (ValueError, TypeError):
        return False


def _normalize_phone(value: Optional[str]) -> str:
    return re.sub(r"\D", "", value or "")


class AuthService:
    """Owns users, one-time OAuth states and opaque application sessions."""

    def __init__(self, db: AsyncIOMotorDatabase, settings: AuthSettings):
        self.db = db
        self.users = db.users
        self.sessions = db.auth_sessions
        self.oauth_states = db.oauth_states
        self.settings = settings
        self._jwk_client = jwt.PyJWKClient(GOOGLE_JWKS_URL, cache_keys=True)

    async def ensure_indexes(self) -> None:
        await self.users.create_index("id", unique=True, name="uq_user_id")
        # Email is optional for phone-based customer accounts; unique only when present.
        try:
            await self.users.drop_index("uq_user_email")
        except Exception:
            pass
        await self.users.create_index(
            "email",
            unique=True,
            partialFilterExpression={"email": {"$type": "string"}},
            name="uq_user_email",
        )
        await self.users.create_index(
            "phone_normalized",
            unique=True,
            partialFilterExpression={"phone_normalized": {"$type": "string"}},
            name="uq_user_phone_normalized",
        )
        await self.users.create_index(
            "google_sub",
            unique=True,
            partialFilterExpression={"google_sub": {"$type": "string"}},
            name="uq_user_google_sub",
        )
        await self.users.create_index(
            [("role", 1), ("is_active", 1), ("full_name", 1)],
            name="ix_user_role_active_name",
        )
        await self.users.create_index(
            [("approval_status", 1), ("created_at", -1)],
            name="ix_user_approval_created",
        )
        await self.sessions.create_index(
            "token_hash", unique=True, name="uq_auth_session_token"
        )
        await self.sessions.create_index(
            "expires_at", expireAfterSeconds=0, name="ttl_auth_session"
        )
        await self.sessions.create_index("user_id", name="ix_auth_session_user")
        await self.oauth_states.create_index(
            "expires_at", expireAfterSeconds=0, name="ttl_oauth_state"
        )

        if self.settings.initial_admin_email:
            initial_password_hash = (
                _password_hash(self.settings.initial_admin_password)
                if self.settings.initial_admin_password
                else None
            )
            admin = User(
                full_name=self.settings.initial_admin_name,
                email=self.settings.initial_admin_email,
                role=UserRole.admin,
                is_primary_admin=True,
                approval_status=AccountApprovalStatus.approved,
                password_hash=initial_password_hash,
            )
            try:
                await self.users.update_one(
                    {"email": self.settings.initial_admin_email},
                    {"$setOnInsert": admin.model_dump(mode="json")},
                    upsert=True,
                )
            except DuplicateKeyError:
                # A concurrent process may have inserted the bootstrap admin.
                pass
            await self.users.update_many(
                {
                    "is_primary_admin": True,
                    "email": {"$ne": self.settings.initial_admin_email},
                },
                {"$set": {"is_primary_admin": False, "updated_at": _now_iso()}},
            )
            await self.users.update_one(
                {"email": self.settings.initial_admin_email},
                {
                    "$set": {
                        "role": UserRole.admin.value,
                        "is_primary_admin": True,
                        "approval_status": AccountApprovalStatus.approved.value,
                        "is_active": True,
                        "updated_at": _now_iso(),
                    }
                },
            )
            if initial_password_hash:
                await self.users.update_one(
                    {
                        "email": self.settings.initial_admin_email,
                        "$or": [
                            {"password_hash": None},
                            {"password_hash": {"$exists": False}},
                        ],
                    },
                    {
                        "$set": {
                            "password_hash": initial_password_hash,
                            "approval_status": AccountApprovalStatus.approved.value,
                            "is_active": True,
                            "updated_at": _now_iso(),
                        }
                    },
                )
        elif not self.settings.disabled:
            logger.warning(
                "INITIAL_ADMIN_EMAIL is not configured; nobody can enter the CRM yet"
            )

    @staticmethod
    def public_user(user: User) -> UserPublic:
        return UserPublic(**user.model_dump())

    def is_primary_admin(self, user: User) -> bool:
        return bool(
            user.is_primary_admin
            or (
                self.settings.initial_admin_email
                and str(user.email or "").lower()
                == self.settings.initial_admin_email
            )
        )

    async def find_user(self, user_id: str) -> Optional[User]:
        doc = await self.users.find_one({"id": user_id}, {"_id": 0})
        return User(**doc) if doc else None

    async def find_user_by_email(self, email: str) -> Optional[User]:
        doc = await self.users.find_one({"email": email.strip().lower()}, {"_id": 0})
        return User(**doc) if doc else None

    async def find_user_by_phone(self, phone: str) -> Optional[User]:
        normalized = _normalize_phone(phone)
        if not normalized:
            return None
        doc = await self.users.find_one({"phone_normalized": normalized}, {"_id": 0})
        return User(**doc) if doc else None

    async def list_users(self) -> list[UserPublic]:
        docs = await self.users.find({}, {"_id": 0}).to_list(500)
        users = [User(**doc) for doc in docs]
        order = {
            AccountApprovalStatus.pending: 0,
            AccountApprovalStatus.approved: 1,
            AccountApprovalStatus.rejected: 2,
        }
        users.sort(
            key=lambda user: (
                not user.is_primary_admin,
                order[user.approval_status],
                not user.is_active,
                user.full_name.casefold(),
            )
        )
        return [self.public_user(user) for user in users]

    async def pending_count(self) -> int:
        return await self.users.count_documents(
            {"approval_status": AccountApprovalStatus.pending.value}
        )

    async def create_user(self, payload: UserCreate) -> UserPublic:
        if payload.role not in {UserRole.admin, UserRole.customer}:
            raise ValueError("Only administrator and customer roles are available")
        phone_normalized = _normalize_phone(payload.phone)
        if (
            payload.role in {UserRole.customer, UserRole.legal_customer}
            and len(phone_normalized) < 7
        ):
            raise ValueError("A valid phone number is required for a customer account")
        if payload.role == UserRole.legal_customer and (
            not (payload.company_name or "").strip()
            or not (payload.tax_id or "").strip()
        ):
            raise ValueError("Company name and tax ID are required for a legal entity")
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            role=payload.role,
            password_hash=_password_hash(payload.password),
            phone=payload.phone,
            phone_normalized=phone_normalized or None,
            company_name=payload.company_name,
            tax_id=payload.tax_id,
            is_active=True,
            approval_status=AccountApprovalStatus.approved,
            registration_method="admin",
        )
        await self.users.insert_one(user.model_dump(mode="json"))
        return self.public_user(user)

    async def register(self, payload: UserRegister) -> UserPublic:
        role = (
            UserRole.legal_customer
            if payload.account_type == CustomerType.legal
            else UserRole.customer
        )
        user = User(
            full_name=payload.full_name,
            email=payload.email,
            role=role,
            is_active=False,
            approval_status=AccountApprovalStatus.pending,
            password_hash=_password_hash(payload.password),
            registration_method="password",
            phone=payload.phone,
            phone_normalized=_normalize_phone(payload.phone),
            company_name=payload.company_name,
            tax_id=payload.tax_id,
        )
        await self.users.insert_one(user.model_dump(mode="json"))
        return self.public_user(user)

    async def approve_user(
        self, user_id: str, payload: UserApproval
    ) -> Optional[UserPublic]:
        if payload.role not in {UserRole.admin, UserRole.customer}:
            raise ValueError("Only administrator and customer roles are available")
        existing = await self.find_user(user_id)
        if not existing:
            return None
        if self.is_primary_admin(existing) and payload.role != UserRole.admin:
            raise ValueError("The primary administrator cannot be demoted")
        if (
            payload.role in {UserRole.customer, UserRole.legal_customer}
            and not existing.phone_normalized
        ):
            raise ValueError(
                "A phone number is required before approving a customer account"
            )
        if payload.role == UserRole.legal_customer and (
            not (existing.company_name or "").strip()
            or not (existing.tax_id or "").strip()
        ):
            raise ValueError(
                "Company name and tax ID are required before approving a legal entity"
            )
        now = _now_iso()
        await self.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "role": payload.role.value,
                    "approval_status": AccountApprovalStatus.approved.value,
                    "is_active": True,
                    "updated_at": now,
                }
            },
        )
        return self.public_user(await self.find_user(user_id))

    async def reject_user(self, user_id: str) -> Optional[UserPublic]:
        existing = await self.find_user(user_id)
        if not existing:
            return None
        if self.is_primary_admin(existing):
            raise ValueError("The primary administrator cannot be rejected")
        await self.users.update_one(
            {"id": user_id},
            {
                "$set": {
                    "approval_status": AccountApprovalStatus.rejected.value,
                    "is_active": False,
                    "updated_at": _now_iso(),
                }
            },
        )
        await self.revoke_sessions(user_id)
        return self.public_user(await self.find_user(user_id))

    async def update_user(
        self, user_id: str, payload: UserUpdate
    ) -> Optional[UserPublic]:
        existing = await self.find_user(user_id)
        if not existing:
            return None

        changes = payload.model_dump(exclude_unset=True, mode="json")
        if self.is_primary_admin(existing) and (
            changes.get("role", UserRole.admin.value) != UserRole.admin.value
            or changes.get("is_active") is False
        ):
            raise ValueError("The primary administrator cannot be disabled or demoted")
        if "phone" in changes:
            normalized = _normalize_phone(changes["phone"])
            changes["phone_normalized"] = normalized or None

        target_role = UserRole(changes.get("role", existing.role.value))
        if target_role not in {UserRole.admin, UserRole.customer}:
            raise ValueError("Only administrator and customer roles are available")
        target_phone = changes.get("phone_normalized", existing.phone_normalized)
        target_company = changes.get("company_name", existing.company_name)
        target_tax_id = changes.get("tax_id", existing.tax_id)
        if (
            target_role in {UserRole.customer, UserRole.legal_customer}
            and not target_phone
        ):
            raise ValueError("A phone number is required for a customer account")
        if target_role == UserRole.legal_customer and (
            not (target_company or "").strip() or not (target_tax_id or "").strip()
        ):
            raise ValueError("Company name and tax ID are required for a legal entity")

        would_remove_admin = existing.role == UserRole.admin and (
            changes.get("role", UserRole.admin.value) != UserRole.admin.value
            or changes.get("is_active", True) is False
        )
        if would_remove_admin:
            active_admins = await self.users.count_documents(
                {"role": UserRole.admin.value, "is_active": True}
            )
            if active_admins <= 1:
                raise ValueError("The last active administrator cannot be disabled")

        if changes:
            changes["updated_at"] = _now_iso()
            await self.users.update_one({"id": user_id}, {"$set": changes})
        if changes.get("is_active") is False:
            await self.revoke_sessions(user_id)
        return self.public_user(await self.find_user(user_id))

    async def delete_user(self, user_id: str, acting_user_id: str) -> bool:
        existing = await self.find_user(user_id)
        if not existing:
            return False
        if self.is_primary_admin(existing):
            raise ValueError("The primary administrator cannot be deleted")
        if existing.id == acting_user_id:
            raise ValueError("You cannot delete your own account")

        if existing.role == UserRole.admin and existing.is_active:
            active_admins = await self.users.count_documents(
                {"role": UserRole.admin.value, "is_active": True}
            )
            if active_admins <= 1:
                raise ValueError("The last active administrator cannot be deleted")

        await self.revoke_sessions(user_id)
        result = await self.users.delete_one({"id": user_id})
        return result.deleted_count == 1

    async def revoke_sessions(self, user_id: str) -> int:
        result = await self.sessions.delete_many({"user_id": user_id})
        return result.deleted_count

    async def _create_session(self, user: User, request: Request) -> tuple[str, int]:
        raw_token = secrets.token_urlsafe(48)
        expires_at = _now() + timedelta(hours=self.settings.session_hours)
        await self.sessions.insert_one(
            {
                "token_hash": _token_hash(raw_token),
                "user_id": user.id,
                "created_at": _now(),
                "expires_at": expires_at,
                "user_agent": request.headers.get("user-agent", "")[:500],
            }
        )
        return raw_token, self.settings.session_hours * 3600

    def _set_session_cookie(self, response: Response, token: str, max_age: int) -> None:
        response.set_cookie(
            SESSION_COOKIE,
            token,
            max_age=max_age,
            httponly=True,
            secure=self.settings.cookie_secure,
            samesite="lax",
            path="/",
        )

    async def password_login(
        self, payload: UserLogin, request: Request, response: Response
    ) -> UserPublic:
        identifier = payload.identifier.strip()
        user = (
            await self.find_user_by_email(identifier)
            if "@" in identifier
            else await self.find_user_by_phone(identifier)
        )
        if not user:
            # Keep response timing closer to the known-user path.
            _password_hash(payload.password)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if user.locked_until and user.locked_until > _now():
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many attempts. Try again in 15 minutes",
            )

        if not _password_matches(payload.password, user.password_hash):
            failed = user.failed_login_count + 1
            changes: dict = {"failed_login_count": failed, "updated_at": _now_iso()}
            if failed >= 5:
                changes["locked_until"] = _now() + timedelta(minutes=15)
                changes["failed_login_count"] = 0
            await self.users.update_one({"id": user.id}, {"$set": changes})
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        if user.approval_status == AccountApprovalStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Registration is waiting for administrator approval",
            )
        if user.approval_status == AccountApprovalStatus.rejected:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Registration was not approved",
            )
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User access is disabled",
            )

        now_iso = _now_iso()
        await self.users.update_one(
            {"id": user.id},
            {
                "$set": {
                    "failed_login_count": 0,
                    "locked_until": None,
                    "last_login_at": now_iso,
                    "updated_at": now_iso,
                }
            },
        )
        token, max_age = await self._create_session(user, request)
        self._set_session_cookie(response, token, max_age)
        refreshed = await self.find_user(user.id)
        return self.public_user(refreshed or user)

    async def current_user(self, request: Request) -> User:
        if self.settings.disabled:
            now = _now_iso()
            return User(
                id="test-admin",
                full_name="Test Administrator",
                email="test-admin@example.com",
                role=UserRole.admin,
                created_at=now,
                updated_at=now,
            )

        token = request.cookies.get(SESSION_COOKIE)
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required",
            )
        session = await self.sessions.find_one(
            {"token_hash": _token_hash(token), "expires_at": {"$gt": _now()}},
            {"_id": 0},
        )
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session expired",
            )
        user = await self.find_user(session["user_id"])
        if (
            not user
            or not user.is_active
            or user.approval_status != AccountApprovalStatus.approved
        ):
            if session:
                await self.sessions.delete_one({"token_hash": session["token_hash"]})
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User access is disabled",
            )
        return user

    async def require_admin(self, request: Request) -> User:
        user = await self.current_user(request)
        if user.role != UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrator access required",
            )
        return user

    async def require_staff(self, request: Request) -> User:
        user = await self.current_user(request)
        if user.role != UserRole.admin:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="The customer portal is not enabled yet",
            )
        return user

    async def begin_google_login(self) -> RedirectResponse:
        if (
            not self.settings.google_configured
            or not self.settings.bootstrap_configured
        ):
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Google authentication is not configured",
            )

        state = secrets.token_urlsafe(32)
        nonce = secrets.token_urlsafe(32)
        verifier = secrets.token_urlsafe(64)
        expires_at = _now() + timedelta(minutes=10)
        await self.oauth_states.insert_one(
            {
                "state": state,
                "nonce": nonce,
                "code_verifier": verifier,
                "expires_at": expires_at,
            }
        )
        params = {
            "client_id": self.settings.google_client_id,
            "redirect_uri": self.settings.google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile",
            "state": state,
            "nonce": nonce,
            "code_challenge": _pkce_challenge(verifier),
            "code_challenge_method": "S256",
            "prompt": "select_account",
        }
        response = RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")
        response.set_cookie(
            OAUTH_STATE_COOKIE,
            state,
            max_age=600,
            httponly=True,
            secure=self.settings.cookie_secure,
            samesite="lax",
            path="/api/auth/google/callback",
        )
        return response

    def _frontend_redirect(self, error: Optional[str] = None) -> RedirectResponse:
        destination = f"{self.settings.frontend_url}/"
        if error:
            destination = (
                f"{self.settings.frontend_url}/login?{urlencode({'error': error})}"
            )
        response = RedirectResponse(destination)
        response.delete_cookie(OAUTH_STATE_COOKIE, path="/api/auth/google/callback")
        return response

    async def finish_google_login(
        self,
        request: Request,
        code: Optional[str],
        state: Optional[str],
        oauth_error: Optional[str],
    ) -> RedirectResponse:
        if oauth_error:
            return self._frontend_redirect("google_cancelled")
        cookie_state = request.cookies.get(OAUTH_STATE_COOKIE)
        if (
            not code
            or not state
            or not cookie_state
            or not secrets.compare_digest(state, cookie_state)
        ):
            return self._frontend_redirect("invalid_state")

        state_doc = await self.oauth_states.find_one_and_delete({"state": state})
        if not state_doc or state_doc["expires_at"] <= _now():
            return self._frontend_redirect("invalid_state")

        try:
            token_response = await asyncio.to_thread(
                requests.post,
                GOOGLE_TOKEN_URL,
                data={
                    "client_id": self.settings.google_client_id,
                    "client_secret": self.settings.google_client_secret,
                    "code": code,
                    "code_verifier": state_doc["code_verifier"],
                    "grant_type": "authorization_code",
                    "redirect_uri": self.settings.google_redirect_uri,
                },
                timeout=15,
            )
            token_response.raise_for_status()
            id_token = token_response.json().get("id_token")
            if not id_token:
                raise ValueError("Google did not return an ID token")
            claims = await asyncio.to_thread(self._verify_id_token, id_token)
            if not secrets.compare_digest(
                str(claims.get("nonce", "")), state_doc["nonce"]
            ):
                raise ValueError("Invalid OpenID nonce")
        except Exception:
            logger.exception("Google authentication failed")
            return self._frontend_redirect("oauth_failed")

        email = str(claims.get("email", "")).strip().lower()
        if not email or claims.get("email_verified") is not True:
            return self._frontend_redirect("email_not_verified")
        user = await self.find_user_by_email(email)
        google_sub = str(claims.get("sub", ""))
        if not google_sub:
            return self._frontend_redirect("account_mismatch")

        if not user:
            pending_user = User(
                full_name=str(claims.get("name", "")).strip() or email.split("@", 1)[0],
                email=email,
                role=UserRole.customer,
                is_active=False,
                approval_status=AccountApprovalStatus.pending,
                registration_method="google",
                google_sub=google_sub,
                picture_url=claims.get("picture"),
            )
            try:
                await self.users.insert_one(pending_user.model_dump(mode="json"))
            except DuplicateKeyError:
                pass
            return self._frontend_redirect("registration_pending")

        if user.google_sub and user.google_sub != google_sub:
            return self._frontend_redirect("account_mismatch")
        if user.approval_status == AccountApprovalStatus.pending:
            return self._frontend_redirect("registration_pending")
        if user.approval_status != AccountApprovalStatus.approved or not user.is_active:
            return self._frontend_redirect("access_denied")

        now_iso = _now_iso()
        update = {
            "google_sub": google_sub,
            "picture_url": claims.get("picture"),
            "last_login_at": now_iso,
            "updated_at": now_iso,
        }
        await self.users.update_one({"id": user.id}, {"$set": update})

        response = self._frontend_redirect()
        raw_token, max_age = await self._create_session(user, request)
        self._set_session_cookie(response, raw_token, max_age)
        return response

    def _verify_id_token(self, id_token: str) -> dict:
        signing_key = self._jwk_client.get_signing_key_from_jwt(id_token)
        claims = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=["RS256"],
            audience=self.settings.google_client_id,
        )
        if claims.get("iss") not in GOOGLE_ISSUERS:
            raise jwt.InvalidIssuerError("Unexpected Google token issuer")
        return claims

    async def logout(self, request: Request, response: Response) -> None:
        token = request.cookies.get(SESSION_COOKIE)
        if token:
            await self.sessions.delete_one({"token_hash": _token_hash(token)})
        response.delete_cookie(SESSION_COOKIE, path="/")
