from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.notifications.models import Notification

User = get_user_model()


class NotificationsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="notify.user@example.com",
            mobile="9111111111",
            first_name="Notify",
            last_name="User",
            password="Notify@12345",
            is_active=True,
            is_verified=True,
        )
        self.client.force_authenticate(self.user)

    def test_notification_create_list_and_read_state(self):
        payload = {
            "title": "Project handoff ready",
            "message": "Delivery project PRJ-00012 is ready for team assignment.",
            "notification_type": "Project",
            "priority": "High",
            "target_module": "Delivery Projects",
            "entity_type": "DeliveryProject",
            "entity_id": "PRJ-00012",
            "recipient_id": self.user.id,
        }
        create_response = self.client.post("/api/v1/notifications/notifications/", payload, format="json")
        self.assertEqual(create_response.status_code, 201)

        overview_response = self.client.get("/api/v1/notifications/overview/")
        self.assertEqual(overview_response.status_code, 200)
        self.assertEqual(overview_response.data["data"]["total_notifications"], 1)

        list_response = self.client.get("/api/v1/notifications/notifications/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data["data"]), 1)

        notification_id = list_response.data["data"][0]["id"]
        read_response = self.client.post(f"/api/v1/notifications/notifications/{notification_id}/read/")
        self.assertEqual(read_response.status_code, 200)

        detail_response = self.client.get(f"/api/v1/notifications/notifications/{notification_id}/")
        self.assertEqual(detail_response.status_code, 200)
        self.assertTrue(detail_response.data["data"]["is_read"])

    def test_communication_job_create_and_list(self):
        notification = Notification.objects.create(
            title="Reminder",
            message="Invoice due today.",
            notification_type="Reminder",
            priority="Medium",
            recipient=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        payload = {
            "channel": "Email",
            "recipient_name": "Finance Desk",
            "recipient_email": "finance@example.com",
            "subject": "Invoice reminder",
            "message": "Invoice due today.",
            "notification_id": notification.id,
        }
        create_response = self.client.post("/api/v1/notifications/communication-jobs/", payload, format="json")
        self.assertEqual(create_response.status_code, 201)

        list_response = self.client.get("/api/v1/notifications/communication-jobs/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data["data"]), 1)
