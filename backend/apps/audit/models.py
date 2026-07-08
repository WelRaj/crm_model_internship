from django.conf import settings
from django.db import models

from apps.core.models import TimeStampedModel, UUIDModel


class AuditLog(UUIDModel, TimeStampedModel):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="audit_logs")
    module = models.CharField(max_length=80, db_index=True)
    action = models.CharField(max_length=80, db_index=True)
    entity_type = models.CharField(max_length=120, db_index=True)
    entity_id = models.CharField(max_length=80, db_index=True)
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["module", "action"]),
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.module}.{self.action}:{self.entity_type}:{self.entity_id}"


class ActivityTimeline(UUIDModel, TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="activity_timeline")
    title = models.CharField(max_length=160)
    detail = models.TextField(blank=True)
    module = models.CharField(max_length=80, db_index=True)
    status = models.CharField(max_length=80, blank=True)

    class Meta:
        db_table = "activity_timeline"
        indexes = [models.Index(fields=["user", "created_at"]), models.Index(fields=["module"])]

# Create your models here.
