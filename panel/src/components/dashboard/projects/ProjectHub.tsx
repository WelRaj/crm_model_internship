"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { 
  CheckCircle2, AlertTriangle, 
  Plus, Search, Filter, Download,
  UserCircle, Briefcase, Users,
  Flag, X, UserPlus, Edit3, Archive, ClipboardList, MessageSquare,
  BadgeIndianRupee
} from "lucide-react";
import { 
  ActionButton, DataTable, StatusBadge, Panel, MetricCard, ProgressBar, Field 
} from "../accounting/AccountingComponents";
import { type ClientContactSnapshot } from "./projectHandoff";
import { listUsers } from "@/services/accounts-api";
import type { AuthUser } from "@/services/auth-api";
import { listProjectHandoffs, type ProjectHandoffRecord } from "@/services/leads-api";
import {
  assignProjectTeamMember,
  createDeliveryProject,
  createProjectDeadline,
  createProjectMilestone,
  createProjectTask,
  deleteProjectTask,
  listDeliveryProjects,
  removeProjectTeamAssignment,
  updateDeliveryProject,
  updateProjectDeadline,
  updateProjectMilestone,
  updateProjectTask,
  type DeliveryProjectRecord,
  type ProjectDeadlineRecord,
  type ProjectMilestoneRecord,
  type ProjectTaskRecord,
  type ProjectTeamAssignmentRecord,
} from "@/services/projects-api";

// --- Types ---
interface TeamMember {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  assignedWork: string;
  startDate: string; 
  endDate: string;   
  progress: number;
  status: "Active" | "Completed";
  priority: "Low" | "Medium" | "High" | "Critical";
  comment: string;
  attachment: string;
  history: string[];
  recordType?: "assignment" | "task";
  backendUserId?: number | null;
  backendRole?: ProjectTeamAssignmentRecord["role"];
}

type MilestoneStatus = "Pending" | "In Progress" | "Completed" | "Archived";
type BillingEventStatus = "Not Ready" | "Ready" | "Queued" | "Billed";

interface Milestone {
  id: string;
  title: string;
  status: MilestoneStatus;
  progress: number;
  amount?: number; // Billing amount when completed
  billed: boolean;
  dueDate: string;
  owner: string;
  nextAction: string;
  billingEventStatus: BillingEventStatus;
  completedAt?: string;
}

type ProjectStatus = "Discovery" | "Planning" | "Development" | "UAT" | "On Hold" | "Completed" | "Archived";
type ProjectHealth = "On Track" | "At Risk" | "Delayed" | "New";
type BillingStatus = "Not Started" | "Milestone Billing" | "Invoice Drafted" | "Partially Billed" | "Fully Billed";

interface Project {
  id: string;
  name: string;
  clientId: string;
  client: string;
  sourceHandoffId?: string | null;
  sourceLeadId: string;
  teamLeader: string;
  teamLeaderId?: string;
  teamLeaderName?: string;
  projectOwner: string;
  status: ProjectStatus;
  health: ProjectHealth;
  billingStatus: BillingStatus;
  progress: number;
  startDate: string; 
  endDate: string;   
  team: TeamMember[];
  milestones: Milestone[];
  deadlines: DeadlineRecord[];
  totalValue: number;
  nextAction: string;
  clientContacts?: ClientContactSnapshot[];
}

interface ProjectFormState {
  projectHandoffId: string;
  name: string;
  clientId: string;
  client: string;
  sourceLeadId: string;
  teamLeader: string;
  projectOwner: string;
  status: ProjectStatus;
  health: ProjectHealth;
  billingStatus: BillingStatus;
  progress: number;
  startDate: string;
  endDate: string;
  totalValue: number;
  nextAction: string;
}

interface NewMemberForm {
  employeeId: string;
  name: string;
  role: string;
  task: string;
  start: string;
  end: string;
  progress: number;
  status: "Active" | "Completed";
  priority: TeamMember["priority"];
  comment: string;
  attachment: string;
}

interface MilestoneFormState {
  projectId: string;
  title: string;
  owner: string;
  status: MilestoneStatus;
  progress: number;
  amount: number;
  dueDate: string;
  nextAction: string;
  billingEventStatus: BillingEventStatus;
}

interface BillingEventDraft {
  id: string;
  projectId: string;
  projectName: string;
  clientId: string;
  client: string;
  milestoneId: string;
  milestoneTitle: string;
  amount: number;
  dueDate: string;
  status: BillingEventStatus;
  createdAt: string;
}

type DeadlinePriority = "Low" | "Medium" | "High" | "Critical";
type DeadlineStatus = "Open" | "In Progress" | "Resolved" | "Archived";
type DeadlineSource = "Project" | "Milestone" | "Task" | "Manual";

interface DeadlineRecord {
  id: string;
  projectId: string;
  projectName: string;
  client: string;
  source: DeadlineSource;
  title: string;
  owner: string;
  dueDate: string;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  nextAction: string;
  linkedRecordId: string;
}

interface DeadlineFormState {
  projectId: string;
  title: string;
  owner: string;
  dueDate: string;
  priority: DeadlinePriority;
  status: DeadlineStatus;
  nextAction: string;
}

const deliveryProjectPageLabels: Record<string, string> = {
  projects: "Project Portfolio",
  "team-tracking": "Team Assignment",
  tasks: "Tasks",
  milestones: "Milestones",
  deadlines: "Deadlines",
  performance: "Team Performance",
};

const deliveryProjectPageDescriptions: Record<string, string> = {
  projects: "Delivery control for software projects and fintech client engagements.",
  "team-tracking": "Assign team leaders, internal members, and client coordination links.",
  tasks: "Track project tasks, owners, priority, status, and due dates.",
  milestones: "Track delivery milestones, billing readiness, owners, and due dates.",
  deadlines: "Track project, milestone, task, and manual delivery deadlines.",
  performance: "Track delivery team performance and review outcomes.",
};

// --- Initial Mock Data ---
const initialProjects: Project[] = [
  {
    id: "PRJ-001",
    name: "Apex Loan Automation Platform",
    clientId: "ACC-24001",
    client: "Apex Finserve Pvt Ltd",
    sourceLeadId: "LEAD-2026-019",
    teamLeader: "Vikram Rathore",
    teamLeaderName: "Vikram Rathore",
    projectOwner: "Priya Menon",
    status: "Development",
    health: "On Track",
    billingStatus: "Milestone Billing",
    progress: 65,
    startDate: "2024-05-01",
    endDate: "2024-07-30",
    totalValue: 1500000,
    nextAction: "Complete backend alpha milestone and raise UAT plan",
    team: [
      { id: "M1", employeeId: "EMP-101", name: "Aman Gupta", role: "Frontend Dev", assignedWork: "Auth UI & Charts", startDate: "2024-05-15", endDate: "2024-06-30", progress: 85, status: "Active", priority: "High", comment: "Charts pending final API mapping.", attachment: "auth-ui-spec.pdf", history: ["Assigned to Aman Gupta", "Progress updated to 85%"] },
      { id: "M2", employeeId: "EMP-102", name: "Neha Sharma", role: "Backend Dev", assignedWork: "Loan Logic API", startDate: "2024-05-10", endDate: "2024-07-05", progress: 45, status: "Active", priority: "Critical", comment: "Loan rules need QA test cases.", attachment: "loan-api-contract.md", history: ["Assigned to Neha Sharma", "Marked critical for backend alpha"] },
      { id: "M3", employeeId: "EMP-103", name: "Rahul Verma", role: "Full Stack", assignedWork: "Profile Master", startDate: "2024-05-20", endDate: "2024-08-15", progress: 60, status: "Active", priority: "Medium", comment: "Waiting for profile import sample.", attachment: "profile-master.xlsx", history: ["Assigned to Rahul Verma"] },
    ],
    milestones: [
      { id: "MS1", title: "UI Final Sign-off", status: "Completed", progress: 100, amount: 300000, billed: true, dueDate: "2024-05-20", owner: "Aman Gupta", nextAction: "Confirm invoice payment receipt", billingEventStatus: "Billed", completedAt: "2024-05-20" },
      { id: "MS2", title: "API Backend Alpha", status: "In Progress", progress: 60, amount: 500000, billed: false, dueDate: "2024-06-25", owner: "Neha Sharma", nextAction: "Finish loan rules QA and backend demo", billingEventStatus: "Not Ready" },
      { id: "MS3", title: "Beta Launch", status: "Pending", progress: 0, amount: 700000, billed: false, dueDate: "2024-07-20", owner: "Priya Menon", nextAction: "Lock beta scope after API alpha", billingEventStatus: "Not Ready" },
    ],
    deadlines: []
  },
  {
    id: "PRJ-002",
    name: "Nexa Retail Web",
    clientId: "ACC-24002",
    client: "Nexa Retail Cloud",
    sourceLeadId: "LEAD-2026-027",
    teamLeader: "Sunita Sharma",
    teamLeaderName: "Sunita Sharma",
    projectOwner: "Ritu Menon",
    status: "Discovery",
    health: "New",
    billingStatus: "Milestone Billing",
    progress: 15,
    startDate: "2024-06-10",
    endDate: "2024-10-15",
    totalValue: 2500000,
    nextAction: "Finalize UX wireframes and discovery sign-off",
    team: [
      { id: "M4", employeeId: "EMP-104", name: "Swati Joshi", role: "UI/UX Designer", assignedWork: "Style Guide", startDate: "2024-06-15", endDate: "2024-07-10", progress: 30, status: "Active", priority: "Medium", comment: "Client has approved direction, components pending.", attachment: "nexa-style-guide.fig", history: ["Assigned to Swati Joshi"] },
    ],
    milestones: [
      { id: "MS4", title: "Requirement Discovery", status: "Completed", progress: 100, amount: 200000, billed: true, dueDate: "2024-06-15", owner: "Sunita Sharma", nextAction: "Share signed discovery notes with billing", billingEventStatus: "Billed", completedAt: "2024-06-15" },
      { id: "MS5", title: "UX Wireframes", status: "In Progress", progress: 20, amount: 400000, billed: false, dueDate: "2024-07-15", owner: "Swati Joshi", nextAction: "Complete mobile and checkout wireframes", billingEventStatus: "Not Ready" },
    ],
    deadlines: []
  }
];

const projectStatuses: ProjectStatus[] = ["Discovery", "Planning", "Development", "UAT", "On Hold", "Completed", "Archived"];
const projectHealthOptions: ProjectHealth[] = ["On Track", "At Risk", "Delayed", "New"];
const billingStatuses: BillingStatus[] = ["Not Started", "Milestone Billing", "Invoice Drafted", "Partially Billed", "Fully Billed"];
const milestoneStatuses: MilestoneStatus[] = ["Pending", "In Progress", "Completed", "Archived"];
const billingEventStatuses: BillingEventStatus[] = ["Not Ready", "Ready", "Queued", "Billed"];
const deadlinePriorities: DeadlinePriority[] = ["Low", "Medium", "High", "Critical"];
const deadlineStatuses: DeadlineStatus[] = ["Open", "In Progress", "Resolved", "Archived"];
const knownClients = [
  { id: "ACC-24001", name: "Apex Finserve Pvt Ltd" },
  { id: "ACC-24002", name: "Nexa Retail Cloud" },
  { id: "ACC-24003", name: "Bluebird Logistics" },
  { id: "ACC-24004", name: "Orbit HR Tech" },
];
const teamLeaders = ["Vikram Rathore", "Sunita Sharma", "Rajesh Kumar", "Anjali Singh", "Priya Menon"];

const blankProjectForm: ProjectFormState = {
  projectHandoffId: "",
  name: "",
  clientId: "",
  client: "",
  sourceLeadId: "",
  teamLeader: "",
  projectOwner: "",
  status: "Discovery",
  health: "New",
  billingStatus: "Not Started",
  progress: 0,
  startDate: "2026-06-23",
  endDate: "2026-07-23",
  totalValue: 0,
  nextAction: "",
};

const blankMemberForm: NewMemberForm = { employeeId: "", name: "", role: "", task: "", start: "", end: "", progress: 0, status: "Active", priority: "Medium", comment: "", attachment: "" };

const blankMilestoneForm: MilestoneFormState = {
  projectId: "",
  title: "",
  owner: "",
  status: "Pending",
  progress: 0,
  amount: 0,
  dueDate: "2026-07-23",
  nextAction: "",
  billingEventStatus: "Not Ready",
};

const blankDeadlineForm: DeadlineFormState = {
  projectId: "",
  title: "",
  owner: "",
  dueDate: "2026-07-23",
  priority: "Medium",
  status: "Open",
  nextAction: "",
};

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function makeProjectId(count: number) {
  return `PRJ-${String(count + 1).padStart(3, "0")}`;
}

function backendStatusToProjectStatus(status: DeliveryProjectRecord["status"]): ProjectStatus {
  if (status === "active") return "Development";
  if (status === "on_hold") return "On Hold";
  if (status === "completed") return "Completed";
  if (status === "cancelled") return "Archived";
  return "Planning";
}

function projectStatusToBackend(status: ProjectStatus): DeliveryProjectRecord["status"] {
  if (status === "Development" || status === "UAT") return "active";
  if (status === "On Hold") return "on_hold";
  if (status === "Completed") return "completed";
  if (status === "Archived") return "cancelled";
  return "planning";
}

function backendHealthToProjectHealth(health: DeliveryProjectRecord["health_status"]): ProjectHealth {
  if (health === "at_risk") return "At Risk";
  if (health === "delayed") return "Delayed";
  return "On Track";
}

function projectHealthToBackend(health: ProjectHealth): DeliveryProjectRecord["health_status"] {
  if (health === "At Risk") return "at_risk";
  if (health === "Delayed") return "delayed";
  return "on_track";
}

function backendPriorityToUi(priority: string): TeamMember["priority"] {
  if (priority === "critical") return "Critical";
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
}

function uiPriorityToBackend(priority: TeamMember["priority"]): "low" | "medium" | "high" | "critical" {
  if (priority === "Critical") return "critical";
  if (priority === "High") return "high";
  if (priority === "Low") return "low";
  return "medium";
}

function teamRoleToBackend(role: string): ProjectTeamAssignmentRecord["role"] {
  const normalized = role.toLowerCase();
  if (normalized.includes("lead")) return "team_lead";
  if (normalized.includes("qa") || normalized.includes("test")) return "qa";
  if (normalized.includes("design") || normalized.includes("ui") || normalized.includes("ux")) return "designer";
  if (normalized.includes("devops") || normalized.includes("infra")) return "devops";
  if (normalized.includes("analyst") || normalized.includes("ba")) return "business_analyst";
  if (normalized.includes("manager") || normalized.includes("pm")) return "project_manager";
  return "developer";
}

function backendMilestoneStatusToUi(status: ProjectMilestoneRecord["status"]): MilestoneStatus {
  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";
  if (status === "blocked") return "Archived";
  return "Pending";
}

function uiMilestoneStatusToBackend(status: MilestoneStatus): ProjectMilestoneRecord["status"] {
  if (status === "Completed") return "completed";
  if (status === "In Progress") return "in_progress";
  if (status === "Archived") return "blocked";
  return "planned";
}

function backendUserName(user?: AuthUser | null) {
  return user?.full_name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.email || "Unassigned";
}

function teamMemberFromBackend(assignment: ProjectTeamAssignmentRecord): TeamMember {
  return {
    id: assignment.id,
    employeeId: assignment.user_detail?.employee_id || String(assignment.user),
    name: backendUserName(assignment.user_detail),
    role: assignment.role_label,
    assignedWork: assignment.notes || "Project delivery assignment",
    startDate: assignment.start_date || "",
    endDate: assignment.end_date || "",
    progress: 0,
    status: assignment.end_date ? "Completed" : "Active",
    priority: "Medium",
    comment: assignment.notes,
    attachment: "",
    history: [`Assigned as ${assignment.role_label}`],
    recordType: "assignment",
    backendUserId: assignment.user,
    backendRole: assignment.role,
  };
}

function milestoneFromBackend(milestone: ProjectMilestoneRecord): Milestone {
  return {
    id: milestone.id,
    title: milestone.title,
    status: backendMilestoneStatusToUi(milestone.status),
    progress: milestone.status === "completed" ? 100 : milestone.status === "in_progress" ? 50 : 0,
    amount: Number(milestone.milestone_value || 0),
    billed: false,
    dueDate: milestone.due_date,
    owner: "Delivery Team",
    nextAction: milestone.description || "Review milestone progress",
    billingEventStatus: milestone.status === "completed" ? "Ready" : "Not Ready",
    completedAt: milestone.completed_at?.split("T")[0],
  };
}

function taskAsTeamMember(task: ProjectTaskRecord): TeamMember {
  return {
    id: task.id,
    employeeId: task.assigned_to_detail?.employee_id || String(task.assigned_to || ""),
    name: backendUserName(task.assigned_to_detail),
    role: task.priority_label,
    assignedWork: task.title,
    startDate: task.created_at.split("T")[0],
    endDate: task.due_date || "",
    progress: task.status === "done" ? 100 : task.status === "in_progress" ? 50 : task.status === "review" ? 80 : 0,
    status: task.status === "done" ? "Completed" : "Active",
    priority: backendPriorityToUi(task.priority),
    comment: task.description,
    attachment: "",
    history: [`Task ${task.task_number} loaded from backend`],
    recordType: "task",
    backendUserId: task.assigned_to,
  };
}

function projectFromBackend(project: DeliveryProjectRecord): Project {
  const client = project.client_detail;
  const sourceLead = client.source_lead_detail;
  return {
    id: project.id,
    name: project.name,
    clientId: client.client_number,
    client: client.company_name,
    sourceHandoffId: project.source_handoff,
    sourceLeadId: sourceLead?.lead_number || project.source_handoff_detail?.project_code || "Manual",
    teamLeader: backendUserName(project.project_manager_detail),
    teamLeaderId: project.project_manager ? String(project.project_manager) : undefined,
    teamLeaderName: backendUserName(project.project_manager_detail),
    projectOwner: client.project_owner || backendUserName(project.project_manager_detail),
    status: backendStatusToProjectStatus(project.status),
    health: backendHealthToProjectHealth(project.health_status),
    billingStatus: project.billing_model === "Milestone Based" ? "Milestone Billing" : "Not Started",
    progress: project.progress_percent,
    startDate: project.start_date,
    endDate: project.target_end_date,
    team: [...project.team_assignments.map(teamMemberFromBackend), ...project.tasks.map(taskAsTeamMember)],
    milestones: project.milestones.map(milestoneFromBackend),
    deadlines: project.deadlines.map((deadline) => deadlineFromBackend(project, deadline)),
    totalValue: Number(client.value || 0),
    nextAction: project.description || "Review delivery plan and next milestone",
    clientContacts: client.contacts,
  };
}

function projectStatusTone(status: ProjectStatus): "green" | "blue" | "amber" | "red" | "purple" | "slate" {
  if (status === "Completed") return "green";
  if (status === "Development" || status === "UAT") return "blue";
  if (status === "Discovery" || status === "Planning") return "purple";
  if (status === "On Hold") return "amber";
  return "slate";
}

function projectHealthTone(health: ProjectHealth): "green" | "blue" | "amber" | "red" | "purple" | "slate" {
  if (health === "On Track") return "green";
  if (health === "At Risk") return "amber";
  if (health === "Delayed") return "red";
  return "blue";
}

function milestoneStatusTone(status: MilestoneStatus): "green" | "blue" | "amber" | "red" | "purple" | "slate" {
  if (status === "Completed") return "green";
  if (status === "In Progress") return "blue";
  if (status === "Archived") return "slate";
  return "amber";
}

function billingEventTone(status: BillingEventStatus): "green" | "blue" | "amber" | "red" | "purple" | "slate" {
  if (status === "Billed") return "green";
  if (status === "Queued") return "blue";
  if (status === "Ready") return "purple";
  return "slate";
}

function deadlinePriorityTone(priority: DeadlinePriority): "green" | "blue" | "amber" | "red" | "purple" | "slate" {
  if (priority === "Critical") return "red";
  if (priority === "High") return "amber";
  if (priority === "Medium") return "blue";
  return "green";
}

function deadlineStatusTone(status: DeadlineStatus): "green" | "blue" | "amber" | "red" | "purple" | "slate" {
  if (status === "Resolved") return "green";
  if (status === "In Progress") return "blue";
  if (status === "Archived") return "slate";
  return "amber";
}

function deadlinePriorityToSeverity(priority: DeadlinePriority): "info" | "warning" | "critical" {
  if (priority === "Critical") return "critical";
  if (priority === "Low") return "info";
  return "warning";
}

function backendSeverityToDeadlinePriority(severity: ProjectDeadlineRecord["severity"]): DeadlinePriority {
  if (severity === "critical") return "Critical";
  if (severity === "info") return "Low";
  return "High";
}

function deadlineStatusToBackend(status: DeadlineStatus): "open" | "met" | "missed" | "extended" {
  if (status === "Resolved") return "met";
  if (status === "Archived") return "extended";
  return "open";
}

function backendDeadlineStatusToUi(status: ProjectDeadlineRecord["status"]): DeadlineStatus {
  if (status === "met") return "Resolved";
  if (status === "extended") return "Archived";
  if (status === "missed") return "In Progress";
  return "Open";
}

function parseDeadlineNotes(notes: string) {
  const [owner, ...rest] = notes.split(" - ");
  return {
    owner: owner?.trim() || "Delivery Team",
    nextAction: rest.join(" - ").trim() || notes || "Review deadline",
  };
}

function deadlineFromBackend(project: DeliveryProjectRecord, deadline: ProjectDeadlineRecord): DeadlineRecord {
  const parsedNotes = parseDeadlineNotes(deadline.notes);
  return {
    id: deadline.id,
    projectId: project.id,
    projectName: project.name,
    client: project.client_detail.company_name,
    source: "Manual",
    title: deadline.title,
    owner: parsedNotes.owner,
    dueDate: deadline.due_date,
    priority: backendSeverityToDeadlinePriority(deadline.severity),
    status: backendDeadlineStatusToUi(deadline.status),
    nextAction: parsedNotes.nextAction,
    linkedRecordId: deadline.id,
  };
}

// --- Sub-View Components ---

function TeamTrackingView({
  projects,
  users,
  onAddMember,
  onUpdateMember,
  onRemoveMember,
  onSetTeamLeader,
}: {
  projects: Project[];
  users: AuthUser[];
  onAddMember: (prjId: string, member: NewMemberForm) => void;
  onUpdateMember: (prjId: string, memberId: string, member: NewMemberForm) => void;
  onRemoveMember: (prjId: string, memberId: string) => void;
  onSetTeamLeader: (prjId: string, employeeId: string) => void;
}) {
  const [activeAddForm, setActiveAddForm] = useState<string | null>(null);
  const [newMem, setNewMem] = useState<NewMemberForm>(blankMemberForm);
  const [editing, setEditing] = useState<{ projectId: string; memberId: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | TeamMember["status"]>("All");
  const [memberError, setMemberError] = useState("");

  const assignments = useMemo(
    () => projects.flatMap((project) => project.team.map((member) => ({ ...member, projectId: project.id, projectName: project.name, projectDeadline: project.endDate }))),
    [projects]
  );
  const filteredAssignments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return assignments.filter((assignment) => {
      const matchesSearch = !normalizedSearch || [
        assignment.employeeId,
        assignment.name,
        assignment.role,
        assignment.assignedWork,
        assignment.projectName,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesProject = projectFilter === "All" || assignment.projectId === projectFilter;
      const matchesStatus = statusFilter === "All" || assignment.status === statusFilter;
      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [assignments, projectFilter, searchTerm, statusFilter]);
  const visibleProjects = useMemo(() => {
    const visibleProjectIds = new Set(filteredAssignments.map((assignment) => assignment.projectId));
    return projects.filter((project) => visibleProjectIds.has(project.id));
  }, [filteredAssignments, projects]);

  const activeAssignments = assignments.filter((assignment) => assignment.status === "Active");
  const completedAssignments = assignments.filter((assignment) => assignment.status === "Completed").length;
  const overloadedMembers = Object.values(assignments.reduce<Record<string, number>>((acc, assignment) => {
    if (assignment.status === "Active") acc[assignment.employeeId] = (acc[assignment.employeeId] || 0) + 1;
    return acc;
  }, {})).filter((count) => count > 2).length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueAssignments = assignments.filter((assignment) => assignment.status === "Active" && assignment.endDate && assignment.endDate < today && assignment.progress < 100).length;

  const resetMemberForm = () => {
    setNewMem(blankMemberForm);
    setEditing(null);
    setMemberError("");
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = users.find((item) => String(item.id) === employeeId || item.employee_id === employeeId);
    setNewMem((current) => ({
      ...current,
      employeeId,
      name: backendUserName(employee) || current.name,
      role: employee?.designation || current.role,
    }));
  };

  const validateMember = () => {
    if (!newMem.employeeId.trim() || !newMem.name.trim() || !newMem.role.trim() || !newMem.task.trim() || !newMem.start || !newMem.end) {
      setMemberError("Employee, role, task, start date and end date are required.");
      return false;
    }
    if (newMem.progress < 0 || newMem.progress > 100) {
      setMemberError("Work progress must be between 0 and 100.");
      return false;
    }
    if (newMem.start > newMem.end) {
      setMemberError("Assignment end date must be after start date.");
      return false;
    }
    return true;
  };

  const handleSaveMember = (projectId: string) => {
    if (!validateMember()) return;
    if (editing) {
      onUpdateMember(editing.projectId, editing.memberId, newMem);
    } else {
      onAddMember(projectId, newMem);
    }
    resetMemberForm();
    setActiveAddForm(null);
  };

  const handleEditMember = (projectId: string, member: TeamMember) => {
    setNewMem({
      employeeId: member.backendUserId ? String(member.backendUserId) : member.employeeId,
      name: member.name,
      role: member.role,
      task: member.assignedWork,
      start: member.startDate,
      end: member.endDate,
      progress: member.progress,
      status: member.status,
      priority: member.priority,
      comment: member.comment,
      attachment: member.attachment,
    });
    setEditing({ projectId, memberId: member.id });
    setActiveAddForm(projectId);
    setMemberError("");
  };

  const handleExport = () => {
    const rows = [
      ["Project ID", "Project", "Employee ID", "Name", "Role", "Task", "Start", "End", "Progress", "Status"],
      ...filteredAssignments.map((assignment) => [
        assignment.projectId,
        assignment.projectName,
        assignment.employeeId,
        assignment.name,
        assignment.role,
        assignment.assignedWork,
        assignment.startDate,
        assignment.endDate,
        assignment.progress,
        assignment.status,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project-team-tracking.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-wrap justify-end gap-3">
        <ActionButton icon={Download} label="Export" variant="outline" onClick={handleExport} />
        <ActionButton icon={Filter} label="Clear Filters" variant="outline" onClick={() => { setSearchTerm(""); setProjectFilter("All"); setStatusFilter("All"); }} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Assignments" value={String(activeAssignments.length)} helper={`${assignments.length} total allocations`} icon={Users} />
        <MetricCard label="Completed" value={String(completedAssignments)} helper="Marked as completed work" icon={CheckCircle2} />
        <MetricCard label="Overloaded" value={String(overloadedMembers).padStart(2, "0")} helper="Employees with 3+ active tasks" icon={AlertTriangle} />
        <MetricCard label="Overdue" value={String(overdueAssignments).padStart(2, "0")} helper="Past due and incomplete" icon={Flag} />
      </div>

      <Panel title="Team Assignment Directory" description="Search active allocations before opening an individual project record.">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_170px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search employee, role, task or project..." className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option value="All">All Projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | TeamMember["status"])} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
        </div>
      </Panel>

      {visibleProjects.map((project) => (
        <Panel 
          key={project.id} 
          title={project.name} 
          description={`Project deadline: ${project.endDate} | Team leader: ${project.teamLeader}`}
          actions={<ActionButton icon={UserPlus} label="Assign Member" variant="accent" onClick={() => setActiveAddForm(activeAddForm === project.id ? null : project.id)} />}
        >
          <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_280px]">
            <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Client Delivery Contacts</p>
                  <h4 className="mt-1 text-sm font-black text-primary">Connected contacts for delivery coordination</h4>
                </div>
                <span className="w-fit rounded-full border border-slate-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {project.clientContacts?.length || 0} Linked
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(project.clientContacts || []).filter((contact) => contact.role === "Technical" || contact.role === "Decision Maker").map((contact) => (
                  <div key={contact.id} className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{contact.role}</p>
                    <h5 className="mt-1 text-sm font-black text-primary">{contact.name}</h5>
                    <p className="text-xs font-bold text-secondary">{contact.designation}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{contact.email}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{contact.phone}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{contact.responsibility}</p>
                  </div>
                ))}
                {!(project.clientContacts || []).length ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs font-black uppercase tracking-widest text-slate-400 md:col-span-2">
                    No client contacts linked from Client Operations
                  </div>
                ) : null}
              </div>
            </div>
            <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Team Leader</p>
              <h4 className="mt-1 text-sm font-black text-primary">Assign the project lead</h4>
              <select
                value={project.teamLeaderId || ""}
                onChange={(event) => onSetTeamLeader(project.id, event.target.value)}
                className="mt-4 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10"
              >
                <option value="">Select team leader...</option>
                {users.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employee_id || employee.id} - {backendUserName(employee)}
                  </option>
                ))}
              </select>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
                This leader coordinates internal work and stays connected to the client technical contact above.
              </p>
            </div>
          </div>

          {activeAddForm === project.id && (
             <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100 mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 shadow-sm">
                {memberError ? <div className="md:col-span-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{memberError}</div> : null}
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Employee</span>
                  <select value={newMem.employeeId} onChange={(e: ChangeEvent<HTMLSelectElement>) => handleEmployeeSelect(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10">
                    <option value="">Select Employee...</option>
                    {users.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.employee_id || employee.id} - {backendUserName(employee)}
                      </option>
                    ))}
                  </select>
                </label>
                <Field label="Role" value={newMem.role} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMem({...newMem, role: e.target.value})} />
                <Field label="Task Detail" value={newMem.task} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMem({...newMem, task: e.target.value})} />
                <div className="grid grid-cols-2 gap-2">
                   <Field label="Start" type="date" value={newMem.start} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMem({...newMem, start: e.target.value})} />
                   <Field label="End" type="date" value={newMem.end} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMem({...newMem, end: e.target.value})} />
                </div>
                <Field label="Progress %" type="number" value={newMem.progress} min={0} max={100} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMem({...newMem, progress: Math.max(0, Math.min(100, Number(e.target.value) || 0))})} />
                <Field label="Status" options={["Active", "Completed"]} value={newMem.status} onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewMem({...newMem, status: e.target.value as TeamMember["status"]})} />
                <Field label="Priority" options={["Low", "Medium", "High", "Critical"]} value={newMem.priority} onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewMem({...newMem, priority: e.target.value as TeamMember["priority"]})} />
                <Field label="Attachment Ref" value={newMem.attachment} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMem({...newMem, attachment: e.target.value})} />
                <Field label="Comment" value={newMem.comment} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMem({...newMem, comment: e.target.value})} />
                <div className="md:col-span-4 flex justify-end gap-3 border-t border-slate-200 pt-6">
                   <ActionButton label="Cancel" variant="outline" onClick={() => { resetMemberForm(); setActiveAddForm(null); }} />
                   <ActionButton label={editing ? "Update" : "Save"} variant="primary" onClick={() => handleSaveMember(project.id)} />
                </div>
             </div>
          )}
          <DataTable columns={["Team Member", "Task Responsibility", "Work Done %", "Working Timeline", "Status", "Actions"]}>
            {project.team
              .filter((member) => filteredAssignments.some((assignment) => assignment.projectId === project.id && assignment.id === member.id))
              .map((m) => (
              <tr key={m.id} className="hover:bg-white transition-all">
                <td className="px-4 py-6 font-black text-primary">{m.name}<br/><span className="text-[10px] text-slate-400 uppercase">{m.employeeId} - {m.role}</span></td>
                <td className="px-4 py-6 font-bold text-slate-600 text-sm">{m.assignedWork}</td>
                <td className="px-4 py-6 w-48"><ProgressBar value={m.progress} tone="blue" /></td>
                <td className="px-4 py-6">
                   <div className="flex flex-col gap-1 text-[10px] font-black uppercase">
                      <span className="text-emerald-600">Start: {m.startDate}</span>
                      <span className="text-red-500">End: {m.endDate}</span>
                   </div>
                </td>
                <td className="px-4 py-6"><StatusBadge tone={m.status === "Completed" ? "green" : "blue"}>{m.status}</StatusBadge></td>
                <td className="px-4 py-6">
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEditMember(project.id, m)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                      <Edit3 size={14} /> Edit
                    </button>
                    <button type="button" onClick={() => onUpdateMember(project.id, m.id, { employeeId: m.employeeId, name: m.name, role: m.role, task: m.assignedWork, start: m.startDate, end: m.endDate, progress: 100, status: "Completed", priority: m.priority, comment: m.comment, attachment: m.attachment })} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-green-700 hover:bg-green-50">
                      <CheckCircle2 size={14} /> Done
                    </button>
                    <button type="button" onClick={() => onRemoveMember(project.id, m.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                      <Archive size={14} /> Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </DataTable>
        </Panel>
      ))}
      {visibleProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
          No team assignments match the selected filters
        </div>
      ) : null}
    </div>
  );
}

function GlobalTasksTracker({
  projects,
  users,
  onCreateTask,
  onUpdateMember,
  onRemoveMember,
}: {
  projects: Project[];
  users: AuthUser[];
  onCreateTask: (prjId: string, member: NewMemberForm) => void;
  onUpdateMember: (prjId: string, memberId: string, member: NewMemberForm) => void;
  onRemoveMember: (prjId: string, memberId: string) => void;
}) {
  const [taskForm, setTaskForm] = useState<NewMemberForm>(blankMemberForm);
  const [targetProjectId, setTargetProjectId] = useState(projects[0]?.id || "");
  const [editingTask, setEditingTask] = useState<{ projectId: string; taskId: string } | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | TeamMember["status"]>("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | TeamMember["priority"]>("All");

  const allTasks = useMemo(
    () => projects.flatMap((project) => project.team.filter((member) => member.recordType === "task").map((member) => ({ ...member, projectId: project.id, projectName: project.name, client: project.client }))),
    [projects]
  );
  const filteredTasks = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return allTasks.filter((task) => {
      const matchesSearch = !normalizedSearch || [
        task.assignedWork,
        task.projectName,
        task.client,
        task.name,
        task.employeeId,
        task.role,
        task.comment,
        task.attachment,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesProject = projectFilter === "All" || task.projectId === projectFilter;
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
      return matchesSearch && matchesProject && matchesStatus && matchesPriority;
    });
  }, [allTasks, priorityFilter, projectFilter, searchTerm, statusFilter]);

  const activeTasks = allTasks.filter((task) => task.status === "Active");
  const completedTasks = allTasks.filter((task) => task.status === "Completed").length;
  const criticalTasks = allTasks.filter((task) => task.priority === "Critical" && task.status === "Active").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueTasks = allTasks.filter((task) => task.status === "Active" && task.endDate && task.endDate < today && task.progress < 100).length;

  const resetTaskForm = () => {
    setTaskForm(blankMemberForm);
    setTargetProjectId(projects[0]?.id || "");
    setEditingTask(null);
    setTaskError("");
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = users.find((item) => String(item.id) === employeeId || item.employee_id === employeeId);
    setTaskForm((current) => ({ ...current, employeeId, name: backendUserName(employee) || current.name, role: employee?.designation || current.role }));
  };

  const validateTask = () => {
    if (!targetProjectId || !taskForm.employeeId || !taskForm.name.trim() || !taskForm.role.trim() || !taskForm.task.trim() || !taskForm.start || !taskForm.end) {
      setTaskError("Project, owner, task, role, start date and due date are required.");
      return false;
    }
    if (taskForm.progress < 0 || taskForm.progress > 100) {
      setTaskError("Progress must be between 0 and 100.");
      return false;
    }
    if (taskForm.start > taskForm.end) {
      setTaskError("Due date must be after start date.");
      return false;
    }
    return true;
  };

  const handleSaveTask = () => {
    if (!validateTask()) return;
    if (editingTask) {
      onUpdateMember(editingTask.projectId, editingTask.taskId, taskForm);
    } else {
      onCreateTask(targetProjectId, taskForm);
    }
    resetTaskForm();
    setShowTaskForm(false);
  };

  const handleEditTask = (task: TeamMember & { projectId: string }) => {
    setTaskForm({
      employeeId: task.backendUserId ? String(task.backendUserId) : task.employeeId,
      name: task.name,
      role: task.role,
      task: task.assignedWork,
      start: task.startDate,
      end: task.endDate,
      progress: task.progress,
      status: task.status,
      priority: task.priority,
      comment: task.comment,
      attachment: task.attachment,
    });
    setTargetProjectId(task.projectId);
    setEditingTask({ projectId: task.projectId, taskId: task.id });
    setTaskError("");
    setShowTaskForm(true);
  };

  const handleExport = () => {
    const rows = [
      ["Project ID", "Project", "Client", "Task", "Employee ID", "Owner", "Role", "Start", "Due", "Progress", "Status", "Priority", "Comment", "Attachment"],
      ...filteredTasks.map((task) => [
        task.projectId,
        task.projectName,
        task.client,
        task.assignedWork,
        task.employeeId,
        task.name,
        task.role,
        task.startDate,
        task.endDate,
        task.progress,
        task.status,
        task.priority,
        task.comment,
        task.attachment,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "project-tasks.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <ActionButton icon={Download} label="Export" variant="outline" onClick={handleExport} />
        <ActionButton icon={Filter} label="Clear Filters" variant="outline" onClick={() => { setSearchTerm(""); setProjectFilter("All"); setStatusFilter("All"); setPriorityFilter("All"); }} />
        <ActionButton icon={Plus} label="New Task" variant="accent" onClick={() => { resetTaskForm(); setShowTaskForm(true); }} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Tasks" value={String(activeTasks.length)} helper={`${allTasks.length} total project tasks`} icon={ClipboardList} />
        <MetricCard label="Completed" value={String(completedTasks)} helper="Marked done" icon={CheckCircle2} />
        <MetricCard label="Critical" value={String(criticalTasks).padStart(2, "0")} helper="Active critical priority" icon={AlertTriangle} />
        <MetricCard label="Overdue" value={String(overdueTasks).padStart(2, "0")} helper="Past due and incomplete" icon={Flag} />
      </div>

      {showTaskForm ? (
        <Panel title={editingTask ? "Edit Task" : "Create Task"} description="Task ownership, due dates, comments, attachments and history for project execution.">
          {taskError ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{taskError}</div> : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Project" options={projects.map((project) => `${project.id} - ${project.name}`)} value={targetProjectId ? `${targetProjectId} - ${projects.find((project) => project.id === targetProjectId)?.name || ""}` : ""} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTargetProjectId(e.target.value.split(" - ")[0])} />
            <label className="block space-y-1.5">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Owner</span>
              <select value={taskForm.employeeId} onChange={(e: ChangeEvent<HTMLSelectElement>) => handleEmployeeSelect(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10">
                <option value="">Select Owner...</option>
                {users.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.employee_id || employee.id} - {backendUserName(employee)}
                  </option>
                ))}
              </select>
            </label>
            <Field label="Role" value={taskForm.role} onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, role: e.target.value })} />
            <Field label="Task" value={taskForm.task} onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, task: e.target.value })} />
            <Field label="Start Date" type="date" value={taskForm.start} onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, start: e.target.value })} />
            <Field label="Due Date" type="date" value={taskForm.end} onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, end: e.target.value })} />
            <Field label="Progress %" type="number" value={taskForm.progress} min={0} max={100} onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} />
            <Field label="Status" options={["Active", "Completed"]} value={taskForm.status} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTaskForm({ ...taskForm, status: e.target.value as TeamMember["status"] })} />
            <Field label="Priority" options={["Low", "Medium", "High", "Critical"]} value={taskForm.priority} onChange={(e: ChangeEvent<HTMLSelectElement>) => setTaskForm({ ...taskForm, priority: e.target.value as TeamMember["priority"] })} />
            <Field label="Attachment Ref" value={taskForm.attachment} onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, attachment: e.target.value })} />
            <Field label="Comment" value={taskForm.comment} onChange={(e: ChangeEvent<HTMLInputElement>) => setTaskForm({ ...taskForm, comment: e.target.value })} />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <ActionButton label="Cancel" variant="outline" onClick={() => { resetTaskForm(); setShowTaskForm(false); }} />
            <ActionButton label={editingTask ? "Save Changes" : "Save Task"} variant="accent" onClick={handleSaveTask} />
          </div>
        </Panel>
      ) : null}

      <Panel title="Execution Monitor" description="Global task list with ownership, priority, due dates, comments, attachments and history.">
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_170px_170px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search task, owner, project, attachment..." className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option value="All">All Projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | TeamMember["status"])} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            <option>Active</option>
            <option>Completed</option>
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "All" | TeamMember["priority"])} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            <option>Low</option>
            <option>Medium</option>
            <option>High</option>
            <option>Critical</option>
          </select>
        </div>
        <DataTable columns={["Task", "Project", "Owner", "Due", "Progress", "Priority", "Comment / Attachment", "Actions"]}>
          {filteredTasks.map(t => (
            <tr key={`${t.projectId}-${t.id}`} className="hover:bg-slate-50">
              <td className="px-4 py-5 font-black text-primary text-sm">{t.assignedWork}<br/><span className="text-[10px] uppercase text-slate-400">{t.id}</span></td>
              <td className="px-4 py-5 font-bold text-slate-500 text-xs">{t.projectName}<br/><span className="text-slate-400">{t.client}</span></td>
              <td className="px-4 py-5 font-bold text-slate-600">{t.name}<br/><span className="text-[10px] uppercase text-slate-400">{t.employeeId} - {t.role}</span></td>
              <td className="px-4 py-5 text-red-500 font-black text-xs">{t.endDate}</td>
              <td className="px-4 py-5 w-40"><ProgressBar value={t.progress} tone={t.status === "Completed" ? "green" : "blue"} /></td>
              <td className="px-4 py-5"><StatusBadge tone={t.priority === "Critical" ? "red" : t.priority === "High" ? "amber" : t.priority === "Medium" ? "blue" : "slate"}>{t.priority}</StatusBadge></td>
              <td className="px-4 py-5 text-xs font-bold text-slate-600">
                <div className="flex items-start gap-2"><MessageSquare size={14} className="mt-0.5 text-primary" /> <span>{t.comment || "No comment"}</span></div>
                <p className="mt-2 text-[10px] font-black uppercase text-slate-400">{t.attachment || "No attachment"}</p>
                <p className="mt-1 text-[10px] text-slate-400">History: {t.history.slice(-1)[0] || "Created"}</p>
              </td>
              <td className="px-4 py-5">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleEditTask(t)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50"><Edit3 size={14} /> Edit</button>
                  <button type="button" onClick={() => onUpdateMember(t.projectId, t.id, { employeeId: t.employeeId, name: t.name, role: t.role, task: t.assignedWork, start: t.startDate, end: t.endDate, progress: 100, status: "Completed", priority: t.priority, comment: t.comment, attachment: t.attachment })} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-green-700 hover:bg-green-50"><CheckCircle2 size={14} /> Done</button>
                  <button type="button" onClick={() => onRemoveMember(t.projectId, t.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50"><Archive size={14} /> Remove</button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        {filteredTasks.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">No tasks match the selected filters</div>
        ) : null}
      </Panel>
    </div>
  );
}

function ProjectTimelineView({ projects }: { projects: Project[] }) {
  return (
    <div className="space-y-10">
      {projects.map(p => (
        <Panel key={p.id} title={`${p.name} - Roadmap Timeline`} description={`Schedule: ${p.startDate} to ${p.endDate}`}>
           <div className="relative mt-4 min-h-[200px] bg-slate-50/50 rounded-3xl p-8 border border-dashed border-slate-200">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-200 border-dashed hidden md:block"></div>
              
              <div className="space-y-12">
                 {p.milestones.map((ms, idx) => (
                    <div key={ms.id} className={`flex items-center gap-8 ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} relative`}>
                       {/* Timeline Connector */}
                       <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-primary z-10 hidden md:block"></div>
                       
                       <div className="flex-1">
                          <div className={`p-6 rounded-[2rem] border bg-white shadow-sm transition-all hover:shadow-md ${ms.status === "Completed" ? 'border-emerald-100' : 'border-slate-100'}`}>
                             <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 rounded-xl ${ms.status === "Completed" ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                   <Flag size={18} />
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{ms.dueDate}</span>
                             </div>
                             <h4 className="font-black text-primary text-sm mb-2">{ms.title}</h4>
                             <div className="flex items-center gap-3">
                                <div className="flex-1"><ProgressBar value={ms.progress} tone={ms.status === "Completed" ? "green" : "blue"} /></div>
                                <span className="text-[10px] font-black text-slate-500">{ms.progress}%</span>
                             </div>
                             {ms.billed && (
                                <div className="mt-4 flex items-center gap-2 text-emerald-600">
                                   <BadgeIndianRupee size={12} />
                                   <span className="text-[10px] font-black uppercase">Auto-Billed</span>
                                </div>
                             )}
                          </div>
                       </div>
                       <div className="flex-1 hidden md:block"></div>
                    </div>
                 ))}
              </div>
           </div>
        </Panel>
      ))}
    </div>
  );
}

function MilestonesView({
  projects,
  billingEvents,
  onSaveMilestone,
  onArchiveMilestone,
  onComplete,
  onExport,
}: {
  projects: Project[];
  billingEvents: BillingEventDraft[];
  onSaveMilestone: (projectId: string, milestoneId: string | null, milestone: MilestoneFormState) => void;
  onArchiveMilestone: (projectId: string, milestoneId: string) => void;
  onComplete: (projectId: string, milestoneId: string) => void;
  onExport: (rows: Array<Array<string | number>>) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<{ projectId: string; milestoneId: string } | null>(null);
  const [milestoneForm, setMilestoneForm] = useState<MilestoneFormState>({ ...blankMilestoneForm, projectId: projects[0]?.id || "" });
  const [milestoneError, setMilestoneError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | MilestoneStatus>("All");
  const [billingFilter, setBillingFilter] = useState<"All" | BillingEventStatus>("All");

  const milestones = useMemo(
    () => projects.flatMap((project) => project.milestones.map((milestone) => ({ ...milestone, projectId: project.id, projectName: project.name, clientId: project.clientId, client: project.client, projectEndDate: project.endDate }))),
    [projects]
  );

  const filteredMilestones = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return milestones.filter((milestone) => {
      const matchesSearch = !normalizedSearch || [
        milestone.id,
        milestone.title,
        milestone.owner,
        milestone.nextAction,
        milestone.projectName,
        milestone.client,
        milestone.clientId,
        milestone.status,
        milestone.billingEventStatus,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesProject = projectFilter === "All" || milestone.projectId === projectFilter;
      const matchesStatus = statusFilter === "All" || milestone.status === statusFilter;
      const matchesBilling = billingFilter === "All" || milestone.billingEventStatus === billingFilter;
      return matchesSearch && matchesProject && matchesStatus && matchesBilling;
    });
  }, [billingFilter, milestones, projectFilter, searchTerm, statusFilter]);

  const activeMilestones = milestones.filter((milestone) => milestone.status !== "Archived");
  const completedMilestones = activeMilestones.filter((milestone) => milestone.status === "Completed").length;
  const readyForBilling = activeMilestones.filter((milestone) => milestone.billingEventStatus === "Ready" || milestone.billingEventStatus === "Queued").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdueMilestones = activeMilestones.filter((milestone) => milestone.status !== "Completed" && milestone.dueDate < today).length;

  const resetMilestoneForm = () => {
    setMilestoneForm({ ...blankMilestoneForm, projectId: projects[0]?.id || "" });
    setEditingMilestone(null);
    setMilestoneError("");
  };

  const validateMilestone = () => {
    if (!milestoneForm.projectId || !milestoneForm.title.trim() || !milestoneForm.owner.trim() || !milestoneForm.dueDate || !milestoneForm.nextAction.trim()) {
      setMilestoneError("Project, title, owner, due date and next action are required.");
      return false;
    }
    if (milestoneForm.amount < 0) {
      setMilestoneError("Billing amount cannot be negative.");
      return false;
    }
    if (milestoneForm.progress < 0 || milestoneForm.progress > 100) {
      setMilestoneError("Milestone progress must be between 0 and 100.");
      return false;
    }
    if (milestoneForm.status === "Completed" && milestoneForm.progress < 100) {
      setMilestoneError("Completed milestone must have 100% progress.");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateMilestone()) return;
    onSaveMilestone(milestoneForm.projectId, editingMilestone?.milestoneId || null, milestoneForm);
    resetMilestoneForm();
    setShowForm(false);
  };

  const handleEdit = (milestone: typeof milestones[number]) => {
    setMilestoneForm({
      projectId: milestone.projectId,
      title: milestone.title,
      owner: milestone.owner,
      status: milestone.status,
      progress: milestone.progress,
      amount: milestone.amount || 0,
      dueDate: milestone.dueDate,
      nextAction: milestone.nextAction,
      billingEventStatus: milestone.billingEventStatus,
    });
    setEditingMilestone({ projectId: milestone.projectId, milestoneId: milestone.id });
    setMilestoneError("");
    setShowForm(true);
  };

  const handleExport = () => {
    onExport([
      ["Project ID", "Project", "Client ID", "Client", "Milestone ID", "Title", "Owner", "Status", "Progress", "Due Date", "Amount", "Billing Event", "Completed At", "Next Action"],
      ...filteredMilestones.map((milestone) => [
        milestone.projectId,
        milestone.projectName,
        milestone.clientId,
        milestone.client,
        milestone.id,
        milestone.title,
        milestone.owner,
        milestone.status,
        milestone.progress,
        milestone.dueDate,
        milestone.amount || 0,
        milestone.billingEventStatus,
        milestone.completedAt || "",
        milestone.nextAction,
      ]),
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <ActionButton icon={Download} label="Export" variant="outline" onClick={handleExport} />
        <ActionButton icon={Filter} label="Clear Filters" variant="outline" onClick={() => { setSearchTerm(""); setProjectFilter("All"); setStatusFilter("All"); setBillingFilter("All"); }} />
        <ActionButton icon={Plus} label="New Milestone" variant="accent" onClick={() => { resetMilestoneForm(); setShowForm(true); }} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Milestones" value={String(activeMilestones.length)} helper={`${completedMilestones} completed`} icon={Flag} />
        <MetricCard label="Ready Billing" value={String(readyForBilling).padStart(2, "0")} helper="Completion created project billing event" icon={BadgeIndianRupee} />
        <MetricCard label="Overdue" value={String(overdueMilestones).padStart(2, "0")} helper="Past due and not completed" icon={AlertTriangle} />
        <MetricCard label="Queue Items" value={String(billingEvents.length).padStart(2, "0")} helper="Backend-ready billing event drafts" icon={ClipboardList} />
      </div>

      {showForm ? (
        <Panel title={editingMilestone ? "Edit Milestone" : "Create Milestone"} description="Manage delivery checkpoints with owner, due date, billing amount and next action.">
          {milestoneError ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{milestoneError}</div> : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Project" options={projects.map((project) => `${project.id} - ${project.name}`)} value={milestoneForm.projectId ? `${milestoneForm.projectId} - ${projects.find((project) => project.id === milestoneForm.projectId)?.name || ""}` : ""} onChange={(event: ChangeEvent<HTMLSelectElement>) => setMilestoneForm((current) => ({ ...current, projectId: event.target.value.split(" - ")[0] }))} />
            <Field label="Milestone Title" value={milestoneForm.title} onChange={(event: ChangeEvent<HTMLInputElement>) => setMilestoneForm((current) => ({ ...current, title: event.target.value }))} />
            <Field label="Owner" value={milestoneForm.owner} onChange={(event: ChangeEvent<HTMLInputElement>) => setMilestoneForm((current) => ({ ...current, owner: event.target.value }))} />
            <Field label="Due Date" type="date" value={milestoneForm.dueDate} onChange={(event: ChangeEvent<HTMLInputElement>) => setMilestoneForm((current) => ({ ...current, dueDate: event.target.value }))} />
            <Field label="Status" options={milestoneStatuses} value={milestoneForm.status} onChange={(event: ChangeEvent<HTMLSelectElement>) => setMilestoneForm((current) => ({ ...current, status: event.target.value as MilestoneStatus, progress: event.target.value === "Completed" ? 100 : current.progress }))} />
            <Field label="Progress %" type="number" min={0} max={100} value={milestoneForm.progress} onChange={(event: ChangeEvent<HTMLInputElement>) => setMilestoneForm((current) => ({ ...current, progress: Math.max(0, Math.min(100, Number(event.target.value) || 0)) }))} />
            <Field label="Billing Amount" type="number" min={0} value={milestoneForm.amount} onChange={(event: ChangeEvent<HTMLInputElement>) => setMilestoneForm((current) => ({ ...current, amount: Math.max(0, Number(event.target.value) || 0) }))} />
            <Field label="Billing Event" options={billingEventStatuses} value={milestoneForm.billingEventStatus} onChange={(event: ChangeEvent<HTMLSelectElement>) => setMilestoneForm((current) => ({ ...current, billingEventStatus: event.target.value as BillingEventStatus }))} />
            <div className="md:col-span-4">
              <Field label="Next Action" value={milestoneForm.nextAction} onChange={(event: ChangeEvent<HTMLInputElement>) => setMilestoneForm((current) => ({ ...current, nextAction: event.target.value }))} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
            <ActionButton label="Cancel" variant="outline" onClick={() => { resetMilestoneForm(); setShowForm(false); }} />
            <ActionButton label={editingMilestone ? "Update Milestone" : "Save Milestone"} variant="primary" onClick={handleSave} />
          </div>
        </Panel>
      ) : null}

      <Panel title="Milestone Control Board" description="Track delivery checkpoints, owners, status, billing readiness and next operational action.">
        <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_220px_170px_170px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search milestone, owner, client, project..." className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option value="All">All Projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | MilestoneStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {milestoneStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={billingFilter} onChange={(event) => setBillingFilter(event.target.value as "All" | BillingEventStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {billingEventStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>

        <DataTable columns={["Milestone", "Project / Client", "Owner", "Due / Progress", "Billing", "Next Action", "Actions"]}>
          {filteredMilestones.map((milestone) => (
            <tr key={`${milestone.projectId}-${milestone.id}`} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-6 font-black text-primary">{milestone.title}<br/><span className="text-[10px] text-slate-400 uppercase">{milestone.id}</span></td>
              <td className="px-4 py-6 font-bold text-slate-500 text-sm">{milestone.projectName}<br/><span className="text-[10px] text-slate-400 uppercase">{milestone.clientId} - {milestone.client}</span></td>
              <td className="px-4 py-6 font-black text-primary text-sm">{milestone.owner}<br/><StatusBadge tone={milestoneStatusTone(milestone.status)}>{milestone.status}</StatusBadge></td>
              <td className="px-4 py-6 min-w-48">
                <div className="mb-2 flex justify-between text-[10px] font-black uppercase text-slate-500"><span>{milestone.dueDate}</span><span>{milestone.progress}%</span></div>
                <ProgressBar value={milestone.progress} tone={milestone.status === "Completed" ? "green" : milestone.dueDate < today ? "red" : "blue"} />
              </td>
              <td className="px-4 py-6 font-black text-primary text-sm">{formatCurrency(milestone.amount || 0)}<br/><StatusBadge tone={billingEventTone(milestone.billingEventStatus)}>{milestone.billingEventStatus}</StatusBadge></td>
              <td className="px-4 py-6 max-w-xs text-sm font-semibold text-slate-600">{milestone.nextAction}</td>
              <td className="px-4 py-6">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => handleEdit(milestone)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                    <Edit3 size={14} /> Edit
                  </button>
                  {milestone.status !== "Completed" && milestone.status !== "Archived" ? (
                    <button type="button" onClick={() => onComplete(milestone.projectId, milestone.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-green-700 hover:bg-green-50">
                      <CheckCircle2 size={14} /> Complete
                    </button>
                  ) : null}
                  <button type="button" onClick={() => onArchiveMilestone(milestone.projectId, milestone.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                    <Archive size={14} /> {milestone.status === "Archived" ? "Restore" : "Archive"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        {filteredMilestones.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
            No milestones match the selected filters
          </div>
        ) : null}
      </Panel>

      <Panel title="Project Billing Event Queue" description="Milestone completions create billing-event drafts for backend/API sync without mutating accounting totals.">
        <DataTable columns={["Event", "Project", "Client", "Amount", "Status", "Due"]}>
          {billingEvents.map((event) => (
            <tr key={event.id} className="hover:bg-slate-50">
              <td className="px-4 py-5 font-black text-primary">{event.milestoneTitle}<br/><span className="text-[10px] text-slate-400 uppercase">{event.id}</span></td>
              <td className="px-4 py-5 font-bold text-slate-500 text-sm">{event.projectName}<br/><span className="text-[10px] text-slate-400 uppercase">{event.projectId}</span></td>
              <td className="px-4 py-5 font-bold text-slate-500 text-sm">{event.client}<br/><span className="text-[10px] text-slate-400 uppercase">{event.clientId}</span></td>
              <td className="px-4 py-5 font-black text-primary">{formatCurrency(event.amount)}</td>
              <td className="px-4 py-5"><StatusBadge tone={billingEventTone(event.status)}>{event.status}</StatusBadge></td>
              <td className="px-4 py-5 text-xs font-black text-slate-500">{event.dueDate}</td>
            </tr>
          ))}
        </DataTable>
        {billingEvents.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
            No new billing events queued in this session
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

function WorkloadHeatmap({ projects }: { projects: Project[] }) {
  // Aggregate tasks per member
  const memberWorkload = useMemo(() => {
    const data: Record<string, { tasks: number, names: string[], active: number, overdue: number }> = {};
    const today = new Date().toISOString().split('T')[0];
    
    projects.forEach(p => {
      p.team.forEach(m => {
        if (!data[m.name]) data[m.name] = { tasks: 0, names: [], active: 0, overdue: 0 };
        data[m.name].tasks += 1;
        if (m.status === "Active") data[m.name].active += 1;
        if (m.endDate < today && m.progress < 100) data[m.name].overdue += 1;
      });
    });
    return data;
  }, [projects]);

  return (
    <Panel title="Resource Workload Heatmap" description="Visual intensity of tasks assigned to team members.">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(memberWorkload).map(([name, stats]) => {
             const intensity = stats.overdue > 0 ? "bg-red-50 border-red-100" : stats.active > 2 ? "bg-amber-50 border-amber-100" : "bg-emerald-50 border-emerald-100";
             const iconColor = stats.overdue > 0 ? "text-red-600" : stats.active > 2 ? "text-amber-600" : "text-emerald-600";
             
             return (
               <div key={name} className={`p-6 rounded-[2.5rem] border ${intensity} transition-all hover:shadow-lg`}>
                  <div className="flex justify-between items-start mb-6">
                     <div className={`h-12 w-12 rounded-2xl bg-white flex items-center justify-center ${iconColor} shadow-sm`}>
                        <UserCircle size={24} />
                     </div>
                     <div className="text-right">
                        <p className="text-2xl font-black text-primary">{stats.tasks}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Tasks</p>
                     </div>
                  </div>
                  <h4 className="font-black text-primary truncate">{name}</h4>
                  <div className="mt-4 flex flex-col gap-2">
                     <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-slate-500">Active</span>
                        <span className="text-primary">{stats.active}</span>
                     </div>
                     <ProgressBar value={(stats.active/stats.tasks)*100} tone={stats.overdue > 0 ? "red" : "blue"} />
                     {stats.overdue > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-red-600 animate-pulse">
                           <AlertTriangle size={12} />
                           <span className="text-[10px] font-black uppercase">{stats.overdue} Overdue Task(s)</span>
                        </div>
                     )}
                  </div>
               </div>
             );
          })}
       </div>
    </Panel>
  );
}

function DeadlinesHub({ projects, onExport }: { projects: Project[]; onExport: (rows: Array<Array<string | number>>) => void }) {
  const [manualDeadlines, setManualDeadlines] = useState<DeadlineRecord[]>([]);
  const [showDeadlineForm, setShowDeadlineForm] = useState(false);
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [deadlineForm, setDeadlineForm] = useState<DeadlineFormState>({ ...blankDeadlineForm, projectId: projects[0]?.id || "" });
  const [deadlineError, setDeadlineError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState<"All" | DeadlineSource>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | DeadlineStatus>("All");
  const [priorityFilter, setPriorityFilter] = useState<"All" | DeadlinePriority>("All");

  const systemDeadlines = useMemo<DeadlineRecord[]>(() => {
    const records: DeadlineRecord[] = [];
    const today = new Date().toISOString().slice(0, 10);
    projects.forEach((project) => {
      records.push({
        id: `${project.id}-deadline`,
        projectId: project.id,
        projectName: project.name,
        client: project.client,
        source: "Project",
        title: "Project delivery deadline",
        owner: project.projectOwner,
        dueDate: project.endDate,
        priority: project.health === "Delayed" || project.health === "At Risk" ? "Critical" : "High",
        status: project.status === "Completed" ? "Resolved" : project.status === "Archived" ? "Archived" : "Open",
        nextAction: project.nextAction,
        linkedRecordId: project.id,
      });

      project.milestones.forEach((milestone) => {
        records.push({
          id: `${project.id}-${milestone.id}`,
          projectId: project.id,
          projectName: project.name,
          client: project.client,
          source: "Milestone",
          title: milestone.title,
          owner: milestone.owner,
          dueDate: milestone.dueDate,
          priority: milestone.dueDate < today && milestone.status !== "Completed" ? "Critical" : milestone.status === "In Progress" ? "High" : "Medium",
          status: milestone.status === "Completed" ? "Resolved" : milestone.status === "Archived" ? "Archived" : milestone.status === "In Progress" ? "In Progress" : "Open",
          nextAction: milestone.nextAction,
          linkedRecordId: milestone.id,
        });
      });

      project.team.filter((member) => member.recordType === "task").forEach((member) => {
        records.push({
          id: `${project.id}-${member.id}`,
          projectId: project.id,
          projectName: project.name,
          client: project.client,
          source: "Task",
          title: member.assignedWork,
          owner: member.name,
          dueDate: member.endDate,
          priority: member.priority,
          status: member.status === "Completed" ? "Resolved" : member.progress > 0 ? "In Progress" : "Open",
          nextAction: member.comment || "Review task progress with owner",
          linkedRecordId: member.id,
        });
      });
    });
    return records;
  }, [projects]);

  const backendManualDeadlines = useMemo(() => projects.flatMap((project) => project.deadlines), [projects]);
  const allDeadlines = useMemo(() => {
    const localIds = new Set(manualDeadlines.map((deadline) => deadline.id));
    return [...manualDeadlines, ...backendManualDeadlines.filter((deadline) => !localIds.has(deadline.id)), ...systemDeadlines];
  }, [backendManualDeadlines, manualDeadlines, systemDeadlines]);
  const filteredDeadlines = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return allDeadlines.filter((deadline) => {
      const matchesSearch = !normalizedSearch || [
        deadline.id,
        deadline.title,
        deadline.owner,
        deadline.projectName,
        deadline.client,
        deadline.source,
        deadline.priority,
        deadline.status,
        deadline.nextAction,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesProject = projectFilter === "All" || deadline.projectId === projectFilter;
      const matchesSource = sourceFilter === "All" || deadline.source === sourceFilter;
      const matchesStatus = statusFilter === "All" || deadline.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || deadline.priority === priorityFilter;
      return matchesSearch && matchesProject && matchesSource && matchesStatus && matchesPriority;
    });
  }, [allDeadlines, priorityFilter, projectFilter, searchTerm, sourceFilter, statusFilter]);

  const deadlineWindow = useMemo(() => {
    const current = new Date();
    const next = new Date(current);
    next.setDate(current.getDate() + 7);
    return {
      today: current.toISOString().slice(0, 10),
      nextWeek: next.toISOString().slice(0, 10),
    };
  }, []);
  const { today, nextWeek } = deadlineWindow;
  const activeDeadlines = allDeadlines.filter((deadline) => deadline.status !== "Resolved" && deadline.status !== "Archived");
  const overdueDeadlines = activeDeadlines.filter((deadline) => deadline.dueDate < today).length;
  const criticalDeadlines = activeDeadlines.filter((deadline) => deadline.priority === "Critical").length;
  const nextSevenDays = activeDeadlines.filter((deadline) => deadline.dueDate >= today && deadline.dueDate <= nextWeek).length;

  const resetDeadlineForm = () => {
    setDeadlineForm({ ...blankDeadlineForm, projectId: projects[0]?.id || "" });
    setEditingDeadlineId(null);
    setDeadlineError("");
  };

  const validateDeadline = () => {
    if (!deadlineForm.projectId || !deadlineForm.title.trim() || !deadlineForm.owner.trim() || !deadlineForm.dueDate || !deadlineForm.nextAction.trim()) {
      setDeadlineError("Project, title, owner, due date and next action are required.");
      return false;
    }
    return true;
  };

  const handleSaveDeadline = async () => {
    if (!validateDeadline()) return;
    const project = projects.find((item) => item.id === deadlineForm.projectId);
    if (!project) {
      setDeadlineError("Selected project was not found.");
      return;
    }
    if (!editingDeadlineId) {
      try {
        const savedDeadline = await createProjectDeadline(project.id, {
          title: deadlineForm.title.trim(),
          due_date: deadlineForm.dueDate,
          severity: deadlinePriorityToSeverity(deadlineForm.priority),
          status: deadlineStatusToBackend(deadlineForm.status),
          notes: `${deadlineForm.owner.trim()} - ${deadlineForm.nextAction.trim()}`,
        });
        const record: DeadlineRecord = {
          id: savedDeadline.id,
          projectId: project.id,
          projectName: project.name,
          client: project.client,
          source: "Manual",
          title: savedDeadline.title,
          owner: deadlineForm.owner,
          dueDate: savedDeadline.due_date,
          priority: deadlineForm.priority,
          status: deadlineForm.status,
          nextAction: deadlineForm.nextAction,
          linkedRecordId: savedDeadline.id,
        };
        setManualDeadlines((current) => [record, ...current]);
        resetDeadlineForm();
        setShowDeadlineForm(false);
        return;
      } catch (error) {
        setDeadlineError(error instanceof Error ? error.message : "Unable to save deadline.");
        return;
      }
    }
    try {
      const savedDeadline = await updateProjectDeadline(editingDeadlineId, {
        title: deadlineForm.title.trim(),
        due_date: deadlineForm.dueDate,
        severity: deadlinePriorityToSeverity(deadlineForm.priority),
        status: deadlineStatusToBackend(deadlineForm.status),
        notes: `${deadlineForm.owner.trim()} - ${deadlineForm.nextAction.trim()}`,
      });
      const record: DeadlineRecord = {
        id: savedDeadline.id,
        projectId: project.id,
        projectName: project.name,
        client: project.client,
        source: "Manual",
        title: savedDeadline.title,
        owner: deadlineForm.owner,
        dueDate: savedDeadline.due_date,
        priority: deadlineForm.priority,
        status: deadlineForm.status,
        nextAction: deadlineForm.nextAction,
        linkedRecordId: savedDeadline.id,
      };
      setManualDeadlines((current) => current.some((deadline) => deadline.id === editingDeadlineId) ? current.map((deadline) => deadline.id === editingDeadlineId ? record : deadline) : [record, ...current]);
      resetDeadlineForm();
      setShowDeadlineForm(false);
    } catch (error) {
      setDeadlineError(error instanceof Error ? error.message : "Unable to update deadline.");
    }
  };

  const handleEditDeadline = (deadline: DeadlineRecord) => {
    if (deadline.source !== "Manual") return;
    setDeadlineForm({
      projectId: deadline.projectId,
      title: deadline.title,
      owner: deadline.owner,
      dueDate: deadline.dueDate,
      priority: deadline.priority,
      status: deadline.status,
      nextAction: deadline.nextAction,
    });
    setEditingDeadlineId(deadline.id);
    setDeadlineError("");
    setShowDeadlineForm(true);
  };

  const handleManualStatus = async (deadlineId: string, status: DeadlineStatus) => {
    const deadline = allDeadlines.find((item) => item.id === deadlineId);
    if (!deadline || deadline.source !== "Manual") return;
    const nextAction = status === "Resolved" ? "Resolved by project team" : status === "Archived" ? "Archived from active deadline board" : deadline.nextAction;
    try {
      const savedDeadline = await updateProjectDeadline(deadlineId, {
        title: deadline.title,
        due_date: deadline.dueDate,
        severity: deadlinePriorityToSeverity(deadline.priority),
        status: deadlineStatusToBackend(status),
        notes: `${deadline.owner} - ${nextAction}`,
      });
      const record: DeadlineRecord = {
        ...deadline,
        title: savedDeadline.title,
        dueDate: savedDeadline.due_date,
        priority: deadline.priority,
        status,
        nextAction,
        linkedRecordId: savedDeadline.id,
      };
      setManualDeadlines((current) => current.some((item) => item.id === deadlineId) ? current.map((item) => item.id === deadlineId ? record : item) : [record, ...current]);
    } catch (error) {
      setDeadlineError(error instanceof Error ? error.message : "Unable to update deadline status.");
    }
  };

  const handleExport = () => {
    onExport([
      ["Deadline ID", "Project ID", "Project", "Client", "Source", "Linked Record", "Title", "Owner", "Due Date", "Priority", "Status", "Next Action"],
      ...filteredDeadlines.map((deadline) => [
        deadline.id,
        deadline.projectId,
        deadline.projectName,
        deadline.client,
        deadline.source,
        deadline.linkedRecordId,
        deadline.title,
        deadline.owner,
        deadline.dueDate,
        deadline.priority,
        deadline.status,
        deadline.nextAction,
      ]),
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <ActionButton icon={Download} label="Export" variant="outline" onClick={handleExport} />
        <ActionButton icon={Filter} label="Clear Filters" variant="outline" onClick={() => { setSearchTerm(""); setProjectFilter("All"); setSourceFilter("All"); setStatusFilter("All"); setPriorityFilter("All"); }} />
        <ActionButton icon={Plus} label="New Deadline" variant="accent" onClick={() => { resetDeadlineForm(); setShowDeadlineForm(true); }} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Deadlines" value={String(activeDeadlines.length)} helper={`${filteredDeadlines.length} visible after filters`} icon={Flag} />
        <MetricCard label="Overdue" value={String(overdueDeadlines).padStart(2, "0")} helper="Past due and unresolved" icon={AlertTriangle} />
        <MetricCard label="Critical" value={String(criticalDeadlines).padStart(2, "0")} helper="Marked critical priority" icon={ClipboardList} />
        <MetricCard label="Next 7 Days" value={String(nextSevenDays).padStart(2, "0")} helper={`Due by ${nextWeek}`} icon={CheckCircle2} />
      </div>

      {showDeadlineForm ? (
        <Panel title={editingDeadlineId ? "Edit Manual Deadline" : "Create Manual Deadline"} description="Add client commitments, review dates or delivery checkpoints not already covered by projects, milestones or tasks.">
          {deadlineError ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{deadlineError}</div> : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Project" options={projects.map((project) => `${project.id} - ${project.name}`)} value={deadlineForm.projectId ? `${deadlineForm.projectId} - ${projects.find((project) => project.id === deadlineForm.projectId)?.name || ""}` : ""} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDeadlineForm((current) => ({ ...current, projectId: event.target.value.split(" - ")[0] }))} />
            <Field label="Deadline Title" value={deadlineForm.title} onChange={(event: ChangeEvent<HTMLInputElement>) => setDeadlineForm((current) => ({ ...current, title: event.target.value }))} />
            <Field label="Owner" value={deadlineForm.owner} onChange={(event: ChangeEvent<HTMLInputElement>) => setDeadlineForm((current) => ({ ...current, owner: event.target.value }))} />
            <Field label="Due Date" type="date" value={deadlineForm.dueDate} onChange={(event: ChangeEvent<HTMLInputElement>) => setDeadlineForm((current) => ({ ...current, dueDate: event.target.value }))} />
            <Field label="Priority" options={deadlinePriorities} value={deadlineForm.priority} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDeadlineForm((current) => ({ ...current, priority: event.target.value as DeadlinePriority }))} />
            <Field label="Status" options={deadlineStatuses} value={deadlineForm.status} onChange={(event: ChangeEvent<HTMLSelectElement>) => setDeadlineForm((current) => ({ ...current, status: event.target.value as DeadlineStatus }))} />
            <div className="md:col-span-2">
              <Field label="Next Action" value={deadlineForm.nextAction} onChange={(event: ChangeEvent<HTMLInputElement>) => setDeadlineForm((current) => ({ ...current, nextAction: event.target.value }))} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
            <ActionButton label="Cancel" variant="outline" onClick={() => { resetDeadlineForm(); setShowDeadlineForm(false); }} />
            <ActionButton label={editingDeadlineId ? "Update Deadline" : "Save Deadline"} variant="primary" onClick={handleSaveDeadline} />
          </div>
        </Panel>
      ) : null}

      <Panel title="Deadline Control Board" description="Project, milestone, task and manual deadlines with owner, source, priority and next action.">
        <div className="mb-5 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_210px_150px_170px_150px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search deadline, owner, project, client..." className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option value="All">All Projects</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select value={sourceFilter} onChange={(event) => setSourceFilter(event.target.value as "All" | DeadlineSource)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            <option>Project</option>
            <option>Milestone</option>
            <option>Task</option>
            <option>Manual</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | DeadlineStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {deadlineStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as "All" | DeadlinePriority)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {deadlinePriorities.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
        </div>

        <DataTable columns={["Deadline", "Project / Client", "Owner", "Due Date", "Priority", "Status", "Next Action", "Actions"]}>
          {filteredDeadlines.map((deadline) => (
            <tr key={deadline.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-4 py-6 font-black text-primary">{deadline.title}<br/><span className="text-[10px] text-slate-400 uppercase">{deadline.source} - {deadline.linkedRecordId}</span></td>
              <td className="px-4 py-6 font-bold text-slate-500 text-sm">{deadline.projectName}<br/><span className="text-[10px] text-slate-400 uppercase">{deadline.projectId} - {deadline.client}</span></td>
              <td className="px-4 py-6 font-black text-primary text-sm">{deadline.owner}</td>
              <td className={`px-4 py-6 font-black ${deadline.dueDate < today && deadline.status !== "Resolved" ? "text-red-600" : "text-primary"}`}>{deadline.dueDate}</td>
              <td className="px-4 py-6"><StatusBadge tone={deadlinePriorityTone(deadline.priority)}>{deadline.priority}</StatusBadge></td>
              <td className="px-4 py-6"><StatusBadge tone={deadlineStatusTone(deadline.status)}>{deadline.status}</StatusBadge></td>
              <td className="px-4 py-6 max-w-xs text-sm font-semibold text-slate-600">{deadline.nextAction}</td>
              <td className="px-4 py-6">
                {deadline.source === "Manual" ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleEditDeadline(deadline)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                      <Edit3 size={14} /> Edit
                    </button>
                    <button type="button" onClick={() => handleManualStatus(deadline.id, "Resolved")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-green-700 hover:bg-green-50">
                      <CheckCircle2 size={14} /> Resolve
                    </button>
                    <button type="button" onClick={() => handleManualStatus(deadline.id, deadline.status === "Archived" ? "Open" : "Archived")} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                      <Archive size={14} /> {deadline.status === "Archived" ? "Restore" : "Archive"}
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Linked</span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
        {filteredDeadlines.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
            No deadlines match the selected filters
          </div>
        ) : null}
      </Panel>
    </div>
  );
}

// --- Main Hub Component ---

export default function ProjectHub({ activeView = "projects" }: { activeView?: string }) {
  void initialProjects;
  void makeProjectId;
  const [projects, setProjects] = useState<Project[]>([]);
  const [backendUsers, setBackendUsers] = useState<AuthUser[]>([]);
  const [projectHandoffs, setProjectHandoffs] = useState<ProjectHandoffRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendMessage, setBackendMessage] = useState("");
  const [showAddPrj, setShowAddPrj] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>(blankProjectForm);
  const [projectError, setProjectError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | ProjectStatus>("All");
  const [healthFilter, setHealthFilter] = useState<"All" | ProjectHealth>("All");
  const [billingEvents, setBillingEvents] = useState<BillingEventDraft[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadProjects = async () => {
      setIsLoading(true);
      setBackendMessage("");
      try {
        const [projectResponse, userResponse] = await Promise.all([
          listDeliveryProjects(),
          listUsers({ status: "active", limit: 200 }),
        ]);
        const handoffResponse = await listProjectHandoffs();
        if (!isMounted) return;
        setProjects(projectResponse.map(projectFromBackend));
        setBackendUsers(userResponse.data);
        setProjectHandoffs(handoffResponse);
      } catch (error) {
        if (isMounted) setBackendMessage(error instanceof Error ? error.message : "Unable to load delivery projects.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadProjects();
    return () => {
      isMounted = false;
    };
  }, []);

  const exportCsv = (filename: string, rows: Array<Array<string | number>>) => {
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const findBackendUser = (employeeIdOrName: string) => {
    const query = employeeIdOrName.trim().toLowerCase();
    return backendUsers.find((user) =>
      String(user.id) === query ||
      (user.employee_id || "").toLowerCase() === query ||
      (user.full_name || "").toLowerCase() === query ||
      [user.first_name, user.last_name].filter(Boolean).join(" ").toLowerCase() === query ||
      (user.email || "").toLowerCase() === query
    );
  };

  const reloadProjects = async () => {
    const projectResponse = await listDeliveryProjects();
    setProjects(projectResponse.map(projectFromBackend));
  };

  const handleSaveMilestone = async (projectId: string, milestoneId: string | null, milestone: MilestoneFormState) => {
    if (!milestone.title.trim() || !milestone.dueDate) {
      setBackendMessage("Milestone title and due date are required.");
      return;
    }
    if (!milestoneId) {
      try {
        const currentProject = projects.find((project) => project.id === projectId);
        await createProjectMilestone(projectId, {
          title: milestone.title.trim(),
          description: milestone.nextAction.trim(),
          status: uiMilestoneStatusToBackend(milestone.status),
          sequence: (currentProject?.milestones.length || 0) + 1,
          due_date: milestone.dueDate,
          milestone_value: String(milestone.amount || 0),
        });
        await reloadProjects();
        setBackendMessage("Milestone saved to backend.");
        return;
      } catch (error) {
        setBackendMessage(error instanceof Error ? error.message : "Unable to save milestone.");
        return;
      }
    }
    try {
      const currentProject = projects.find((project) => project.id === projectId);
      const currentMilestone = currentProject?.milestones.find((item) => item.id === milestoneId);
      await updateProjectMilestone(milestoneId, {
        title: milestone.title.trim(),
        description: milestone.nextAction.trim(),
        status: uiMilestoneStatusToBackend(milestone.status),
        sequence: currentMilestone ? currentProject!.milestones.findIndex((item) => item.id === milestoneId) + 1 : undefined,
        due_date: milestone.dueDate,
        milestone_value: String(milestone.amount || 0),
      });
      await reloadProjects();
      setBackendMessage("Milestone updated in backend.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to update milestone.");
    }
  };

  const handleArchiveMilestone = async (projectId: string, milestoneId: string) => {
    const project = projects.find((item) => item.id === projectId);
    const milestone = project?.milestones.find((item) => item.id === milestoneId);
    if (!project || !milestone) return;
    const restored = milestone.status === "Archived";
    try {
      await updateProjectMilestone(milestoneId, {
        title: milestone.title,
        description: restored ? "Review restored milestone and confirm owner" : "Archived from active milestone board",
        status: restored ? "planned" : "blocked",
        sequence: project.milestones.findIndex((item) => item.id === milestoneId) + 1,
        due_date: milestone.dueDate,
        milestone_value: String(milestone.amount || 0),
      });
      await reloadProjects();
      setBackendMessage(restored ? "Milestone restored in backend." : "Milestone archived in backend.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to update milestone status.");
    }
  };

  const handleCompleteMilestone = async (projectId: string, milestoneId: string) => {
    const project = projects.find((item) => item.id === projectId);
    const milestone = project?.milestones.find((item) => item.id === milestoneId);
    if (!project || !milestone) return;

    const completedAt = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const shouldQueueBilling = Boolean(milestone.amount && milestone.amount > 0 && milestone.billingEventStatus !== "Billed");
    try {
      await updateProjectMilestone(milestoneId, {
        title: milestone.title,
        description: shouldQueueBilling ? "Review queued billing event and raise invoice from accounting workflow" : "Completion verified; no billing amount configured",
        status: "completed",
        sequence: project.milestones.findIndex((item) => item.id === milestoneId) + 1,
        due_date: milestone.dueDate,
        milestone_value: String(milestone.amount || 0),
      });
      await reloadProjects();
      setBackendMessage("Milestone completed in backend.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to complete milestone.");
      return;
    }

    if (shouldQueueBilling) {
      const existingEventId = `${projectId}-${milestoneId}`;
      setBillingEvents((current) => {
        if (current.some((event) => event.id === existingEventId)) return current;
        return [
          {
            id: existingEventId,
            projectId,
            projectName: project.name,
            clientId: project.clientId,
            client: project.client,
            milestoneId,
            milestoneTitle: milestone.title,
            amount: milestone.amount || 0,
            dueDate,
            status: "Queued",
            createdAt: completedAt,
          },
          ...current,
        ];
      });
    }
  };
  const filteredProjects = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return projects.filter((project) => {
      const matchesSearch = !normalizedSearch || [
        project.id,
        project.name,
        project.client,
        project.clientId,
        project.sourceLeadId,
        project.teamLeader,
        project.projectOwner,
        project.status,
        project.health,
        project.billingStatus,
        project.nextAction,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "All" || project.status === statusFilter;
      const matchesHealth = healthFilter === "All" || project.health === healthFilter;
      return matchesSearch && matchesStatus && matchesHealth;
    });
  }, [healthFilter, projects, searchTerm, statusFilter]);

  const activeProjects = projects.filter((project) => project.status !== "Archived");
  const totalPortfolioValue = activeProjects.reduce((sum, project) => sum + project.totalValue, 0);
  const atRiskProjects = activeProjects.filter((project) => project.health === "At Risk" || project.health === "Delayed").length;
  const openMilestones = activeProjects.reduce((sum, project) => sum + project.milestones.filter((milestone) => milestone.status !== "Completed").length, 0);
  const allocatedMembers = activeProjects.reduce((sum, project) => sum + project.team.length, 0);

  const resetProjectForm = () => {
    setProjectForm(blankProjectForm);
    setEditingProjectId(null);
    setProjectError("");
  };

  const openNewProject = () => {
    resetProjectForm();
    setShowAddPrj(true);
  };

  const handleProjectField = <K extends keyof ProjectFormState>(field: K, value: ProjectFormState[K]) => {
    setProjectForm((current) => ({ ...current, [field]: value }));
  };

  const handleClientSelect = (clientId: string) => {
    const selectedClient = knownClients.find((client) => client.id === clientId);
    setProjectForm((current) => ({ ...current, clientId, client: selectedClient?.name || current.client }));
  };

  const handleProjectHandoffSelect = (handoffId: string) => {
    const handoff = projectHandoffs.find((item) => item.id === handoffId);
    const client = handoff?.client_detail;
    setProjectForm((current) => ({
      ...current,
      projectHandoffId: handoffId,
      name: client?.project_name || current.name,
      clientId: client?.client_number || current.clientId,
      client: client?.company_name || current.client,
      sourceLeadId: client?.source_lead_detail?.lead_number || handoff?.project_code || current.sourceLeadId,
      teamLeader: handoff?.project_manager || current.teamLeader,
      projectOwner: client?.project_owner || handoff?.project_manager || current.projectOwner,
      startDate: handoff?.start_date || current.startDate,
      endDate: handoff?.target_end_date || current.endDate,
      totalValue: Number(client?.value || current.totalValue || 0),
      nextAction: handoff?.kickoff_notes || current.nextAction,
      billingStatus: handoff?.billing_model === "Milestone Based" ? "Milestone Billing" : current.billingStatus,
    }));
  };

  const handleEditProject = (project: Project) => {
    setProjectForm({
      projectHandoffId: "",
      name: project.name,
      clientId: project.clientId,
      client: project.client,
      sourceLeadId: project.sourceLeadId,
      teamLeader: project.teamLeader,
      projectOwner: project.projectOwner,
      status: project.status,
      health: project.health,
      billingStatus: project.billingStatus,
      progress: project.progress,
      startDate: project.startDate,
      endDate: project.endDate,
      totalValue: project.totalValue,
      nextAction: project.nextAction,
    });
    setEditingProjectId(project.id);
    setProjectError("");
    setShowAddPrj(true);
  };

  const handleSaveProject = async () => {
    const requiredFields = [projectForm.name, projectForm.client, projectForm.clientId, projectForm.sourceLeadId, projectForm.teamLeader, projectForm.projectOwner, projectForm.nextAction];
    if (!editingProjectId && !projectForm.projectHandoffId) {
      setProjectError("Select a signed CRM project handoff before creating a delivery project.");
      return;
    }
    if (requiredFields.some((field) => !field.trim())) {
      setProjectError("Project name, client link, source lead, team leader, owner and next action are required.");
      return;
    }
    if (projectForm.totalValue <= 0) {
      setProjectError("Project value must be greater than zero.");
      return;
    }
    if (projectForm.progress < 0 || projectForm.progress > 100) {
      setProjectError("Progress must be between 0 and 100.");
      return;
    }
    if (projectForm.startDate > projectForm.endDate) {
      setProjectError("Project deadline must be after start date.");
      return;
    }

    if (editingProjectId) {
      try {
        await updateDeliveryProject(editingProjectId, {
          name: projectForm.name.trim(),
          description: projectForm.nextAction.trim(),
          status: projectStatusToBackend(projectForm.status),
          health_status: projectHealthToBackend(projectForm.health),
          progress_percent: projectForm.progress,
          start_date: projectForm.startDate,
          target_end_date: projectForm.endDate,
        });
        await reloadProjects();
        setBackendMessage("Project updated in backend.");
      } catch (error) {
        setProjectError(error instanceof Error ? error.message : "Unable to update project.");
        return;
      }
    } else {
      try {
        const manager = findBackendUser(projectForm.teamLeader);
        await createDeliveryProject({
          project_handoff_id: projectForm.projectHandoffId,
          name: projectForm.name.trim(),
          description: projectForm.nextAction.trim(),
          status: projectStatusToBackend(projectForm.status),
          health_status: projectHealthToBackend(projectForm.health),
          project_manager_id: manager?.id ?? null,
          start_date: projectForm.startDate,
          target_end_date: projectForm.endDate,
          progress_percent: projectForm.progress,
          billing_model: projectForm.billingStatus === "Milestone Billing" ? "Milestone Based" : "Fixed Cost",
        });
        await reloadProjects();
        setBackendMessage("Delivery project created from signed handoff.");
      } catch (error) {
        setProjectError(error instanceof Error ? error.message : "Unable to create delivery project.");
        return;
      }
    }
    resetProjectForm();
    setShowAddPrj(false);
  };

  const handleArchiveProject = async (projectId: string) => {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;
    try {
      await updateDeliveryProject(projectId, {
        status: project.status === "Archived" ? "planning" : "cancelled",
        progress_percent: project.progress,
      });
      await reloadProjects();
      setBackendMessage(project.status === "Archived" ? "Project restored." : "Project archived.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to update project status.");
    }
  };

  const handleExportProjects = () => {
    const rows = [
      ["ID", "Name", "Client ID", "Client", "Source Lead", "Leader", "Owner", "Status", "Health", "Billing", "Progress", "Start", "End", "Value", "Members", "Milestones", "Next Action"],
      ...filteredProjects.map((project) => [
        project.id,
        project.name,
        project.clientId,
        project.client,
        project.sourceLeadId,
        project.teamLeader,
        project.projectOwner,
        project.status,
        project.health,
        project.billingStatus,
        project.progress,
        project.startDate,
        project.endDate,
        project.totalValue,
        project.team.length,
        project.milestones.length,
        project.nextAction,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "projects-portfolio.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAddMemberToProject = async (prjId: string, member: NewMemberForm) => {
    if (!member.name.trim() || !member.role.trim() || !member.task.trim() || !member.start || !member.end) return;
    const user = findBackendUser(member.employeeId || member.name);
    if (!user) {
      setBackendMessage("Backend user not found for this employee. Select/create a real backend employee first.");
      return;
    }
    try {
      await assignProjectTeamMember(prjId, {
        user_id: user.id,
        role: teamRoleToBackend(member.role),
        allocation_percent: Math.max(1, Math.min(100, member.progress || 100)),
        start_date: member.start,
        end_date: member.status === "Completed" ? member.end : null,
        notes: member.task || member.comment,
      });
      await createProjectTask(prjId, {
        title: member.task,
        description: member.comment,
        status: member.status === "Completed" ? "done" : "todo",
        priority: uiPriorityToBackend(member.priority),
        assigned_to_id: user.id,
        due_date: member.end,
      });
      await reloadProjects();
      setBackendMessage("Team member and task saved to backend.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to save team assignment.");
    }
  };

  const handleCreateProjectTask = async (prjId: string, member: NewMemberForm) => {
    if (!member.name.trim() || !member.task.trim() || !member.end) return;
    const user = findBackendUser(member.employeeId || member.name);
    if (!user) {
      setBackendMessage("Backend user not found for this task owner. Select/create a real backend employee first.");
      return;
    }
    try {
      await createProjectTask(prjId, {
        title: member.task.trim(),
        description: member.comment.trim(),
        status: member.status === "Completed" ? "done" : member.progress > 0 ? "in_progress" : "todo",
        priority: uiPriorityToBackend(member.priority),
        assigned_to_id: user.id,
        due_date: member.end,
      });
      await reloadProjects();
      setBackendMessage("Task saved to backend.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to save task.");
    }
  };

  const handleSetTeamLeader = async (projectId: string, employeeId: string) => {
    const employee = findBackendUser(employeeId);
    if (!employee) return;
    try {
      const project = projects.find((item) => item.id === projectId);
      await updateDeliveryProject(projectId, { project_manager_id: employee.id });
      await assignProjectTeamMember(projectId, {
        user_id: employee.id,
        role: "team_lead",
        allocation_percent: 100,
        start_date: project?.startDate || undefined,
        end_date: null,
        notes: "Assigned as delivery team leader.",
      });
      await reloadProjects();
      setBackendMessage("Team leader updated in backend.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to update team leader.");
    }
  };

  const handleUpdateMember = async (prjId: string, memberId: string, member: NewMemberForm) => {
    const project = projects.find((item) => item.id === prjId);
    const existingMember = project?.team.find((item) => item.id === memberId);
    const user = existingMember?.backendUserId ? backendUsers.find((item) => item.id === existingMember.backendUserId) : findBackendUser(member.employeeId || member.name);
    if (!user) {
      setBackendMessage("Backend user not found for this team record.");
      return;
    }
    try {
      if (existingMember?.recordType === "assignment") {
        await assignProjectTeamMember(prjId, {
          user_id: user.id,
          role: existingMember.backendRole || teamRoleToBackend(member.role),
          allocation_percent: Math.max(1, Math.min(100, member.progress || 100)),
          start_date: member.start,
          end_date: member.status === "Completed" ? member.end : null,
          notes: member.task || member.comment,
        });
      } else {
        await updateProjectTask(memberId, {
          title: member.task,
          description: member.comment,
          status: member.status === "Completed" ? "done" : member.progress > 0 ? "in_progress" : "todo",
          priority: uiPriorityToBackend(member.priority),
          assigned_to_id: user.id,
          due_date: member.end,
          actual_hours: member.status === "Completed" ? "1.00" : "0.00",
        });
      }
      await reloadProjects();
      setBackendMessage(existingMember?.recordType === "assignment" ? "Team assignment updated in backend." : "Task updated in backend.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to update team record.");
    }
  };

  const handleRemoveMember = async (prjId: string, memberId: string) => {
    const project = projects.find((item) => item.id === prjId);
    const member = project?.team.find((item) => item.id === memberId);
    if (!member) return;
    try {
      if (member.recordType === "assignment") {
        await removeProjectTeamAssignment(memberId);
      } else {
        await deleteProjectTask(memberId);
      }
      await reloadProjects();
      setBackendMessage(member.recordType === "assignment" ? "Team assignment removed from backend." : "Task removed from backend.");
    } catch (error) {
      setBackendMessage(error instanceof Error ? error.message : "Unable to remove team record.");
    }
  };

  const usedHandoffIds = useMemo(
    () => new Set(projects.map((project) => project.sourceHandoffId).filter(Boolean)),
    [projects]
  );
  const availableProjectHandoffs = useMemo(
    () => projectHandoffs.filter((handoff) => !usedHandoffIds.has(handoff.id)),
    [projectHandoffs, usedHandoffIds]
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-4xl font-black text-primary tracking-tight">
            {deliveryProjectPageLabels[activeView] || "Project Portfolio"}
          </h2>
          <p className="text-slate-500 font-medium mt-1 text-lg">
            {deliveryProjectPageDescriptions[activeView] || deliveryProjectPageDescriptions.projects}
          </p>
        </div>
        {activeView === "projects" && (
          <div className="flex flex-wrap gap-3">
            <ActionButton icon={Download} label="Export" variant="outline" onClick={handleExportProjects} />
            <ActionButton icon={Filter} label="Clear Filters" variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter("All"); setHealthFilter("All"); }} />
            <ActionButton icon={Plus} label="New Project" variant="accent" onClick={openNewProject} />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-black text-blue-700">
          Loading backend delivery projects...
        </div>
      ) : null}
      {backendMessage ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 text-sm font-black text-slate-600">
          {backendMessage}
        </div>
      ) : null}

      {activeView === "projects" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Active Projects" value={String(activeProjects.length)} helper={`${allocatedMembers} allocated team members`} icon={Briefcase} />
            <MetricCard label="Portfolio Value" value={formatCurrency(totalPortfolioValue)} helper="Active project contract value" icon={BadgeIndianRupee} />
            <MetricCard label="Open Milestones" value={String(openMilestones)} helper="Not yet marked complete" icon={Flag} />
            <MetricCard label="At Risk" value={String(atRiskProjects).padStart(2, "0")} helper="Health marked at risk/delayed" icon={AlertTriangle} />
          </div>

          <Panel title="Active Project Portfolio" description="Project master list with client, source lead, owner, health, billing and delivery links.">
            <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_190px_170px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search project, client, source lead, owner..." className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
              </div>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | ProjectStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                <option>All</option>
                {projectStatuses.map((status) => <option key={status}>{status}</option>)}
              </select>
              <select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value as "All" | ProjectHealth)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                <option>All</option>
                {projectHealthOptions.map((health) => <option key={health}>{health}</option>)}
              </select>
            </div>
           <DataTable columns={["Project", "Client Link", "Owner", "Status", "Health", "Value", "Team", "Schedule", "Actions"]}>
              {filteredProjects.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                   <td className="px-4 py-6 font-black text-primary">{p.name}<br/><span className="text-[10px] text-slate-400 uppercase">{p.id}</span></td>
                   <td className="px-4 py-6 font-bold text-slate-500 text-sm">{p.client}<br/><span className="text-[10px] text-slate-400 uppercase">{p.clientId} - {p.sourceLeadId}</span></td>
                   <td className="px-4 py-6 font-black text-primary text-sm">{p.teamLeader}<br/><span className="text-[10px] text-slate-400 uppercase">Owner: {p.projectOwner}</span></td>
                   <td className="px-4 py-6"><StatusBadge tone={projectStatusTone(p.status)}>{p.status}</StatusBadge></td>
                   <td className="px-4 py-6"><StatusBadge tone={projectHealthTone(p.health)}>{p.health}</StatusBadge></td>
                   <td className="px-4 py-6 font-black text-primary text-sm">{formatCurrency(p.totalValue)}<br/><span className="text-[10px] text-slate-400 uppercase">{p.billingStatus}</span></td>
                   <td className="px-4 py-6">
                      <div className="flex -space-x-2">
                         {p.team.map(m => <div key={m.id} title={m.name} className="w-8 h-8 rounded-full bg-primary text-white border-2 border-white flex items-center justify-center text-[10px] font-black">{m.name.charAt(0)}</div>)}
                         {p.team.length === 0 && <span className="text-[10px] font-bold text-slate-300 italic">No allocation</span>}
                      </div>
                   </td>
                   <td className="px-4 py-6">
                      <div className="flex flex-col gap-1 text-[10px] font-black uppercase">
                         <span className="text-emerald-600">Start: {p.startDate}</span>
                         <span className="text-red-500 animate-pulse">Deadline: {p.endDate}</span>
                         <span className="text-slate-500">Progress: {p.progress}%</span>
                      </div>
                   </td>
                   <td className="px-4 py-6">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => handleEditProject(p)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                          <Edit3 size={14} /> Edit
                        </button>
                        <button type="button" onClick={() => handleArchiveProject(p.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                          <Archive size={14} /> {p.status === "Archived" ? "Restore" : "Archive"}
                        </button>
                      </div>
                   </td>
                </tr>
              ))}
           </DataTable>
           {filteredProjects.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                No projects match the selected filters
              </div>
           ) : null}
        </Panel>
        </div>
      ) : activeView === "team-tracking" ? (
        <TeamTrackingView
          projects={projects}
          users={backendUsers}
          onAddMember={handleAddMemberToProject}
          onUpdateMember={handleUpdateMember}
          onRemoveMember={handleRemoveMember}
          onSetTeamLeader={handleSetTeamLeader}
        />
      ) : activeView === "tasks" ? (
        <GlobalTasksTracker
          projects={projects}
          users={backendUsers}
          onCreateTask={handleCreateProjectTask}
          onUpdateMember={handleUpdateMember}
          onRemoveMember={handleRemoveMember}
        />
      ) : activeView === "milestones" ? (
        <MilestonesView
          projects={projects}
          billingEvents={billingEvents}
          onSaveMilestone={handleSaveMilestone}
          onArchiveMilestone={handleArchiveMilestone}
          onComplete={handleCompleteMilestone}
          onExport={(rows) => exportCsv("project-milestones.csv", rows)}
        />
      ) : activeView === "deadlines" ? (
        <DeadlinesHub projects={projects} onExport={(rows) => exportCsv("project-deadlines.csv", rows)} />
      ) : (
        <>
          <ProjectTimelineView projects={projects} />
          <div className="mt-10">
            <WorkloadHeatmap projects={projects} />
          </div>
        </>
      )}

      {showAddPrj && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <Panel title={editingProjectId ? "Edit Project" : "Create Project Record"} description="Create a project record with client, source lead, delivery owner, billing status and next action.">
            <button type="button" onClick={() => { resetProjectForm(); setShowAddPrj(false); }} className="absolute right-8 top-8 inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
              <X size={14} /> Close
            </button>
            {projectError ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{projectError}</div> : null}
            <div className="grid grid-cols-1 gap-4 mt-6 md:grid-cols-3">
               {!editingProjectId ? (
                <select value={projectForm.projectHandoffId} onChange={(event) => handleProjectHandoffSelect(event.target.value)} disabled={availableProjectHandoffs.length === 0} className="md:col-span-3 h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10 disabled:bg-slate-100 disabled:text-slate-400">
                  <option value="">{availableProjectHandoffs.length ? "Select available signed CRM project handoff..." : "No available signed CRM project handoff"}</option>
                  {availableProjectHandoffs.map((handoff) => (
                    <option key={handoff.id} value={handoff.id}>
                      {handoff.project_code} - {handoff.client_detail.company_name} - {handoff.client_detail.project_name}
                    </option>
                  ))}
                </select>
               ) : null}
               <input value={projectForm.name} onChange={(event) => handleProjectField("name", event.target.value)} placeholder="Project name" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
               <select value={projectForm.clientId} onChange={(event) => handleClientSelect(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                  <option value="">Select client account...</option>
                  {knownClients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
               </select>
               <input value={projectForm.client} onChange={(event) => handleProjectField("client", event.target.value)} placeholder="Client name / manual client" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
               <input value={projectForm.sourceLeadId} onChange={(event) => handleProjectField("sourceLeadId", event.target.value)} placeholder="Source lead ID" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
               <select value={projectForm.teamLeader} onChange={(event) => handleProjectField("teamLeader", event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                  <option value="">Select team leader...</option>
                  {teamLeaders.map((leader) => <option key={leader}>{leader}</option>)}
               </select>
               <input value={projectForm.projectOwner} onChange={(event) => handleProjectField("projectOwner", event.target.value)} placeholder="Project owner" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
               <select value={projectForm.status} onChange={(event) => handleProjectField("status", event.target.value as ProjectStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                  {projectStatuses.map((status) => <option key={status}>{status}</option>)}
               </select>
               <select value={projectForm.health} onChange={(event) => handleProjectField("health", event.target.value as ProjectHealth)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                  {projectHealthOptions.map((health) => <option key={health}>{health}</option>)}
               </select>
               <select value={projectForm.billingStatus} onChange={(event) => handleProjectField("billingStatus", event.target.value as BillingStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                  {billingStatuses.map((status) => <option key={status}>{status}</option>)}
               </select>
               <input type="number" min="0" max="100" value={projectForm.progress} onChange={(event) => handleProjectField("progress", Math.max(0, Math.min(100, Number(event.target.value) || 0)))} placeholder="Progress %" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
               <input type="number" min="0" value={projectForm.totalValue} onChange={(event) => handleProjectField("totalValue", Math.max(0, Number(event.target.value) || 0))} placeholder="Project value" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
               <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={projectForm.startDate} onChange={(event) => handleProjectField("startDate", event.target.value)} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
                  <input type="date" value={projectForm.endDate} onChange={(event) => handleProjectField("endDate", event.target.value)} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
               </div>
               <input value={projectForm.nextAction} onChange={(event) => handleProjectField("nextAction", event.target.value)} placeholder="Next action" className="md:col-span-3 h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <ActionButton label="Cancel" variant="outline" onClick={() => { resetProjectForm(); setShowAddPrj(false); }} />
              <ActionButton label={editingProjectId ? "Save Changes" : "Confirm"} variant="accent" onClick={handleSaveProject} />
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
