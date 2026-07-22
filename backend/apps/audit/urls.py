from django.urls import path

from apps.audit.views import AuditLogInvestigationView, AuditLogListView


urlpatterns = [
    path("audit/logs/", AuditLogListView.as_view(), name="audit-logs"),
    path("audit/logs/<uuid:log_id>/investigation/", AuditLogInvestigationView.as_view(), name="audit-log-investigation"),
]
