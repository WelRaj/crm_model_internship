from datetime import date

from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.accounts.models import Role, UserRole
from apps.marketing.models import LeadSource, MarketingCampaign


class MarketingApiTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(email="marketing@test.local", password="testpass123")
        marketing_role, _ = Role.objects.get_or_create(code="marketing", defaults={"name": "Marketing", "description": "Marketing module access."})
        UserRole.objects.get_or_create(user=self.user, role=marketing_role, defaults={"assigned_by": self.user})
        self.client.force_authenticate(self.user)

    def test_create_campaign_and_source(self):
        campaign_response = self.client.post(
            "/api/v1/marketing/campaigns/",
            {
                "name": "Search Launch",
                "channel": "Google Search",
                "objective": "Demo bookings",
                "audience_segment": "Founders",
                "budget_amount": "100000",
                "spent_amount": "25000",
                "leads": 40,
                "mql": 18,
                "pipeline_amount": "350000",
                "start_date": "2026-07-01",
                "end_date": "2026-07-31",
                "utm_source": "google",
                "utm_medium": "cpc",
                "utm_campaign": "search-launch",
                "landing_page": "/demo",
                "lead_form": "Demo form",
                "owner": "Growth",
                "status": "Active",
                "next_action": "Scale keywords",
            },
            format="json",
        )
        self.assertEqual(campaign_response.status_code, 201)
        self.assertEqual(MarketingCampaign.objects.count(), 1)

        source_response = self.client.post(
            "/api/v1/marketing/sources/",
            {
                "source": "Website Organic",
                "source_type": "Organic",
                "default_utm_source": "website",
                "default_utm_medium": "organic",
                "owner": "SEO",
                "quality": "High",
                "leads": 100,
                "mql": 40,
                "sql": 20,
                "won": 8,
                "last_30_change": 12,
                "status": "Active",
                "next_action": "Add service pages",
            },
            format="json",
        )
        self.assertEqual(source_response.status_code, 201)
        self.assertEqual(LeadSource.objects.count(), 1)

    def test_archived_campaign_remains_listable(self):
        campaign = MarketingCampaign.objects.create(
            campaign_code="CMP-2026-001",
            name="Launch",
            channel=MarketingCampaign.Channel.GOOGLE_SEARCH,
            objective="Demo",
            audience_segment="Founders",
            budget_amount=1000,
            spent_amount=100,
            leads=10,
            mql=4,
            pipeline_amount=10000,
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 31),
            utm_source="google",
            utm_medium="cpc",
            utm_campaign="launch",
            landing_page="/demo",
            lead_form="Demo",
            owner="Growth",
            status=MarketingCampaign.Status.ACTIVE,
            next_action="Scale",
            created_by=self.user,
            updated_by=self.user,
        )
        response = self.client.delete(f"/api/v1/marketing/campaigns/{campaign.id}/")
        self.assertEqual(response.status_code, 200)
        campaign.refresh_from_db()
        self.assertEqual(campaign.status, MarketingCampaign.Status.ARCHIVED)
        self.assertFalse(campaign.is_active)

    def test_overview_and_roi_endpoints(self):
        MarketingCampaign.objects.create(
            campaign_code="CMP-2026-002",
            name="Search",
            channel=MarketingCampaign.Channel.GOOGLE_SEARCH,
            objective="Demo",
            audience_segment="Founders",
            budget_amount=1000,
            spent_amount=200,
            leads=20,
            mql=10,
            pipeline_amount=5000,
            start_date=date(2026, 7, 1),
            end_date=date(2026, 7, 31),
            utm_source="google",
            utm_medium="cpc",
            utm_campaign="search",
            landing_page="/demo",
            lead_form="Demo",
            owner="Growth",
            status=MarketingCampaign.Status.ACTIVE,
            next_action="Scale",
            created_by=self.user,
            updated_by=self.user,
        )
        overview = self.client.get("/api/v1/marketing/overview/")
        self.assertEqual(overview.status_code, 200)
        self.assertEqual(overview.data["data"]["active_campaigns"], 1)

    def test_non_marketing_user_is_blocked_from_marketing_module(self):
        blocked = get_user_model().objects.create_user(
            email="blocked.marketing@test.local",
            mobile="9811111333",
            password="testpass123",
        )
        self.client.force_authenticate(blocked)

        overview = self.client.get("/api/v1/marketing/overview/")
        self.assertEqual(overview.status_code, 403)

        create = self.client.post(
            "/api/v1/marketing/campaigns/",
            {
                "name": "Blocked",
                "channel": "Google Search",
                "objective": "Demo bookings",
                "audience_segment": "Founders",
                "budget_amount": "100000",
                "spent_amount": "25000",
                "leads": 40,
                "mql": 18,
                "pipeline_amount": "350000",
                "start_date": "2026-07-01",
                "end_date": "2026-07-31",
                "utm_source": "google",
                "utm_medium": "cpc",
                "utm_campaign": "blocked",
                "landing_page": "/demo",
                "lead_form": "Demo form",
                "owner": "Growth",
                "status": "Active",
                "next_action": "Scale keywords",
            },
            format="json",
        )
        self.assertEqual(create.status_code, 403)
