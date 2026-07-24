from django.conf import settings
from django.db import models

from apps.core.models import BaseModel


class Notification(BaseModel):
    class NotificationType(models.TextChoices):
        INFO = "Info", "Info"
        SUCCESS = "Success", "Success"
        WARNING = "Warning", "Warning"
        ERROR = "Error", "Error"
        ASSIGNMENT = "Assignment", "Assignment"
        APPROVAL = "Approval", "Approval"
        REMINDER = "Reminder", "Reminder"
        SECURITY = "Security", "Security"
        PROJECT = "Project", "Project"
        FINANCE = "Finance", "Finance"
        SUPPORT = "Support", "Support"
        HRMS = "HRMS", "HRMS"
        SYSTEM = "System", "System"

    class Priority(models.TextChoices):
        LOW = "Low", "Low"
        MEDIUM = "Medium", "Medium"
        HIGH = "High", "High"
        CRITICAL = "Critical", "Critical"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="notifications",
    )
    title = models.CharField(max_length=180, db_index=True)
    message = models.TextField()
    notification_type = models.CharField(max_length=30, choices=NotificationType.choices, db_index=True)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM, db_index=True)
    action_url = models.CharField(max_length=240, blank=True)
    target_module = models.CharField(max_length=80, blank=True, db_index=True)
    entity_type = models.CharField(max_length=120, blank=True, db_index=True)
    entity_id = models.CharField(max_length=80, blank=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    is_broadcast = models.BooleanField(default=False, db_index=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)

    class Meta:
        db_table = "notifications"
        indexes = [
            models.Index(fields=["recipient", "is_broadcast", "is_active", "created_at"]),
            models.Index(fields=["notification_type", "priority"]),
            models.Index(fields=["target_module", "notification_type"]),
            models.Index(fields=["entity_type", "entity_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.title}"


class NotificationRead(BaseModel):
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name="reads")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notification_reads")
    read_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "notification_reads"
        constraints = [
            models.UniqueConstraint(fields=["notification", "user"], name="unique_notification_read"),
        ]
        indexes = [
            models.Index(fields=["user", "read_at"]),
            models.Index(fields=["notification", "user"]),
        ]

    def __str__(self) -> str:
        return f"{self.notification_id} -> {self.user_id}"


class CommunicationJob(BaseModel):
    class Channel(models.TextChoices):
        EMAIL = "Email", "Email"
        SMS = "SMS", "SMS"
        WHATSAPP = "WhatsApp", "WhatsApp"
        IN_APP = "In-App", "In-App"

    class Status(models.TextChoices):
        QUEUED = "Queued", "Queued"
        PROCESSING = "Processing", "Processing"
        SENT = "Sent", "Sent"
        DELIVERED = "Delivered", "Delivered"
        FAILED = "Failed", "Failed"
        CANCELLED = "Cancelled", "Cancelled"

    notification = models.ForeignKey(
        Notification,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="communication_jobs",
    )
    channel = models.CharField(max_length=20, choices=Channel.choices, db_index=True)
    recipient_name = models.CharField(max_length=160)
    recipient_email = models.EmailField(blank=True)
    recipient_mobile = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=180)
    message = models.TextField()
    payload = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED, db_index=True)
    scheduled_at = models.DateTimeField(null=True, blank=True, db_index=True)
    sent_at = models.DateTimeField(null=True, blank=True, db_index=True)
    delivered_at = models.DateTimeField(null=True, blank=True, db_index=True)
    retry_count = models.PositiveSmallIntegerField(default=0)
    last_error = models.TextField(blank=True)

    class Meta:
        db_table = "communication_jobs"
        indexes = [
            models.Index(fields=["status", "channel"]),
            models.Index(fields=["scheduled_at", "status"]),
            models.Index(fields=["recipient_email"]),
            models.Index(fields=["recipient_mobile"]),
        ]

    def __str__(self) -> str:
        return f"{self.channel} {self.status}"
