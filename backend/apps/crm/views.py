from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination
from apps.core.responses import success_response
from apps.crm.models import Lead, LeadFollowUp
from apps.crm.selectors import get_leads_queryset
from apps.crm.serializers import (
    LeadAssignSerializer,
    LeadCreateSerializer,
    LeadFollowUpCreateSerializer,
    LeadFollowUpSerializer,
    LeadSerializer,
    LeadUpdateSerializer,
)
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


class LeadDetailView(APIView):
    def get(self, request, lead_id):
        lead = get_object_or_404(get_leads_queryset(), id=lead_id)
        return success_response(data=LeadSerializer(lead).data)

    def put(self, request, lead_id):
        lead = get_object_or_404(Lead, id=lead_id)
        serializer = LeadUpdateSerializer(data=request.data, context={"lead": lead}, partial=True)
        serializer.is_valid(raise_exception=True)
        updated_lead = LeadService.update_lead(
            lead=lead,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=LeadSerializer(updated_lead).data, message="Lead updated successfully")


class LeadAssignView(APIView):
    def post(self, request, lead_id):
        lead = get_object_or_404(Lead, id=lead_id)
        serializer = LeadAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assigned_lead = LeadService.assign_lead(
            lead=lead,
            assigned_to_id=serializer.validated_data.get("assigned_to_id"),
            actor=request.user,
            request=request,
        )
        return success_response(data=LeadSerializer(assigned_lead).data, message="Lead assignment updated")


class LeadFollowUpListCreateView(APIView):
    def get(self, request, lead_id):
        lead = get_object_or_404(Lead, id=lead_id, is_deleted=False)
        follow_ups = LeadFollowUp.objects.filter(lead=lead, is_deleted=False).select_related("created_by").order_by("-created_at")
        return success_response(data=LeadFollowUpSerializer(follow_ups, many=True).data)

    def post(self, request, lead_id):
        lead = get_object_or_404(Lead, id=lead_id, is_deleted=False)
        serializer = LeadFollowUpCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        follow_up = LeadService.create_follow_up(
            lead=lead,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=LeadFollowUpSerializer(follow_up).data,
            message="Follow-up added successfully",
            status_code=status.HTTP_201_CREATED,
        )


class FollowUpQueueView(APIView):
    def get(self, request):
        queryset = LeadFollowUp.objects.filter(is_deleted=False).select_related("lead", "lead__assigned_to", "created_by").order_by("-created_at")
        due_status = request.query_params.get("due_status")
        lead_type = request.query_params.get("lead_type")
        owner_id = request.query_params.get("owner_id")
        search = request.query_params.get("search")
        today = timezone.localdate()

        if due_status == "today":
            queryset = queryset.filter(next_follow_up_at__date=today).exclude(outcome=LeadFollowUp.Outcome.DONE)
        elif due_status == "overdue":
            queryset = queryset.filter(next_follow_up_at__date__lt=today).exclude(outcome=LeadFollowUp.Outcome.DONE)
        elif due_status == "scheduled":
            queryset = queryset.filter(next_follow_up_at__date__gt=today).exclude(outcome=LeadFollowUp.Outcome.DONE)
        elif due_status == "done":
            queryset = queryset.filter(outcome=LeadFollowUp.Outcome.DONE)

        if lead_type:
            queryset = queryset.filter(lead__lead_type=lead_type)
        if owner_id:
            queryset = queryset.filter(lead__assigned_to_id=owner_id)
        if search:
            queryset = queryset.filter(
                Q(lead__lead_number__icontains=search)
                | Q(lead__contact_name__icontains=search)
                | Q(lead__mobile__icontains=search)
                | Q(note__icontains=search)
            )

        return success_response(data=LeadFollowUpSerializer(queryset[:200], many=True).data)
