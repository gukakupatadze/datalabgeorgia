"""Domain models & enums for the Repair CRM.

Kept isolated from the transport (FastAPI) and storage (Mongo) layers so the
data contract can be reused if we migrate storage to Supabase/Postgres later.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from enum import Enum
from typing import Any, List, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    return str(uuid.uuid4())


def _clean_phone(value: str) -> str:
    return re.sub(r"\D", "", value or "")


def _validate_password(value: str) -> str:
    if len(value.encode("utf-8")) > 72:
        raise ValueError("Password is too long")
    if not any(char.isalpha() for char in value) or not any(
        char.isdigit() for char in value
    ):
        raise ValueError("Password must contain letters and numbers")
    return value


class TicketStatus(str, Enum):
    new = "new"
    in_progress = "in_progress"
    waiting_for_part = "waiting_for_part"
    ready = "ready"
    could_not_fix = "could_not_fix"
    picked_up = "picked_up"


class CustomerType(str, Enum):
    physical = "physical"
    legal = "legal"


class DeviceType(str, Enum):
    laptop = "laptop"
    desktop = "desktop"
    drone = "drone"
    data_recovery = "data_recovery"
    non_standard_board = "non_standard_board"
    phone = "phone"
    tablet = "tablet"
    console = "console"
    television = "television"
    other = "other"


class DamageCategory(str, Enum):
    # Data-recovery categories used by the current CRM forms.
    deleted_data = "deleted_data"
    formatted_media = "formatted_media"
    partition_file_system = "partition_file_system"
    logical_damage = "logical_damage"
    bad_sectors = "bad_sectors"
    mechanical_damage = "mechanical_damage"
    electronic_damage = "electronic_damage"
    firmware_controller = "firmware_controller"
    nand_flash = "nand_flash"
    raid_configuration = "raid_configuration"
    fire_damage = "fire_damage"
    # Legacy values remain readable for older tickets and analytics.
    screen = "screen"
    power_charging = "power_charging"
    battery = "battery"
    keyboard_touchpad = "keyboard_touchpad"
    software = "software"
    overheating = "overheating"
    motherboard = "motherboard"
    liquid_damage = "liquid_damage"
    data_recovery = "data_recovery"
    ports_connectors = "ports_connectors"
    storage = "storage"
    other = "other"


class Folder(str, Enum):
    incoming = "incoming"
    in_progress = "in_progress"
    completed = "completed"
    closed = "closed"


class UserRole(str, Enum):
    admin = "admin"
    receptionist = "receptionist"
    technician = "technician"
    customer = "customer"
    legal_customer = "legal_customer"


class AccountApprovalStatus(str, Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class WebsiteRequestStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    approved = "approved"
    merged = "merged"
    rejected = "rejected"


class WebsiteRequestType(str, Enum):
    service_request = "service_request"
    contact_message = "contact_message"


class InvoiceStatus(str, Enum):
    draft = "draft"
    issued = "issued"
    paid = "paid"


# Which statuses belong to which folder (a folder can hold multiple statuses).
FOLDER_STATUSES: dict[Folder, List[TicketStatus]] = {
    Folder.incoming: [TicketStatus.new],
    Folder.in_progress: [TicketStatus.in_progress, TicketStatus.waiting_for_part],
    Folder.completed: [TicketStatus.ready, TicketStatus.could_not_fix],
    Folder.closed: [TicketStatus.picked_up],
}

# Reverse lookup: status -> folder
STATUS_FOLDER: dict[TicketStatus, Folder] = {
    status: folder
    for folder, statuses in FOLDER_STATUSES.items()
    for status in statuses
}


def folder_for_status(status: TicketStatus) -> Folder:
    return STATUS_FOLDER[status]


STATUS_LABELS: dict[TicketStatus, str] = {
    TicketStatus.new: "New",
    TicketStatus.in_progress: "In Progress",
    TicketStatus.waiting_for_part: "Waiting for Part",
    TicketStatus.ready: "Ready",
    TicketStatus.could_not_fix: "Could Not Fix",
    TicketStatus.picked_up: "Picked Up",
}


class ActivityType(str, Enum):
    created = "created"
    status_change = "status_change"
    updated = "updated"
    note = "note"


# ---------------------------------------------------------------------------
# Ticket
# ---------------------------------------------------------------------------
class TicketBase(BaseModel):
    customer_type: CustomerType = CustomerType.physical
    customer_name: str = Field(..., min_length=1, max_length=200)
    company_name: Optional[str] = Field(default="", max_length=200)
    tax_id: Optional[str] = Field(default="", max_length=60)
    customer_phone: str = Field(..., min_length=1, max_length=60)
    device_type: Optional[str] = Field(default="", max_length=120)
    device: Optional[str] = Field(default="", max_length=200)
    serial_number: Optional[str] = Field(default="", max_length=200)
    damage_category: DamageCategory = DamageCategory.other
    issue_description: str = Field(..., min_length=1, max_length=5000)
    cost_estimate: Optional[float] = Field(default=None, ge=0)
    assigned_technician: Optional[str] = Field(default="", max_length=120)
    part_info: Optional[str] = Field(default="", max_length=2000)
    urgent: bool = False
    accessories: List[str] = Field(default_factory=list)
    accessories_other: Optional[str] = Field(default="", max_length=1000)


class TicketItemBase(BaseModel):
    """A single repair job inside a customer ticket."""

    device_type: Optional[str] = Field(default="", max_length=120)
    device: Optional[str] = Field(default="", max_length=200)
    serial_number: Optional[str] = Field(default="", max_length=200)
    damage_category: DamageCategory = DamageCategory.other
    issue_description: str = Field(..., min_length=1, max_length=5000)
    cost_estimate: Optional[float] = Field(default=None, ge=0)
    assigned_technician: Optional[str] = Field(default="", max_length=120)
    part_info: Optional[str] = Field(default="", max_length=2000)
    urgent: bool = False
    accessories: List[str] = Field(default_factory=list)
    accessories_other: Optional[str] = Field(default="", max_length=1000)


class TicketItemCreate(TicketItemBase):
    pass


class TicketItemUpdate(BaseModel):
    device_type: Optional[str] = Field(default=None, max_length=120)
    device: Optional[str] = Field(default=None, max_length=200)
    serial_number: Optional[str] = Field(default=None, max_length=200)
    damage_category: Optional[DamageCategory] = None
    issue_description: Optional[str] = Field(
        default=None, min_length=1, max_length=5000
    )
    cost_estimate: Optional[float] = Field(default=None, ge=0)
    assigned_technician: Optional[str] = Field(default=None, max_length=120)
    part_info: Optional[str] = Field(default=None, max_length=2000)
    urgent: Optional[bool] = None
    accessories: Optional[List[str]] = None
    accessories_other: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[TicketStatus] = None


class TicketItem(TicketItemBase):
    id: str = Field(default_factory=_new_id)
    position: int = Field(default=1, ge=1)
    status: TicketStatus = TicketStatus.new
    resolution: Optional[str] = None
    # Immutable first-completion timestamp used for revenue/outcome analytics.
    # Older rows without this field fall back to updated_at in the repository.
    completed_at: Optional[str] = None
    picked_up_at: Optional[str] = None
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class TicketCreate(TicketBase):
    # Inherited repair fields are item #1, preserving older API clients.
    additional_items: List[TicketItemCreate] = Field(
        default_factory=list, max_length=49
    )


class TicketUpdate(BaseModel):
    customer_type: Optional[CustomerType] = None
    customer_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    company_name: Optional[str] = Field(default=None, max_length=200)
    tax_id: Optional[str] = Field(default=None, max_length=60)
    customer_phone: Optional[str] = Field(default=None, min_length=1, max_length=60)
    device_type: Optional[str] = Field(default=None, max_length=120)
    device: Optional[str] = Field(default=None, max_length=200)
    serial_number: Optional[str] = Field(default=None, max_length=200)
    damage_category: Optional[DamageCategory] = None
    issue_description: Optional[str] = Field(
        default=None, min_length=1, max_length=5000
    )
    cost_estimate: Optional[float] = Field(default=None, ge=0)
    assigned_technician: Optional[str] = Field(default=None, max_length=120)
    part_info: Optional[str] = Field(default=None, max_length=2000)
    urgent: Optional[bool] = None
    accessories: Optional[List[str]] = None
    accessories_other: Optional[str] = Field(default=None, max_length=1000)
    status: Optional[TicketStatus] = None


class Ticket(TicketBase):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_new_id)
    ticket_code: Optional[int] = None
    resolution: Optional[str] = None  # 'fixed' | 'not_fixed' (set at pickup)
    status: TicketStatus = TicketStatus.new
    folder: Folder = Folder.incoming
    items: List[TicketItem] = Field(default_factory=list)
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


# ---------------------------------------------------------------------------
# Invoice
# ---------------------------------------------------------------------------
class InvoiceLineInput(BaseModel):
    item_id: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    unit_price: float = Field(..., ge=0, allow_inf_nan=False)


class InvoiceCreate(BaseModel):
    ticket_id: str = Field(..., min_length=1, max_length=100)
    lines: List[InvoiceLineInput] = Field(..., min_length=1, max_length=50)
    note: str = Field(default="", max_length=2000)
    status: InvoiceStatus = InvoiceStatus.draft


class InvoiceStatusUpdate(BaseModel):
    status: InvoiceStatus


class InvoiceLine(BaseModel):
    item_id: str
    item_position: int = Field(..., ge=1)
    device: str = ""
    description: str = Field(..., min_length=1, max_length=500)
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., ge=0, allow_inf_nan=False)
    amount: float = Field(..., ge=0, allow_inf_nan=False)


class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_new_id)
    invoice_number: str
    ticket_id: str
    ticket_code: int
    customer_type: CustomerType = CustomerType.physical
    customer_name: str
    customer_phone: str = ""
    company_name: str = ""
    tax_id: str = ""
    lines: List[InvoiceLine]
    note: str = ""
    status: InvoiceStatus = InvoiceStatus.draft
    total_amount: float = Field(..., ge=0, allow_inf_nan=False)
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class WebsiteServiceRequest(BaseModel):
    id: str = Field(default_factory=_new_id)
    name: str = Field(..., min_length=1, max_length=200)
    email: EmailStr
    phone: str = Field(default="", max_length=60)
    device_type: str = Field(..., min_length=1, max_length=120)
    problem_description: str = Field(..., min_length=10, max_length=5000)
    request_type: WebsiteRequestType = WebsiteRequestType.service_request
    subject: str = Field(default="", max_length=300)
    urgency: str = Field(default="medium", max_length=20)
    status: WebsiteRequestStatus = WebsiteRequestStatus.pending
    resulting_ticket_id: Optional[str] = None
    resulting_ticket_code: Optional[int] = None
    resulting_item_position: Optional[int] = None
    read_at: Optional[str] = None
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


# ---------------------------------------------------------------------------
# Activity
# ---------------------------------------------------------------------------
class ActivityCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    item_id: Optional[str] = None


class ActivityChange(BaseModel):
    field: str
    from_value: Any = None
    to_value: Any = None


class Activity(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_new_id)
    ticket_id: str
    item_id: Optional[str] = None
    item_position: Optional[int] = None
    type: ActivityType = ActivityType.note
    message: str
    from_status: Optional[TicketStatus] = None
    to_status: Optional[TicketStatus] = None
    changes: List[ActivityChange] = Field(default_factory=list)
    created_at: str = Field(default_factory=_now_iso)


class StatusCounts(BaseModel):
    new: int = 0
    in_progress: int = 0
    waiting_for_part: int = 0
    ready: int = 0
    could_not_fix: int = 0
    picked_up: int = 0
    overdue: int = 0
    total: int = 0


class AnalyticsPeriod(str, Enum):
    month = "month"
    year = "year"
    custom = "custom"


class AnalyticsTrendPoint(BaseModel):
    key: str
    label: str
    received_tickets: int = 0
    received_items: int = 0
    fixed_items: int = 0
    failed_items: int = 0
    revenue: float = 0


class AnalyticsDamageRow(BaseModel):
    damage: str
    count: int = 0
    fixed_items: int = 0
    failed_items: int = 0
    active_items: int = 0
    revenue: float = 0
    average_revenue: float = 0
    success_rate: float = 0


class AnalyticsDeviceRow(BaseModel):
    device_type: str
    count: int = 0
    fixed_items: int = 0
    failed_items: int = 0
    active_items: int = 0
    revenue: float = 0
    average_revenue: float = 0


class AnalyticsSummary(BaseModel):
    period: AnalyticsPeriod
    year: int
    month: Optional[int] = None
    range_start: str
    range_end: str
    available_years: List[int] = Field(default_factory=list)
    received_tickets: int = 0
    received_items: int = 0
    fixed_items: int = 0
    failed_items: int = 0
    revenue: float = 0
    trend: List[AnalyticsTrendPoint] = Field(default_factory=list)
    common_damage: List[AnalyticsDamageRow] = Field(default_factory=list)
    revenue_damage: List[AnalyticsDamageRow] = Field(default_factory=list)
    failed_damage: List[AnalyticsDamageRow] = Field(default_factory=list)
    damage_categories: List[AnalyticsDamageRow] = Field(default_factory=list)
    device_types: List[AnalyticsDeviceRow] = Field(default_factory=list)


# ---------------------------------------------------------------------------
# Authentication users
# ---------------------------------------------------------------------------
class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=160)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    role: UserRole
    phone: Optional[str] = Field(default="", max_length=60)
    company_name: Optional[str] = Field(default="", max_length=200)
    tax_id: Optional[str] = Field(default="", max_length=60)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)


class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=160)
    email: Optional[EmailStr] = None
    password: str = Field(..., min_length=8, max_length=128)
    account_type: CustomerType = CustomerType.physical
    phone: str = Field(..., min_length=3, max_length=60)
    company_name: Optional[str] = Field(default="", max_length=200)
    tax_id: Optional[str] = Field(default="", max_length=60)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return " ".join(value.strip().split())

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: Optional[EmailStr]) -> Optional[str]:
        return str(value).strip().lower() if value else None

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        if len(_clean_phone(value)) < 7:
            raise ValueError("Enter a valid phone number")
        return value.strip()

    @model_validator(mode="after")
    def validate_legal_registration(self):
        if self.account_type == CustomerType.legal and (
            not (self.company_name or "").strip() or not (self.tax_id or "").strip()
        ):
            raise ValueError("Company name and tax ID are required for a legal entity")
        return self


class UserLogin(BaseModel):
    identifier: str = Field(..., min_length=1, max_length=160)
    password: str = Field(..., min_length=1, max_length=128)

    @field_validator("identifier")
    @classmethod
    def clean_identifier(cls, value: str) -> str:
        return value.strip().lower()


class UserApproval(BaseModel):
    role: UserRole


class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(default=None, min_length=2, max_length=160)
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    phone: Optional[str] = Field(default=None, max_length=60)
    company_name: Optional[str] = Field(default=None, max_length=200)
    tax_id: Optional[str] = Field(default=None, max_length=60)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value: Optional[str]) -> Optional[str]:
        return " ".join(value.strip().split()) if value is not None else None


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=_new_id)
    full_name: str
    email: Optional[EmailStr] = None
    role: UserRole
    is_primary_admin: bool = False
    is_active: bool = True
    approval_status: AccountApprovalStatus = AccountApprovalStatus.approved
    password_hash: Optional[str] = None
    registration_method: str = "admin"
    phone: Optional[str] = ""
    phone_normalized: Optional[str] = None
    company_name: Optional[str] = ""
    tax_id: Optional[str] = ""
    google_sub: Optional[str] = None
    picture_url: Optional[str] = None
    failed_login_count: int = 0
    locked_until: Optional[datetime] = None
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class CustomerPortalItem(BaseModel):
    position: int
    device: Optional[str] = ""
    serial_number: Optional[str] = ""
    issue_description: str
    cost_estimate: Optional[float] = None
    status: TicketStatus
    resolution: Optional[str] = None
    updated_at: str


class CustomerPortalTicket(BaseModel):
    ticket_code: Optional[int] = None
    device: Optional[str] = ""
    issue_description: str
    cost_estimate: Optional[float] = None
    status: TicketStatus
    resolution: Optional[str] = None
    items: List[CustomerPortalItem] = Field(default_factory=list)
    created_at: str
    updated_at: str
    last_login_at: Optional[str] = None


class UserPublic(BaseModel):
    id: str
    full_name: str
    email: Optional[EmailStr] = None
    role: UserRole
    is_primary_admin: bool = False
    is_active: bool
    approval_status: AccountApprovalStatus
    registration_method: str
    phone: Optional[str] = ""
    company_name: Optional[str] = ""
    tax_id: Optional[str] = ""
    picture_url: Optional[str] = None
    created_at: str
    updated_at: str
    last_login_at: Optional[str] = None
