from django.urls import path

from apps.crm.views import (
    ClientContactCreateView,
    FollowUpQueueView,
    LeadAssignView,
    LeadDetailView,
    LeadFollowUpListCreateView,
    LeadListCreateView,
    LeadOutcomeView,
    ProjectAgreementDetailView,
    ProjectAgreementListCreateView,
    ProjectClientListCreateView,
    ProjectHandoffDetailView,
    ProjectHandoffListCreateView,
)

urlpatterns = [
    path("leads/", LeadListCreateView.as_view(), name="leads"),
    path("follow-ups/", FollowUpQueueView.as_view(), name="follow-up-queue"),
    path("project-clients/", ProjectClientListCreateView.as_view(), name="project-clients"),
    path("project-clients/<uuid:client_id>/contacts/", ClientContactCreateView.as_view(), name="project-client-contacts"),
    path("project-handoffs/", ProjectHandoffListCreateView.as_view(), name="project-handoffs"),
    path("project-handoffs/<uuid:project_id>/", ProjectHandoffDetailView.as_view(), name="project-handoff-detail"),
    path("project-agreements/", ProjectAgreementListCreateView.as_view(), name="project-agreements"),
    path("project-agreements/<uuid:agreement_id>/", ProjectAgreementDetailView.as_view(), name="project-agreement-detail"),
    path("leads/<uuid:lead_id>/", LeadDetailView.as_view(), name="lead-detail"),
    path("leads/<uuid:lead_id>/assign/", LeadAssignView.as_view(), name="lead-assign"),
    path("leads/<uuid:lead_id>/outcome/", LeadOutcomeView.as_view(), name="lead-outcome"),
    path("leads/<uuid:lead_id>/follow-ups/", LeadFollowUpListCreateView.as_view(), name="lead-follow-ups"),
]
