"""Focused local checks for authentication data and safety guards."""

from __future__ import annotations

import asyncio

from fastapi import HTTPException
from mongomock_motor import AsyncMongoMockClient
from pymongo.errors import DuplicateKeyError
from starlette.requests import Request
from starlette.responses import Response

from auth import AuthService, AuthSettings
from models import (
    AccountApprovalStatus,
    CustomerType,
    UserApproval,
    UserCreate,
    UserLogin,
    UserRegister,
    UserRole,
    UserUpdate,
)


async def check_auth_guards() -> None:
    client = AsyncMongoMockClient()
    settings = AuthSettings(
        google_client_id="",
        google_client_secret="",
        google_redirect_uri="http://localhost:8000/api/auth/google/callback",
        frontend_url="http://localhost:3000",
        initial_admin_email="owner@gmail.com",
        initial_admin_name="Owner Admin",
        session_hours=12,
        cookie_secure=False,
        disabled=False,
    )
    service = AuthService(client.tecservice_auth_test, settings)
    await service.ensure_indexes()

    users = await service.list_users()
    assert len(users) == 1
    assert users[0].email == "owner@gmail.com"
    assert users[0].role == UserRole.admin
    assert users[0].is_active is True
    assert users[0].approval_status == AccountApprovalStatus.approved

    pending = await service.register(
        UserRegister(
            full_name="Pending Customer",
            email="pending@gmail.com",
            password="Secure123",
            account_type=CustomerType.physical,
            phone="555123123",
        )
    )
    assert pending.is_active is False
    assert pending.approval_status == AccountApprovalStatus.pending
    assert pending.role == UserRole.customer
    assert await service.pending_count() == 1

    login_request = Request(
        {"type": "http", "headers": [], "method": "POST", "path": "/api/auth/login"}
    )
    try:
        await service.password_login(
            UserLogin(identifier="pending@gmail.com", password="Secure123"),
            login_request,
            Response(),
        )
    except HTTPException as exc:
        assert exc.status_code == 403
    else:
        raise AssertionError("A pending registration was allowed to sign in")

    approved = await service.approve_user(
        pending.id, UserApproval(role=UserRole.customer)
    )
    assert approved is not None
    assert approved.is_active is True
    assert approved.role == UserRole.customer
    assert approved.approval_status == AccountApprovalStatus.approved
    login_response = Response()
    logged_in = await service.password_login(
        UserLogin(identifier="pending@gmail.com", password="Secure123"),
        login_request,
        login_response,
    )
    assert logged_in.id == pending.id
    assert "tecservice_session=" in login_response.headers["set-cookie"]
    stored = await service.users.find_one({"id": pending.id})
    assert stored["password_hash"] != "Secure123"

    customer = await service.create_user(
        UserCreate(
            full_name="Test Customer",
            email="CUSTOMER@gmail.com",
            password="Secure123",
            role=UserRole.customer,
            phone="555456456",
        )
    )
    assert customer.email == "customer@gmail.com"

    try:
        await service.create_user(
            UserCreate(
                full_name="Forbidden Technician",
                email="forbidden@gmail.com",
                password="Secure123",
                role=UserRole.technician,
            )
        )
    except ValueError:
        pass
    else:
        raise AssertionError("A removed technician role was accepted")

    try:
        await service.update_user(customer.id, UserUpdate(role=UserRole.legal_customer))
    except ValueError:
        pass
    else:
        raise AssertionError("A removed legal-customer role was accepted")

    try:
        await service.create_user(
            UserCreate(
                full_name="Duplicate Customer",
                email="customer@gmail.com",
                password="Secure123",
                role=UserRole.customer,
                phone="555999999",
            )
        )
    except DuplicateKeyError:
        pass
    else:
        raise AssertionError("Duplicate Gmail was not rejected")

    try:
        await service.update_user(users[0].id, UserUpdate(is_active=False))
    except ValueError:
        pass
    else:
        raise AssertionError("The last active administrator was disabled")

    request = Request({"type": "http", "headers": [], "method": "GET", "path": "/"})
    try:
        await service.current_user(request)
    except HTTPException as exc:
        assert exc.status_code == 401
    else:
        raise AssertionError("An unauthenticated request was accepted")

    indexes = await service.sessions.index_information()
    assert indexes["ttl_auth_session"]["expireAfterSeconds"] == 0


if __name__ == "__main__":
    asyncio.run(check_auth_guards())
    print(
        "Auth checks passed: bootstrap admin, normalized unique Gmail, "
        "admin/customer-only roles, last-admin protection, unauthenticated rejection and session TTL"
    )
