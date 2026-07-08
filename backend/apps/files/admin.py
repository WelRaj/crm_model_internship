from django.contrib import admin

from apps.files.models import FileAccessLog, FileObject


@admin.register(FileObject)
class FileObjectAdmin(admin.ModelAdmin):
    list_display = ("id", "original_name", "file_category", "owner_type", "owner_id", "uploaded_by", "created_at")
    list_filter = ("file_category", "owner_type")
    search_fields = ("original_name", "storage_key", "owner_id", "checksum")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(FileAccessLog)
class FileAccessLogAdmin(admin.ModelAdmin):
    list_display = ("id", "file", "action", "accessed_by", "ip_address", "created_at")
    list_filter = ("action",)
    search_fields = ("file__original_name", "accessed_by__email", "ip_address")
