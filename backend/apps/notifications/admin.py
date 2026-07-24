from django.contrib import admin

from apps.notifications.models import CommunicationJob, Notification, NotificationRead


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "notification_type", "priority", "recipient", "is_broadcast", "is_active", "created_at")
    list_filter = ("notification_type", "priority", "is_broadcast", "is_active")
    search_fields = ("title", "message", "target_module", "entity_type", "entity_id", "recipient__email")


@admin.register(NotificationRead)
class NotificationReadAdmin(admin.ModelAdmin):
    list_display = ("notification", "user", "read_at")
    search_fields = ("notification__title", "user__email", "user__mobile")


@admin.register(CommunicationJob)
class CommunicationJobAdmin(admin.ModelAdmin):
    list_display = ("channel", "status", "recipient_name", "recipient_email", "recipient_mobile", "scheduled_at", "created_at")
    list_filter = ("channel", "status")
    search_fields = ("recipient_name", "recipient_email", "recipient_mobile", "subject", "message")
