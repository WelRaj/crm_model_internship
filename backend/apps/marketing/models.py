from django.db import models

from apps.core.models import BaseModel


class MarketingCampaign(BaseModel):
    class Channel(models.TextChoices):
        GOOGLE_SEARCH = "Google Search", "Google Search"
        LINKEDIN_ADS = "LinkedIn Ads", "LinkedIn Ads"
        META_ADS = "Meta Ads", "Meta Ads"
        WHATSAPP = "WhatsApp", "WhatsApp"
        EMAIL = "Email", "Email"
        WEBINAR = "Webinar", "Webinar"
        MARKETPLACE = "Marketplace", "Marketplace"

    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        ACTIVE = "Active", "Active"
        REVIEW = "Review", "Review"
        SCALE = "Scale", "Scale"
        ARCHIVED = "Archived", "Archived"

    campaign_code = models.CharField(max_length=40, unique=True)
    name = models.CharField(max_length=180, db_index=True)
    channel = models.CharField(max_length=40, choices=Channel.choices, db_index=True)
    objective = models.CharField(max_length=220)
    audience_segment = models.CharField(max_length=220)
    budget_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    spent_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    leads = models.PositiveIntegerField(default=0)
    mql = models.PositiveIntegerField(default=0)
    pipeline_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    start_date = models.DateField(db_index=True)
    end_date = models.DateField(db_index=True)
    utm_source = models.CharField(max_length=120, db_index=True)
    utm_medium = models.CharField(max_length=120, db_index=True)
    utm_campaign = models.CharField(max_length=160, unique=True, db_index=True)
    landing_page = models.CharField(max_length=240)
    lead_form = models.CharField(max_length=180)
    owner = models.CharField(max_length=160, db_index=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT, db_index=True)
    next_action = models.CharField(max_length=240)

    class Meta:
        db_table = "marketing_campaigns"
        indexes = [
            models.Index(fields=["campaign_code"]),
            models.Index(fields=["status", "channel"]),
            models.Index(fields=["owner", "status"]),
            models.Index(fields=["start_date", "end_date"]),
        ]

    def __str__(self) -> str:
        return f"{self.campaign_code} - {self.name}"


class LeadSource(BaseModel):
    class SourceType(models.TextChoices):
        ORGANIC = "Organic", "Organic"
        PAID = "Paid", "Paid"
        REFERRAL = "Referral", "Referral"
        OUTBOUND = "Outbound", "Outbound"
        EVENT = "Event", "Event"
        PARTNER = "Partner", "Partner"
        OFFLINE = "Offline", "Offline"

    class Status(models.TextChoices):
        ACTIVE = "Active", "Active"
        REVIEW = "Review", "Review"
        PAUSED = "Paused", "Paused"
        ARCHIVED = "Archived", "Archived"

    class Quality(models.TextChoices):
        HIGH = "High", "High"
        HIGH_INTENT = "High Intent", "High Intent"
        ENTERPRISE = "Enterprise", "Enterprise"
        WARM = "Warm", "Warm"
        MIXED = "Mixed", "Mixed"
        NURTURE = "Nurture", "Nurture"
        LOW = "Low", "Low"

    source_code = models.CharField(max_length=20, unique=True)
    source = models.CharField(max_length=180, db_index=True)
    source_type = models.CharField(max_length=20, choices=SourceType.choices, db_index=True)
    normalized_key = models.CharField(max_length=120, unique=True, db_index=True)
    default_utm_source = models.CharField(max_length=120)
    default_utm_medium = models.CharField(max_length=120)
    owner = models.CharField(max_length=160, db_index=True)
    quality = models.CharField(max_length=40, choices=Quality.choices, db_index=True)
    leads = models.PositiveIntegerField(default=0)
    mql = models.PositiveIntegerField(default=0)
    sql = models.PositiveIntegerField(default=0)
    won = models.PositiveIntegerField(default=0)
    last_30_change = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE, db_index=True)
    next_action = models.CharField(max_length=240)

    class Meta:
        db_table = "lead_sources"
        indexes = [
            models.Index(fields=["source_code"]),
            models.Index(fields=["source_type", "status"]),
            models.Index(fields=["quality", "status"]),
            models.Index(fields=["owner", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.source_code} - {self.source}"

