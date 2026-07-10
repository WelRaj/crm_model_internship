from django.db.models import Q
from rest_framework import status
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination
from apps.core.responses import success_response
from apps.crm.selectors import get_leads_queryset
from apps.crm.serializers import LeadCreateSerializer, LeadSerializer
from apps.crm.services import LeadService


class LeadListCreateView(APIView):
    def get(self, request):
        queryset = get_leads_queryset()
        search = request.query_params.get("search")
        lead_status = request.query_params.get("status")
        lead_type = request.query_params.get("lead_type")

        if search:
            queryset = queryset.filter(
                Q(lead_number__icontains=search)
                | Q(contact_name__icontains=search)
                | Q(company_name__icontains=search)
                | Q(email__icontains=search)
                | Q(mobile__icontains=search)
            )
        if lead_status:
            queryset = queryset.filter(status=lead_status)
        if lead_type:
            queryset = queryset.filter(lead_type=lead_type)

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(LeadSerializer(page, many=True).data)

    def post(self, request):
        serializer = LeadCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lead = LeadService.create_lead(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(
            data=LeadSerializer(lead).data,
            message="Lead created successfully",
            status_code=status.HTTP_201_CREATED,
        )

