from django.db.models import Q

from apps.crm.models import ProjectAgreement, ProjectClient, ProjectHandoff, Lead


def get_leads_queryset():
    return Lead.objects.filter(is_deleted=False).select_related("assigned_to").order_by("-created_at")


def find_duplicate_leads(*, mobile: str, email: str = "", company_name: str = "", exclude_lead_id=None):
    query = Q(mobile=mobile)
    if email:
        query |= Q(email__iexact=email)
    if company_name:
        query |= Q(company_name__iexact=company_name)
    queryset = get_leads_queryset().filter(query)
    if exclude_lead_id:
        queryset = queryset.exclude(id=exclude_lead_id)
    return queryset


def get_project_clients_queryset():
    return (
        ProjectClient.objects.filter(is_deleted=False)
        .select_related("source_lead")
        .prefetch_related("contacts")
        .order_by("-created_at")
    )


def get_project_handoffs_queryset():
    return (
        ProjectHandoff.objects.filter(is_deleted=False)
        .select_related("client", "client__source_lead")
        .prefetch_related("client__contacts")
        .order_by("-created_at")
    )


def get_project_agreements_queryset():
    return (
        ProjectAgreement.objects.filter(is_deleted=False)
        .select_related("client", "project_handoff", "client__source_lead")
        .prefetch_related("client__contacts")
        .order_by("-created_at")
    )
