from django.contrib import admin

from apps.crm.models import ClientContact, Lead, LeadFollowUp, ProjectAgreement, ProjectClient, ProjectHandoff


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


class ClientContactInline(admin.TabularInline):
    model = ClientContact
    extra = 0


@admin.register(ProjectClient)
class ProjectClientAdmin(admin.ModelAdmin):
    list_display = ("client_number", "company_name", "project_name", "agreement_status", "project_status", "value", "created_at")
    list_filter = ("agreement_status", "project_status", "created_at")
    search_fields = ("client_number", "company_name", "project_name", "source_lead__lead_number")
    inlines = [ClientContactInline]
    ordering = ("-created_at",)


@admin.register(ProjectHandoff)
class ProjectHandoffAdmin(admin.ModelAdmin):
    list_display = ("project_code", "client", "project_manager", "priority", "status", "start_date", "target_end_date")
    list_filter = ("priority", "status", "created_at")
    search_fields = ("project_code", "client__client_number", "client__company_name", "project_manager")
    ordering = ("-created_at",)


@admin.register(ProjectAgreement)
class ProjectAgreementAdmin(admin.ModelAdmin):
    list_display = ("agreement_number", "client", "project_handoff", "agreement_type", "status", "contract_value", "effective_date", "expiry_date")
    list_filter = ("agreement_type", "status", "effective_date")
    search_fields = ("agreement_number", "client__company_name", "project_handoff__project_code", "attachment_name")
    ordering = ("-created_at",)
