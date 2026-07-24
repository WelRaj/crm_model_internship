from django.db.models import Q

from apps.marketing import models


def apply_search(queryset, search, fields):
    if not search:
        return queryset
    query = Q()
    for field in fields:
        query |= Q(**{f"{field}__icontains": search})
    return queryset.filter(query)


def campaigns_queryset():
    return models.MarketingCampaign.objects.filter(is_deleted=False).order_by("-start_date", "-created_at")


def lead_sources_queryset():
    return models.LeadSource.objects.filter(is_deleted=False).order_by("-created_at")

