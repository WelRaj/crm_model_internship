from django.contrib import admin

from apps.marketing.models import LeadSource, MarketingCampaign


@admin.register(MarketingCampaign)
class MarketingCampaignAdmin(admin.ModelAdmin):
    list_display = ("campaign_code", "name", "channel", "status", "owner", "start_date", "end_date", "is_active")
    list_filter = ("channel", "status", "is_active")
    search_fields = ("campaign_code", "name", "objective", "audience_segment", "owner", "utm_source", "utm_medium", "utm_campaign")
    ordering = ("-start_date",)


@admin.register(LeadSource)
class LeadSourceAdmin(admin.ModelAdmin):
    list_display = ("source_code", "source", "source_type", "quality", "status", "owner", "leads", "sql", "is_active")
    list_filter = ("source_type", "quality", "status", "is_active")
    search_fields = ("source_code", "source", "normalized_key", "default_utm_source", "default_utm_medium", "owner", "next_action")
    ordering = ("-created_at",)

