from datetime import date, timedelta

from rest_framework.test import APITestCase

from apps.accounts.models import Role, User, UserRole
from apps.audit.models import AuditLog
from apps.crm.models import ProjectAgreement, ProjectClient, ProjectHandoff
from apps.hrms.models import EmployeeHRProfile
from apps.projects.models import DeliveryProject, EmployeePerformanceReview, ProjectDeadline, ProjectMilestone, ProjectTask, ProjectTeamAssignment
from apps.projects.services import DeliveryProjectService


class DeliveryProjectModelTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="project.user@example.com", mobile="9811111111", password="User@12345")
        self.user.employee_id = "EMP-PROJECT-001"
        self.user.department = "Product Engineering"
        self.user.designation = "Delivery Engineer"
        self.user.save(update_fields=["employee_id", "department", "designation"])
        EmployeeHRProfile.objects.create(
            user=self.user,
            role="Delivery Engineer",
            team="Product Engineering",
            status=EmployeeHRProfile.Status.ACTIVE,
            kyc_status=EmployeeHRProfile.KycStatus.COMPLETE,
        )
        project_role, _ = Role.objects.get_or_create(code="project_manager", defaults={"name": "Project Manager", "description": "Project delivery access."})
        UserRole.objects.get_or_create(user=self.user, role=project_role, defaults={"assigned_by": self.user})
        self.client.force_authenticate(user=self.user)
        self.client_record = ProjectClient.objects.create(
            client_number="ACC-TEST-001",
            company_name="Delivery Client",
            project_name="Delivery CRM",
            value="250000.00",
            created_by=self.user,
        )
        self.handoff = ProjectHandoff.objects.create(
            client=self.client_record,
            project_code="HANDOFF-001",
            project_manager="Project Manager",
            start_date=date.today(),
            target_end_date=date.today() + timedelta(days=30),
            priority=ProjectHandoff.Priority.HIGH,
            billing_model="Fixed",
            delivery_method="Agile",
            kickoff_notes="Kickoff notes for delivery project.",
            created_by=self.user,
        )

    def create_active_agreement(self):
        return ProjectAgreement.objects.create(
            agreement_number="AGR-TEST-001",
            project_handoff=self.handoff,
            client=self.client_record,
            agreement_type=ProjectAgreement.AgreementType.MSA,
            effective_date=date.today(),
            expiry_date=date.today() + timedelta(days=365),
            contract_value="250000.00",
            status=ProjectAgreement.AgreementStatus.ACTIVE,
            attachment_name="signed-test-agreement.pdf",
            created_by=self.user,
        )

    def test_delivery_project_foundation_models(self):
        self.create_active_agreement()
        project = DeliveryProjectService.create_project(
            data={
                "source_handoff": self.handoff,
                "client": self.client_record,
                "name": "Delivery CRM",
                "description": "Delivery project created from signed agreement.",
                "project_manager": self.user,
                "start_date": date.today(),
                "target_end_date": date.today() + timedelta(days=45),
                "billing_model": "Fixed",
                "delivery_method": "Agile",
            },
            actor=self.user,
        )
        milestone = ProjectMilestone.objects.create(
            project=project,
            title="Kickoff",
            sequence=1,
            due_date=date.today() + timedelta(days=7),
            created_by=self.user,
        )
        task = ProjectTask.objects.create(
            task_number="TASK-00001",
            project=project,
            milestone=milestone,
            title="Requirement freeze",
            assigned_to=self.user,
            due_date=date.today() + timedelta(days=5),
            created_by=self.user,
        )
        assignment = ProjectTeamAssignment.objects.get(project=project, user=self.user, role=ProjectTeamAssignment.Role.PROJECT_MANAGER)
        deadline = ProjectDeadline.objects.create(project=project, milestone=milestone, title="Kickoff deadline", due_date=date.today() + timedelta(days=7), created_by=self.user)

        self.assertEqual(project.project_number, "PRJ-00001")
        self.assertEqual(project.tasks.count(), 1)
        self.assertEqual(milestone.tasks.first(), task)
        self.assertEqual(assignment.project, project)
        self.assertEqual(deadline.project, project)

        response = self.client.get("/api/v1/projects/?search=Delivery")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["data"][0]["project_number"], "PRJ-00001")

    def test_user_can_create_update_and_fetch_delivery_project_from_signed_handoff(self):
        blocked_response = self.client.post(
            "/api/v1/projects/",
            {
                "project_handoff_id": str(self.handoff.id),
                "name": "Blocked Project",
            },
            format="json",
        )
        self.assertEqual(blocked_response.status_code, 400)

        self.create_active_agreement()
        response = self.client.post(
            "/api/v1/projects/",
            {
                "project_handoff_id": str(self.handoff.id),
                "name": "Delivery Project API",
                "status": "active",
                "project_manager_id": str(self.user.id),
                "progress_percent": 10,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        project_id = response.data["data"]["id"]
        self.assertEqual(response.data["data"]["project_number"], "PRJ-00001")
        self.assertEqual(response.data["data"]["client_detail"]["client_number"], "ACC-TEST-001")
        self.assertEqual(ProjectTeamAssignment.objects.filter(project_id=project_id, user=self.user, role=ProjectTeamAssignment.Role.PROJECT_MANAGER).count(), 1)
        self.assertTrue(AuditLog.objects.filter(module="projects", action="create").exists())

        duplicate_response = self.client.post(
            "/api/v1/projects/",
            {
                "project_handoff_id": str(self.handoff.id),
                "name": "Duplicate Project",
            },
            format="json",
        )
        self.assertEqual(duplicate_response.status_code, 400)

        update_response = self.client.put(
            f"/api/v1/projects/{project_id}/",
            {
                "progress_percent": 35,
                "health_status": "at_risk",
                "target_end_date": str(date.today() + timedelta(days=60)),
            },
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["data"]["progress_percent"], 35)
        self.assertEqual(update_response.data["data"]["health_status"], "at_risk")
        self.assertTrue(AuditLog.objects.filter(module="projects", action="update").exists())

        detail_response = self.client.get(f"/api/v1/projects/{project_id}/")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["data"]["project_number"], "PRJ-00001")

    def test_user_can_manage_project_delivery_operations(self):
        self.create_active_agreement()
        project_response = self.client.post(
            "/api/v1/projects/",
            {
                "project_handoff_id": str(self.handoff.id),
                "name": "Delivery Operations API",
                "status": "active",
                "project_manager_id": self.user.id,
            },
            format="json",
        )
        project_id = project_response.data["data"]["id"]

        team_response = self.client.post(
            f"/api/v1/projects/{project_id}/team/",
            {
                "user_id": self.user.id,
                "role": "developer",
                "allocation_percent": 80,
                "start_date": str(date.today()),
                "notes": "Developer assigned for API verification.",
            },
            format="json",
        )
        self.assertEqual(team_response.status_code, 201)
        self.assertEqual(team_response.data["data"]["role"], "developer")
        assignment_id = team_response.data["data"]["id"]

        team_update_response = self.client.post(
            f"/api/v1/projects/{project_id}/team/",
            {
                "user_id": self.user.id,
                "role": "developer",
                "allocation_percent": 60,
                "start_date": str(date.today()),
                "notes": "Developer allocation updated from Team Assignment page.",
            },
            format="json",
        )
        self.assertEqual(team_update_response.status_code, 201)
        self.assertEqual(team_update_response.data["data"]["id"], assignment_id)
        self.assertEqual(team_update_response.data["data"]["allocation_percent"], 60)

        archived_user = User.objects.create_user(
            email="archived.delivery@example.com",
            mobile="9811111199",
            password="User@12345",
            employee_id="EMP-PROJECT-ARCHIVED",
            department="Product Engineering",
            designation="Archived Developer",
        )
        EmployeeHRProfile.objects.create(
            user=archived_user,
            role="Archived Developer",
            team="Product Engineering",
            status=EmployeeHRProfile.Status.ARCHIVED,
            kyc_status=EmployeeHRProfile.KycStatus.COMPLETE,
        )
        archived_team_response = self.client.post(
            f"/api/v1/projects/{project_id}/team/",
            {
                "user_id": archived_user.id,
                "role": "developer",
                "allocation_percent": 50,
                "start_date": str(date.today()),
                "notes": "Archived employee should not be assignable.",
            },
            format="json",
        )
        self.assertEqual(archived_team_response.status_code, 400)

        milestone_response = self.client.post(
            f"/api/v1/projects/{project_id}/milestones/",
            {
                "title": "Phase 1",
                "description": "Discovery and requirement freeze.",
                "sequence": 1,
                "start_date": str(date.today()),
                "due_date": str(date.today() + timedelta(days=10)),
                "milestone_value": "50000.00",
            },
            format="json",
        )
        self.assertEqual(milestone_response.status_code, 201)
        milestone_id = milestone_response.data["data"]["id"]

        milestone_update_response = self.client.put(
            f"/api/v1/projects/milestones/{milestone_id}/",
            {
                "title": "Phase 1 updated",
                "description": "Updated from Milestones page audit.",
                "sequence": 1,
                "due_date": str(date.today() + timedelta(days=12)),
                "status": "in_progress",
                "milestone_value": "65000.00",
            },
            format="json",
        )
        self.assertEqual(milestone_update_response.status_code, 200)
        self.assertEqual(milestone_update_response.data["data"]["title"], "Phase 1 updated")
        self.assertEqual(milestone_update_response.data["data"]["status"], "in_progress")

        milestone_complete_response = self.client.put(
            f"/api/v1/projects/milestones/{milestone_id}/",
            {
                "status": "completed",
            },
            format="json",
        )
        self.assertEqual(milestone_complete_response.status_code, 200)
        self.assertEqual(milestone_complete_response.data["data"]["status"], "completed")
        self.assertIsNotNone(milestone_complete_response.data["data"]["completed_at"])

        task_response = self.client.post(
            f"/api/v1/projects/{project_id}/tasks/",
            {
                "milestone_id": milestone_id,
                "title": "Requirement freeze",
                "description": "Freeze production scope.",
                "priority": "high",
                "assigned_to_id": self.user.id,
                "due_date": str(date.today() + timedelta(days=5)),
                "estimated_hours": "12.50",
            },
            format="json",
        )
        self.assertEqual(task_response.status_code, 201)
        task_id = task_response.data["data"]["id"]
        self.assertEqual(task_response.data["data"]["task_number"], "TASK-00001")

        task_update_response = self.client.put(
            f"/api/v1/projects/tasks/{task_id}/",
            {
                "status": "done",
                "actual_hours": "11.00",
            },
            format="json",
        )
        self.assertEqual(task_update_response.status_code, 200)
        self.assertEqual(task_update_response.data["data"]["status"], "done")
        self.assertIsNotNone(task_update_response.data["data"]["completed_at"])

        task_delete_response = self.client.delete(f"/api/v1/projects/tasks/{task_id}/")
        self.assertEqual(task_delete_response.status_code, 200)
        self.assertFalse(ProjectTask.objects.filter(id=task_id, is_deleted=False).exists())

        team_delete_response = self.client.delete(f"/api/v1/projects/team/{assignment_id}/")
        self.assertEqual(team_delete_response.status_code, 200)
        self.assertFalse(ProjectTeamAssignment.objects.filter(id=assignment_id, is_deleted=False).exists())

        deadline_response = self.client.post(
            f"/api/v1/projects/{project_id}/deadlines/",
            {
                "milestone_id": milestone_id,
                "title": "Phase 1 signoff",
                "due_date": str(date.today() + timedelta(days=10)),
                "severity": "critical",
                "notes": "Client signoff required.",
            },
            format="json",
        )
        self.assertEqual(deadline_response.status_code, 201)
        self.assertEqual(deadline_response.data["data"]["severity"], "critical")
        deadline_id = deadline_response.data["data"]["id"]

        deadline_update_response = self.client.put(
            f"/api/v1/projects/deadlines/{deadline_id}/",
            {
                "title": "Phase 1 signoff updated",
                "due_date": str(date.today() + timedelta(days=12)),
                "severity": "warning",
                "status": "met",
                "notes": "Delivery Lead - Resolved by project team.",
            },
            format="json",
        )
        self.assertEqual(deadline_update_response.status_code, 200)
        self.assertEqual(deadline_update_response.data["data"]["status"], "met")
        self.assertEqual(deadline_update_response.data["data"]["severity"], "warning")

        detail_response = self.client.get(f"/api/v1/projects/{project_id}/")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(len(detail_response.data["data"]["team_assignments"]), 1)
        self.assertEqual(len(detail_response.data["data"]["milestones"]), 1)
        self.assertEqual(len(detail_response.data["data"]["tasks"]), 0)
        self.assertEqual(len(detail_response.data["data"]["deadlines"]), 1)
        self.assertTrue(AuditLog.objects.filter(module="projects", entity_type="ProjectTask", action="update").exists())
        self.assertTrue(AuditLog.objects.filter(module="projects", entity_type="ProjectMilestone", action="update").exists())
        self.assertTrue(AuditLog.objects.filter(module="projects", entity_type="ProjectDeadline", action="update").exists())
        self.assertTrue(AuditLog.objects.filter(module="projects", entity_type="ProjectTask", action="delete").exists())
        self.assertTrue(AuditLog.objects.filter(module="projects", entity_type="ProjectTeamAssignment", action="delete").exists())

    def test_user_can_create_and_update_employee_performance_review(self):
        payload = {
            "employee_id": self.user.id,
            "manager_id": self.user.id,
            "department": "Engineering",
            "designation": "Backend Engineer",
            "review_cycle": "Q2 2026",
            "review_stage": "manager_review",
            "goals_assigned": 10,
            "goals_completed": 8,
            "kpi_score": 88,
            "task_completion": 91,
            "quality_score": "4.4",
            "attendance_score": 96,
            "rating": "4.3",
            "status": "exceeds_expectations",
            "last_review_date": str(date.today()),
            "next_review_date": str(date.today() + timedelta(days=90)),
            "manager_notes": "Strong delivery ownership.",
            "improvement_plan": "Grow into module ownership.",
            "promotion_readiness": 82,
            "attrition_risk": "low",
            "recommended_training": ["System Design"],
            "metrics": [{"label": "Delivery", "score": 91, "weight": 30}],
            "okrs": [{"objective": "Improve delivery quality", "progress": 80, "keyResults": []}],
            "feedback": {"manager": "Reliable", "peer": "Helpful", "self": "Focused"},
        }
        response = self.client.post("/api/v1/projects/performance-reviews/", payload, format="json")
        self.assertEqual(response.status_code, 201)
        review_id = response.data["data"]["id"]
        self.assertEqual(response.data["data"]["status"], "exceeds_expectations")
        self.assertEqual(EmployeePerformanceReview.objects.filter(employee=self.user, review_cycle="Q2 2026").count(), 1)

        duplicate_response = self.client.post("/api/v1/projects/performance-reviews/", payload, format="json")
        self.assertEqual(duplicate_response.status_code, 400)

        archived_user = User.objects.create_user(
            email="archived.performance@example.com",
            mobile="9811111188",
            password="User@12345",
            employee_id="EMP-PERF-ARCHIVED",
            department="Product Engineering",
            designation="Archived Reviewer",
        )
        EmployeeHRProfile.objects.create(
            user=archived_user,
            role="Archived Reviewer",
            team="Product Engineering",
            status=EmployeeHRProfile.Status.ARCHIVED,
            kyc_status=EmployeeHRProfile.KycStatus.COMPLETE,
        )
        archived_payload = {**payload, "employee_id": archived_user.id, "manager_id": self.user.id, "review_cycle": "Q3 2026"}
        archived_response = self.client.post("/api/v1/projects/performance-reviews/", archived_payload, format="json")
        self.assertEqual(archived_response.status_code, 400)

        update_payload = {**payload, "status": "archived", "review_stage": "finalized", "rating": "4.5"}
        update_response = self.client.put(f"/api/v1/projects/performance-reviews/{review_id}/", update_payload, format="json")
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["data"]["status"], "archived")
        self.assertEqual(update_response.data["data"]["review_stage"], "finalized")

        list_response = self.client.get("/api/v1/projects/performance-reviews/?review_cycle=Q2%202026")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data["data"]), 1)
        self.assertTrue(AuditLog.objects.filter(module="projects", entity_type="EmployeePerformanceReview", action="create").exists())
        self.assertTrue(AuditLog.objects.filter(module="projects", entity_type="EmployeePerformanceReview", action="update").exists())

    def test_non_project_user_is_blocked_from_delivery_modules(self):
        blocked_user = User.objects.create_user(email="blocked.project@example.com", mobile="9811111222", password="User@12345")
        self.client.force_authenticate(user=blocked_user)

        overview = self.client.get("/api/v1/projects/")
        self.assertEqual(overview.status_code, 403)

        create = self.client.post(
            "/api/v1/projects/",
            {
                "project_handoff_id": str(self.handoff.id),
                "name": "Blocked Project",
            },
            format="json",
        )
        self.assertEqual(create.status_code, 403)

    def test_project_manager_is_scoped_to_assigned_delivery_projects(self):
        self.create_active_agreement()
        own_project = DeliveryProjectService.create_project(
            data={
                "source_handoff": self.handoff,
                "client": self.client_record,
                "name": "Assigned Delivery Project",
                "description": "Project assigned to current project manager.",
                "project_manager": self.user,
                "start_date": date.today(),
                "target_end_date": date.today() + timedelta(days=45),
                "billing_model": "Fixed",
                "delivery_method": "Agile",
            },
            actor=self.user,
        )

        other_user = User.objects.create_user(email="other.pm@example.com", mobile="9811111333", password="User@12345")
        other_user.employee_id = "EMP-PROJECT-OTHER"
        other_user.department = "Product Engineering"
        other_user.designation = "Project Manager"
        other_user.save(update_fields=["employee_id", "department", "designation"])
        EmployeeHRProfile.objects.create(
            user=other_user,
            role="Project Manager",
            team="Other Team",
            status=EmployeeHRProfile.Status.ACTIVE,
            kyc_status=EmployeeHRProfile.KycStatus.COMPLETE,
        )
        other_client = ProjectClient.objects.create(
            client_number="ACC-TEST-OTHER",
            company_name="Other Delivery Client",
            project_name="Other CRM",
            value="150000.00",
            created_by=other_user,
        )
        other_project = DeliveryProject.objects.create(
            project_number="PRJ-OTHER-001",
            client=other_client,
            name="Unassigned Delivery Project",
            description="Current project manager must not access this project.",
            project_manager=other_user,
            start_date=date.today(),
            target_end_date=date.today() + timedelta(days=30),
            created_by=other_user,
        )
        ProjectTeamAssignment.objects.create(
            project=other_project,
            user=other_user,
            role=ProjectTeamAssignment.Role.PROJECT_MANAGER,
            created_by=other_user,
        )

        list_response = self.client.get("/api/v1/projects/")
        self.assertEqual(list_response.status_code, 200)
        project_ids = {row["id"] for row in list_response.data["data"]}
        self.assertIn(str(own_project.id), project_ids)
        self.assertNotIn(str(other_project.id), project_ids)

        own_detail = self.client.get(f"/api/v1/projects/{own_project.id}/")
        self.assertEqual(own_detail.status_code, 200)

        other_detail = self.client.get(f"/api/v1/projects/{other_project.id}/")
        self.assertEqual(other_detail.status_code, 404)

        other_assignment = self.client.post(
            f"/api/v1/projects/{other_project.id}/team/",
            {
                "user_id": str(self.user.id),
                "role": "developer",
                "allocation_percent": 50,
            },
            format="json",
        )
        self.assertEqual(other_assignment.status_code, 404)
