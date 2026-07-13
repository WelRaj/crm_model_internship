import { api } from "@/lib/api-client";
import type { AuthUser } from "@/services/auth-api";
import type { ProjectClientRecord, ProjectHandoffRecord } from "@/services/leads-api";

type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data: T;
};

export type DeliveryProjectRecord = {
  id: string;
  project_number: string;
  source_handoff: string | null;
  source_handoff_detail: ProjectHandoffRecord | null;
  client: string;
  client_detail: ProjectClientRecord;
  name: string;
  description: string;
  status: "planning" | "active" | "on_hold" | "completed" | "cancelled";
  status_label: string;
  priority: "low" | "medium" | "high" | "critical";
  priority_label: string;
  health_status: "on_track" | "at_risk" | "delayed";
  health_status_label: string;
  project_manager: number | null;
  project_manager_detail: AuthUser | null;
  start_date: string;
  target_end_date: string;
  actual_end_date: string | null;
  progress_percent: number;
  billing_model: string;
  delivery_method: string;
  communication_channel: string;
  repository_url: string;
  team_assignments: ProjectTeamAssignmentRecord[];
  milestones: ProjectMilestoneRecord[];
  tasks: ProjectTaskRecord[];
  deadlines: ProjectDeadlineRecord[];
  created_at: string;
  updated_at: string;
};

export type ProjectTeamAssignmentRecord = {
  id: string;
  project: string;
  user: number;
  user_detail: AuthUser;
  role: "project_manager" | "team_lead" | "developer" | "designer" | "qa" | "devops" | "business_analyst" | "viewer";
  role_label: string;
  allocation_percent: number;
  start_date: string | null;
  end_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type ProjectMilestoneRecord = {
  id: string;
  project: string;
  title: string;
  description: string;
  status: "planned" | "in_progress" | "completed" | "blocked";
  status_label: string;
  sequence: number;
  start_date: string | null;
  due_date: string;
  completed_at: string | null;
  milestone_value: string;
  created_at: string;
  updated_at: string;
};

export type ProjectTaskRecord = {
  id: string;
  task_number: string;
  project: string;
  milestone: string | null;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "done" | "blocked";
  status_label: string;
  priority: "low" | "medium" | "high" | "critical";
  priority_label: string;
  assigned_to: number | null;
  assigned_to_detail: AuthUser | null;
  due_date: string | null;
  completed_at: string | null;
  estimated_hours: string;
  actual_hours: string;
  created_at: string;
  updated_at: string;
};

export type ProjectDeadlineRecord = {
  id: string;
  project: string;
  milestone: string | null;
  title: string;
  due_date: string;
  severity: "info" | "warning" | "critical";
  severity_label: string;
  status: "open" | "met" | "missed" | "extended";
  status_label: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type EmployeePerformanceReviewRecord = {
  id: string;
  employee: number;
  employee_detail: AuthUser;
  manager: number | null;
  manager_detail: AuthUser | null;
  department: string;
  designation: string;
  review_cycle: "Q1 2026" | "Q2 2026" | "Q3 2026" | "Q4 2026";
  review_stage: "draft" | "manager_review" | "hr_review" | "finalized";
  review_stage_label: string;
  goals_assigned: number;
  goals_completed: number;
  kpi_score: number;
  task_completion: number;
  quality_score: string;
  attendance_score: number;
  rating: string;
  status: "top_performer" | "exceeds_expectations" | "meets_expectations" | "needs_improvement" | "promotion_eligible" | "archived";
  status_label: string;
  last_review_date: string;
  next_review_date: string;
  manager_notes: string;
  improvement_plan: string;
  promotion_readiness: number;
  attrition_risk: "low" | "medium" | "high";
  attrition_risk_label: string;
  recommended_training: string[];
  metrics: Array<{ label: string; score: number; weight: number }>;
  okrs: Array<{ objective: string; progress: number; keyResults: Array<{ title: string; progress: number }> }>;
  feedback: { manager?: string; peer?: string; self?: string };
  created_at: string;
  updated_at: string;
};

export type CreateDeliveryProjectPayload = {
  project_handoff_id: string;
  name?: string;
  description?: string;
  status?: DeliveryProjectRecord["status"];
  priority?: DeliveryProjectRecord["priority"];
  health_status?: DeliveryProjectRecord["health_status"];
  project_manager_id?: number | null;
  start_date?: string;
  target_end_date?: string;
  progress_percent?: number;
  billing_model?: string;
  delivery_method?: string;
  communication_channel?: string;
  repository_url?: string;
};

export type UpdateDeliveryProjectPayload = Partial<Omit<CreateDeliveryProjectPayload, "project_handoff_id">> & {
  actual_end_date?: string | null;
};

export type ProjectTeamAssignmentPayload = {
  user_id: number;
  role: ProjectTeamAssignmentRecord["role"];
  allocation_percent?: number;
  start_date?: string | null;
  end_date?: string | null;
  notes?: string;
};

export type ProjectMilestonePayload = {
  title: string;
  description?: string;
  status?: ProjectMilestoneRecord["status"];
  sequence: number;
  start_date?: string | null;
  due_date: string;
  milestone_value?: string;
};

export type ProjectTaskPayload = {
  milestone_id?: string | null;
  title: string;
  description?: string;
  status?: ProjectTaskRecord["status"];
  priority?: ProjectTaskRecord["priority"];
  assigned_to_id?: number | null;
  due_date?: string | null;
  estimated_hours?: string;
  actual_hours?: string;
};

export type UpdateProjectTaskPayload = Partial<ProjectTaskPayload>;

export type ProjectDeadlinePayload = {
  milestone_id?: string | null;
  title: string;
  due_date: string;
  severity?: ProjectDeadlineRecord["severity"];
  status?: ProjectDeadlineRecord["status"];
  notes?: string;
};

export type EmployeePerformanceReviewPayload = {
  employee_id: number;
  manager_id?: number | null;
  department?: string;
  designation?: string;
  review_cycle: EmployeePerformanceReviewRecord["review_cycle"];
  review_stage: EmployeePerformanceReviewRecord["review_stage"];
  goals_assigned: number;
  goals_completed: number;
  kpi_score: number;
  task_completion: number;
  quality_score: string;
  attendance_score: number;
  rating: string;
  status: EmployeePerformanceReviewRecord["status"];
  last_review_date: string;
  next_review_date: string;
  manager_notes: string;
  improvement_plan: string;
  promotion_readiness: number;
  attrition_risk: EmployeePerformanceReviewRecord["attrition_risk"];
  recommended_training?: string[];
  metrics?: EmployeePerformanceReviewRecord["metrics"];
  okrs?: EmployeePerformanceReviewRecord["okrs"];
  feedback?: EmployeePerformanceReviewRecord["feedback"];
};

function toQuery(params?: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== "") searchParams.set(key, String(value));
  });
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listDeliveryProjects(params?: { search?: string; status?: string }) {
  const response = await api.get<ApiResponse<DeliveryProjectRecord[]>>(`/projects/${toQuery(params)}`);
  return response.data;
}

export async function createDeliveryProject(payload: CreateDeliveryProjectPayload) {
  const response = await api.post<ApiResponse<DeliveryProjectRecord>>("/projects/", payload);
  return response.data;
}

export async function getDeliveryProject(projectId: string) {
  const response = await api.get<ApiResponse<DeliveryProjectRecord>>(`/projects/${projectId}/`);
  return response.data;
}

export async function updateDeliveryProject(projectId: string, payload: UpdateDeliveryProjectPayload) {
  const response = await api.put<ApiResponse<DeliveryProjectRecord>>(`/projects/${projectId}/`, payload);
  return response.data;
}

export async function assignProjectTeamMember(projectId: string, payload: ProjectTeamAssignmentPayload) {
  const response = await api.post<ApiResponse<ProjectTeamAssignmentRecord>>(`/projects/${projectId}/team/`, payload);
  return response.data;
}

export async function createProjectMilestone(projectId: string, payload: ProjectMilestonePayload) {
  const response = await api.post<ApiResponse<ProjectMilestoneRecord>>(`/projects/${projectId}/milestones/`, payload);
  return response.data;
}

export async function updateProjectMilestone(milestoneId: string, payload: Partial<ProjectMilestonePayload>) {
  const response = await api.put<ApiResponse<ProjectMilestoneRecord>>(`/projects/milestones/${milestoneId}/`, payload);
  return response.data;
}

export async function createProjectTask(projectId: string, payload: ProjectTaskPayload) {
  const response = await api.post<ApiResponse<ProjectTaskRecord>>(`/projects/${projectId}/tasks/`, payload);
  return response.data;
}

export async function updateProjectTask(taskId: string, payload: UpdateProjectTaskPayload) {
  const response = await api.put<ApiResponse<ProjectTaskRecord>>(`/projects/tasks/${taskId}/`, payload);
  return response.data;
}

export async function deleteProjectTask(taskId: string) {
  const response = await api.delete<ApiResponse<null>>(`/projects/tasks/${taskId}/`);
  return response.data;
}

export async function removeProjectTeamAssignment(assignmentId: string) {
  const response = await api.delete<ApiResponse<null>>(`/projects/team/${assignmentId}/`);
  return response.data;
}

export async function createProjectDeadline(projectId: string, payload: ProjectDeadlinePayload) {
  const response = await api.post<ApiResponse<ProjectDeadlineRecord>>(`/projects/${projectId}/deadlines/`, payload);
  return response.data;
}

export async function updateProjectDeadline(deadlineId: string, payload: Partial<ProjectDeadlinePayload>) {
  const response = await api.put<ApiResponse<ProjectDeadlineRecord>>(`/projects/deadlines/${deadlineId}/`, payload);
  return response.data;
}

export async function listEmployeePerformanceReviews(params?: { search?: string; status?: string; review_cycle?: string; department?: string }) {
  const response = await api.get<ApiResponse<EmployeePerformanceReviewRecord[]>>(`/projects/performance-reviews/${toQuery(params)}`);
  return response.data;
}

export async function createEmployeePerformanceReview(payload: EmployeePerformanceReviewPayload) {
  const response = await api.post<ApiResponse<EmployeePerformanceReviewRecord>>("/projects/performance-reviews/", payload);
  return response.data;
}

export async function updateEmployeePerformanceReview(reviewId: string, payload: EmployeePerformanceReviewPayload) {
  const response = await api.put<ApiResponse<EmployeePerformanceReviewRecord>>(`/projects/performance-reviews/${reviewId}/`, payload);
  return response.data;
}
