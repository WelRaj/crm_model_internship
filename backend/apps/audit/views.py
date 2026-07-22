from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework.views import APIView

from apps.accounts.permissions import IsAccountsAdmin
from apps.audit.models import AuditLog
from apps.audit.serializers import AuditInvestigationSerializer, AuditLogSerializer
from apps.core.pagination import StandardPagination
from apps.core.responses import success_response


class AuditLogListView(APIView):
    permission_classes = [IsAccountsAdmin]

    def get(self, request):
        queryset = AuditLog.objects.select_related("actor").prefetch_related("actor__user_roles__role").order_by("-created_at")
        search = request.query_params.get("search")
        module = request.query_params.get("module")
        action = request.query_params.get("action")
        entity_type = request.query_params.get("entity_type")
        investigation_status = request.query_params.get("investigation_status")

        if search:
            queryset = queryset.filter(
                Q(module__icontains=search)
                | Q(action__icontains=search)
                | Q(entity_type__icontains=search)
                | Q(entity_id__icontains=search)
                | Q(actor__email__icontains=search)
                | Q(actor__first_name__icontains=search)
                | Q(actor__last_name__icontains=search)
                | Q(actor__employee_id__icontains=search)
                | Q(ip_address__icontains=search)
            )
        if module and module != "All":
            queryset = queryset.filter(module=module)
        if action:
            queryset = queryset.filter(action=action)
        if entity_type:
            queryset = queryset.filter(entity_type=entity_type)
        if investigation_status and investigation_status != "All":
            queryset = queryset.filter(investigation_status=investigation_status)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset.distinct(), request, view=self)
        serializer = AuditLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)


class AuditLogInvestigationView(APIView):
    permission_classes = [IsAccountsAdmin]

    def put(self, request, log_id):
        audit_log = get_object_or_404(AuditLog.objects.select_related("actor"), id=log_id)
        serializer = AuditInvestigationSerializer(instance=audit_log, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(audit_log, field, value)
        audit_log.investigated_by = request.user
        audit_log.investigated_at = timezone.now()
        audit_log.save(update_fields=["investigation_status", "investigation_note", "investigated_by", "investigated_at", "updated_at"])
        return success_response(data=AuditLogSerializer(audit_log).data)
