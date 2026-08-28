"""Focused local checks for indexes and ticket-counter recovery."""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta, timezone

from mongomock_motor import AsyncMongoMockClient
from pymongo.errors import DuplicateKeyError

from models import (
    ActivityType,
    AnalyticsPeriod,
    Ticket,
    TicketCreate,
    TicketItemCreate,
    TicketItemUpdate,
    TicketUpdate,
)
from repository import CRMRepository, _device_type_key


async def check_integrity_guards() -> None:
    assert _device_type_key("hard_disk") == "hard_disk"
    assert _device_type_key("HDD / მყარი დისკი") == "hard_disk"
    assert _device_type_key("SSD") == "ssd"
    assert _device_type_key("external_drive") == "external_drive"
    assert _device_type_key("Custom Storage Model") == "custom storage model"
    assert _device_type_key("") == "other_storage"

    client = AsyncMongoMockClient()
    repository = CRMRepository(client.tecservice_integrity, use_transactions=False)

    restored_ticket = Ticket(
        **TicketCreate(
            customer_name="Restored ticket",
            customer_phone="555-0050",
            device="Laptop",
            issue_description="Counter recovery test",
        ).model_dump(),
        ticket_code=10050,
    )
    await repository.tickets.insert_one(restored_ticket.model_dump())
    await repository.ensure_indexes()
    migrated = await repository.get_ticket(restored_ticket.id)
    assert migrated is not None and len(migrated.items) == 1
    assert migrated.items[0].device == "Laptop"

    created = await repository.create_ticket(
        TicketCreate(
            customer_name="Next ticket",
            customer_phone="555-0051",
            device="Phone",
            issue_description="Must receive the next code",
        )
    )
    assert created.ticket_code == 10051

    duplicate = Ticket(
        **TicketCreate(
            customer_name="Duplicate code",
            customer_phone="555-9999",
            device="Tablet",
            issue_description="Must be rejected",
        ).model_dump(),
        ticket_code=created.ticket_code,
    )
    try:
        await repository.tickets.insert_one(duplicate.model_dump())
    except DuplicateKeyError:
        pass
    else:
        raise AssertionError("Duplicate ticket_code was not rejected")

    indexes = await repository.tickets.index_information()
    assert "uq_ticket_id" in indexes
    assert "uq_ticket_code" in indexes
    assert "ix_ticket_queue" in indexes

    await repository.update_ticket(
        created.id,
        TicketUpdate(
            cost_estimate=125.5,
            urgent=True,
            device="Phone Pro",
        ),
    )
    activities = await repository.list_activities(created.id)
    updated = next(
        activity for activity in activities if activity.type == ActivityType.updated
    )
    changes = {change.field: change for change in updated.changes}
    assert changes["cost_estimate"].from_value is None
    assert changes["cost_estimate"].to_value == 125.5
    assert changes["urgent"].from_value is False
    assert changes["urgent"].to_value is True
    assert changes["device"].from_value == "Phone"
    assert changes["device"].to_value == "Phone Pro"

    updated_count = sum(
        activity.type == ActivityType.updated for activity in activities
    )
    await repository.update_ticket(
        created.id,
        TicketUpdate(cost_estimate=125.5, urgent=True, device="Phone Pro"),
    )
    activities_after_noop = await repository.list_activities(created.id)
    assert (
        sum(
            activity.type == ActivityType.updated
            for activity in activities_after_noop
        )
        == updated_count
    )

    multi = await repository.create_ticket(
        TicketCreate(
            customer_name="Multi device customer",
            customer_phone="555 123 456",
            device="Dell Latitude",
            serial_number="MAIN-001",
            issue_description="Does not boot",
            cost_estimate=100,
            additional_items=[
                TicketItemCreate(
                    device="Lenovo ThinkPad",
                    serial_number="SECOND-SEARCH-002",
                    issue_description="Broken screen",
                    cost_estimate=50,
                )
            ],
        )
    )
    assert len(multi.items) == 2
    assert multi.cost_estimate == 150

    second = multi.items[1]
    multi = await repository.update_ticket_item(
        multi.id,
        second.id,
        TicketItemUpdate(status="in_progress", cost_estimate=75),
    )
    assert multi is not None
    assert multi.items[1].cost_estimate == 75
    assert multi.cost_estimate == 175
    assert multi.status.value == "in_progress"

    nested_search = await repository.list_tickets(q="SECOND-SEARCH-002")
    assert [ticket.id for ticket in nested_search] == [multi.id]
    item_activities = await repository.list_activities(multi.id)
    assert any(activity.item_id == second.id for activity in item_activities)

    note = await repository.add_note(
        multi.id, "Customer approved the repair", second.id
    )
    assert note is not None
    assert note.item_id == second.id
    assert note.item_position == second.position
    item_activities = await repository.list_activities(multi.id)
    assert any(
        activity.type == ActivityType.note
        and activity.item_id == second.id
        and activity.message == "Customer approved the repair"
        for activity in item_activities
    )

    old_created_at = (datetime.now(timezone.utc) - timedelta(hours=25)).isoformat()
    multi = await repository.update_ticket(
        multi.id, TicketUpdate(status="new")
    )
    assert multi is not None
    await repository.tickets.update_one(
        {"id": multi.id}, {"$set": {"created_at": old_created_at}}
    )
    counts = await repository.counts()
    assert counts.overdue == 1
    overdue = await repository.list_tickets(overdue=True)
    assert [ticket.id for ticket in overdue] == [multi.id]
    multi = await repository.update_ticket(
        multi.id, TicketUpdate(status="in_progress")
    )
    assert multi is not None
    assert (await repository.counts()).overdue == 0
    assert await repository.list_tickets(overdue=True) == []

    first = multi.items[0]
    multi = await repository.update_ticket_item(
        multi.id, first.id, TicketItemUpdate(status="ready")
    )
    multi = await repository.update_ticket_item(
        multi.id, second.id, TicketItemUpdate(status="could_not_fix")
    )
    assert multi is not None
    assert all(item.completed_at for item in multi.items)

    report_now = datetime.now(timezone(timedelta(hours=4)))
    report = await repository.analytics(
        AnalyticsPeriod.month, report_now.year, report_now.month
    )
    assert report.received_items >= 2
    assert report.fixed_items >= 1
    assert report.failed_items >= 1
    assert report.revenue >= 100
    assert any(row.damage == "software" for row in report.common_damage)
    assert any(row.damage == "screen" for row in report.failed_damage)
    assert any(row.device_type == "other_storage" for row in report.device_types)

    custom_report = await repository.analytics(
        AnalyticsPeriod.custom,
        report_now.year,
        date_from=(report_now - timedelta(days=30)).date(),
        date_to=report_now.date(),
    )
    assert custom_report.period == AnalyticsPeriod.custom
    assert len(custom_report.trend) == 31
    assert custom_report.received_items >= 2
    assert custom_report.revenue >= 100

    multi = await repository.delete_ticket_item(multi.id, second.id)
    assert multi is not None and len(multi.items) == 1
    try:
        await repository.delete_ticket_item(multi.id, multi.items[0].id)
    except ValueError:
        pass
    else:
        raise AssertionError("Deleting the only device should be rejected")


if __name__ == "__main__":
    asyncio.run(check_integrity_guards())
    print(
        "Integrity checks passed: indexes, unique code, migration, audit log, "
        "multi-device aggregation and nested search"
    )
