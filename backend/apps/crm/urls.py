from django.urls import path

from apps.crm.views import LeadListCreateView

urlpatterns = [
    path("leads/", LeadListCreateView.as_view(), name="leads"),
]

