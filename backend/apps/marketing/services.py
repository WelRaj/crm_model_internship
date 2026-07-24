from collections import defaultdict
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from apps.audit.services import record_audit_log
from apps.core.models import Sequence
from apps.marketing.models import LeadSource, MarketingCampaign


def _next_sequence(code: str, prefix: str, padding: int = 3) -> str:
    sequence, _ = Sequence.objects.select_for_update().get_or_create(
        code=code,
        defaults={"prefix": prefix, "current_value": 0, "padding": padding},
    )
    if sequence.prefix != prefix:
        sequence.prefix = prefix
    if sequence.padding != padding:
        sequence.padding = padding
    sequence.current_value += 1
    sequence.save(update_fields=["prefix", "current_value", "padding", "updated_at"])
    return f"{sequence.prefix}-{sequence.current_value:0{sequence.padding}d}"


def _campaign_payload(campaign: MarketingCampaign):
    return {
        "campaign_code": campaign.campaign_code,
        "name": campaign.name,
        "channel": campaign.channel,
        "status": campaign.status,
        "budget_amount": str(campaign.budget_amount),
        "spent_amount": str(campaign.spent_amount),
        "leads": campaign.leads,
        "mql": campaign.mql,
        "pipeline_amount": str(campaign.pipeline_amount),
    }


def _source_payload(source: LeadSource):
    return {
        "source_code": source.source_code,
        "source": source.source,
        "source_type": source.source_type,
        "normalized_key": source.normalized_key,
        "status": source.status,
        "quality": source.quality,
        "leads": source.leads,
        "mql": source.mql,
        "sql": source.sql,
        "won": source.won,
    }


class MarketingService:
    @staticmethod
    @transaction.atomic
    def create_campaign(*, data, actor, request=None):
        code = _next_sequence(f"marketing_campaign_{timezone.now().year}", f"CMP-{timezone.now().year}")
        campaign = MarketingCampaign.objects.create(
            campaign_code=code,
            created_by=actor,
            updated_by=actor,
            is_active=data["status"] != MarketingCampaign.Status.ARCHIVED,
            **data,
        )
        record_audit_log(
            actor=actor,
            module="marketing",
            action="create",
            entity_type="MarketingCampaign",
            entity_id=campaign.id,
            new_values=_campaign_payload(campaign),
            request=request,
        )
        return campaign

    @staticmethod
    @transaction.atomic
    def update_campaign(*, campaign, data, actor, request=None):
        old_values = _campaign_payload(campaign)
        for field, value in data.items():
            setattr(campaign, field, value)
        if "status" in data:
            campaign.is_active = data["status"] != MarketingCampaign.Status.ARCHIVED
        campaign.updated_by = actor
        campaign.save(update_fields=list(data.keys()) + ["is_active", "updated_by", "updated_at"])
        record_audit_log(
            actor=actor,
            module="marketing",
            action="update",
            entity_type="MarketingCampaign",
            entity_id=campaign.id,
            old_values=old_values,
            new_values=_campaign_payload(campaign),
            request=request,
        )
        return campaign

    @staticmethod
    @transaction.atomic
    def archive_campaign(*, campaign, actor, request=None):
        return MarketingService.update_campaign(
            campaign=campaign,
            data={"status": MarketingCampaign.Status.ARCHIVED},
            actor=actor,
            request=request,
        )

    @staticmethod
    @transaction.atomic
    def create_source(*, data, actor, request=None):
        code = _next_sequence("marketing_source", "SRC")
        source = LeadSource.objects.create(
            source_code=code,
            created_by=actor,
            updated_by=actor,
            is_active=data["status"] != LeadSource.Status.ARCHIVED,
            **data,
        )
        record_audit_log(
            actor=actor,
            module="marketing",
            action="create",
            entity_type="LeadSource",
            entity_id=source.id,
            new_values=_source_payload(source),
            request=request,
        )
        return source

    @staticmethod
    @transaction.atomic
    def update_source(*, source, data, actor, request=None):
        old_values = _source_payload(source)
        for field, value in data.items():
            setattr(source, field, value)
        if "status" in data:
            source.is_active = data["status"] != LeadSource.Status.ARCHIVED
        source.updated_by = actor
        source.save(update_fields=list(data.keys()) + ["is_active", "updated_by", "updated_at"])
        record_audit_log(
            actor=actor,
            module="marketing",
            action="update",
            entity_type="LeadSource",
            entity_id=source.id,
            old_values=old_values,
            new_values=_source_payload(source),
            request=request,
        )
        return source

    @staticmethod
    @transaction.atomic
    def archive_source(*, source, actor, request=None):
        return MarketingService.update_source(
            source=source,
            data={"status": LeadSource.Status.ARCHIVED},
            actor=actor,
            request=request,
        )

    @staticmethod
    def roi_rows(*, campaigns):
        rows = defaultdict(lambda: {
            "channel": "",
            "spend_amount": Decimal("0"),
            "leads": 0,
            "mql": 0,
            "pipeline_amount": Decimal("0"),
            "campaign_count": 0,
        })
        for campaign in campaigns:
            row = rows[campaign.channel]
            row["channel"] = campaign.channel
            row["spend_amount"] += campaign.spent_amount
            row["leads"] += campaign.leads
            row["mql"] += campaign.mql
            row["pipeline_amount"] += campaign.pipeline_amount
            row["campaign_count"] += 1
        result = []
        for row in rows.values():
            spend = row["spend_amount"]
            leads = row["leads"]
            mql = row["mql"]
            pipeline = row["pipeline_amount"]
            result.append(
                {
                    **row,
                    "cpl": spend / leads if leads else Decimal("0"),
                    "cac": spend / mql if mql else Decimal("0"),
                    "roi": pipeline / spend if spend else Decimal("0"),
                }
            )
        return sorted(result, key=lambda item: item["pipeline_amount"], reverse=True)

    @staticmethod
    def overview(*, campaigns, sources):
        active_campaigns = [campaign for campaign in campaigns if campaign.status != MarketingCampaign.Status.ARCHIVED]
        active_sources = [source for source in sources if source.status != LeadSource.Status.ARCHIVED]
        top_source = max(active_sources, key=lambda item: item.sql, default=None)
        warmest_source = max(active_sources, key=lambda item: (item.sql / item.leads) if item.leads else 0, default=None)
        return {
            "active_campaigns": len(active_campaigns),
            "monthly_spend": str(sum((campaign.spent_amount for campaign in active_campaigns), Decimal("0"))),
            "generated_leads": sum(campaign.leads for campaign in active_campaigns),
            "qualified_leads": sum(campaign.mql for campaign in active_campaigns),
            "tracked_sources": len(active_sources),
            "review_sources": sum(1 for source in active_sources if source.status == LeadSource.Status.REVIEW or source.quality in {LeadSource.Quality.MIXED, LeadSource.Quality.LOW}),
            "top_source": None if top_source is None else {
                "source_code": top_source.source_code,
                "source": top_source.source,
                "sql": top_source.sql,
                "quality": top_source.quality,
            },
            "warmest_source": None if warmest_source is None else {
                "source_code": warmest_source.source_code,
                "source": warmest_source.source,
                "sql_conversion": round((warmest_source.sql / warmest_source.leads) * 100, 1) if warmest_source.leads else 0,
                "quality": warmest_source.quality,
            },
        }

