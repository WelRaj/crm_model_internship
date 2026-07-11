from django.urls import path

from apps.crm.views import FollowUpQueueView, LeadAssignView, LeadDetailView, LeadFollowUpListCreateView, LeadListCreateView

urlpatterns = [
    path("leads/", LeadListCreateView.as_view(), name="leads"),
    path("follow-ups/", FollowUpQueueView.as_view(), name="follow-up-queue"),
    path("leads/<uuid:lead_id>/", LeadDetailView.as_view(), name="lead-detail"),
    path("leads/<uuid:lead_id>/assign/", LeadAssignView.as_view(), name="lead-assign"),
    path("leads/<uuid:lead_id>/follow-ups/", LeadFollowUpListCreateView.as_view(), name="lead-follow-ups"),
]
