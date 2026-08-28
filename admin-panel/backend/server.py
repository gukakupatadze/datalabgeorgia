"""Repair Service CRM API."""

from __future__ import annotations

import logging
import os
import re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import List, Literal, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Query, Request, Response
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

from auth import AuthService, AuthSettings
from models import (
    STATUS_LABELS,
    Activity,
    ActivityCreate,
    AnalyticsPeriod,
    AnalyticsSummary,
    CustomerPortalItem,
    CustomerPortalTicket,
    Folder,
    StatusCounts,
    Ticket,
    TicketCreate,
    TicketItem,
    TicketItemCreate,
    TicketItemUpdate,
    TicketStatus,
    TicketUpdate,
    UserApproval,
    UserCreate,
    UserLogin,
    UserPublic,
    UserRole,
    UserUpdate,
    WebsiteRequestStatus,
    WebsiteRequestType,
    WebsiteServiceRequest,
)
from repository import CRMRepository

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

use_in_memory_db = os.environ.get("USE_IN_MEMORY_DB", "false").lower() == "true"
if use_in_memory_db:
    from mongomock_motor import AsyncMongoMockClient

    client = AsyncMongoMockClient()
else:
    mongo_url = os.environ["MONGO_URL"]
    client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]
repo = CRMRepository(db, use_transactions=not use_in_memory_db)
auth = AuthService(db, AuthSettings.from_environment())

app = FastAPI(title="Repair CRM API")
public_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/api/auth")
users_router = APIRouter(
    prefix="/api/users", dependencies=[Depends(auth.require_admin)]
)
analytics_router = APIRouter(
    prefix="/api/analytics", dependencies=[Depends(auth.require_admin)]
)
portal_router = APIRouter(
    prefix="/api/portal", dependencies=[Depends(auth.current_user)]
)
api_router = APIRouter(prefix="/api", dependencies=[Depends(auth.require_staff)])


class PublicTicketCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=60)
    device_type: str = Field(..., min_length=1, max_length=120)
    problem_description: str = Field(..., min_length=10, max_length=5000)
    urgency: Literal["low", "medium", "high", "critical"] = "medium"


class PublicContactMessage(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    phone: Optional[str] = Field(default="", max_length=60)
    subject: str = Field(..., min_length=5, max_length=300)
    message: str = Field(..., min_length=10, max_length=5000)


class PublicTicketResponse(BaseModel):
    ticket_code: int
    tracking_code: str
    item_position: int = 1
    device_type: str = ""
    device: str = ""
    status: TicketStatus
    created_at: str
    estimated_completion: Optional[str] = None
    price: Optional[float] = None
    progress_percentage: int
    customer_message: str


class WebsiteRequestReview(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(default=None, min_length=7, max_length=60)
    device_type: Optional[str] = Field(default=None, min_length=1, max_length=120)
    device: Optional[str] = Field(default=None, max_length=200)
    problem_description: Optional[str] = Field(
        default=None, min_length=1, max_length=5000
    )
    urgency: Optional[Literal["low", "medium", "high", "critical"]] = None
    cost_estimate: Optional[float] = Field(default=None, ge=0)
    target_ticket_code: Optional[int] = Field(default=None, ge=10001)


class PriceEstimateRequest(BaseModel):
    device_type: Literal["hdd", "ssd", "raid", "usb", "sd"]
    problem_type: Literal["logical", "physical", "water", "fire"]
    urgency: Literal["standard", "urgent", "emergency"]


def _normalize_phone(value: str) -> str:
    """Normalize Georgian local and +995/00995 phone formats for exact matching."""
    digits = re.sub(r"\D", "", value or "")
    if digits.startswith("00995") and len(digits) > 9:
        digits = digits[5:]
    elif digits.startswith("995") and len(digits) > 9:
        digits = digits[3:]
    if len(digits) == 10 and digits.startswith("0"):
        digits = digits[1:]
    return digits


def _reviewed_request_values(
    request: WebsiteServiceRequest, review: WebsiteRequestReview
) -> dict:
    name = (review.name or request.name).strip()
    email = str(review.email or request.email).strip().lower()
    phone = (review.phone or request.phone or "არ არის მითითებული").strip()
    device_type = (review.device_type or request.device_type).strip()
    problem = (review.problem_description or request.problem_description).strip()
    if request.subject and request.subject not in problem:
        problem = f"თემა: {request.subject}\n\n{problem}"
    urgency = review.urgency or request.urgency
    device = (review.device or device_type).strip()
    return {
        "customer_name": name,
        "customer_phone": phone,
        "device_type": device_type,
        "device": device,
        "damage_category": "data_recovery",
        "issue_description": f"{problem}\n\nელფოსტა: {email}",
        "cost_estimate": review.cost_estimate,
        "urgent": urgency in {"high", "critical"},
    }


def _require_role(user, *allowed: UserRole) -> None:
    if user.role not in allowed:
        raise HTTPException(
            status_code=403, detail="You do not have permission for this action"
        )


def _ticket_for_user(ticket: Ticket, user) -> Ticket:
    return ticket


def _require_customer_portal(user) -> None:
    if user.role != UserRole.customer:
        raise HTTPException(status_code=403, detail="Customer portal access required")


@public_router.get("/")
async def root():
    return {"message": "Repair CRM API", "status": "ok"}


@public_router.post("/price-estimate/")
async def price_estimate(payload: PriceEstimateRequest):
    """Return a transparent preliminary estimate for the public calculator."""
    base_prices = {"hdd": 150, "ssd": 300, "raid": 500, "usb": 150, "sd": 150}
    damage_multiplier = {"logical": 1, "physical": 1.5, "water": 2, "fire": 2.5}
    urgency_multiplier = {"standard": 1, "urgent": 1.5, "emergency": 2}
    timeframes = {
        "standard": ("5-7 სამუშაო დღე", "5-7 business days"),
        "urgent": ("2-3 სამუშაო დღე", "2-3 business days"),
        "emergency": ("დაახლოებით 24 საათი", "Approximately 24 hours"),
    }
    amount = round(
        base_prices[payload.device_type]
        * damage_multiplier[payload.problem_type]
        * urgency_multiplier[payload.urgency]
    )
    timeframe_ka, timeframe_en = timeframes[payload.urgency]
    return {
        "estimated_price": amount,
        "currency": "GEL",
        "timeframe_ka": timeframe_ka,
        "timeframe_en": timeframe_en,
    }


@public_router.post("/public/tickets", status_code=201)
async def create_public_ticket(payload: PublicTicketCreate):
    """Queue a website request for administrator review without creating a ticket."""
    request = await repo.create_website_request(
        WebsiteServiceRequest(
            name=payload.name.strip(),
            email=str(payload.email).strip().lower(),
            phone=payload.phone.strip(),
            device_type=payload.device_type.strip(),
            problem_description=payload.problem_description.strip(),
            urgency=payload.urgency,
        )
    )
    return {
        "success": True,
        "message": "Service request is waiting for administrator review",
        "request_id": request.id,
    }


@public_router.post("/public/contact-messages", status_code=201)
async def create_public_contact_message(payload: PublicContactMessage):
    """Queue the homepage contact form in the same administrator inbox."""
    request = await repo.create_website_request(
        WebsiteServiceRequest(
            name=payload.name.strip(),
            email=str(payload.email).strip().lower(),
            phone=(payload.phone or "").strip(),
            device_type="contact_message",
            subject=payload.subject.strip(),
            problem_description=payload.message.strip(),
            request_type=WebsiteRequestType.contact_message,
            urgency="medium",
        )
    )
    return {
        "success": True,
        "message": "Contact message is waiting for administrator review",
        "request_id": request.id,
    }


@public_router.get(
    "/public/tickets/track", response_model=List[PublicTicketResponse]
)
async def track_public_ticket(query: str = Query(..., min_length=4, max_length=60)):
    """Return active devices separately, including multi-ticket sub-codes."""
    clean_query = query.strip()
    code_query = clean_query.lstrip("#")
    code_match = re.fullmatch(r"(\d+)(?:-(\d+))?", code_query)
    requested_code = int(code_match.group(1)) if code_match else None
    requested_position = int(code_match.group(2)) if code_match and code_match.group(2) else None
    phone_query = _normalize_phone(clean_query)
    # A Georgian mobile number such as 574001930 is digits-only and used to be
    # mistaken for a ticket code. Inspect exact codes first, then fall back to
    # normalized phone matching across every stored formatting variant.
    candidates = await repo.list_tickets(limit=5000)
    has_code_match = bool(
        requested_code is not None
        and any(ticket.ticket_code == requested_code for ticket in candidates)
    )

    progress = {
        TicketStatus.new: 10,
        TicketStatus.in_progress: 45,
        TicketStatus.waiting_for_part: 55,
        TicketStatus.ready: 100,
        TicketStatus.could_not_fix: 90,
        TicketStatus.picked_up: 100,
    }
    messages = {
        TicketStatus.new: "თქვენი განაცხადი მიღებულია და დამუშავებას ელოდება.",
        TicketStatus.in_progress: "თქვენს მოწყობილობაზე მუშაობა მიმდინარეობს.",
        TicketStatus.waiting_for_part: "შეკეთებისთვის საჭირო ნაწილის მიღებას ველოდებით.",
        TicketStatus.ready: "მოწყობილობა მზადაა. დეტალებისთვის დაგვიკავშირდით.",
        TicketStatus.could_not_fix: "მოწყობილობის შეკეთება ვერ მოხერხდა. დეტალებისთვის დაგვიკავშირდით.",
        TicketStatus.picked_up: "მოწყობილობა გატანილია.",
    }
    results = []
    for ticket in candidates:
        code_matches = has_code_match and ticket.ticket_code == requested_code
        phone_matches = (
            not has_code_match
            and len(phone_query) >= 7
            and _normalize_phone(ticket.customer_phone) == phone_query
        )
        if not (code_matches or phone_matches):
            continue

        items = ticket.items or [
            TicketItem(
                position=1,
                status=ticket.status,
                device_type=ticket.device_type,
                device=ticket.device,
                serial_number=ticket.serial_number,
                issue_description=ticket.issue_description,
                cost_estimate=ticket.cost_estimate,
                assigned_technician=ticket.assigned_technician,
                part_info=ticket.part_info,
                urgent=ticket.urgent,
                accessories=ticket.accessories,
                accessories_other=ticket.accessories_other,
                created_at=ticket.created_at,
                updated_at=ticket.updated_at,
                resolution=ticket.resolution,
            )
        ]
        is_multi = len(items) > 1
        for item in items:
            if requested_position is not None and item.position != requested_position:
                continue
            if item.status == TicketStatus.picked_up:
                pickup_value = item.picked_up_at or item.updated_at
                try:
                    picked_up_at = datetime.fromisoformat(
                        pickup_value.replace("Z", "+00:00")
                    )
                    if picked_up_at.tzinfo is None:
                        picked_up_at = picked_up_at.replace(tzinfo=timezone.utc)
                except (AttributeError, TypeError, ValueError):
                    continue
                if datetime.now(timezone.utc) - picked_up_at > timedelta(days=30):
                    continue
            tracking_code = (
                f"{ticket.ticket_code}-{item.position}"
                if is_multi
                else str(ticket.ticket_code)
            )
            results.append(
                PublicTicketResponse(
                    ticket_code=ticket.ticket_code,
                    tracking_code=tracking_code,
                    item_position=item.position,
                    device_type=item.device_type or "",
                    device=item.device or "",
                    status=item.status,
                    created_at=item.created_at or ticket.created_at,
                    price=item.cost_estimate,
                    progress_percentage=progress.get(item.status, 0),
                    customer_message=messages.get(item.status, ""),
                )
            )

    if not results:
        raise HTTPException(status_code=404, detail="Active ticket not found")
    return sorted(results, key=lambda entry: (entry.ticket_code, entry.item_position))


@api_router.get(
    "/website-requests", response_model=List[WebsiteServiceRequest]
)
async def list_website_requests(user=Depends(auth.current_user)):
    _require_role(user, UserRole.admin)
    return await repo.list_website_requests()


@api_router.get("/website-requests/count")
async def website_request_count(user=Depends(auth.current_user)):
    _require_role(user, UserRole.admin)
    return {"count": await repo.website_request_count()}


@api_router.post(
    "/website-requests/{request_id}/read",
    response_model=WebsiteServiceRequest,
)
async def mark_website_request_read(
    request_id: str, user=Depends(auth.current_user)
):
    _require_role(user, UserRole.admin)
    request = await repo.mark_website_request_read(request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


async def _claim_request_or_409(request_id: str) -> WebsiteServiceRequest:
    request = await repo.claim_website_request(request_id)
    if not request:
        raise HTTPException(
            status_code=409,
            detail="Request was already processed or does not exist",
        )
    return request


@api_router.post("/website-requests/{request_id}/approve", response_model=Ticket)
async def approve_website_request(
    request_id: str,
    review: WebsiteRequestReview,
    user=Depends(auth.current_user),
):
    _require_role(user, UserRole.admin)
    request = await _claim_request_or_409(request_id)
    try:
        ticket = await repo.create_ticket(
            TicketCreate(**_reviewed_request_values(request, review))
        )
        await repo.complete_website_request(
            request_id, WebsiteRequestStatus.approved, ticket, item_position=1
        )
        return ticket
    except Exception:
        await repo.release_website_request(request_id)
        raise


@api_router.post("/website-requests/{request_id}/merge", response_model=Ticket)
async def merge_website_request(
    request_id: str,
    review: WebsiteRequestReview,
    user=Depends(auth.current_user),
):
    _require_role(user, UserRole.admin)
    if review.target_ticket_code is None:
        raise HTTPException(status_code=422, detail="Target ticket code is required")
    target = await repo.get_ticket_by_code(review.target_ticket_code)
    if not target:
        raise HTTPException(status_code=404, detail="Target ticket not found")
    request = await _claim_request_or_409(request_id)
    try:
        values = _reviewed_request_values(request, review)
        ticket = await repo.add_ticket_item(
            target.id,
            TicketItemCreate(
                device_type=values["device_type"],
                device=values["device"],
                damage_category=values["damage_category"],
                issue_description=values["issue_description"],
                cost_estimate=values["cost_estimate"],
                urgent=values["urgent"],
            ),
        )
        if not ticket:
            raise HTTPException(status_code=404, detail="Target ticket not found")
        item_position = max((item.position for item in ticket.items), default=1)
        await repo.complete_website_request(
            request_id,
            WebsiteRequestStatus.merged,
            ticket,
            item_position=item_position,
        )
        return ticket
    except Exception:
        await repo.release_website_request(request_id)
        raise


@api_router.post(
    "/website-requests/{request_id}/reject",
    response_model=WebsiteServiceRequest,
)
async def reject_website_request(
    request_id: str, user=Depends(auth.current_user)
):
    _require_role(user, UserRole.admin)
    await _claim_request_or_409(request_id)
    request = await repo.complete_website_request(
        request_id, WebsiteRequestStatus.rejected
    )
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


@auth_router.get("/config")
async def auth_config():
    """Return only non-secret configuration needed by the login page."""
    return {
        "password_login_enabled": True,
        "registration_enabled": False,
        "google_configured": auth.settings.google_configured,
        "bootstrap_admin_configured": auth.settings.bootstrap_configured,
        "session_hours": auth.settings.session_hours,
    }


@auth_router.post("/login", response_model=UserPublic)
async def password_login(payload: UserLogin, request: Request, response: Response):
    return await auth.password_login(payload, request, response)


@auth_router.get("/google/login")
async def google_login():
    return await auth.begin_google_login()


@auth_router.get("/google/callback")
async def google_callback(
    request: Request,
    code: Optional[str] = None,
    state: Optional[str] = None,
    error: Optional[str] = None,
):
    return await auth.finish_google_login(request, code, state, error)


@auth_router.get("/me", response_model=UserPublic)
async def current_user(user=Depends(auth.current_user)):
    return auth.public_user(user)


@auth_router.post("/logout", status_code=204)
async def logout(request: Request, response: Response, _=Depends(auth.current_user)):
    await auth.logout(request, response)


@users_router.get("", response_model=List[UserPublic])
async def list_users():
    return await auth.list_users()


@users_router.get("/pending-count")
async def pending_user_count():
    return {"count": await auth.pending_count()}


@users_router.post("", response_model=UserPublic, status_code=201)
async def create_user(payload: UserCreate):
    try:
        return await auth.create_user(payload)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=409, detail="This email or phone number is already added"
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@users_router.patch("/{user_id}", response_model=UserPublic)
async def update_user(user_id: str, payload: UserUpdate):
    try:
        user = await auth.update_user(user_id, payload)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=409, detail="This email or phone number is already added"
        ) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@users_router.post("/{user_id}/approve", response_model=UserPublic)
async def approve_user(user_id: str, payload: UserApproval):
    try:
        user = await auth.approve_user(user_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@users_router.post("/{user_id}/reject", response_model=UserPublic)
async def reject_user(user_id: str):
    user = await auth.reject_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@users_router.post("/{user_id}/revoke-sessions")
async def revoke_user_sessions(user_id: str):
    if not await auth.find_user(user_id):
        raise HTTPException(status_code=404, detail="User not found")
    revoked = await auth.revoke_sessions(user_id)
    return {"success": True, "revoked_sessions": revoked}


@portal_router.get("/tickets", response_model=List[CustomerPortalTicket])
async def customer_portal_tickets(user=Depends(auth.current_user)):
    _require_customer_portal(user)
    if not user.phone_normalized:
        raise HTTPException(
            status_code=400, detail="No phone number is linked to this account"
        )
    legal_company = user.company_name if user.role == UserRole.legal_customer else None
    tickets = await repo.list_customer_tickets(user.phone_normalized, legal_company)
    return [
        CustomerPortalTicket(
            ticket_code=ticket.ticket_code,
            device=ticket.device,
            issue_description=ticket.issue_description,
            cost_estimate=ticket.cost_estimate,
            status=ticket.status,
            resolution=ticket.resolution,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
            items=[
                CustomerPortalItem(
                    position=item.position,
                    device=item.device,
                    serial_number=item.serial_number,
                    issue_description=item.issue_description,
                    cost_estimate=item.cost_estimate,
                    status=item.status,
                    resolution=item.resolution,
                    updated_at=item.updated_at,
                )
                for item in ticket.items
            ],
        )
        for ticket in tickets
    ]


@api_router.get("/meta")
async def meta():
    """Static metadata for the frontend (statuses + labels)."""
    return {
        "statuses": [
            {"value": s.value, "label": STATUS_LABELS[s]} for s in TicketStatus
        ],
    }


@api_router.get("/tickets/counts", response_model=StatusCounts)
async def get_counts(user=Depends(auth.current_user)):
    return await repo.counts()


@analytics_router.get("/overview", response_model=AnalyticsSummary)
async def analytics_overview(
    period: AnalyticsPeriod = AnalyticsPeriod.month,
    year: Optional[int] = Query(default=None, ge=2000, le=2100),
    month: Optional[int] = Query(default=None, ge=1, le=12),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
):
    now = datetime.now(timezone(timedelta(hours=4)))
    if period == AnalyticsPeriod.custom:
        if date_from is None or date_to is None:
            raise HTTPException(
                status_code=400,
                detail="date_from and date_to are required for a custom period",
            )
        if date_from > date_to:
            raise HTTPException(
                status_code=400,
                detail="date_from must not be later than date_to",
            )
    selected_year = year or now.year
    selected_month = month or now.month
    if date_from is not None:
        selected_year = date_from.year
    return await repo.analytics(
        period,
        selected_year,
        selected_month,
        date_from=date_from,
        date_to=date_to,
    )


@api_router.get("/companies", response_model=List[str])
async def get_companies():
    return await repo.companies()


@api_router.get("/customers")
async def get_customers(user=Depends(auth.current_user)):
    _require_role(user, UserRole.admin)
    return await repo.customers()


@api_router.get("/tickets", response_model=List[Ticket])
async def list_tickets(
    folder: Optional[Folder] = None,
    status: Optional[TicketStatus] = None,
    statuses: Optional[str] = Query(default=None),
    resolution: Optional[Literal["fixed", "not_fixed"]] = None,
    overdue: bool = False,
    q: Optional[str] = Query(default=None, max_length=200),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    user=Depends(auth.current_user),
):
    status_list = (
        [s.strip() for s in statuses.split(",") if s.strip()] if statuses else None
    )
    tickets = await repo.list_tickets(
        folder=folder,
        status=status,
        statuses=status_list,
        resolution=resolution,
        overdue=overdue,
        q=q,
        offset=offset,
        limit=limit,
    )
    return [_ticket_for_user(ticket, user) for ticket in tickets]


@api_router.post("/tickets", response_model=Ticket, status_code=201)
async def create_ticket(payload: TicketCreate, user=Depends(auth.current_user)):
    _require_role(user, UserRole.admin)
    return await repo.create_ticket(payload)


@api_router.get("/tickets/{ticket_id}", response_model=Ticket)
async def get_ticket(ticket_id: str, user=Depends(auth.current_user)):
    ticket = await repo.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_for_user(ticket, user)


@api_router.put("/tickets/{ticket_id}", response_model=Ticket)
async def update_ticket(
    ticket_id: str, payload: TicketUpdate, user=Depends(auth.current_user)
):
    existing = await repo.get_ticket(ticket_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket = await repo.update_ticket(ticket_id, payload)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_for_user(ticket, user)


@api_router.post("/tickets/{ticket_id}/items", response_model=Ticket, status_code=201)
async def add_ticket_item(
    ticket_id: str, payload: TicketItemCreate, user=Depends(auth.current_user)
):
    _require_role(user, UserRole.admin)
    ticket = await repo.add_ticket_item(ticket_id, payload)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@api_router.put("/tickets/{ticket_id}/items/{item_id}", response_model=Ticket)
async def update_ticket_item(
    ticket_id: str,
    item_id: str,
    payload: TicketItemUpdate,
    user=Depends(auth.current_user),
):
    existing = await repo.get_ticket(ticket_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Ticket not found")
    try:
        ticket = await repo.update_ticket_item(ticket_id, item_id, payload)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return _ticket_for_user(ticket, user)


@api_router.delete("/tickets/{ticket_id}/items/{item_id}", response_model=Ticket)
async def delete_ticket_item(
    ticket_id: str, item_id: str, user=Depends(auth.current_user)
):
    _require_role(user, UserRole.admin)
    try:
        ticket = await repo.delete_ticket_item(ticket_id, item_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@api_router.delete("/tickets/{ticket_id}")
async def delete_ticket(ticket_id: str, user=Depends(auth.current_user)):
    _require_role(user, UserRole.admin)
    ticket = await repo.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ok = await repo.delete_ticket(ticket_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return {"success": True}


@api_router.get("/tickets/{ticket_id}/activities", response_model=List[Activity])
async def list_activities(ticket_id: str, user=Depends(auth.current_user)):
    ticket = await repo.get_ticket(ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return await repo.list_activities(ticket_id)


@api_router.post(
    "/tickets/{ticket_id}/activities", response_model=Activity, status_code=201
)
async def add_note(
    ticket_id: str, payload: ActivityCreate, user=Depends(auth.current_user)
):
    try:
        activity = await repo.add_note(ticket_id, payload.message, payload.item_id)
    except LookupError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    if not activity:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return activity


app.include_router(public_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(analytics_router)
app.include_router(portal_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        origin.strip()
        for origin in os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
        if origin.strip()
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def initialize_database():
    await repo.ensure_indexes()
    await auth.ensure_indexes()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
