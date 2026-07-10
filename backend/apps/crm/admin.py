from django.contrib import admin

from apps.crm.models import Lead


@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ("lead_number", "contact_name", "company_name", "mobile", "lead_type", "status", "assigned_to", "is_active")
    list_filter = ("lead_type", "status", "source", "is_active")
    search_fields = ("lead_number", "contact_name", "company_name", "email", "mobile")
    ordering = ("-created_at",)

