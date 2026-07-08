from django.conf import settings
from django.db import models

from apps.core.models import BaseModel, TimeStampedModel, UUIDModel


class FileObject(BaseModel):
    owner_type = models.CharField(max_length=120, db_index=True)
    owner_id = models.CharField(max_length=80, db_index=True)
    file_category = models.CharField(max_length=80, db_index=True)
    original_name = models.CharField(max_length=255)
    storage_key = models.CharField(max_length=255, unique=True)
    mime_type = models.CharField(max_length=120, blank=True)
    size = models.PositiveBigIntegerField(default=0)
    checksum = models.CharField(max_length=128, blank=True, db_index=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name="uploaded_files")

    class Meta:
        db_table = "file_objects"
        indexes = [
            models.Index(fields=["owner_type", "owner_id"]),
            models.Index(fields=["file_category"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self) -> str:
        return self.original_name


class FileAccessLog(UUIDModel, TimeStampedModel):
    file = models.ForeignKey(FileObject, on_delete=models.CASCADE, related_name="access_logs")
    accessed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    action = models.CharField(max_length=40)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        db_table = "file_access_logs"
        indexes = [models.Index(fields=["file", "created_at"]), models.Index(fields=["action"])]

# Create your models here.
