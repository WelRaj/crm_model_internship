from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError

from apps.audit.services import record_audit_log
from apps.notifications.models import CommunicationJob, Notification, NotificationRead


def _notification_payload(notification: Notification):
    return {
        "title": notification.title,
        "message": notification.message,
        "notification_type": notification.notification_type,
        "priority": notification.priority,
        "recipient_id": str(notification.recipient_id) if notification.recipient_id else None,
        "target_module": notification.target_module,
        "entity_type": notification.entity_type,
        "entity_id": notification.entity_id,
        "is_broadcast": notification.is_broadcast,
    }


def _job_payload(job: CommunicationJob):
    return {
        "channel": job.channel,
        "recipient_name": job.recipient_name,
        "recipient_email": job.recipient_email,
        "recipient_mobile": job.recipient_mobile,
        "subject": job.subject,
        "status": job.status,
        "notification_id": str(job.notification_id) if job.notification_id else None,
    }


class NotificationService:
    @staticmethod
    @transaction.atomic
    def create_notification(*, data, actor, request=None):
        recipient_id = data.pop("recipient_id", None)
        notification = Notification.objects.create(
            recipient_id=recipient_id,
            created_by=actor,
            updated_by=actor,
            **data,
        )
        record_audit_log(
            actor=actor,
            module="notifications",
            action="create",
            entity_type="Notification",
            entity_id=notification.id,
            new_values=_notification_payload(notification),
            request=request,
        )
        return notification

    @staticmethod
    @transaction.atomic
    def update_notification(*, notification, data, actor, request=None):
        old_values = _notification_payload(notification)
        for field, value in data.items():
            setattr(notification, field, value)
        notification.updated_by = actor
        notification.save()
        record_audit_log(
            actor=actor,
            module="notifications",
            action="update",
            entity_type="Notification",
            entity_id=notification.id,
            old_values=old_values,
            new_values=_notification_payload(notification),
            request=request,
        )
        return notification

    @staticmethod
    @transaction.atomic
    def mark_read(*, notification, actor, request=None):
        read, created = NotificationRead.objects.get_or_create(
            notification=notification,
            user=actor,
            defaults={"created_by": actor, "updated_by": actor},
        )
        if not created:
            read.updated_by = actor
            read.save(update_fields=["updated_by", "updated_at"])
        record_audit_log(
            actor=actor,
            module="notifications",
            action="read",
            entity_type="Notification",
            entity_id=notification.id,
            new_values={"is_read": True, "notification_id": str(notification.id)},
            request=request,
        )
        return read

    @staticmethod
    @transaction.atomic
    def mark_unread(*, notification, actor, request=None):
        deleted, _ = NotificationRead.objects.filter(notification=notification, user=actor).delete()
        record_audit_log(
            actor=actor,
            module="notifications",
            action="unread",
            entity_type="Notification",
            entity_id=notification.id,
            new_values={"is_read": False, "removed_rows": deleted},
            request=request,
        )
        return notification

    @staticmethod
    @transaction.atomic
    def archive_notification(*, notification, actor, request=None):
        notification.is_active = False
        notification.updated_by = actor
        notification.save(update_fields=["is_active", "updated_by", "updated_at"])
        record_audit_log(
            actor=actor,
            module="notifications",
            action="update",
            entity_type="Notification",
            entity_id=notification.id,
            old_values={"is_active": True},
            new_values={"is_active": False},
            request=request,
        )
        return notification

    @staticmethod
    @transaction.atomic
    def queue_job(*, data, actor, request=None):
        notification_id = data.pop("notification_id", None)
        notification = None
        if notification_id:
            notification = Notification.objects.filter(id=notification_id, is_deleted=False).first()
            if not notification:
                raise ValidationError({"notification_id": "Notification not found."})
        scheduled_at = data.get("scheduled_at")
        if scheduled_at and scheduled_at < timezone.now():
            raise ValidationError({"scheduled_at": "Scheduled time cannot be in the past."})
        job = CommunicationJob.objects.create(
            notification=notification,
            created_by=actor,
            updated_by=actor,
            **data,
        )
        record_audit_log(
            actor=actor,
            module="notifications",
            action="create",
            entity_type="CommunicationJob",
            entity_id=job.id,
            new_values=_job_payload(job),
            request=request,
        )
        return job

    @staticmethod
    @transaction.atomic
    def update_job(*, job, data, actor, request=None):
        old_values = _job_payload(job)
        for field, value in data.items():
            setattr(job, field, value)
        job.updated_by = actor
        job.save()
        record_audit_log(
            actor=actor,
            module="notifications",
            action="update",
            entity_type="CommunicationJob",
            entity_id=job.id,
            old_values=old_values,
            new_values=_job_payload(job),
            request=request,
        )
        return job
