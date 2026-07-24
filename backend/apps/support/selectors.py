from django.db.models import Q

from apps.support.models import SupportTicket


def apply_search(queryset, search, fields):
    if not search:
        return queryset
    query = Q()
    for field in fields:
        query |= Q(**{f"{field}__icontains": search})
    return queryset.filter(query)


def tickets_queryset():
    return (
        SupportTicket.objects.filter(is_deleted=False)
        .select_related("current_owner")
        .prefetch_related("comments", "status_history", "assignments")
        .order_by("-created_at")
    )
