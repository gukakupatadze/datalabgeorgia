"""Storage layer for the Repair CRM.

All MongoDB specifics live here behind a small async repository API. If we swap
to Supabase/Postgres later, only this file needs to change.
"""

from __future__ import annotations

import re
from collections import defaultdict
from contextlib import asynccontextmanager
from datetime import date, datetime, timedelta, timezone
from enum import Enum
from typing import Any, AsyncIterator, List, Optional

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ReturnDocument

from models import (
    FOLDER_STATUSES,
    STATUS_LABELS,
    Activity,
    ActivityChange,
    ActivityType,
    AnalyticsDamageRow,
    AnalyticsDeviceRow,
    AnalyticsPeriod,
    AnalyticsSummary,
    AnalyticsTrendPoint,
    Folder,
    StatusCounts,
    Ticket,
    TicketCreate,
    TicketItem,
    TicketItemCreate,
    TicketItemUpdate,
    TicketStatus,
    TicketUpdate,
    folder_for_status,
    WebsiteRequestStatus,
    WebsiteServiceRequest,
)


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


REPORT_TIMEZONE = timezone(timedelta(hours=4))


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(REPORT_TIMEZONE)


def _period_bounds(
    period: AnalyticsPeriod,
    year: int,
    month: Optional[int],
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
) -> tuple[datetime, datetime]:
    if period == AnalyticsPeriod.custom:
        if date_from is None or date_to is None:
            raise ValueError("Custom analytics period requires both dates")
        start = datetime(
            date_from.year, date_from.month, date_from.day, tzinfo=REPORT_TIMEZONE
        )
        inclusive_end = date_to + timedelta(days=1)
        end = datetime(
            inclusive_end.year,
            inclusive_end.month,
            inclusive_end.day,
            tzinfo=REPORT_TIMEZONE,
        )
        return start, end
    if period == AnalyticsPeriod.month:
        selected_month = month or datetime.now(REPORT_TIMEZONE).month
        start = datetime(year, selected_month, 1, tzinfo=REPORT_TIMEZONE)
        end = (
            datetime(year + 1, 1, 1, tzinfo=REPORT_TIMEZONE)
            if selected_month == 12
            else datetime(year, selected_month + 1, 1, tzinfo=REPORT_TIMEZONE)
        )
        return start, end
    return (
        datetime(year, 1, 1, tzinfo=REPORT_TIMEZONE),
        datetime(year + 1, 1, 1, tzinfo=REPORT_TIMEZONE),
    )


def _is_in_period(value: Optional[str], start: datetime, end: datetime) -> bool:
    parsed = _parse_datetime(value)
    return bool(parsed and start <= parsed < end)


_DAMAGE_CATEGORY_KEYWORDS = {
    "deleted_data": ("წაშლ", "deleted", "delete"),
    "formatted_media": ("ფორმატ", "formatted", "format"),
    "partition_file_system": ("დანაყოფ", "partition", "file system", "filesystem"),
    "logical_damage": ("ლოგიკურ", "logical", "corrupt"),
    "bad_sectors": ("bad sector", "ბედ სექტორ", "ცუდ სექტორ"),
    "mechanical_damage": ("მექანიკ", "თავაკ", "კლიკ", "mechanical", "clicking", "head"),
    "electronic_damage": ("ელექტრონ", "კვება", "pcb", "electronic", "power"),
    "firmware_controller": ("firmware", "კონტროლერ", "controller"),
    "nand_flash": ("nand", "flash", "ფლეშ"),
    "raid_configuration": ("raid", "nas", "parity", "stripe"),
    "fire_damage": ("ცეცხლ", "დამწვ", "fire", "burn"),
    "screen": ("ეკრან", "დისპლე", "screen", "display"),
    "power_charging": ("დამტენ", "დატენ", "კვება", "power", "charg"),
    "battery": ("ბატარე", "battery"),
    "keyboard_touchpad": ("კლავიატურ", "თაჩპად", "keyboard", "touchpad"),
    "software": ("ოპერაციულ", "ვინდოუს", "პროგრამ", "software", "windows", "boot"),
    "overheating": ("გადახურ", "გაგრილ", "ხმაურ", "overheat", "cooling", "fan"),
    "motherboard": ("დედაპლატ", "პლატა", "motherboard", "mainboard"),
    "liquid_damage": ("წყლ", "სითხ", "liquid", "water"),
    "data_recovery": ("მონაცემ", "აღდგენ", "data recovery"),
    "ports_connectors": ("პორტ", "კონექტორ", "hdmi", "usb", "connector", "port"),
    "storage": ("ssd", "hdd", "დისკ", "storage", "drive"),
}

_DEVICE_TYPE_ALIASES = {
    # Current data-recovery device categories and their saved/display labels.
    "hard_disk": "hard_disk",
    "hdd": "hard_disk",
    "hard disk": "hard_disk",
    "hdd / hard disk": "hard_disk",
    "hdd / მყარი დისკი": "hard_disk",
    "მყარი დისკი": "hard_disk",
    "ssd": "ssd",
    "ssd drive": "ssd",
    "ssd disk": "ssd",
    "ssd დისკი": "ssd",
    "სსდ": "ssd",
    "სსდ დისკი": "ssd",
    "external_drive": "external_drive",
    "external drive": "external_drive",
    "გარე დისკი": "external_drive",
    "usb_flash": "usb_flash",
    "usb": "usb_flash",
    "usb flash": "usb_flash",
    "usb flash drive": "usb_flash",
    "usb ფლეშ მეხსიერება": "usb_flash",
    "ფლეშ მეხსიერება": "usb_flash",
    "memory_card": "memory_card",
    "memory card": "memory_card",
    "sd": "memory_card",
    "microsd": "memory_card",
    "sd / microsd": "memory_card",
    "მეხსიერების ბარათი": "memory_card",
    "მეხსიერების ბარათი (sd / microsd)": "memory_card",
    "raid_array": "raid_array",
    "raid": "raid_array",
    "raid array": "raid_array",
    "raid მასივი": "raid_array",
    "nas": "nas",
    "nas storage": "nas",
    "nas საცავი": "nas",
    "server_storage": "server_storage",
    "server storage": "server_storage",
    "სერვერის საცავი": "server_storage",
    "mobile_storage": "mobile_storage",
    "mobile storage": "mobile_storage",
    "phone storage": "mobile_storage",
    "ტელეფონის მეხსიერება": "mobile_storage",
    "other_storage": "other_storage",
    "other data carrier": "other_storage",
    "სხვა მონაცემთა მატარებელი": "other_storage",
    # Legacy categories remain separate in historical reports.
    "laptop": "laptop",
    "ლეპტოპი": "laptop",
    "desktop": "desktop",
    "desktop computer": "desktop",
    "დესკტოპ კომპიუტერი": "desktop",
    "drone": "drone",
    "დრონი": "drone",
    "data_recovery": "data_recovery",
    "data recovery": "data_recovery",
    "მონაცემთა აღდგენა": "data_recovery",
    "non_standard_board": "non_standard_board",
    "non-standard board": "non_standard_board",
    "არასტანდარტული დაფა": "non_standard_board",
    "phone": "phone",
    "ტელეფონი": "phone",
    "tablet": "tablet",
    "ტაბლეტი": "tablet",
    "console": "console",
    "კონსოლი": "console",
    "television": "television",
    "ტელევიზორი": "television",
    "other": "other",
    "სხვა": "other",
}


def _damage_category_key(category: object, description: str) -> str:
    raw_category = getattr(category, "value", category)
    normalized = " ".join(str(raw_category or "").split()).strip().casefold()
    if normalized and normalized != "other":
        return normalized
    searchable = " ".join((description or "").split()).casefold()
    for key, keywords in _DAMAGE_CATEGORY_KEYWORDS.items():
        if any(keyword in searchable for keyword in keywords):
            return key
    return "other"


def _device_type_key(value: str) -> str:
    normalized = " ".join((value or "").split()).strip().casefold()
    if not normalized:
        return "other_storage"
    # Preserve genuinely custom device types instead of silently merging every
    # unknown value into one "other" row in analytics.
    return _DEVICE_TYPE_ALIASES.get(normalized, normalized)


def _audit_value(value: Any) -> Any:
    """Convert model values to JSON/Mongo-safe values used in the audit trail."""
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, list):
        return [_audit_value(item) for item in value]
    if isinstance(value, dict):
        return {key: _audit_value(item) for key, item in value.items()}
    return value


class CRMRepository:
    ITEM_FIELDS = {
        "device_type",
        "device",
        "serial_number",
        "damage_category",
        "issue_description",
        "cost_estimate",
        "assigned_technician",
        "part_info",
        "urgent",
        "accessories",
        "accessories_other",
    }

    def __init__(self, db: AsyncIOMotorDatabase, use_transactions: bool = True):
        self.db = db
        self.tickets = db.tickets
        self.activities = db.activities
        self.counters = db.counters
        self.website_requests = db.website_requests
        self.use_transactions = use_transactions

    @staticmethod
    def _session_kwargs(session) -> dict:
        """Avoid passing unsupported session arguments to the in-memory mock."""
        return {"session": session} if session is not None else {}

    @asynccontextmanager
    async def _transaction(self) -> AsyncIterator[object | None]:
        """Run related writes atomically when backed by a real Mongo replica set."""
        if not self.use_transactions:
            yield None
            return

        async with await self.db.client.start_session() as session:
            async with session.start_transaction():
                yield session

    async def ensure_indexes(self) -> None:
        """Create integrity/performance indexes and realign the ticket counter."""
        highest = await self.tickets.find_one(
            {"ticket_code": {"$type": "number"}},
            {"_id": 0, "ticket_code": 1},
            sort=[("ticket_code", -1)],
        )
        if highest:
            highest_seq = max(int(highest["ticket_code"]) - 10000, 0)
            await self.counters.update_one(
                {"_id": "ticket_code"},
                {"$max": {"seq": highest_seq}},
                upsert=True,
            )

        await self.tickets.create_index("id", unique=True, name="uq_ticket_id")
        await self.tickets.create_index(
            "ticket_code",
            unique=True,
            partialFilterExpression={"ticket_code": {"$type": "number"}},
            name="uq_ticket_code",
        )
        await self.tickets.create_index(
            [("status", 1), ("urgent", -1), ("updated_at", -1)],
            name="ix_ticket_queue",
        )
        await self.tickets.create_index(
            [("status", 1), ("created_at", 1)],
            name="ix_ticket_overdue",
        )
        await self.tickets.create_index(
            [("items.completed_at", 1), ("items.status", 1)],
            name="ix_ticket_item_completed",
        )
        await self.tickets.create_index(
            [("assigned_technician", 1), ("updated_at", -1)],
            name="ix_ticket_technician",
        )
        await self.tickets.create_index(
            [("customer_phone", 1), ("updated_at", -1)],
            name="ix_ticket_customer_phone",
        )
        await self.tickets.create_index(
            [("items.serial_number", 1), ("updated_at", -1)],
            name="ix_ticket_item_serial",
        )
        await self.activities.create_index("id", unique=True, name="uq_activity_id")
        await self.activities.create_index(
            [("ticket_id", 1), ("created_at", -1)],
            name="ix_activity_ticket_created",
        )
        await self.activities.create_index(
            [("ticket_id", 1), ("item_id", 1), ("created_at", -1)],
            name="ix_activity_ticket_item_created",
        )
        await self.website_requests.create_index(
            "id", unique=True, name="uq_website_request_id"
        )
        await self.website_requests.create_index(
            [("status", 1), ("created_at", -1)],
            name="ix_website_request_status_created",
        )
        await self.website_requests.create_index(
            [("status", 1), ("read_at", 1), ("created_at", -1)],
            name="ix_website_request_unread_created",
        )

        # Lossless migration for tickets created before multi-device support.
        cursor = self.tickets.find(
            {"$or": [{"items": {"$exists": False}}, {"items": []}]},
            {"_id": 0},
        )
        async for doc in cursor:
            item = self._legacy_item(doc)
            await self.tickets.update_one(
                {"id": doc["id"]},
                {"$set": {"items": [item.model_dump()]}},
            )

    # ------------------------------------------------------------------
    # Website service requests (reviewed before becoming CRM tickets)
    # ------------------------------------------------------------------
    async def create_website_request(
        self, request: WebsiteServiceRequest
    ) -> WebsiteServiceRequest:
        await self.website_requests.insert_one(request.model_dump(mode="json"))
        return request

    async def list_website_requests(
        self, status: WebsiteRequestStatus = WebsiteRequestStatus.pending
    ) -> List[WebsiteServiceRequest]:
        cursor = self.website_requests.find(
            {"status": status.value}, {"_id": 0}
        ).sort([("created_at", -1)])
        docs = await cursor.limit(200).to_list(200)
        return [WebsiteServiceRequest(**doc) for doc in docs]

    async def website_request_count(self) -> int:
        return await self.website_requests.count_documents(
            {
                "status": WebsiteRequestStatus.pending.value,
                "$or": [{"read_at": None}, {"read_at": {"$exists": False}}],
            }
        )

    async def mark_website_request_read(
        self, request_id: str
    ) -> Optional[WebsiteServiceRequest]:
        doc = await self.website_requests.find_one_and_update(
            {"id": request_id, "status": WebsiteRequestStatus.pending.value},
            {"$set": {"read_at": _now_iso()}},
            return_document=ReturnDocument.AFTER,
        )
        return WebsiteServiceRequest(**doc) if doc else None

    async def claim_website_request(
        self, request_id: str
    ) -> Optional[WebsiteServiceRequest]:
        doc = await self.website_requests.find_one_and_update(
            {
                "id": request_id,
                "status": WebsiteRequestStatus.pending.value,
            },
            {
                "$set": {
                    "status": WebsiteRequestStatus.processing.value,
                    "updated_at": _now_iso(),
                }
            },
            return_document=ReturnDocument.AFTER,
        )
        return WebsiteServiceRequest(**doc) if doc else None

    async def complete_website_request(
        self,
        request_id: str,
        status: WebsiteRequestStatus,
        ticket: Optional[Ticket] = None,
        item_position: Optional[int] = None,
    ) -> Optional[WebsiteServiceRequest]:
        values = {
            "status": status.value,
            "updated_at": _now_iso(),
        }
        if ticket:
            values.update(
                {
                    "resulting_ticket_id": ticket.id,
                    "resulting_ticket_code": ticket.ticket_code,
                    "resulting_item_position": item_position,
                }
            )
        doc = await self.website_requests.find_one_and_update(
            {"id": request_id},
            {"$set": values},
            return_document=ReturnDocument.AFTER,
        )
        return WebsiteServiceRequest(**doc) if doc else None

    async def release_website_request(self, request_id: str) -> None:
        await self.website_requests.update_one(
            {
                "id": request_id,
                "status": WebsiteRequestStatus.processing.value,
            },
            {
                "$set": {
                    "status": WebsiteRequestStatus.pending.value,
                    "updated_at": _now_iso(),
                }
            },
        )

    # ------------------------------------------------------------------
    # Ticket code (sequential, unique 5-digit starting at 10001)
    # ------------------------------------------------------------------
    async def _next_ticket_code(self, session=None) -> int:
        doc = await self.counters.find_one_and_update(
            {"_id": "ticket_code"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
            **self._session_kwargs(session),
        )
        return 10000 + int(doc["seq"])

    # ------------------------------------------------------------------
    # Tickets
    # ------------------------------------------------------------------
    @staticmethod
    def _legacy_item(values: dict | Ticket, position: int = 1) -> TicketItem:
        source = values.model_dump() if isinstance(values, Ticket) else values
        status = TicketStatus(source.get("status", TicketStatus.new))
        completed_at = source.get("completed_at")
        if not completed_at and status in {
            TicketStatus.ready,
            TicketStatus.could_not_fix,
            TicketStatus.picked_up,
        }:
            completed_at = source.get("updated_at")
        return TicketItem(
            position=position,
            status=status,
            resolution=source.get("resolution"),
            completed_at=completed_at,
            created_at=source.get("created_at", _now_iso()),
            updated_at=source.get("updated_at", _now_iso()),
            **{
                field: source.get(field)
                for field in CRMRepository.ITEM_FIELDS
                if field in source
            },
        )

    @staticmethod
    def _aggregate_items(items: List[TicketItem]) -> dict:
        """Build the single outer-ticket summary from independent item states."""
        if not items:
            return {}

        open_items = [item for item in items if item.status != TicketStatus.picked_up]
        if not open_items:
            status = TicketStatus.picked_up
            resolution = (
                "not_fixed"
                if any(item.resolution == "not_fixed" for item in items)
                else "fixed"
            )
        else:
            statuses = {item.status for item in open_items}
            if TicketStatus.in_progress in statuses:
                status = TicketStatus.in_progress
            elif TicketStatus.waiting_for_part in statuses:
                status = TicketStatus.waiting_for_part
            elif TicketStatus.new in statuses:
                status = TicketStatus.new
            elif TicketStatus.ready in statuses:
                status = TicketStatus.ready
            else:
                status = TicketStatus.could_not_fix
            resolution = None

        first = items[0]
        prices = [
            item.cost_estimate for item in items if item.cost_estimate is not None
        ]
        return {
            "status": status.value,
            "folder": folder_for_status(status).value,
            "resolution": resolution,
            "device_type": first.device_type,
            "device": first.device,
            "serial_number": first.serial_number,
            "damage_category": first.damage_category.value,
            "issue_description": first.issue_description,
            "cost_estimate": sum(prices) if prices else None,
            "assigned_technician": first.assigned_technician,
            "part_info": first.part_info,
            "urgent": any(item.urgent for item in items),
            "accessories": first.accessories,
            "accessories_other": first.accessories_other,
        }

    @staticmethod
    def _apply_status_transition(
        values: dict, old_status: TicketStatus, new_status: TicketStatus, now: str
    ) -> None:
        """Keep an immutable completion timestamp for analytics.

        Moving an active device into a completed/closed state records the first
        completion time. Reopening it clears that time so a later completion is
        attributed to the correct reporting period.
        """
        completed_statuses = {
            TicketStatus.ready,
            TicketStatus.could_not_fix,
            TicketStatus.picked_up,
        }
        if new_status in completed_statuses:
            if old_status not in completed_statuses or not values.get("completed_at"):
                values["completed_at"] = now
        else:
            values["completed_at"] = None
        if new_status == TicketStatus.picked_up:
            if old_status != TicketStatus.picked_up or not values.get("picked_up_at"):
                values["picked_up_at"] = now
        else:
            values["picked_up_at"] = None

    async def create_ticket(self, payload: TicketCreate) -> Ticket:
        async with self._transaction() as session:
            code = await self._next_ticket_code(session=session)
            payload_values = payload.model_dump(exclude={"additional_items"})
            items = [
                TicketItem(
                    position=1,
                    status=TicketStatus.new,
                    **{field: payload_values.get(field) for field in self.ITEM_FIELDS},
                )
            ]
            items.extend(
                TicketItem(
                    **item.model_dump(),
                    position=index,
                    status=TicketStatus.new,
                )
                for index, item in enumerate(payload.additional_items, start=2)
            )
            ticket_values = dict(payload_values)
            ticket_values.update(self._aggregate_items(items))
            ticket = Ticket(
                **ticket_values,
                ticket_code=code,
                items=items,
            )
            await self.tickets.insert_one(
                ticket.model_dump(), **self._session_kwargs(session)
            )
            await self._add_activity(
                ticket_id=ticket.id,
                type=ActivityType.created,
                message=(
                    f"Ticket created with status \u201c{STATUS_LABELS[ticket.status]}\u201d"
                ),
                to_status=ticket.status,
                session=session,
            )
        return ticket

    async def get_ticket(self, ticket_id: str, session=None) -> Optional[Ticket]:
        doc = await self.tickets.find_one(
            {"id": ticket_id},
            {"_id": 0},
            **self._session_kwargs(session),
        )
        return Ticket(**doc) if doc else None

    async def get_ticket_by_code(self, ticket_code: int) -> Optional[Ticket]:
        doc = await self.tickets.find_one(
            {"ticket_code": ticket_code},
            {"_id": 0},
        )
        return Ticket(**doc) if doc else None

    async def list_tickets(
        self,
        folder: Optional[Folder] = None,
        status: Optional[TicketStatus] = None,
        statuses: Optional[List[str]] = None,
        technician: Optional[str] = None,
        resolution: Optional[str] = None,
        overdue: bool = False,
        q: Optional[str] = None,
        offset: int = 0,
        limit: int = 100,
    ) -> List[Ticket]:
        query: dict = {}

        if statuses:
            valid = [s for s in statuses if s in TicketStatus.__members__]
            if valid:
                query["status"] = {"$in": valid}
        elif status is not None:
            query["status"] = status.value
        elif folder is not None:
            allowed = [s.value for s in FOLDER_STATUSES[folder]]
            query["status"] = {"$in": allowed}

        if overdue:
            cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
            query["created_at"] = {"$lte": cutoff}
            status_filter = query.get("status")
            if isinstance(status_filter, dict) and "$in" in status_filter:
                query["status"] = {
                    "$in": [TicketStatus.new.value]
                    if TicketStatus.new.value in status_filter["$in"]
                    else []
                }
            elif isinstance(status_filter, str):
                if status_filter != TicketStatus.new.value:
                    query["status"] = {"$in": []}
            else:
                query["status"] = TicketStatus.new.value

        if technician:
            query["items.assigned_technician"] = technician

        if resolution:
            query["resolution"] = resolution

        if q:
            # Treat user input as plain text rather than MongoDB regex syntax.
            escaped_query = re.escape(q.strip())
            regex = {"$regex": escaped_query, "$options": "i"}
            or_clauses = [
                {"customer_name": regex},
                {"company_name": regex},
                {"tax_id": regex},
                {"customer_phone": regex},
                {"device": regex},
                {"serial_number": regex},
                {"issue_description": regex},
                {"assigned_technician": regex},
                {"part_info": regex},
                {"accessories_other": regex},
                {"items.device": regex},
                {"items.serial_number": regex},
                {"items.issue_description": regex},
                {"items.assigned_technician": regex},
                {"items.part_info": regex},
            ]
            phone_digits = re.sub(r"\D", "", q)
            if 3 <= len(phone_digits) <= 30:
                # A digits-only query also matches formatted stored numbers such as
                # "555 100 101", "555-100-101", or "+995 555 100 101".
                phone_pattern = r"\D*".join(re.escape(digit) for digit in phone_digits)
                or_clauses.append({"customer_phone": {"$regex": phone_pattern}})

            code_digits = q.strip().lstrip("#")
            if code_digits.isdigit():
                try:
                    or_clauses.append({"ticket_code": int(code_digits)})
                except ValueError:
                    pass
            query["$or"] = or_clauses

        # Urgent tickets float to the top, then most-recently updated.
        cursor = self.tickets.find(query, {"_id": 0}).sort(
            [("urgent", -1), ("updated_at", -1)]
        )
        docs = await cursor.skip(offset).limit(limit).to_list(limit)
        return [Ticket(**d) for d in docs]

    async def list_customer_tickets(
        self,
        phone: str,
        legal_company_name: Optional[str] = None,
        limit: int = 100,
    ) -> List[Ticket]:
        """Return only tickets owned by a customer portal account.

        The phone comparison accepts formatting differences, while legal accounts
        are additionally narrowed to their registered company name.
        """
        digits = re.sub(r"\D", "", phone or "")
        if len(digits) < 7:
            return []
        phone_pattern = (
            "^\\D*" + "\\D*".join(re.escape(digit) for digit in digits) + "\\D*$"
        )
        query: dict = {"customer_phone": {"$regex": phone_pattern}}
        if legal_company_name:
            query["customer_type"] = "legal"
            query["company_name"] = {
                "$regex": f"^{re.escape(legal_company_name.strip())}$",
                "$options": "i",
            }
        cursor = self.tickets.find(query, {"_id": 0}).sort([("updated_at", -1)])
        docs = await cursor.limit(min(max(limit, 1), 200)).to_list(limit)
        return [Ticket(**doc) for doc in docs]

    async def update_ticket(
        self, ticket_id: str, payload: TicketUpdate
    ) -> Optional[Ticket]:
        async with self._transaction() as session:
            existing = await self.get_ticket(ticket_id, session=session)
            if not existing:
                return None

            changes = payload.model_dump(exclude_unset=True)
            existing_values = existing.model_dump()
            old_status = existing.status
            items = list(existing.items) or [self._legacy_item(existing)]

            # The legacy ticket endpoint edits item #1. A status sent to a
            # multi-device parent is intentionally treated as a batch action.
            item_changes = {
                key: value for key, value in changes.items() if key in self.ITEM_FIELDS
            }
            if item_changes:
                item_values = items[0].model_dump()
                item_values.update(item_changes)
                item_values["updated_at"] = _now_iso()
                items[0] = TicketItem(**item_values)

            if "status" in changes:
                requested_status = changes["status"]
                new_item_status = (
                    requested_status
                    if isinstance(requested_status, TicketStatus)
                    else TicketStatus(requested_status)
                )
                updated_items = []
                status_changed_at = _now_iso()
                for item in items:
                    values = item.model_dump()
                    values["status"] = new_item_status
                    values["resolution"] = (
                        item.resolution
                        if new_item_status == TicketStatus.picked_up
                        and item.status == TicketStatus.picked_up
                        and item.resolution
                        else (
                            "not_fixed"
                            if new_item_status == TicketStatus.picked_up
                            and item.status == TicketStatus.could_not_fix
                            else (
                                "fixed"
                                if new_item_status == TicketStatus.picked_up
                                else None
                            )
                        )
                    )
                    self._apply_status_transition(
                        values, item.status, new_item_status, status_changed_at
                    )
                    values["updated_at"] = status_changed_at
                    updated_items.append(TicketItem(**values))
                items = updated_items

            update_doc = {
                k: v
                for k, v in changes.items()
                if k not in self.ITEM_FIELDS and k != "status"
            }
            update_doc.update(self._aggregate_items(items))
            update_doc["items"] = [item.model_dump() for item in items]
            field_changes = [
                ActivityChange(
                    field=field,
                    from_value=_audit_value(existing_values.get(field)),
                    to_value=_audit_value(value),
                )
                for field, value in changes.items()
                if field != "status"
                and _audit_value(existing_values.get(field)) != _audit_value(value)
            ]
            update_doc["updated_at"] = _now_iso()
            new_status_val = TicketStatus(update_doc["status"])

            await self.tickets.update_one(
                {"id": ticket_id},
                {"$set": update_doc},
                **self._session_kwargs(session),
            )

            if "status" in changes and new_status_val != old_status:
                await self._add_activity(
                    ticket_id=ticket_id,
                    type=ActivityType.status_change,
                    message=(
                        f"Status changed from \u201c{STATUS_LABELS[old_status]}\u201d "
                        f"to \u201c{STATUS_LABELS[new_status_val]}\u201d"
                    ),
                    from_status=old_status,
                    to_status=new_status_val,
                    item_id=items[0].id if len(items) == 1 else None,
                    item_position=1 if len(items) == 1 else None,
                    session=session,
                )

            if field_changes:
                await self._add_activity(
                    ticket_id=ticket_id,
                    type=ActivityType.updated,
                    message="Ticket details updated",
                    changes=field_changes,
                    item_id=items[0].id if len(items) == 1 else None,
                    item_position=1 if len(items) == 1 else None,
                    session=session,
                )

            return await self.get_ticket(ticket_id, session=session)

    async def add_ticket_item(
        self, ticket_id: str, payload: TicketItemCreate
    ) -> Optional[Ticket]:
        async with self._transaction() as session:
            existing = await self.get_ticket(ticket_id, session=session)
            if not existing:
                return None
            items = list(existing.items) or [self._legacy_item(existing)]
            position = max((item.position for item in items), default=0) + 1
            item = TicketItem(
                **payload.model_dump(), position=position, status=TicketStatus.new
            )
            items.append(item)
            update_doc = self._aggregate_items(items)
            update_doc.update(
                {
                    "items": [entry.model_dump() for entry in items],
                    "updated_at": _now_iso(),
                }
            )
            await self.tickets.update_one(
                {"id": ticket_id},
                {"$set": update_doc},
                **self._session_kwargs(session),
            )
            await self._add_activity(
                ticket_id=ticket_id,
                type=ActivityType.updated,
                message=f"Device #{position} added",
                changes=[
                    ActivityChange(
                        field="item_added", from_value=None, to_value=item.device
                    )
                ],
                item_id=item.id,
                item_position=position,
                session=session,
            )
            return await self.get_ticket(ticket_id, session=session)

    async def update_ticket_item(
        self, ticket_id: str, item_id: str, payload: TicketItemUpdate
    ) -> Optional[Ticket]:
        async with self._transaction() as session:
            existing = await self.get_ticket(ticket_id, session=session)
            if not existing:
                return None
            items = list(existing.items) or [self._legacy_item(existing)]
            index = next((i for i, item in enumerate(items) if item.id == item_id), -1)
            if index < 0:
                raise LookupError("Ticket item not found")

            current = items[index]
            changes = payload.model_dump(exclude_unset=True)
            values = current.model_dump()
            old_status = current.status
            requested_status = changes.get("status", old_status)
            new_status = (
                requested_status
                if isinstance(requested_status, TicketStatus)
                else TicketStatus(requested_status)
            )
            values.update(
                {key: value for key, value in changes.items() if key != "status"}
            )
            if "status" in changes:
                values["status"] = new_status
                values["resolution"] = (
                    current.resolution
                    if new_status == TicketStatus.picked_up
                    and old_status == TicketStatus.picked_up
                    and current.resolution
                    else (
                        "not_fixed"
                        if new_status == TicketStatus.picked_up
                        and old_status == TicketStatus.could_not_fix
                        else "fixed" if new_status == TicketStatus.picked_up else None
                    )
                )
                self._apply_status_transition(
                    values, old_status, new_status, _now_iso()
                )
            values["updated_at"] = _now_iso()
            updated_item = TicketItem(**values)
            items[index] = updated_item

            parent_update = self._aggregate_items(items)
            parent_update.update(
                {
                    "items": [item.model_dump() for item in items],
                    "updated_at": _now_iso(),
                }
            )
            await self.tickets.update_one(
                {"id": ticket_id},
                {"$set": parent_update},
                **self._session_kwargs(session),
            )

            if "status" in changes and new_status != old_status:
                await self._add_activity(
                    ticket_id=ticket_id,
                    type=ActivityType.status_change,
                    message=(
                        f"Device #{current.position} status changed from "
                        f"“{STATUS_LABELS[old_status]}” to “{STATUS_LABELS[new_status]}”"
                    ),
                    from_status=old_status,
                    to_status=new_status,
                    item_id=item_id,
                    item_position=current.position,
                    session=session,
                )

            field_changes = [
                ActivityChange(
                    field=field,
                    from_value=_audit_value(current.model_dump().get(field)),
                    to_value=_audit_value(value),
                )
                for field, value in changes.items()
                if field != "status"
                and _audit_value(current.model_dump().get(field)) != _audit_value(value)
            ]
            if field_changes:
                await self._add_activity(
                    ticket_id=ticket_id,
                    type=ActivityType.updated,
                    message=f"Device #{current.position} updated",
                    changes=field_changes,
                    item_id=item_id,
                    item_position=current.position,
                    session=session,
                )
            return await self.get_ticket(ticket_id, session=session)

    async def delete_ticket_item(
        self, ticket_id: str, item_id: str
    ) -> Optional[Ticket]:
        async with self._transaction() as session:
            existing = await self.get_ticket(ticket_id, session=session)
            if not existing:
                return None
            items = list(existing.items) or [self._legacy_item(existing)]
            if len(items) == 1:
                raise ValueError("The only device cannot be deleted")
            removed = next((item for item in items if item.id == item_id), None)
            if not removed:
                raise LookupError("Ticket item not found")
            items = [item for item in items if item.id != item_id]
            for position, item in enumerate(items, start=1):
                item.position = position
            update_doc = self._aggregate_items(items)
            update_doc.update(
                {
                    "items": [item.model_dump() for item in items],
                    "updated_at": _now_iso(),
                }
            )
            await self.tickets.update_one(
                {"id": ticket_id},
                {"$set": update_doc},
                **self._session_kwargs(session),
            )
            await self._add_activity(
                ticket_id=ticket_id,
                type=ActivityType.updated,
                message=f"Device #{removed.position} removed",
                changes=[
                    ActivityChange(
                        field="item_removed", from_value=removed.device, to_value=None
                    )
                ],
                item_id=removed.id,
                item_position=removed.position,
                session=session,
            )
            return await self.get_ticket(ticket_id, session=session)

    async def delete_ticket(self, ticket_id: str) -> bool:
        async with self._transaction() as session:
            res = await self.tickets.delete_one(
                {"id": ticket_id}, **self._session_kwargs(session)
            )
            if res.deleted_count:
                await self.activities.delete_many(
                    {"ticket_id": ticket_id}, **self._session_kwargs(session)
                )
                return True
            return False

    async def counts(self) -> StatusCounts:
        pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
        rows = await self.tickets.aggregate(pipeline).to_list(100)
        by_status = {r["_id"]: r["count"] for r in rows}

        counts = StatusCounts()
        total = 0
        for status in TicketStatus:
            c = by_status.get(status.value, 0)
            setattr(counts, status.value, c)
            total += c
        cutoff = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        counts.overdue = await self.tickets.count_documents(
            {
                "status": TicketStatus.new.value,
                "created_at": {"$lte": cutoff},
            }
        )
        counts.total = total
        return counts

    async def analytics(
        self,
        period: AnalyticsPeriod,
        year: int,
        month: Optional[int] = None,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
    ) -> AnalyticsSummary:
        """Build admin reporting metrics from ticket/item source records.

        Received volume is attributed to created_at. Repair outcomes and revenue
        are attributed to the immutable item completed_at timestamp. Legacy
        completed items use updated_at as a documented fallback.
        """
        start, end = _period_bounds(period, year, month, date_from, date_to)
        selected_month = start.month if period == AnalyticsPeriod.month else None
        daily_trend = period == AnalyticsPeriod.month or (
            period == AnalyticsPeriod.custom and (end - start).days <= 62
        )

        trend: dict[str, AnalyticsTrendPoint] = {}
        if daily_trend:
            cursor = start
            while cursor < end:
                key = cursor.strftime("%Y-%m-%d")
                label = (
                    cursor.strftime("%d/%m")
                    if period == AnalyticsPeriod.custom
                    else str(cursor.day)
                )
                trend[key] = AnalyticsTrendPoint(key=key, label=label)
                cursor += timedelta(days=1)
        elif period == AnalyticsPeriod.custom:
            cursor = datetime(start.year, start.month, 1, tzinfo=REPORT_TIMEZONE)
            while cursor < end:
                key = cursor.strftime("%Y-%m")
                trend[key] = AnalyticsTrendPoint(
                    key=key, label=cursor.strftime("%m/%Y")
                )
                cursor = (
                    datetime(cursor.year + 1, 1, 1, tzinfo=REPORT_TIMEZONE)
                    if cursor.month == 12
                    else datetime(
                        cursor.year, cursor.month + 1, 1, tzinfo=REPORT_TIMEZONE
                    )
                )
        else:
            for month_number in range(1, 13):
                key = f"{year:04d}-{month_number:02d}"
                trend[key] = AnalyticsTrendPoint(
                    key=key, label=str(month_number)
                )

        def trend_key(value: Optional[str]) -> Optional[str]:
            parsed = _parse_datetime(value)
            if not parsed or not (start <= parsed < end):
                return None
            return (
                parsed.strftime("%Y-%m-%d")
                if daily_trend
                else parsed.strftime("%Y-%m")
            )

        received_tickets = 0
        received_items = 0
        fixed_items = 0
        failed_items = 0
        revenue = 0.0
        available_years = {datetime.now(REPORT_TIMEZONE).year, year}
        damage_stats: dict[str, dict[str, float | int]] = defaultdict(
            lambda: {
                "count": 0,
                "fixed_items": 0,
                "failed_items": 0,
                "active_items": 0,
                "revenue": 0.0,
            }
        )
        device_stats: dict[str, dict[str, float | int]] = defaultdict(
            lambda: {
                "count": 0,
                "fixed_items": 0,
                "failed_items": 0,
                "active_items": 0,
                "revenue": 0.0,
            }
        )

        docs = await self.tickets.find({}, {"_id": 0}).to_list(100000)
        for doc in docs:
            ticket = Ticket(**doc)
            items = list(ticket.items) or [self._legacy_item(ticket)]

            ticket_created = _parse_datetime(ticket.created_at)
            if ticket_created:
                available_years.add(ticket_created.year)
            ticket_bucket = trend_key(ticket.created_at)
            if ticket_bucket:
                received_tickets += 1
                trend[ticket_bucket].received_tickets += 1

            for item in items:
                item_created_value = item.created_at or ticket.created_at
                item_created = _parse_datetime(item_created_value)
                if item_created:
                    available_years.add(item_created.year)
                item_bucket = trend_key(item_created_value)
                damage_key = _damage_category_key(
                    item.damage_category, item.issue_description
                )
                device_key = _device_type_key(item.device_type)
                is_fixed = item.status == TicketStatus.ready or (
                    item.status == TicketStatus.picked_up
                    and item.resolution != "not_fixed"
                )
                is_failed = item.status == TicketStatus.could_not_fix or (
                    item.status == TicketStatus.picked_up
                    and item.resolution == "not_fixed"
                )
                if item_bucket:
                    received_items += 1
                    trend[item_bucket].received_items += 1
                    damage_stats[damage_key]["count"] += 1
                    device_stats[device_key]["count"] += 1
                    if not (is_fixed or is_failed):
                        damage_stats[damage_key]["active_items"] += 1
                        device_stats[device_key]["active_items"] += 1

                if not (is_fixed or is_failed):
                    continue

                completed_value = item.completed_at or item.updated_at
                completed = _parse_datetime(completed_value)
                if completed:
                    available_years.add(completed.year)
                completed_bucket = trend_key(completed_value)
                if not completed_bucket:
                    continue

                if is_fixed:
                    price = float(item.cost_estimate or 0)
                    fixed_items += 1
                    revenue += price
                    trend[completed_bucket].fixed_items += 1
                    trend[completed_bucket].revenue += price
                    damage_stats[damage_key]["fixed_items"] += 1
                    damage_stats[damage_key]["revenue"] += price
                    device_stats[device_key]["fixed_items"] += 1
                    device_stats[device_key]["revenue"] += price
                else:
                    failed_items += 1
                    trend[completed_bucket].failed_items += 1
                    damage_stats[damage_key]["failed_items"] += 1
                    device_stats[device_key]["failed_items"] += 1

        def damage_row(key: str, values: dict[str, float | int]) -> AnalyticsDamageRow:
            fixed = int(values["fixed_items"])
            failed = int(values["failed_items"])
            completed = fixed + failed
            revenue_value = float(values["revenue"])
            return AnalyticsDamageRow(
                damage=key,
                count=int(values["count"]),
                fixed_items=fixed,
                failed_items=failed,
                active_items=int(values["active_items"]),
                revenue=round(revenue_value, 2),
                average_revenue=round(revenue_value / fixed, 2) if fixed else 0,
                success_rate=round((fixed / completed) * 100, 1) if completed else 0,
            )

        def device_row(key: str, values: dict[str, float | int]) -> AnalyticsDeviceRow:
            fixed = int(values["fixed_items"])
            revenue_value = float(values["revenue"])
            return AnalyticsDeviceRow(
                device_type=key,
                count=int(values["count"]),
                fixed_items=fixed,
                failed_items=int(values["failed_items"]),
                active_items=int(values["active_items"]),
                revenue=round(revenue_value, 2),
                average_revenue=round(revenue_value / fixed, 2) if fixed else 0,
            )

        damage_rows = [damage_row(key, values) for key, values in damage_stats.items()]
        device_rows = [device_row(key, values) for key, values in device_stats.items()]
        common_damage = sorted(
            damage_rows, key=lambda row: (-row.count, -row.revenue, row.damage)
        )[:10]
        revenue_damage = sorted(
            damage_rows,
            key=lambda row: (-row.revenue, -row.fixed_items, row.damage),
        )[:10]
        failed_damage = sorted(
            damage_rows,
            key=lambda row: (-row.failed_items, -row.count, row.damage),
        )[:10]
        device_rows.sort(
            key=lambda row: (-row.count, -row.revenue, row.device_type)
        )

        return AnalyticsSummary(
            period=period,
            year=year,
            month=selected_month,
            range_start=start.isoformat(),
            range_end=end.isoformat(),
            available_years=sorted(available_years, reverse=True),
            received_tickets=received_tickets,
            received_items=received_items,
            fixed_items=fixed_items,
            failed_items=failed_items,
            revenue=round(revenue, 2),
            trend=[
                point.model_copy(update={"revenue": round(point.revenue, 2)})
                for point in trend.values()
            ],
            common_damage=common_damage,
            revenue_damage=revenue_damage,
            failed_damage=failed_damage,
            damage_categories=sorted(
                damage_rows, key=lambda row: (-row.count, -row.revenue, row.damage)
            ),
            device_types=device_rows,
        )

    async def technicians(self) -> List[str]:
        top_level = await self.tickets.distinct("assigned_technician")
        item_level = await self.tickets.distinct("items.assigned_technician")
        return sorted({value for value in [*top_level, *item_level] if value})

    async def companies(self) -> List[str]:
        values = await self.tickets.distinct("company_name")
        return sorted([v for v in values if v])

    async def customers(self) -> List[dict]:
        """Distinct customers keyed by phone, using their most recent ticket."""
        pipeline = [
            {"$match": {"customer_phone": {"$nin": ["", None]}}},
            {"$sort": {"updated_at": -1}},
            {
                "$group": {
                    "_id": "$customer_phone",
                    "customer_name": {"$first": "$customer_name"},
                    "customer_type": {"$first": "$customer_type"},
                    "company_name": {"$first": "$company_name"},
                    "tax_id": {"$first": "$tax_id"},
                }
            },
        ]
        rows = await self.tickets.aggregate(pipeline).to_list(2000)
        return [
            {
                "customer_phone": r["_id"],
                "customer_name": r.get("customer_name") or "",
                "customer_type": r.get("customer_type") or "physical",
                "company_name": r.get("company_name") or "",
                "tax_id": r.get("tax_id") or "",
            }
            for r in rows
        ]

    # ------------------------------------------------------------------
    # Activities
    # ------------------------------------------------------------------
    async def _add_activity(
        self,
        ticket_id: str,
        type: ActivityType,
        message: str,
        from_status: Optional[TicketStatus] = None,
        to_status: Optional[TicketStatus] = None,
        changes: Optional[List[ActivityChange]] = None,
        item_id: Optional[str] = None,
        item_position: Optional[int] = None,
        session=None,
    ) -> Activity:
        activity = Activity(
            ticket_id=ticket_id,
            item_id=item_id,
            item_position=item_position,
            type=type,
            message=message,
            from_status=from_status,
            to_status=to_status,
            changes=changes or [],
        )
        await self.activities.insert_one(
            activity.model_dump(), **self._session_kwargs(session)
        )
        return activity

    async def add_note(
        self, ticket_id: str, message: str, item_id: Optional[str] = None
    ) -> Optional[Activity]:
        async with self._transaction() as session:
            ticket_doc = await self.tickets.find_one(
                {"id": ticket_id},
                {"_id": 0},
                **self._session_kwargs(session),
            )
            if not ticket_doc:
                return None
            item_position = None
            if item_id:
                item = next(
                    (
                        entry
                        for entry in ticket_doc.get("items", [])
                        if entry.get("id") == item_id
                    ),
                    None,
                )
                if not item:
                    raise LookupError("Ticket item not found")
                item_position = item.get("position")
            await self.tickets.update_one(
                {"id": ticket_id},
                {"$set": {"updated_at": _now_iso()}},
                **self._session_kwargs(session),
            )
            return await self._add_activity(
                ticket_id=ticket_id,
                type=ActivityType.note,
                message=message,
                item_id=item_id,
                item_position=item_position,
                session=session,
            )

    async def list_activities(self, ticket_id: str) -> List[Activity]:
        cursor = self.activities.find({"ticket_id": ticket_id}, {"_id": 0}).sort(
            "created_at", -1
        )
        docs = await cursor.to_list(1000)
        return [Activity(**d) for d in docs]
