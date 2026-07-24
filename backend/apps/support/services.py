from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.audit.services import record_audit_log
from apps.core.models import Sequence
from apps.support.models import SupportTicket, SupportTicketAssignment, SupportTicketComment, SupportTicketStatusHistory


def _next_ticket_number():
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code="support_ticket_number",
        defaults={"prefix": "SUP", "current_value": 0, "padding": 4},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


def _ticket_payload(ticket: SupportTicket):
    return {
        "ticket_number": ticket.ticket_number,
        "subject": ticket.subject,
        "module": ticket.module,
        "requester": ticket.requester,
        "priority": ticket.priority,
        "status": ticket.status,
        "channel": ticket.channel,
        "current_owner_id": str(ticket.current_owner_id) if ticket.current_owner_id else None,
    }


class SupportService:
    @staticmethod
    def _resolve_due_at(priority):
        hours = {
            SupportTicket.Priority.CRITICAL: 2,
            SupportTicket.Priority.HIGH: 8,
            SupportTicket.Priority.MEDIUM: 24,
            SupportTicket.Priority.LOW: 48,
        }.get(priority, 24)
        return timezone.now() + timedelta(hours=hours)

    @staticmethod
    @transaction.atomic
    def create_ticket(*, data, actor, request=None):
        owner_id = data.pop("current_owner_id", None)
        status = data.pop("status", SupportTicket.Status.OPEN)
        resolution_summary = data.pop("resolution_summary", "")
        response_due_at = data.pop("response_due_at", None) or SupportService._resolve_due_at(data["priority"])
        ticket = SupportTicket.objects.create(
            ticket_number=_next_ticket_number(),
            current_owner_id=owner_id or actor.id,
            response_due_at=response_due_at,
            status=status,
            resolution_summary=resolution_summary,
            created_by=actor,
            updated_by=actor,
            **data,
        )
        if ticket.current_owner_id:
            SupportTicketAssignment.objects.create(
                ticket=ticket,
                owner_id=ticket.current_owner_id,
                assigned_by=actor,
                note="Initial assignment created with the ticket.",
                is_current=True,
                created_by=actor,
                updated_by=actor,
            )
        SupportTicketStatusHistory.objects.create(
            ticket=ticket,
            from_status="",
            to_status=ticket.status,
            note="Ticket created.",
            changed_by=actor,
            created_by=actor,
            updated_by=actor,
        )
        record_audit_log(
            actor=actor,
            module="support",
            action="create",
            entity_type="SupportTicket",
            entity_id=ticket.id,
            new_values=_ticket_payload(ticket),
            request=request,
        )
        return ticket

    @staticmethod
    @transaction.atomic
    def update_ticket(*, ticket, data, actor, request=None):
        old_values = _ticket_payload(ticket)
        owner_id = data.pop("current_owner_id", None) if "current_owner_id" in data else None
        status = data.pop("status", None) if "status" in data else None
        resolution_summary = data.pop("resolution_summary", None) if "resolution_summary" in data else None
        response_due_at = data.pop("response_due_at", None) if "response_due_at" in data else None

        if owner_id is not None and owner_id != ticket.current_owner_id:
            SupportTicketAssignment.objects.filter(ticket=ticket, is_current=True).update(is_current=False, updated_by=actor)
            SupportTicketAssignment.objects.create(
                ticket=ticket,
                owner_id=owner_id,
                assigned_by=actor,
                note=data.get("assignment_note", "") or "Updated assignment.",
                is_current=True,
                created_by=actor,
                updated_by=actor,
            )
            ticket.current_owner_id = owner_id

        if status and status != ticket.status:
            SupportTicketStatusHistory.objects.create(
                ticket=ticket,
                from_status=ticket.status,
                to_status=status,
                note=data.get("status_note", "") or "",
                changed_by=actor,
                created_by=actor,
                updated_by=actor,
            )
            ticket.status = status
            if status == SupportTicket.Status.RESOLVED:
                ticket.resolved_at = timezone.now()
            elif ticket.resolved_at:
                ticket.resolved_at = None

        if response_due_at is not None:
            ticket.response_due_at = response_due_at
        if resolution_summary is not None:
            ticket.resolution_summary = resolution_summary

        for field, value in data.items():
            setattr(ticket, field, value)
        ticket.updated_by = actor
        ticket.save()
        record_audit_log(
            actor=actor,
            module="support",
            action="update",
            entity_type="SupportTicket",
            entity_id=ticket.id,
            old_values=old_values,
            new_values=_ticket_payload(ticket),
            request=request,
        )
        return ticket

    @staticmethod
    @transaction.atomic
    def add_comment(*, ticket, data, actor, request=None):
        comment = SupportTicketComment.objects.create(
            ticket=ticket,
            author=actor,
            created_by=actor,
            updated_by=actor,
            **data,
        )
        record_audit_log(
            actor=actor,
            module="support",
            action="comment",
            entity_type="SupportTicketComment",
            entity_id=comment.id,
            new_values={"ticket_number": ticket.ticket_number, "message": comment.message, "is_internal": comment.is_internal},
            request=request,
        )
        return comment
