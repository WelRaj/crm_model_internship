from django.db.models import Q
from django.utils import timezone
from rest_framework import status
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView

from apps.core.pagination import StandardPagination
from apps.core.responses import success_response
from apps.crm.models import Lead, LeadFollowUp, ProjectAgreement, ProjectClient, ProjectHandoff
from apps.crm.selectors import get_leads_queryset, get_project_agreements_queryset, get_project_clients_queryset, get_project_handoffs_queryset
from apps.crm.permissions import (
    crm_action_access,
    require_crm_action_access,
    require_crm_page_access,
    require_lead_access,
    require_project_agreement_access,
    require_project_client_access,
    require_project_handoff_access,
    scope_followups_queryset,
    scope_leads_queryset,
    scope_project_agreements_queryset,
    scope_project_clients_queryset,
    scope_project_handoffs_queryset,
)
from apps.crm.serializers import (
    ClientContactCreateSerializer,
    ClientContactSerializer,
    LeadAssignSerializer,
    LeadCreateSerializer,
    LeadFollowUpCreateSerializer,
    LeadFollowUpSerializer,
    LeadOutcomeSerializer,
    LeadSerializer,
    LeadUpdateSerializer,
    ProjectClientCreateSerializer,
    ProjectClientSerializer,
    ProjectAgreementCreateUpdateSerializer,
    ProjectAgreementSerializer,
    ProjectHandoffCreateUpdateSerializer,
    ProjectHandoffSerializer,
)
from apps.crm.services import LeadService, ProjectAgreementService, ProjectClientService


class LeadListCreateView(APIView):
    def get(self, request):
        require_crm_page_access(request.user, "leads")
        require_crm_action_access(request.user, "view", "leads")
        queryset = scope_leads_queryset(request.user, get_leads_queryset())
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
        require_crm_page_access(request.user, "leads")
        require_crm_action_access(request.user, "create", "leads")
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
        require_crm_page_access(request.user, "leads")
        require_crm_action_access(request.user, "view", "leads")
        lead = get_object_or_404(Lead, id=lead_id, is_deleted=False)
        require_lead_access(request.user, lead)
        return success_response(data=LeadSerializer(lead).data)

    def put(self, request, lead_id):
        require_crm_page_access(request.user, "leads")
        require_crm_action_access(request.user, "edit", "leads")
        lead = get_object_or_404(Lead, id=lead_id)
        require_lead_access(request.user, lead)
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
        require_crm_page_access(request.user, "lead-assign")
        require_crm_action_access(request.user, "assign", "lead-assign")
        lead = get_object_or_404(Lead, id=lead_id)
        require_lead_access(request.user, lead)
        serializer = LeadAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        assigned_lead = LeadService.assign_lead(
            lead=lead,
            assigned_to_id=serializer.validated_data.get("assigned_to_id"),
            actor=request.user,
            request=request,
        )
        return success_response(data=LeadSerializer(assigned_lead).data, message="Lead assignment updated")


class LeadOutcomeView(APIView):
    def post(self, request, lead_id):
        require_crm_page_access(request.user, "lead-outcomes")
        require_crm_action_access(request.user, "approve", "lead-outcomes")
        lead = get_object_or_404(Lead, id=lead_id, is_deleted=False)
        require_lead_access(request.user, lead)
        serializer = LeadOutcomeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        updated_lead = LeadService.close_outcome(
            lead=lead,
            status=serializer.validated_data["status"],
            note=serializer.validated_data.get("note", ""),
            actor=request.user,
            request=request,
        )
        return success_response(data=LeadSerializer(updated_lead).data, message="Lead outcome saved")


class LeadFollowUpListCreateView(APIView):
    def get(self, request, lead_id):
        require_crm_page_access(request.user, "followups")
        require_crm_action_access(request.user, "view", "followups")
        lead = get_object_or_404(Lead, id=lead_id, is_deleted=False)
        require_lead_access(request.user, lead)
        follow_ups = LeadFollowUp.objects.filter(lead=lead, is_deleted=False).select_related("created_by").order_by("-created_at")
        return success_response(data=LeadFollowUpSerializer(follow_ups, many=True).data)

    def post(self, request, lead_id):
        require_crm_page_access(request.user, "followups")
        require_crm_action_access(request.user, "create", "followups")
        lead = get_object_or_404(Lead, id=lead_id, is_deleted=False)
        require_lead_access(request.user, lead)
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
        require_crm_page_access(request.user, "followups")
        require_crm_action_access(request.user, "view", "followups")
        queryset = scope_followups_queryset(
            request.user,
            LeadFollowUp.objects.filter(is_deleted=False).select_related("lead", "lead__assigned_to", "created_by").order_by("-created_at"),
        )
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


class ProjectClientListCreateView(APIView):
    def get(self, request):
        require_crm_page_access(request.user, "clients")
        require_crm_action_access(request.user, "view", "clients")
        queryset = scope_project_clients_queryset(request.user, get_project_clients_queryset())
        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(
                Q(client_number__icontains=search)
                | Q(company_name__icontains=search)
                | Q(project_name__icontains=search)
                | Q(source_lead__lead_number__icontains=search)
            )
        return success_response(data=ProjectClientSerializer(queryset[:200], many=True).data)

    def post(self, request):
        require_crm_page_access(request.user, "clients")
        require_crm_action_access(request.user, "create", "clients")
        serializer = ProjectClientCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = ProjectClientService.create_client(
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=ProjectClientSerializer(client).data,
            message="Project client created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class ClientContactCreateView(APIView):
    def post(self, request, client_id):
        require_crm_page_access(request.user, "clients")
        require_crm_action_access(request.user, "create", "clients")
        client = get_object_or_404(ProjectClient, id=client_id, is_deleted=False)
        require_project_client_access(request.user, client)
        serializer = ClientContactCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        contact = ProjectClientService.create_contact(
            client=client,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=ClientContactSerializer(contact).data,
            message="Client contact added successfully",
            status_code=status.HTTP_201_CREATED,
        )


class ProjectHandoffListCreateView(APIView):
    def get(self, request):
        require_crm_page_access(request.user, "agreements")
        require_crm_action_access(request.user, "view", "agreements")
        queryset = scope_project_handoffs_queryset(request.user, get_project_handoffs_queryset())
        client_id = request.query_params.get("client_id")
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        return success_response(data=ProjectHandoffSerializer(queryset[:200], many=True).data)

    def post(self, request):
        require_crm_page_access(request.user, "agreements")
        require_crm_action_access(request.user, "create", "agreements")
        serializer = ProjectHandoffCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = get_object_or_404(scope_project_clients_queryset(request.user, get_project_clients_queryset()), id=serializer.validated_data["client_id"])
        require_project_client_access(request.user, client)
        project = ProjectClientService.create_or_update_project_handoff(
            client=client,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=ProjectHandoffSerializer(project).data,
            message="Project handoff created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class ProjectHandoffDetailView(APIView):
    def put(self, request, project_id):
        require_crm_page_access(request.user, "agreements")
        require_crm_action_access(request.user, "edit", "agreements")
        project = get_object_or_404(ProjectHandoff, id=project_id, is_deleted=False)
        require_project_handoff_access(request.user, project)
        serializer = ProjectHandoffCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = get_object_or_404(ProjectClient, id=serializer.validated_data["client_id"], is_deleted=False)
        require_project_client_access(request.user, client)
        updated_project = ProjectClientService.create_or_update_project_handoff(
            project=project,
            client=client,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=ProjectHandoffSerializer(updated_project).data, message="Project handoff updated successfully")


class ProjectAgreementListCreateView(APIView):
    def get(self, request):
        require_crm_page_access(request.user, "agreements")
        require_crm_action_access(request.user, "view", "agreements")
        queryset = scope_project_agreements_queryset(request.user, get_project_agreements_queryset())
        client_id = request.query_params.get("client_id")
        project_handoff_id = request.query_params.get("project_handoff_id")
        search = request.query_params.get("search")
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if project_handoff_id:
            queryset = queryset.filter(project_handoff_id=project_handoff_id)
        if search:
            queryset = queryset.filter(
                Q(agreement_number__icontains=search)
                | Q(client__company_name__icontains=search)
                | Q(project_handoff__project_code__icontains=search)
                | Q(attachment_name__icontains=search)
        )
        return success_response(data=ProjectAgreementSerializer(queryset[:200], many=True).data)

    def post(self, request):
        require_crm_page_access(request.user, "agreements")
        require_crm_action_access(request.user, "create", "agreements")
        serializer = ProjectAgreementCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = get_object_or_404(ProjectClient, id=serializer.validated_data["client_id"], is_deleted=False)
        require_project_client_access(request.user, client)
        project_handoff = None
        if serializer.validated_data.get("project_handoff_id"):
            project_handoff = get_object_or_404(ProjectHandoff, id=serializer.validated_data["project_handoff_id"], is_deleted=False)
            require_project_handoff_access(request.user, project_handoff)
        agreement = ProjectAgreementService.create_or_update_agreement(
            client=client,
            project_handoff=project_handoff,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(
            data=ProjectAgreementSerializer(agreement).data,
            message="Project agreement created successfully",
            status_code=status.HTTP_201_CREATED,
        )


class ProjectAgreementDetailView(APIView):
    def put(self, request, agreement_id):
        require_crm_page_access(request.user, "agreements")
        require_crm_action_access(request.user, "edit", "agreements")
        agreement = get_object_or_404(ProjectAgreement, id=agreement_id, is_deleted=False)
        require_project_agreement_access(request.user, agreement)
        serializer = ProjectAgreementCreateUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        client = get_object_or_404(ProjectClient, id=serializer.validated_data["client_id"], is_deleted=False)
        require_project_client_access(request.user, client)
        project_handoff = None
        if serializer.validated_data.get("project_handoff_id"):
            project_handoff = get_object_or_404(ProjectHandoff, id=serializer.validated_data["project_handoff_id"], is_deleted=False)
            require_project_handoff_access(request.user, project_handoff)
        updated_agreement = ProjectAgreementService.create_or_update_agreement(
            agreement=agreement,
            client=client,
            project_handoff=project_handoff,
            data=serializer.validated_data,
            actor=request.user,
            request=request,
        )
        return success_response(data=ProjectAgreementSerializer(updated_agreement).data, message="Project agreement updated successfully")
