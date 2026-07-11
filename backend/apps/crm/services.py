from django.db import transaction
from django.db.models import Count, Q

from apps.accounts.models import User
from apps.audit.services import record_audit_log
from apps.core.models import Sequence
from apps.crm.models import Lead, LeadFollowUp

MAX_ACTIVE_LEADS_PER_TELECALLER = 5
OPEN_LEAD_STATUSES = [
    Lead.LeadStatus.NEW,
    Lead.LeadStatus.CONTACTED,
    Lead.LeadStatus.QUALIFIED,
    Lead.LeadStatus.PROPOSAL,
]


def _next_lead_number():
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code="lead_number",
        defaults={"prefix": "LEAD", "current_value": 0, "padding": 5},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


def _user_label(user):
    return user.get_full_name() or user.email or user.mobile or str(user.id)


def _active_lead_count(user):
    return Lead.objects.filter(
        assigned_to=user,
        is_deleted=False,
        status__in=OPEN_LEAD_STATUSES,
    ).count()


def _least_loaded_telecaller(*, exclude_user_id=None):
    queryset = (
        User.objects.filter(is_active=True, user_roles__role__code="telecaller")
        .exclude(id=exclude_user_id)
        .annotate(
            active_lead_count=Count(
                "assigned_leads",
                filter=Q(assigned_leads__is_deleted=False, assigned_leads__status__in=OPEN_LEAD_STATUSES),
                distinct=True,
            )
        )
        .order_by("active_lead_count", "id")
        .distinct()
    )
    return queryset.first()


class LeadService:
    @staticmethod
    @transaction.atomic
    def create_lead(*, data, actor, request=None):
        lead = Lead.objects.create(
            lead_number=_next_lead_number(),
            created_by=actor,
            updated_by=actor,
            **data,
        )
        record_audit_log(
            actor=actor,
            module="crm",
            action="create",
            entity_type="Lead",
            entity_id=lead.id,
            new_values={
                "lead_number": lead.lead_number,
                "lead_type": lead.lead_type,
                "status": lead.status,
                "mobile": lead.mobile,
                "email": lead.email,
                "company_name": lead.company_name,
            },
            request=request,
        )
        return lead

    @staticmethod
    @transaction.atomic
    def update_lead(*, lead, data, actor, request=None):
        old_values = {
            "lead_type": lead.lead_type,
            "status": lead.status,
            "source": lead.source,
            "company_name": lead.company_name,
            "contact_name": lead.contact_name,
            "email": lead.email,
            "mobile": lead.mobile,
            "city": lead.city,
            "requirement_summary": lead.requirement_summary,
            "estimated_value": str(lead.estimated_value),
            "assigned_to_id": lead.assigned_to_id,
        }

        for field, value in data.items():
            setattr(lead, field, value)
        lead.updated_by = actor
        lead.save(update_fields=list(data.keys()) + ["updated_by", "updated_at"])

        record_audit_log(
            actor=actor,
            module="crm",
            action="update",
            entity_type="Lead",
            entity_id=lead.id,
            old_values=old_values,
            new_values={
                "lead_type": lead.lead_type,
                "status": lead.status,
                "source": lead.source,
                "company_name": lead.company_name,
                "contact_name": lead.contact_name,
                "email": lead.email,
                "mobile": lead.mobile,
                "city": lead.city,
                "requirement_summary": lead.requirement_summary,
                "estimated_value": str(lead.estimated_value),
                "assigned_to_id": lead.assigned_to_id,
            },
            request=request,
        )
        return lead

    @staticmethod
    @transaction.atomic
    def assign_lead(*, lead, assigned_to_id, actor, request=None):
        if lead.assigned_to_id == assigned_to_id:
            return lead

        old_values = {"assigned_to_id": lead.assigned_to_id}
        assigned_user = None
        requested_user = None
        auto_balance_note = ""
        if assigned_to_id is not None:
            requested_user = User.objects.get(id=assigned_to_id, is_active=True)
            assigned_user = requested_user
            requested_load = _active_lead_count(requested_user)
            if requested_load >= MAX_ACTIVE_LEADS_PER_TELECALLER:
                balanced_user = _least_loaded_telecaller(exclude_user_id=requested_user.id)
                if balanced_user:
                    assigned_user = balanced_user
                    auto_balance_note = (
                        f" Auto-balanced from {_user_label(requested_user)} to {_user_label(balanced_user)}"
                        f" because requested owner already had {requested_load} active leads."
                    )

        lead.assigned_to = assigned_user
        lead.updated_by = actor
        lead.save(update_fields=["assigned_to", "updated_by", "updated_at"])

        follow_up_note = (
            f"Assignment updated to {_user_label(assigned_user)}.{auto_balance_note}"
            if assigned_user
            else "Assignment cleared."
        )
        LeadFollowUp.objects.create(
            lead=lead,
            channel=LeadFollowUp.Channel.CALL,
            outcome=LeadFollowUp.Outcome.PENDING,
            note=follow_up_note,
            next_follow_up_at=None,
            created_by=actor,
            updated_by=actor,
        )

        record_audit_log(
            actor=actor,
            module="crm",
            action="assign",
            entity_type="Lead",
            entity_id=lead.id,
            old_values=old_values,
            new_values={
                "assigned_to_id": lead.assigned_to_id,
                "requested_assigned_to_id": requested_user.id if requested_user else None,
                "auto_balanced": bool(auto_balance_note),
            },
            request=request,
        )
        return lead

    @staticmethod
    @transaction.atomic
    def create_follow_up(*, lead, data, actor, request=None):
        follow_up = LeadFollowUp.objects.create(
            lead=lead,
            created_by=actor,
            updated_by=actor,
            **data,
        )

        if lead.status == Lead.LeadStatus.NEW and follow_up.outcome != LeadFollowUp.Outcome.PENDING:
            lead.status = Lead.LeadStatus.CONTACTED
            lead.updated_by = actor
            lead.save(update_fields=["status", "updated_by", "updated_at"])

        record_audit_log(
            actor=actor,
            module="crm",
            action="follow_up",
            entity_type="LeadFollowUp",
            entity_id=follow_up.id,
            new_values={
                "lead_id": str(lead.id),
                "lead_number": lead.lead_number,
                "channel": follow_up.channel,
                "outcome": follow_up.outcome,
                "next_follow_up_at": follow_up.next_follow_up_at.isoformat() if follow_up.next_follow_up_at else None,
            },
            request=request,
        )
        return follow_up
