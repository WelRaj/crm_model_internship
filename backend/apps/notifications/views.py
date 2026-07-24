from django.db.models import Q
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView

from apps.core.responses import success_response
from apps.notifications.models import CommunicationJob, Notification, NotificationRead
from apps.notifications.selectors import apply_search, communication_jobs_queryset, notifications_queryset
from apps.notifications.serializers import (
    CommunicationJobSerializer,
    CommunicationJobWriteSerializer,
    NotificationReadSerializer,
    NotificationSerializer,
    NotificationWriteSerializer,
)
from apps.notifications.services import NotificationService


def _visible_notifications(request):
    user = request.user
    queryset = notifications_queryset()
    if user.is_authenticated:
        queryset = queryset.filter(Q(recipient=user) | Q(is_broadcast=True))
    else:
        queryset = queryset.filter(is_broadcast=True)
    return queryset


class NotificationOverviewView(APIView):
    def get(self, request):
        queryset = _visible_notifications(request)
        unread_ids = NotificationRead.objects.filter(user=request.user).values_list("notification_id", flat=True)
        return success_response(
            data={
                "total_notifications": queryset.count(),
                "unread_notifications": queryset.exclude(id__in=unread_ids).count(),
                "critical_notifications": queryset.filter(priority=Notification.Priority.CRITICAL).count(),
                "system_notifications": queryset.filter(notification_type=Notification.NotificationType.SYSTEM).count(),
                "queued_jobs": communication_jobs_queryset().filter(status=CommunicationJob.Status.QUEUED).count(),
            }
        )


class NotificationListCreateView(APIView):
    def get(self, request):
        queryset = _visible_notifications(request)
        status_filter = request.query_params.get("status")
        type_filter = request.query_params.get("notification_type")
        priority_filter = request.query_params.get("priority")
        module_filter = request.query_params.get("target_module")
        search = request.query_params.get("search")

        if status_filter == "unread":
            queryset = queryset.exclude(reads__user=request.user)
        elif status_filter == "read":
            queryset = queryset.filter(reads__user=request.user)
        if type_filter:
            queryset = queryset.filter(notification_type=type_filter)
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        if module_filter:
            queryset = queryset.filter(target_module=module_filter)
        if search:
            queryset = apply_search(
                queryset,
                search,
                ("title", "message", "notification_type", "priority", "target_module", "entity_type", "entity_id"),
            )
        queryset = queryset.distinct()
        return success_response(data=NotificationSerializer(queryset[:200], many=True, context={"request": request}).data)

    def post(self, request):
        serializer = NotificationWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        notification = NotificationService.create_notification(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(
            data=NotificationSerializer(notification, context={"request": request}).data,
            message="Notification created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class NotificationDetailView(APIView):
    def get(self, request, notification_id):
        notification = get_object_or_404(_visible_notifications(request), id=notification_id)
        return success_response(data=NotificationSerializer(notification, context={"request": request}).data)

    def patch(self, request, notification_id):
        notification = get_object_or_404(_visible_notifications(request), id=notification_id)
        serializer = NotificationWriteSerializer(data=request.data, partial=True, context={"notification": notification})
        serializer.is_valid(raise_exception=True)
        notification = NotificationService.update_notification(notification=notification, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=NotificationSerializer(notification, context={"request": request}).data, message="Notification updated successfully")


class NotificationReadStateView(APIView):
    def post(self, request, notification_id):
        notification = get_object_or_404(_visible_notifications(request), id=notification_id)
        NotificationService.mark_read(notification=notification, actor=request.user, request=request)
        return success_response(data=NotificationReadSerializer({"is_read": True}).data, message="Notification marked as read")

    def delete(self, request, notification_id):
        notification = get_object_or_404(_visible_notifications(request), id=notification_id)
        NotificationService.mark_unread(notification=notification, actor=request.user, request=request)
        return success_response(data=NotificationReadSerializer({"is_read": False}).data, message="Notification marked as unread")


class CommunicationJobListCreateView(APIView):
    def get(self, request):
        queryset = communication_jobs_queryset()
        status_filter = request.query_params.get("status")
        channel_filter = request.query_params.get("channel")
        search = request.query_params.get("search")
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if channel_filter:
            queryset = queryset.filter(channel=channel_filter)
        if search:
            queryset = apply_search(queryset, search, ("recipient_name", "recipient_email", "recipient_mobile", "subject", "message", "status", "channel"))
        return success_response(data=CommunicationJobSerializer(queryset[:200], many=True).data)

    def post(self, request):
        serializer = CommunicationJobWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = NotificationService.queue_job(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(
            data=CommunicationJobSerializer(job).data,
            message="Communication job queued successfully",
            status_code=status.HTTP_201_CREATED,
        )


class CommunicationJobDetailView(APIView):
    def get(self, request, job_id):
        job = get_object_or_404(communication_jobs_queryset(), id=job_id)
        return success_response(data=CommunicationJobSerializer(job).data)

    def patch(self, request, job_id):
        job = get_object_or_404(communication_jobs_queryset(), id=job_id)
        serializer = CommunicationJobWriteSerializer(data=request.data, partial=True, context={"job": job})
        serializer.is_valid(raise_exception=True)
        job = NotificationService.update_job(job=job, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=CommunicationJobSerializer(job).data, message="Communication job updated successfully")
