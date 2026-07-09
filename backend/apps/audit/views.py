from django.shortcuts import render

from django.db.models import Q
from rest_framework.views import APIView

from apps.accounts.permissions import IsAccountsAdmin
from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer
from apps.core.pagination import StandardPagination


class AuditLogListView(APIView):
    permission_classes = [IsAccountsAdmin]

    def get(self, request):
        queryset = AuditLog.objects.select_related("actor").prefetch_related("actor__user_roles__role").order_by("-created_at")
        search = request.query_params.get("search")
        module = request.query_params.get("module")
        action = request.query_params.get("action")
        entity_type = request.query_params.get("entity_type")

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

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset.distinct(), request, view=self)
        serializer = AuditLogSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)
