from decimal import Decimal

from rest_framework import serializers

from apps.marketing.models import LeadSource, MarketingCampaign


class MarketingCampaignSerializer(serializers.ModelSerializer):
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = MarketingCampaign
        fields = (
            "id",
            "campaign_code",
            "name",
            "channel",
            "status",
            "status_label",
            "objective",
            "audience_segment",
            "budget_amount",
            "spent_amount",
            "leads",
            "mql",
            "pipeline_amount",
            "start_date",
            "end_date",
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "landing_page",
            "lead_form",
            "owner",
            "next_action",
            "is_active",
            "created_at",
            "updated_at",
        )


class MarketingCampaignWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=180)
    channel = serializers.ChoiceField(choices=MarketingCampaign.Channel.choices)
    objective = serializers.CharField(max_length=220)
    audience_segment = serializers.CharField(max_length=220)
    budget_amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal("0.01"))
    spent_amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal("0"))
    leads = serializers.IntegerField(min_value=0)
    mql = serializers.IntegerField(min_value=0)
    pipeline_amount = serializers.DecimalField(max_digits=14, decimal_places=2, min_value=Decimal("0"))
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    utm_source = serializers.CharField(max_length=120)
    utm_medium = serializers.CharField(max_length=120)
    utm_campaign = serializers.CharField(max_length=160)
    landing_page = serializers.CharField(max_length=240)
    lead_form = serializers.CharField(max_length=180)
    owner = serializers.CharField(max_length=160)
    status = serializers.ChoiceField(choices=MarketingCampaign.Status.choices, default=MarketingCampaign.Status.DRAFT)
    next_action = serializers.CharField(max_length=240)

    def validate(self, attrs):
        campaign = self.context.get("campaign")
        start_date = attrs.get("start_date", getattr(campaign, "start_date", None))
        end_date = attrs.get("end_date", getattr(campaign, "end_date", None))
        budget_amount = attrs.get("budget_amount", getattr(campaign, "budget_amount", Decimal("0")))
        spent_amount = attrs.get("spent_amount", getattr(campaign, "spent_amount", Decimal("0")))
        leads = attrs.get("leads", getattr(campaign, "leads", 0))
        mql = attrs.get("mql", getattr(campaign, "mql", 0))
        utm_campaign = attrs.get("utm_campaign", getattr(campaign, "utm_campaign", ""))

        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError({"end_date": "End date must not be earlier than start date."})
        if spent_amount > budget_amount:
            raise serializers.ValidationError({"spent_amount": "Spent amount cannot exceed budget amount."})
        if mql > leads:
            raise serializers.ValidationError({"mql": "MQL cannot be greater than leads."})
        queryset = MarketingCampaign.objects.filter(utm_campaign__iexact=utm_campaign)
        if campaign:
            queryset = queryset.exclude(id=campaign.id)
        if utm_campaign and queryset.exists():
            raise serializers.ValidationError({"utm_campaign": "A campaign with this UTM campaign already exists."})
        return attrs


class LeadSourceSerializer(serializers.ModelSerializer):
    type_label = serializers.CharField(source="get_source_type_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)
    quality_label = serializers.CharField(source="get_quality_display", read_only=True)

    class Meta:
        model = LeadSource
        fields = (
            "id",
            "source_code",
            "source",
            "source_type",
            "type_label",
            "normalized_key",
            "default_utm_source",
            "default_utm_medium",
            "owner",
            "quality",
            "quality_label",
            "leads",
            "mql",
            "sql",
            "won",
            "last_30_change",
            "status",
            "status_label",
            "next_action",
            "is_active",
            "created_at",
            "updated_at",
        )


class LeadSourceWriteSerializer(serializers.Serializer):
    source = serializers.CharField(max_length=180)
    source_type = serializers.ChoiceField(choices=LeadSource.SourceType.choices)
    normalized_key = serializers.CharField(max_length=120, required=False, allow_blank=True)
    default_utm_source = serializers.CharField(max_length=120)
    default_utm_medium = serializers.CharField(max_length=120)
    owner = serializers.CharField(max_length=160)
    quality = serializers.ChoiceField(choices=LeadSource.Quality.choices, default=LeadSource.Quality.MIXED)
    leads = serializers.IntegerField(min_value=0)
    mql = serializers.IntegerField(min_value=0)
    sql = serializers.IntegerField(min_value=0)
    won = serializers.IntegerField(min_value=0)
    last_30_change = serializers.IntegerField()
    status = serializers.ChoiceField(choices=LeadSource.Status.choices, default=LeadSource.Status.ACTIVE)
    next_action = serializers.CharField(max_length=240)

    def validate(self, attrs):
        source = self.context.get("source")
        normalized_key = attrs.get("normalized_key", "").strip().lower()
        if not normalized_key:
            normalized_key = attrs.get("source", getattr(source, "source", "")).strip().lower().replace(" ", "_").replace("/", "_")
        normalized_key = "_".join(part for part in normalized_key.split("_") if part)
        attrs["normalized_key"] = normalized_key
        leads = attrs.get("leads", getattr(source, "leads", 0))
        mql = attrs.get("mql", getattr(source, "mql", 0))
        sql = attrs.get("sql", getattr(source, "sql", 0))
        won = attrs.get("won", getattr(source, "won", 0))
        if mql > leads or sql > mql or won > sql:
            raise serializers.ValidationError("Lead counts must follow Leads >= MQL >= SQL >= Won.")
        queryset = LeadSource.objects.filter(normalized_key__iexact=normalized_key)
        if source:
            queryset = queryset.exclude(id=source.id)
        if normalized_key and queryset.exists():
            raise serializers.ValidationError({"normalized_key": "A source with this normalized key already exists."})
        return attrs
