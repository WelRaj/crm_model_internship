from django.contrib import admin

from apps.crm.models import Lead, LeadFollowUp


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("lead_number", "contact_name", "company_name", "mobile", "lead_type", "status", "assigned_to", "is_active")
    list_filter = ("lead_type", "status", "source", "is_active")
    search_fields = ("lead_number", "contact_name", "company_name", "email", "mobile")
    ordering = ("-created_at",)


@admin.register(LeadFollowUp)
class LeadFollowUpAdmin(admin.ModelAdmin):
    list_display = ("lead", "channel", "outcome", "next_follow_up_at", "created_by", "created_at")
    list_filter = ("channel", "outcome", "created_at")
    search_fields = ("lead__lead_number", "lead__contact_name", "note")
    ordering = ("-created_at",)
