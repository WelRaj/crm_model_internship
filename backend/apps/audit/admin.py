from django.contrib import admin

from apps.audit.models import ActivityTimeline, AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "module", "action", "entity_type", "entity_id", "actor", "created_at")
    list_filter = ("module", "action", "entity_type")
    search_fields = ("entity_id", "entity_type", "actor__email")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(ActivityTimeline)
class ActivityTimelineAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "module", "title", "status", "created_at")
    list_filter = ("module", "status")
    search_fields = ("user__email", "title", "detail")
