from django.urls import path

from apps.notifications.views import (
    CommunicationJobDetailView,
    CommunicationJobListCreateView,
    NotificationDetailView,
    NotificationListCreateView,
    NotificationOverviewView,
    NotificationReadStateView,
)


urlpatterns = [
    path("overview/", NotificationOverviewView.as_view(), name="notification-overview"),
    path("notifications/", NotificationListCreateView.as_view(), name="notifications"),
    path("notifications/<uuid:notification_id>/", NotificationDetailView.as_view(), name="notification-detail"),
    path("notifications/<uuid:notification_id>/read/", NotificationReadStateView.as_view(), name="notification-read"),
    path("communication-jobs/", CommunicationJobListCreateView.as_view(), name="communication-jobs"),
    path("communication-jobs/<uuid:job_id>/", CommunicationJobDetailView.as_view(), name="communication-job-detail"),
]
