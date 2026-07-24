from django.urls import path

from apps.marketing.views import CampaignDetailView, CampaignListCreateView, MarketingOverviewView, SourceDetailView, SourceListCreateView


urlpatterns = [
    path("marketing/overview/", MarketingOverviewView.as_view(), name="marketing-overview"),
    path("marketing/campaigns/", CampaignListCreateView.as_view(), name="marketing-campaigns"),
    path("marketing/campaigns/<uuid:campaign_id>/", CampaignDetailView.as_view(), name="marketing-campaign-detail"),
    path("marketing/sources/", SourceListCreateView.as_view(), name="marketing-sources"),
    path("marketing/sources/<uuid:source_id>/", SourceDetailView.as_view(), name="marketing-source-detail"),
]

