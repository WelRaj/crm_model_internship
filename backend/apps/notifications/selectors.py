from django.db.models import Q

from apps.notifications.models import CommunicationJob, Notification


def apply_search(queryset, search, fields):
    if not search:
        return queryset
    query = Q()
    for field in fields:
        query |= Q(**{f"{field}__icontains": search})
    return queryset.filter(query)


def notifications_queryset():
    return Notification.objects.filter(is_deleted=False).order_by("-created_at")


def communication_jobs_queryset():
    return CommunicationJob.objects.filter(is_deleted=False).order_by("-scheduled_at", "-created_at")
