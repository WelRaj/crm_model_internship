from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView

from apps.core.responses import success_response
from apps.support.models import SupportTicket
from apps.support.permissions import require_support_access, require_support_action_access, scope_support_tickets_queryset
from apps.support.selectors import apply_search, tickets_queryset
from apps.support.serializers import (
    SupportTicketCommentCreateSerializer,
    SupportTicketCommentSerializer,
    SupportTicketSerializer,
    SupportTicketStatusUpdateSerializer,
    SupportTicketWriteSerializer,
)
from apps.support.services import SupportService


class SupportOverviewView(APIView):
    def get(self, request):
        require_support_access(request.user)
        require_support_action_access(request.user, "view")
        queryset = scope_support_tickets_queryset(request.user, tickets_queryset())
        return success_response(
            data={
                "open_tickets": queryset.exclude(status=SupportTicket.Status.RESOLVED).count(),
                "critical_tickets": queryset.filter(priority=SupportTicket.Priority.CRITICAL).count(),
                "resolved_tickets": queryset.filter(status=SupportTicket.Status.RESOLVED).count(),
                "waiting_tickets": queryset.filter(status=SupportTicket.Status.WAITING).count(),
            }
        )


class SupportTicketListCreateView(APIView):
    def get(self, request):
        require_support_access(request.user)
        require_support_action_access(request.user, "view")
        queryset = scope_support_tickets_queryset(request.user, tickets_queryset())
        search = request.query_params.get("search")
        status_filter = request.query_params.get("status")
        module_filter = request.query_params.get("module")
        if status_filter and status_filter != "All":
            queryset = queryset.filter(status=status_filter)
        if module_filter and module_filter != "All":
            queryset = queryset.filter(module=module_filter)
        if search:
            queryset = apply_search(
                queryset,
                search,
                ("ticket_number", "subject", "module", "requester", "priority", "status", "channel", "description", "resolution_summary"),
            )
        return success_response(data=SupportTicketSerializer(queryset[:200], many=True).data)

    def post(self, request):
        require_support_access(request.user)
        require_support_action_access(request.user, "create")
        serializer = SupportTicketWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        ticket = SupportService.create_ticket(data=serializer.validated_data, actor=request.user, request=request)
        return success_response(
            data=SupportTicketSerializer(ticket).data,
            message="Support ticket created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class SupportTicketDetailView(APIView):
    def get(self, request, ticket_id):
        require_support_access(request.user)
        require_support_action_access(request.user, "view")
        ticket = get_object_or_404(scope_support_tickets_queryset(request.user, tickets_queryset()), id=ticket_id)
        return success_response(data=SupportTicketSerializer(ticket).data)

    def patch(self, request, ticket_id):
        require_support_access(request.user)
        require_support_action_access(request.user, "edit")
        ticket = get_object_or_404(scope_support_tickets_queryset(request.user, tickets_queryset()), id=ticket_id)
        serializer = SupportTicketWriteSerializer(data=request.data, partial=True, context={"ticket": ticket})
        serializer.is_valid(raise_exception=True)
        ticket = SupportService.update_ticket(ticket=ticket, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(data=SupportTicketSerializer(ticket).data, message="Support ticket updated successfully")


class SupportTicketCommentListCreateView(APIView):
    def get(self, request, ticket_id):
        require_support_access(request.user)
        require_support_action_access(request.user, "comment")
        ticket = get_object_or_404(scope_support_tickets_queryset(request.user, tickets_queryset()), id=ticket_id)
        return success_response(data=SupportTicketCommentSerializer(ticket.comments.all(), many=True).data)

    def post(self, request, ticket_id):
        require_support_access(request.user)
        require_support_action_access(request.user, "comment")
        ticket = get_object_or_404(scope_support_tickets_queryset(request.user, tickets_queryset()), id=ticket_id)
        serializer = SupportTicketCommentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        comment = SupportService.add_comment(ticket=ticket, data=serializer.validated_data, actor=request.user, request=request)
        return success_response(
            data=SupportTicketCommentSerializer(comment).data,
            message="Support comment added successfully",
            status_code=status.HTTP_201_CREATED,
        )
