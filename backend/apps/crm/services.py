from django.db import transaction
from django.db.models import Count, Q
from rest_framework.exceptions import ValidationError

from apps.accounts.models import User
from apps.audit.services import record_audit_log
from apps.core.models import Sequence
from apps.crm.models import ClientContact, Lead, LeadFollowUp, ProjectAgreement, ProjectClient, ProjectHandoff
from apps.hrms.models import EmployeeHRProfile

MAX_ACTIVE_LEADS_PER_TELECALLER = 5
OPEN_LEAD_STATUSES = [
    Lead.LeadStatus.NEW,
    Lead.LeadStatus.CONTACTED,
    Lead.LeadStatus.QUALIFIED,
    Lead.LeadStatus.PROPOSAL,
]
OUTCOME_ALLOWED_STATUSES = {
    Lead.LeadStatus.QUALIFIED,
    Lead.LeadStatus.PROPOSAL,
    Lead.LeadStatus.WON,
    Lead.LeadStatus.LOST,
}


def _next_lead_number():
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code="lead_number",
        defaults={"prefix": "LEAD", "current_value": 0, "padding": 5},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


def _next_client_number():
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code="project_client_number",
        defaults={"prefix": "ACC", "current_value": 24000, "padding": 5},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


def _next_agreement_number():
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code="project_agreement_number",
        defaults={"prefix": "AGR", "current_value": 0, "padding": 5},
    )
    sequence.current_value += 1
    sequence.save(update_fields=["current_value", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


def _user_label(user):
    return user.get_full_name() or user.email or user.mobile or str(user.id)


def _create_default_client_contacts(*, client, lead, actor):
    contact_rows = [
        {
            "role": ClientContact.ContactRole.DECISION_MAKER,
            "name": lead.contact_name,
            "designation": "Project Sponsor",
            "phone": lead.mobile,
            "email": lead.email,
            "responsibility": "Budget, scope approval, final sign-off",
        },
        {
            "role": ClientContact.ContactRole.TECHNICAL,
            "name": f"{lead.company_name or lead.contact_name} Technical Team",
            "designation": "Technical Coordinator",
            "phone": lead.mobile,
            "email": lead.email,
            "responsibility": "Technical requirement clarification and UAT coordination",
        },
        {
            "role": ClientContact.ContactRole.FINANCE,
            "name": f"{lead.company_name or lead.contact_name} Finance Team",
            "designation": "Finance Coordinator",
            "phone": lead.mobile,
            "email": lead.email,
            "responsibility": "Payment terms, invoice coordination, billing approval",
        },
        {
            "role": ClientContact.ContactRole.DAILY_COORDINATOR,
            "name": f"{lead.company_name or lead.contact_name} Daily Coordinator",
            "designation": "Daily Coordinator",
            "phone": lead.mobile,
            "email": lead.email,
            "responsibility": "Daily follow-up, meeting coordination, delivery communication",
        },
    ]
    contacts = []
    for row in contact_rows:
        contacts.append(
            ClientContact.objects.create(
                client=client,
                created_by=actor,
                updated_by=actor,
                **row,
            )
        )
    return contacts


def _active_lead_count(user):
    return Lead.objects.filter(
        assigned_to=user,
        is_deleted=False,
        status__in=OPEN_LEAD_STATUSES,
    ).count()


def _least_loaded_telecaller(*, exclude_user_id=None):
    queryset = (
        User.objects.filter(is_active=True, user_roles__role__code="telecaller", hr_profile__status=EmployeeHRProfile.Status.ACTIVE)
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


def _get_active_hrms_lead_owner(user_id):
    try:
        return User.objects.select_related("hr_profile").get(
            id=user_id,
            is_active=True,
            hr_profile__status=EmployeeHRProfile.Status.ACTIVE,
        )
    except User.DoesNotExist as exc:
        raise ValidationError({"assigned_to_id": "Active HRMS employee does not exist for lead assignment."}) from exc


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
            requested_user = _get_active_hrms_lead_owner(assigned_to_id)
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

    @staticmethod
    @transaction.atomic
    def close_outcome(*, lead, status, note, actor, request=None):
        if status not in OUTCOME_ALLOWED_STATUSES:
            raise ValidationError({"status": "Invalid outcome status."})

        has_completed_follow_up = LeadFollowUp.objects.filter(
            lead=lead,
            outcome=LeadFollowUp.Outcome.DONE,
            is_deleted=False,
        ).exists()
        if not has_completed_follow_up:
            raise ValidationError({"follow_up": "Complete a follow-up before saving lead outcome."})

        if lead.status == status:
            return lead

        old_values = {"status": lead.status}
        lead.status = status
        lead.updated_by = actor
        lead.save(update_fields=["status", "updated_by", "updated_at"])

        if not LeadFollowUp.objects.filter(
            lead=lead,
            outcome=LeadFollowUp.Outcome.DONE if status == Lead.LeadStatus.WON else LeadFollowUp.Outcome.NOT_INTERESTED if status == Lead.LeadStatus.LOST else LeadFollowUp.Outcome.INTERESTED,
            note__iexact=note or f"Lead outcome updated to {lead.get_status_display()}.",
            is_deleted=False,
        ).exists():
            LeadFollowUp.objects.create(
                lead=lead,
                channel=LeadFollowUp.Channel.CALL,
                outcome=(
                    LeadFollowUp.Outcome.DONE
                    if status == Lead.LeadStatus.WON
                    else LeadFollowUp.Outcome.NOT_INTERESTED
                    if status == Lead.LeadStatus.LOST
                    else LeadFollowUp.Outcome.INTERESTED
                ),
                note=note or f"Lead outcome updated to {lead.get_status_display()}.",
                next_follow_up_at=None,
                created_by=actor,
                updated_by=actor,
            )

        record_audit_log(
            actor=actor,
            module="crm",
            action="outcome",
            entity_type="Lead",
            entity_id=lead.id,
            old_values=old_values,
            new_values={
                "lead_number": lead.lead_number,
                "status": lead.status,
                "note": note,
            },
            request=request,
        )
        if lead.lead_type == Lead.LeadType.PROJECT and lead.status == Lead.LeadStatus.WON:
            ProjectClientService.sync_won_project_leads(actor=actor)
        return lead


class ProjectClientService:
    @staticmethod
    @transaction.atomic
    def sync_won_project_leads(*, actor):
        leads = (
            Lead.objects.filter(
                is_deleted=False,
                lead_type=Lead.LeadType.PROJECT,
                status=Lead.LeadStatus.WON,
                project_client__isnull=True,
            )
            .select_related("assigned_to")
            .order_by("created_at")
        )
        clients = []
        for lead in leads:
            client = ProjectClient.objects.create(
                client_number=_next_client_number(),
                source_lead=lead,
                company_name=lead.company_name or lead.contact_name,
                project_name=f"{lead.company_name or lead.contact_name} - {lead.requirement_summary[:80] or 'Project'}",
                project_type=lead.company_name or "Project",
                project_status=ProjectClient.ProjectStatus.DISCOVERY,
                project_owner="Development Team",
                team_leader="Rajkumar Rathore (TL-1)",
                telecaller=_user_label(lead.assigned_to) if lead.assigned_to else "",
                agreement_status=ProjectClient.AgreementStatus.DRAFTED,
                value=lead.estimated_value,
                next_action="Create project and assign delivery team",
                created_by=actor,
                updated_by=actor,
            )
            _create_default_client_contacts(client=client, lead=lead, actor=actor)
            clients.append(client)
        return clients

    @staticmethod
    @transaction.atomic
    def create_client(*, data, actor, request=None):
        primary_contact = data.pop("primary_contact", None)
        source_lead_id = data.pop("source_lead_id", None)
        source_lead = Lead.objects.filter(id=source_lead_id, is_deleted=False).first() if source_lead_id else None
        if source_lead and source_lead.status != Lead.LeadStatus.WON:
            source_lead.status = Lead.LeadStatus.WON
            source_lead.updated_by = actor
            source_lead.save(update_fields=["status", "updated_by", "updated_at"])

        client = ProjectClient.objects.create(
            client_number=_next_client_number(),
            source_lead=source_lead,
            project_status=ProjectClient.ProjectStatus.DISCOVERY,
            next_action="Create project and assign delivery team",
            created_by=actor,
            updated_by=actor,
            **data,
        )

        if primary_contact:
            ClientContact.objects.create(
                client=client,
                created_by=actor,
                updated_by=actor,
                **primary_contact,
            )

        record_audit_log(
            actor=actor,
            module="crm",
            action="create",
            entity_type="ProjectClient",
            entity_id=client.id,
            new_values={
                "client_number": client.client_number,
                "source_lead_id": str(source_lead.id) if source_lead else None,
                "company_name": client.company_name,
                "project_name": client.project_name,
            },
            request=request,
        )
        return client

    @staticmethod
    @transaction.atomic
    def create_contact(*, client, data, actor, request=None):
        contact = ClientContact.objects.create(
            client=client,
            created_by=actor,
            updated_by=actor,
            **data,
        )
        record_audit_log(
            actor=actor,
            module="crm",
            action="create",
            entity_type="ClientContact",
            entity_id=contact.id,
            new_values={
                "client_id": str(client.id),
                "client_number": client.client_number,
                "role": contact.role,
                "name": contact.name,
                "phone": contact.phone,
            },
            request=request,
        )
        return contact

    @staticmethod
    @transaction.atomic
    def create_or_update_project_handoff(*, project=None, client, data, actor, request=None):
        values = {
            "project_code": data["project_code"],
            "project_manager": data["project_manager"],
            "start_date": data["start_date"],
            "target_end_date": data["target_end_date"],
            "priority": data["priority"],
            "billing_model": data["billing_model"],
            "delivery_method": data["delivery_method"],
            "communication_channel": data.get("communication_channel", ""),
            "repository_url": data.get("repository_url", ""),
            "kickoff_notes": data["kickoff_notes"].strip(),
            "updated_by": actor,
        }

        action = "update" if project else "create"
        if project:
            for field, value in values.items():
                setattr(project, field, value)
            project.client = client
            project.save(update_fields=[*values.keys(), "client", "updated_at"])
        else:
            active_handoff_exists = ProjectHandoff.objects.filter(
                client=client,
                is_deleted=False,
                status__in=[
                    ProjectHandoff.Status.PLANNING,
                    ProjectHandoff.Status.ACTIVE,
                    ProjectHandoff.Status.ON_HOLD,
                ],
            ).exists()
            if active_handoff_exists:
                raise ValidationError({"client_id": "Active project handoff already exists for this client. Edit the existing handoff instead."})
            project = ProjectHandoff.objects.create(
                client=client,
                status=ProjectHandoff.Status.PLANNING,
                created_by=actor,
                **values,
            )

        client.project_status = ProjectClient.ProjectStatus.DEVELOPMENT
        client.agreement_status = ProjectClient.AgreementStatus.SIGNED
        client.updated_by = actor
        client.save(update_fields=["project_status", "agreement_status", "updated_by", "updated_at"])

        record_audit_log(
            actor=actor,
            module="crm",
            action=action,
            entity_type="ProjectHandoff",
            entity_id=project.id,
            new_values={
                "client_id": str(client.id),
                "project_code": project.project_code,
                "project_manager": project.project_manager,
                "priority": project.priority,
            },
            request=request,
        )
        return project


class ProjectAgreementService:
    @staticmethod
    @transaction.atomic
    def create_or_update_agreement(*, agreement=None, client, project_handoff=None, data, actor, request=None):
        if project_handoff and project_handoff.client_id != client.id:
            raise ValidationError({"project_handoff_id": "Project handoff does not belong to selected client."})

        if project_handoff:
            duplicate = ProjectAgreement.objects.filter(
                project_handoff=project_handoff,
                is_deleted=False,
            )
            if agreement:
                duplicate = duplicate.exclude(id=agreement.id)
            if duplicate.exists():
                raise ValidationError({"project_handoff_id": "Agreement already exists for this project handoff."})

        values = {
            "project_handoff": project_handoff,
            "client": client,
            "agreement_type": data["agreement_type"],
            "effective_date": data["effective_date"],
            "expiry_date": data.get("expiry_date"),
            "contract_value": data.get("contract_value", 0),
            "payment_terms": data.get("payment_terms", "").strip(),
            "status": data["status"],
            "remarks": data.get("remarks", "").strip(),
            "attachment_name": data.get("attachment_name", "").strip(),
            "updated_by": actor,
        }

        action = "update" if agreement else "create"
        if agreement:
            for field, value in values.items():
                setattr(agreement, field, value)
            agreement.save(update_fields=[*values.keys(), "updated_at"])
        else:
            agreement = ProjectAgreement.objects.create(
                agreement_number=_next_agreement_number(),
                created_by=actor,
                **values,
            )

        if agreement.status == ProjectAgreement.AgreementStatus.ACTIVE:
            client.agreement_status = ProjectClient.AgreementStatus.SIGNED
            client.updated_by = actor
            client.save(update_fields=["agreement_status", "updated_by", "updated_at"])

        record_audit_log(
            actor=actor,
            module="crm",
            action=action,
            entity_type="ProjectAgreement",
            entity_id=agreement.id,
            new_values={
                "agreement_number": agreement.agreement_number,
                "client_id": str(client.id),
                "project_handoff_id": str(project_handoff.id) if project_handoff else None,
                "status": agreement.status,
                "contract_value": str(agreement.contract_value),
            },
            request=request,
        )
        return agreement
