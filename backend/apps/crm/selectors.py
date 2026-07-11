from django.db.models import Q

from apps.crm.models import Lead


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
