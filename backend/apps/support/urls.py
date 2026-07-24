from django.urls import path

from apps.support.views import (
    SupportOverviewView,
    SupportTicketCommentListCreateView,
    SupportTicketDetailView,
    SupportTicketListCreateView,
)


urlpatterns = [
    path("overview/", SupportOverviewView.as_view(), name="support-overview"),
    path("tickets/", SupportTicketListCreateView.as_view(), name="support-tickets"),
    path("tickets/<uuid:ticket_id>/", SupportTicketDetailView.as_view(), name="support-ticket-detail"),
    path("tickets/<uuid:ticket_id>/comments/", SupportTicketCommentListCreateView.as_view(), name="support-ticket-comments"),
]
