from django.contrib import admin

from apps.support.models import SupportTicket, SupportTicketAssignment, SupportTicketComment, SupportTicketStatusHistory


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("ticket_number", "subject", "module", "requester", "priority", "status", "channel", "current_owner", "created_at")
    list_filter = ("module", "priority", "status", "channel", "is_deleted")
    search_fields = ("ticket_number", "subject", "requester", "description")


admin.site.register(SupportTicketComment)
admin.site.register(SupportTicketStatusHistory)
admin.site.register(SupportTicketAssignment)
