from django.db import transaction

from apps.audit.services import record_audit_log
from apps.core.models import Sequence
from apps.crm.models import Lead


def _next_lead_number():
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code="lead_number",
        defaults={"prefix": "LEAD", "current_value": 0, "padding": 5},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


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

