from django.db.models import Q
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView

from apps.core.responses import success_response
from apps.marketing.models import LeadSource, MarketingCampaign
from apps.marketing.permissions import require_marketing_access, require_marketing_action_access
from apps.marketing.selectors import apply_search, campaigns_queryset, lead_sources_queryset
from apps.marketing.serializers import (
    LeadSourceSerializer,
    LeadSourceWriteSerializer,
    MarketingCampaignSerializer,
    MarketingCampaignWriteSerializer,
)
from apps.marketing.services import MarketingService


class MarketingOverviewView(APIView):
    def get(self, request):
        require_marketing_access(request.user)
        require_marketing_action_access(request.user, "view")
        campaigns = campaigns_queryset()
        sources = lead_sources_queryset()
        if request.query_params.get("status"):
            campaigns = campaigns.filter(status=request.query_params["status"])
        if request.query_params.get("source_status"):
            sources = sources.filter(status=request.query_params["source_status"])
        if request.query_params.get("channel"):
            campaigns = campaigns.filter(channel=request.query_params["channel"])
        if request.query_params.get("search"):
            search = request.query_params["search"]
            campaigns = apply_search(
                campaigns,
                search,
                ("campaign_code", "name", "channel", "objective", "audience_segment", "owner", "utm_source", "utm_medium", "utm_campaign", "landing_page", "lead_form", "next_action"),
            )
            sources = apply_search(
                sources,
                search,
                ("source_code", "source", "source_type", "normalized_key", "default_utm_source", "default_utm_medium", "owner", "quality", "next_action"),
            )
        return success_response(
            data={
                **MarketingService.overview(campaigns=campaigns, sources=sources),
                "roi_rows": MarketingService.roi_rows(campaigns=campaigns.exclude(status=MarketingCampaign.Status.ARCHIVED)),
            }
        )


class CampaignListCreateView(APIView):
    def get(self, request):
        require_marketing_access(request.user)
        require_marketing_action_access(request.user, "view")
        queryset = campaigns_queryset()
        if request.query_params.get("status"):
            queryset = queryset.filter(status=request.query_params["status"])
        if request.query_params.get("channel"):
            queryset = queryset.filter(channel=request.query_params["channel"])
        search = request.query_params.get("search")
        if search:
            queryset = apply_search(
                queryset,
                search,
                ("campaign_code", "name", "channel", "objective", "audience_segment", "owner", "utm_source", "utm_medium", "utm_campaign", "landing_page", "lead_form", "next_action"),
            )
        return success_response(data=MarketingCampaignSerializer(queryset[:200], many=True).data)

    def post(self, request):
        require_marketing_access(request.user)
        require_marketing_action_access(request.user, "create")
        serializer = MarketingCampaignWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        campaign = MarketingService.create_campaign(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=MarketingCampaignSerializer(campaign).data, message="Marketing campaign created successfully", status_code=status.HTTP_201_CREATED)


class CampaignDetailView(APIView):
    def put(self, request, campaign_id):
        require_marketing_access(request.user)
        require_marketing_action_access(request.user, "edit")
        campaign = get_object_or_404(campaigns_queryset(), id=campaign_id)
        serializer = MarketingCampaignWriteSerializer(data=request.data, partial=True, context={"campaign": campaign})
        serializer.is_valid(raise_exception=True)
        campaign = MarketingService.update_campaign(campaign=campaign, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=MarketingCampaignSerializer(campaign).data, message="Marketing campaign updated successfully")

    def delete(self, request, campaign_id):
        require_marketing_access(request.user)
        require_marketing_action_access(request.user, "delete")
        campaign = get_object_or_404(campaigns_queryset(), id=campaign_id)
        campaign = MarketingService.archive_campaign(campaign=campaign, actor=request.user, request=request)
        return success_response(data=MarketingCampaignSerializer(campaign).data, message="Marketing campaign archived successfully")


class SourceListCreateView(APIView):
    def get(self, request):
        require_marketing_access(request.user)
        require_marketing_action_access(request.user, "view")
        queryset = lead_sources_queryset()
        if request.query_params.get("status"):
            queryset = queryset.filter(status=request.query_params["status"])
        if request.query_params.get("source_type"):
            queryset = queryset.filter(source_type=request.query_params["source_type"])
        search = request.query_params.get("search")
        if search:
            queryset = apply_search(
                queryset,
                search,
                ("source_code", "source", "source_type", "normalized_key", "default_utm_source", "default_utm_medium", "owner", "quality", "next_action"),
            )
        return success_response(data=LeadSourceSerializer(queryset[:200], many=True).data)

    def post(self, request):
        require_marketing_access(request.user)
        require_marketing_action_access(request.user, "create")
        serializer = LeadSourceWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        source = MarketingService.create_source(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=LeadSourceSerializer(source).data, message="Lead source created successfully", status_code=status.HTTP_201_CREATED)


class SourceDetailView(APIView):
    def put(self, request, source_id):
        require_marketing_access(request.user)
        require_marketing_action_access(request.user, "edit")
        source = get_object_or_404(lead_sources_queryset(), id=source_id)
        serializer = LeadSourceWriteSerializer(data=request.data, partial=True, context={"source": source})
        serializer.is_valid(raise_exception=True)
        source = MarketingService.update_source(source=source, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=LeadSourceSerializer(source).data, message="Lead source updated successfully")

    def delete(self, request, source_id):
        require_marketing_access(request.user)
        require_marketing_action_access(request.user, "delete")
        source = get_object_or_404(lead_sources_queryset(), id=source_id)
        source = MarketingService.archive_source(source=source, actor=request.user, request=request)
        return success_response(data=LeadSourceSerializer(source).data, message="Lead source archived successfully")
