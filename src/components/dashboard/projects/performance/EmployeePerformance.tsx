"use client";

import React, { useMemo, useState, type ChangeEvent } from "react";
import {
  AccountingPage,
  ActionButton,
  DataTable,
  Field,
  MetricCard,
  Panel,
  ProgressBar,
  StatusBadge,
} from "../../accounting/AccountingComponents";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  Compass,
  Download,
  Edit3,
  Filter,
  LayoutDashboard,
  MessageSquare,
  Search,
  ShieldCheck,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";

type PerformanceStatus = "Top Performer" | "Exceeds Expectations" | "Meets Expectations" | "Needs Improvement" | "Promotion Eligible" | "Archived";
type ReviewCycle = "Q1 2026" | "Q2 2026" | "Q3 2026" | "Q4 2026";
type ReviewStage = "Draft" | "Manager Review" | "HR Review" | "Finalized";
type AttritionRisk = "Low" | "Medium" | "High";

interface PerformanceMetric {
  label: string;
  score: number;
  weight: number;
}

interface OKRRecord {
  objective: string;
  progress: number;
  keyResults: { title: string; progress: number }[];
}

interface FeedbackRecord {
  manager: string;
  peer: string;
  self: string;
}

interface CareerStats {
  promotionReadiness: number;
  attritionRisk: AttritionRisk;
  recommendedTraining: string[];
}

interface EmployeePerformanceRecord {
  id: string;
  employeeId: string;
  name: string;
  dept: string;
  role: string;
  manager: string;
  reviewCycle: ReviewCycle;
  reviewStage: ReviewStage;
  goalsAssigned: number;
  goalsCompleted: number;
  kpiScore: number;
  taskCompletion: number;
  qualityScore: number;
  attendanceScore: number;
  rating: number;
  status: PerformanceStatus;
  lastReviewDate: string;
  nextReviewDate: string;
  managerNotes: string;
  improvementPlan: string;
  metrics: PerformanceMetric[];
  okrs: OKRRecord[];
  feedback: FeedbackRecord;
  career: CareerStats;
}

interface PerformanceFormState {
  employeeId: string;
  name: string;
  dept: string;
  role: string;
  manager: string;
  reviewCycle: ReviewCycle;
  reviewStage: ReviewStage;
  goalsAssigned: number;
  goalsCompleted: number;
  kpiScore: number;
  taskCompletion: number;
  qualityScore: number;
  attendanceScore: number;
  rating: number;
  status: PerformanceStatus;
  lastReviewDate: string;
  nextReviewDate: string;
  managerNotes: string;
  improvementPlan: string;
  promotionReadiness: number;
  attritionRisk: AttritionRisk;
  recommendedTraining: string;
}

const reviewCycles: ReviewCycle[] = ["Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026"];
const reviewStages: ReviewStage[] = ["Draft", "Manager Review", "HR Review", "Finalized"];
const performanceStatuses: PerformanceStatus[] = ["Top Performer", "Exceeds Expectations", "Meets Expectations", "Needs Improvement", "Promotion Eligible", "Archived"];
const attritionRisks: AttritionRisk[] = ["Low", "Medium", "High"];
const departments = ["Engineering", "IT", "Marketing", "Support", "Design", "Sales", "Operations"];

const initialEmployees: EmployeePerformanceRecord[] = [
  {
    id: "PERF-001",
    employeeId: "EMP-101",
    name: "Aarav Sharma",
    dept: "Engineering",
    role: "Senior Backend Engineer",
    manager: "Vikram Singh",
    reviewCycle: "Q2 2026",
    reviewStage: "Manager Review",
    goalsAssigned: 12,
    goalsCompleted: 11,
    kpiScore: 96,
    taskCompletion: 98,
    qualityScore: 4.8,
    attendanceScore: 97,
    rating: 4.8,
    status: "Top Performer",
    lastReviewDate: "2026-04-01",
    nextReviewDate: "2026-07-01",
    managerNotes: "Consistently delivers high-quality work and unblocks backend decisions early.",
    improvementPlan: "Prepare him for tech lead ownership on the next CRM release.",
    metrics: [
      { label: "Sprint Delivery", score: 98, weight: 25 },
      { label: "Code Quality", score: 95, weight: 20 },
      { label: "Bug Resolution", score: 94, weight: 15 },
      { label: "Ownership", score: 97, weight: 20 },
    ],
    okrs: [
      {
        objective: "Scale CRM Infrastructure",
        progress: 85,
        keyResults: [
          { title: "Reduce API latency by 20%", progress: 90 },
          { title: "Implement 99.9% uptime monitoring", progress: 80 },
        ],
      },
    ],
    feedback: {
      manager: "Aarav is proactive and communicates risk before it becomes a blocker.",
      peer: "Great team player, always willing to help with complex debugging.",
      self: "I focused on backend reliability and want more leadership exposure next cycle.",
    },
    career: {
      promotionReadiness: 92,
      attritionRisk: "Low",
      recommendedTraining: ["Leadership Foundations", "Advanced System Design"],
    },
  },
  {
    id: "PERF-002",
    employeeId: "EMP-102",
    name: "Priya Patel",
    dept: "IT",
    role: "Systems Analyst",
    manager: "Neha Gupta",
    reviewCycle: "Q2 2026",
    reviewStage: "HR Review",
    goalsAssigned: 10,
    goalsCompleted: 9,
    kpiScore: 92,
    taskCompletion: 94,
    qualityScore: 4.5,
    attendanceScore: 95,
    rating: 4.4,
    status: "Exceeds Expectations",
    lastReviewDate: "2026-04-05",
    nextReviewDate: "2026-07-05",
    managerNotes: "Strong execution quality and reliable handoffs.",
    improvementPlan: "Add more ownership in cross-team planning.",
    metrics: [
      { label: "Requirement Accuracy", score: 93, weight: 25 },
      { label: "SLA Discipline", score: 91, weight: 20 },
      { label: "Stakeholder Updates", score: 90, weight: 20 },
      { label: "Documentation", score: 94, weight: 15 },
    ],
    okrs: [
      {
        objective: "Improve internal system audit readiness",
        progress: 78,
        keyResults: [
          { title: "Close 90% pending IT controls", progress: 82 },
          { title: "Publish runbook library", progress: 74 },
        ],
      },
    ],
    feedback: {
      manager: "Priya has become dependable for high-detail analysis work.",
      peer: "Clear documents and calm follow-ups.",
      self: "I want to improve planning visibility and stakeholder confidence.",
    },
    career: {
      promotionReadiness: 78,
      attritionRisk: "Low",
      recommendedTraining: ["Stakeholder Management", "Process Automation"],
    },
  },
  {
    id: "PERF-003",
    employeeId: "EMP-103",
    name: "Rohan Verma",
    dept: "Marketing",
    role: "Campaign Specialist",
    manager: "Ananya Iyer",
    reviewCycle: "Q2 2026",
    reviewStage: "Draft",
    goalsAssigned: 8,
    goalsCompleted: 6,
    kpiScore: 82,
    taskCompletion: 85,
    qualityScore: 3.9,
    attendanceScore: 91,
    rating: 3.8,
    status: "Meets Expectations",
    lastReviewDate: "2026-04-02",
    nextReviewDate: "2026-07-02",
    managerNotes: "Good campaign execution, needs tighter attribution hygiene.",
    improvementPlan: "Weekly UTM review and post-campaign reporting checklist.",
    metrics: [
      { label: "Campaign Delivery", score: 84, weight: 25 },
      { label: "Lead Quality", score: 79, weight: 25 },
      { label: "Reporting Discipline", score: 78, weight: 20 },
      { label: "Creative Testing", score: 86, weight: 15 },
    ],
    okrs: [
      {
        objective: "Improve paid campaign quality",
        progress: 68,
        keyResults: [
          { title: "Raise MQL rate by 10%", progress: 62 },
          { title: "Publish weekly ROI view", progress: 74 },
        ],
      },
    ],
    feedback: {
      manager: "Rohan has good pace but needs cleaner analysis habits.",
      peer: "Responsive and creative, sometimes late on reporting details.",
      self: "I need a stronger system for campaign review and source cleanup.",
    },
    career: {
      promotionReadiness: 58,
      attritionRisk: "Medium",
      recommendedTraining: ["Performance Analytics", "CRM Attribution Basics"],
    },
  },
  {
    id: "PERF-004",
    employeeId: "EMP-104",
    name: "Kabir Khan",
    dept: "Support",
    role: "Customer Support Executive",
    manager: "Meera Reddy",
    reviewCycle: "Q2 2026",
    reviewStage: "Manager Review",
    goalsAssigned: 10,
    goalsCompleted: 5,
    kpiScore: 68,
    taskCompletion: 70,
    qualityScore: 3.2,
    attendanceScore: 84,
    rating: 2.8,
    status: "Needs Improvement",
    lastReviewDate: "2026-04-10",
    nextReviewDate: "2026-06-30",
    managerNotes: "Ticket closure and escalation quality need immediate attention.",
    improvementPlan: "30-day coaching plan with daily QA sampling and weekly manager review.",
    metrics: [
      { label: "Ticket Closure", score: 68, weight: 25 },
      { label: "CSAT Quality", score: 62, weight: 25 },
      { label: "Escalation Hygiene", score: 64, weight: 20 },
      { label: "Attendance Reliability", score: 84, weight: 15 },
    ],
    okrs: [
      {
        objective: "Stabilize support quality",
        progress: 42,
        keyResults: [
          { title: "Reach 85% QA score", progress: 38 },
          { title: "Reduce reopen rate by 20%", progress: 46 },
        ],
      },
    ],
    feedback: {
      manager: "Kabir needs a structured improvement plan and closer follow-up.",
      peer: "Helpful when available, but ticket notes need more detail.",
      self: "I need support with prioritization and escalation notes.",
    },
    career: {
      promotionReadiness: 34,
      attritionRisk: "High",
      recommendedTraining: ["Ticket Quality", "Customer Escalation Handling"],
    },
  },
  {
    id: "PERF-005",
    employeeId: "EMP-105",
    name: "Ishita Sharma",
    dept: "Design",
    role: "Product Designer",
    manager: "Priya Nair",
    reviewCycle: "Q2 2026",
    reviewStage: "Finalized",
    goalsAssigned: 9,
    goalsCompleted: 8,
    kpiScore: 90,
    taskCompletion: 92,
    qualityScore: 4.6,
    attendanceScore: 96,
    rating: 4.5,
    status: "Promotion Eligible",
    lastReviewDate: "2026-04-06",
    nextReviewDate: "2026-07-06",
    managerNotes: "Strong product sense and mature review participation.",
    improvementPlan: "Pair with engineering leads earlier during solution discovery.",
    metrics: [
      { label: "Design Quality", score: 94, weight: 25 },
      { label: "Research Coverage", score: 88, weight: 20 },
      { label: "Delivery Timeliness", score: 90, weight: 20 },
      { label: "Stakeholder Alignment", score: 89, weight: 20 },
    ],
    okrs: [
      {
        objective: "Improve CRM usability for repeated workflows",
        progress: 82,
        keyResults: [
          { title: "Ship reusable workflow patterns", progress: 86 },
          { title: "Complete five usability reviews", progress: 78 },
        ],
      },
    ],
    feedback: {
      manager: "Ishita is ready for larger product ownership.",
      peer: "Thoughtful designer with practical tradeoffs.",
      self: "I want to lead the next CRM workflow design cycle end to end.",
    },
    career: {
      promotionReadiness: 88,
      attritionRisk: "Low",
      recommendedTraining: ["Product Strategy", "Design Leadership"],
    },
  },
];

const blankPerformanceForm: PerformanceFormState = {
  employeeId: "",
  name: "",
  dept: "Engineering",
  role: "",
  manager: "",
  reviewCycle: "Q2 2026",
  reviewStage: "Draft",
  goalsAssigned: 0,
  goalsCompleted: 0,
  kpiScore: 0,
  taskCompletion: 0,
  qualityScore: 0,
  attendanceScore: 0,
  rating: 0,
  status: "Meets Expectations",
  lastReviewDate: "2026-06-23",
  nextReviewDate: "2026-07-23",
  managerNotes: "",
  improvementPlan: "",
  promotionReadiness: 0,
  attritionRisk: "Low",
  recommendedTraining: "",
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function statusTone(status: PerformanceStatus): "green" | "blue" | "amber" | "red" | "purple" | "slate" {
  if (status === "Top Performer") return "green";
  if (status === "Exceeds Expectations") return "blue";
  if (status === "Promotion Eligible") return "purple";
  if (status === "Needs Improvement") return "red";
  if (status === "Archived") return "slate";
  return "amber";
}

function stageTone(stage: ReviewStage): "green" | "blue" | "amber" | "red" | "purple" | "slate" {
  if (stage === "Finalized") return "green";
  if (stage === "HR Review") return "purple";
  if (stage === "Manager Review") return "blue";
  return "amber";
}

function riskTone(risk: AttritionRisk): "green" | "blue" | "amber" | "red" | "purple" | "slate" {
  if (risk === "High") return "red";
  if (risk === "Medium") return "amber";
  return "green";
}

function toForm(record: EmployeePerformanceRecord): PerformanceFormState {
  return {
    employeeId: record.employeeId,
    name: record.name,
    dept: record.dept,
    role: record.role,
    manager: record.manager,
    reviewCycle: record.reviewCycle,
    reviewStage: record.reviewStage,
    goalsAssigned: record.goalsAssigned,
    goalsCompleted: record.goalsCompleted,
    kpiScore: record.kpiScore,
    taskCompletion: record.taskCompletion,
    qualityScore: record.qualityScore,
    attendanceScore: record.attendanceScore,
    rating: record.rating,
    status: record.status,
    lastReviewDate: record.lastReviewDate,
    nextReviewDate: record.nextReviewDate,
    managerNotes: record.managerNotes,
    improvementPlan: record.improvementPlan,
    promotionReadiness: record.career.promotionReadiness,
    attritionRisk: record.career.attritionRisk,
    recommendedTraining: record.career.recommendedTraining.join(", "),
  };
}

function buildRecord(form: PerformanceFormState, existing?: EmployeePerformanceRecord): EmployeePerformanceRecord {
  const goalProgress = form.goalsAssigned > 0 ? Math.round((form.goalsCompleted / form.goalsAssigned) * 100) : 0;
  return {
    id: existing?.id || `PERF-${Date.now()}`,
    employeeId: form.employeeId,
    name: form.name,
    dept: form.dept,
    role: form.role,
    manager: form.manager,
    reviewCycle: form.reviewCycle,
    reviewStage: form.reviewStage,
    goalsAssigned: form.goalsAssigned,
    goalsCompleted: form.goalsCompleted,
    kpiScore: form.kpiScore,
    taskCompletion: form.taskCompletion,
    qualityScore: form.qualityScore,
    attendanceScore: form.attendanceScore,
    rating: form.rating,
    status: form.status,
    lastReviewDate: form.lastReviewDate,
    nextReviewDate: form.nextReviewDate,
    managerNotes: form.managerNotes,
    improvementPlan: form.improvementPlan,
    metrics: existing?.metrics || [
      { label: "Goal Completion", score: clamp(goalProgress, 0, 100), weight: 25 },
      { label: "Task Delivery", score: form.taskCompletion, weight: 25 },
      { label: "KPI Outcome", score: form.kpiScore, weight: 25 },
      { label: "Attendance", score: form.attendanceScore, weight: 10 },
    ],
    okrs: existing?.okrs || [
      {
        objective: `${form.reviewCycle} performance objectives`,
        progress: clamp(Math.round((goalProgress + form.kpiScore) / 2), 0, 100),
        keyResults: [
          { title: "Complete assigned goals", progress: clamp(goalProgress, 0, 100) },
          { title: "Maintain KPI score", progress: form.kpiScore },
        ],
      },
    ],
    feedback: existing?.feedback || {
      manager: form.managerNotes || "Manager review pending.",
      peer: "Peer feedback pending.",
      self: "Self assessment pending.",
    },
    career: {
      promotionReadiness: form.promotionReadiness,
      attritionRisk: form.attritionRisk,
      recommendedTraining: form.recommendedTraining.split(",").map((item) => item.trim()).filter(Boolean),
    },
  };
}

function ProfileDrawer({
  employee,
  onClose,
  onEdit,
}: {
  employee: EmployeePerformanceRecord;
  onClose: () => void;
  onEdit: (employee: EmployeePerformanceRecord) => void;
}) {
  const [activeTab, setActiveTab] = useState<"kpi" | "okr" | "feedback" | "career">("kpi");

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="h-full w-full max-w-2xl overflow-y-auto border-l border-border bg-white shadow-2xl animate-in slide-in-from-right duration-500">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-white/90 p-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-black leading-tight text-primary">{employee.name}</h2>
              <p className="text-xs font-bold text-slate-500">{employee.employeeId} - {employee.role} - {employee.manager}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge tone={statusTone(employee.status)}>{employee.status}</StatusBadge>
            <button type="button" onClick={() => onEdit(employee)} className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-50">
              <Edit3 size={18} />
            </button>
          </div>
        </div>

        <div className="p-8">
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "KPI Score", value: `${employee.kpiScore}%`, icon: Zap },
              { label: "Rating", value: `${employee.rating}/5`, icon: Star },
              { label: "Goals", value: `${employee.goalsCompleted}/${employee.goalsAssigned}`, icon: Target },
              { label: "Quality", value: String(employee.qualityScore), icon: ShieldCheck },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl border border-border bg-slate-50 p-4 text-center">
                <stat.icon size={16} className="mx-auto mb-2 text-slate-400" />
                <p className="text-lg font-black text-primary">{stat.value}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-8 flex overflow-x-auto border-b border-border">
            {[
              { id: "kpi", label: "KPI Scorecard", icon: LayoutDashboard },
              { id: "okr", label: "Goal Tracking", icon: Target },
              { id: "feedback", label: "360 Feedback", icon: MessageSquare },
              { id: "career", label: "Career Path", icon: Compass },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as "kpi" | "okr" | "feedback" | "career")}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-3 text-sm font-black transition-all ${
                  activeTab === tab.id ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === "kpi" ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-primary">Weighted Metrics</h3>
                  <StatusBadge tone={stageTone(employee.reviewStage)}>{employee.reviewStage}</StatusBadge>
                </div>
                {employee.metrics.map((metric) => (
                  <div key={metric.label} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-slate-600">{metric.label}</span>
                      <span className="font-black text-primary">{metric.score}% <span className="text-[10px] font-black text-slate-400">({metric.weight}%)</span></span>
                    </div>
                    <ProgressBar value={metric.score} tone={metric.score >= 85 ? "green" : metric.score >= 70 ? "blue" : "red"} />
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === "okr" ? (
              <div className="space-y-6">
                {employee.okrs.map((okr) => (
                  <Panel key={okr.objective} title={okr.objective} actions={<span className="font-black text-accent">{okr.progress}%</span>}>
                    <ProgressBar value={okr.progress} tone="blue" />
                    <div className="mt-6 space-y-4">
                      {okr.keyResults.map((kr, index) => (
                        <div key={kr.title} className="flex items-center gap-4">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">{index + 1}</div>
                          <div className="flex-1">
                            <div className="mb-1 flex justify-between text-[10px] font-black uppercase tracking-widest">
                              <span className="text-slate-400">{kr.title}</span>
                              <span className="text-primary">{kr.progress}%</span>
                            </div>
                            <ProgressBar value={kr.progress} tone="green" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Panel>
                ))}
              </div>
            ) : null}

            {activeTab === "feedback" ? (
              <div className="space-y-4">
                {[
                  { label: "Manager Feedback", text: employee.feedback.manager, icon: ShieldCheck },
                  { label: "Peer Review", text: employee.feedback.peer, icon: Users },
                  { label: "Self Assessment", text: employee.feedback.self, icon: Star },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border border-l-4 border-l-accent bg-slate-50 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <item.icon size={16} className="text-slate-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                    </div>
                    <p className="text-sm font-bold leading-relaxed text-slate-600">{item.text}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === "career" ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border bg-slate-50 p-6 text-center">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Promotion Readiness</p>
                    <p className="text-3xl font-black text-primary">{employee.career.promotionReadiness}%</p>
                    <ProgressBar value={employee.career.promotionReadiness} tone="green" />
                  </div>
                  <div className="rounded-2xl border border-border bg-slate-50 p-6 text-center">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Attrition Risk</p>
                    <StatusBadge tone={riskTone(employee.career.attritionRisk)}>{employee.career.attritionRisk}</StatusBadge>
                    <p className="mt-4 text-xs font-bold text-slate-500">Next review: {employee.nextReviewDate}</p>
                  </div>
                </div>
                <div>
                  <h4 className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                    <Zap size={16} className="text-amber-500" /> Recommended Training
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {employee.career.recommendedTraining.map((training) => (
                      <span key={training} className="rounded-lg border border-border bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600">
                        {training}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EmployeePerformance() {
  const [employees, setEmployees] = useState<EmployeePerformanceRecord[]>(initialEmployees);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | PerformanceStatus>("All");
  const [cycleFilter, setCycleFilter] = useState<"All" | ReviewCycle>("All");
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePerformanceRecord | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PerformanceFormState>(blankPerformanceForm);
  const [formError, setFormError] = useState("");

  const filteredEmployees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch = !normalizedSearch || [
        employee.employeeId,
        employee.name,
        employee.dept,
        employee.role,
        employee.manager,
        employee.status,
        employee.reviewStage,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesDept = deptFilter === "All" || employee.dept === deptFilter;
      const matchesStatus = statusFilter === "All" || employee.status === statusFilter;
      const matchesCycle = cycleFilter === "All" || employee.reviewCycle === cycleFilter;
      return matchesSearch && matchesDept && matchesStatus && matchesCycle;
    });
  }, [cycleFilter, deptFilter, employees, searchTerm, statusFilter]);

  const activeEmployees = employees.filter((employee) => employee.status !== "Archived");
  const topPerformers = activeEmployees.filter((employee) => employee.status === "Top Performer").length;
  const needsImprovement = activeEmployees.filter((employee) => employee.status === "Needs Improvement").length;
  const promotionReady = activeEmployees.filter((employee) => employee.status === "Promotion Eligible" || employee.career.promotionReadiness >= 85).length;
  const averageRating = activeEmployees.length ? (activeEmployees.reduce((sum, employee) => sum + employee.rating, 0) / activeEmployees.length).toFixed(1) : "0.0";

  const resetForm = () => {
    setForm(blankPerformanceForm);
    setEditingId(null);
    setFormError("");
  };

  const openNewReview = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditReview = (employee: EmployeePerformanceRecord) => {
    setForm(toForm(employee));
    setEditingId(employee.id);
    setFormError("");
    setShowForm(true);
  };

  const handleField = <K extends keyof PerformanceFormState>(field: K, value: PerformanceFormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    if (!form.employeeId.trim() || !form.name.trim() || !form.dept.trim() || !form.role.trim() || !form.manager.trim() || !form.managerNotes.trim() || !form.improvementPlan.trim()) {
      setFormError("Employee ID, name, department, role, manager, manager notes and improvement plan are required.");
      return false;
    }
    if (employees.some((employee) => employee.employeeId === form.employeeId && employee.id !== editingId)) {
      setFormError("Employee ID already has a performance record.");
      return false;
    }
    if (form.goalsAssigned < form.goalsCompleted) {
      setFormError("Completed goals cannot be greater than assigned goals.");
      return false;
    }
    if ([form.kpiScore, form.taskCompletion, form.attendanceScore, form.promotionReadiness].some((score) => score < 0 || score > 100)) {
      setFormError("Percentage scores must be between 0 and 100.");
      return false;
    }
    if (form.qualityScore < 0 || form.qualityScore > 5 || form.rating < 0 || form.rating > 5) {
      setFormError("Quality score and rating must be between 0 and 5.");
      return false;
    }
    if (form.lastReviewDate > form.nextReviewDate) {
      setFormError("Next review date must be after last review date.");
      return false;
    }
    return true;
  };

  const handleSave = () => {
    if (!validateForm()) return;
    const existing = employees.find((employee) => employee.id === editingId);
    const record = buildRecord(form, existing);
    setEmployees((current) => editingId ? current.map((employee) => employee.id === editingId ? record : employee) : [record, ...current]);
    setSelectedEmployee((current) => current?.id === record.id ? record : current);
    resetForm();
    setShowForm(false);
  };

  const handleArchive = (employeeId: string) => {
    setEmployees((current) =>
      current.map((employee) =>
        employee.id === employeeId
          ? {
              ...employee,
              status: employee.status === "Archived" ? "Meets Expectations" : "Archived",
              reviewStage: employee.status === "Archived" ? employee.reviewStage : "Finalized",
              managerNotes: employee.status === "Archived" ? employee.managerNotes : `${employee.managerNotes} Archived from active performance directory.`,
            }
          : employee
      )
    );
  };

  const handleExport = () => {
    const rows = [
      ["Record ID", "Employee ID", "Name", "Department", "Role", "Manager", "Review Cycle", "Review Stage", "Goals Assigned", "Goals Completed", "KPI Score", "Task Completion", "Quality", "Attendance", "Rating", "Status", "Promotion Readiness", "Attrition Risk", "Last Review", "Next Review", "Manager Notes", "Improvement Plan"],
      ...filteredEmployees.map((employee) => [
        employee.id,
        employee.employeeId,
        employee.name,
        employee.dept,
        employee.role,
        employee.manager,
        employee.reviewCycle,
        employee.reviewStage,
        employee.goalsAssigned,
        employee.goalsCompleted,
        employee.kpiScore,
        employee.taskCompletion,
        employee.qualityScore,
        employee.attendanceScore,
        employee.rating,
        employee.status,
        employee.career.promotionReadiness,
        employee.career.attritionRisk,
        employee.lastReviewDate,
        employee.nextReviewDate,
        employee.managerNotes,
        employee.improvementPlan,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee-performance.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AccountingPage
      title="Employee Performance"
      description="Performance reviews with KPI scores, goals, review stages, feedback, career readiness and improvement planning."
      icon={Trophy}
      badge="Performance Engine"
      actions={
        <>
          <ActionButton icon={Download} label="Export" variant="outline" onClick={handleExport} />
          <ActionButton icon={Target} label="New Review" variant="accent" onClick={openNewReview} />
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Active Reviews" value={String(activeEmployees.length)} helper={`${filteredEmployees.length} visible after filters`} icon={Users} />
        <MetricCard label="Top Performers" value={String(topPerformers).padStart(2, "0")} helper="Current active cycle" icon={Trophy} />
        <MetricCard label="Avg Rating" value={averageRating} helper="Across active records" icon={Star} />
        <MetricCard label="Needs Coaching" value={String(needsImprovement).padStart(2, "0")} helper="PIP or manager review needed" icon={AlertCircle} />
        <MetricCard label="Promotion Ready" value={String(promotionReady).padStart(2, "0")} helper="Status/readiness based" icon={UserPlus} />
      </div>

      <Panel title="Performance Filters" description="Filter by employee, department, review cycle or performance status.">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_180px_220px_170px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input
              type="text"
              placeholder="Search employee, role, manager, status..."
              className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-4 text-sm font-semibold text-primary outline-none transition-all placeholder:text-slate-300 focus:ring-4 focus:ring-primary/10"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
          <select value={deptFilter} onChange={(event) => setDeptFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option value="All">All Departments</option>
            {departments.map((dept) => <option key={dept}>{dept}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | PerformanceStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {performanceStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
          <select value={cycleFilter} onChange={(event) => setCycleFilter(event.target.value as "All" | ReviewCycle)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {reviewCycles.map((cycle) => <option key={cycle}>{cycle}</option>)}
          </select>
        </div>
        <div className="mt-4 flex justify-end">
          <ActionButton icon={Filter} label="Clear Filters" variant="outline" onClick={() => { setSearchTerm(""); setDeptFilter("All"); setStatusFilter("All"); setCycleFilter("All"); }} />
        </div>
      </Panel>

      {showForm ? (
        <Panel title={editingId ? "Edit Performance Review" : "Create Performance Review"} description="Create a review record with scores, stage, manager notes, improvement plan and career signals.">
          <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="absolute right-8 top-8 inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
            <X size={14} /> Close
          </button>
          {formError ? <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{formError}</div> : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Field label="Employee ID" value={form.employeeId} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("employeeId", event.target.value)} />
            <Field label="Employee Name" value={form.name} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("name", event.target.value)} />
            <Field label="Department" options={departments} value={form.dept} onChange={(event: ChangeEvent<HTMLSelectElement>) => handleField("dept", event.target.value)} />
            <Field label="Role" value={form.role} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("role", event.target.value)} />
            <Field label="Manager" value={form.manager} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("manager", event.target.value)} />
            <Field label="Review Cycle" options={reviewCycles} value={form.reviewCycle} onChange={(event: ChangeEvent<HTMLSelectElement>) => handleField("reviewCycle", event.target.value as ReviewCycle)} />
            <Field label="Review Stage" options={reviewStages} value={form.reviewStage} onChange={(event: ChangeEvent<HTMLSelectElement>) => handleField("reviewStage", event.target.value as ReviewStage)} />
            <Field label="Status" options={performanceStatuses} value={form.status} onChange={(event: ChangeEvent<HTMLSelectElement>) => handleField("status", event.target.value as PerformanceStatus)} />
            <Field label="Goals Assigned" type="number" min={0} value={form.goalsAssigned} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("goalsAssigned", Math.max(0, Number(event.target.value) || 0))} />
            <Field label="Goals Completed" type="number" min={0} value={form.goalsCompleted} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("goalsCompleted", Math.max(0, Number(event.target.value) || 0))} />
            <Field label="KPI Score %" type="number" min={0} max={100} value={form.kpiScore} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("kpiScore", clamp(Number(event.target.value) || 0, 0, 100))} />
            <Field label="Task Completion %" type="number" min={0} max={100} value={form.taskCompletion} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("taskCompletion", clamp(Number(event.target.value) || 0, 0, 100))} />
            <Field label="Quality Score" type="number" min={0} max={5} step={0.1} value={form.qualityScore} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("qualityScore", clamp(Number(event.target.value) || 0, 0, 5))} />
            <Field label="Attendance %" type="number" min={0} max={100} value={form.attendanceScore} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("attendanceScore", clamp(Number(event.target.value) || 0, 0, 100))} />
            <Field label="Rating" type="number" min={0} max={5} step={0.1} value={form.rating} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("rating", clamp(Number(event.target.value) || 0, 0, 5))} />
            <Field label="Promotion Readiness %" type="number" min={0} max={100} value={form.promotionReadiness} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("promotionReadiness", clamp(Number(event.target.value) || 0, 0, 100))} />
            <Field label="Attrition Risk" options={attritionRisks} value={form.attritionRisk} onChange={(event: ChangeEvent<HTMLSelectElement>) => handleField("attritionRisk", event.target.value as AttritionRisk)} />
            <Field label="Last Review" type="date" value={form.lastReviewDate} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("lastReviewDate", event.target.value)} />
            <Field label="Next Review" type="date" value={form.nextReviewDate} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("nextReviewDate", event.target.value)} />
            <Field label="Training CSV" value={form.recommendedTraining} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("recommendedTraining", event.target.value)} />
            <div className="md:col-span-2">
              <Field label="Manager Notes" value={form.managerNotes} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("managerNotes", event.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Field label="Improvement Plan" value={form.improvementPlan} onChange={(event: ChangeEvent<HTMLInputElement>) => handleField("improvementPlan", event.target.value)} />
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
            <ActionButton label="Cancel" variant="outline" onClick={() => { resetForm(); setShowForm(false); }} />
            <ActionButton label={editingId ? "Update Review" : "Save Review"} variant="primary" onClick={handleSave} />
          </div>
        </Panel>
      ) : null}

      <Panel title="Performance Directory" description={`${filteredEmployees.length} review records matched.`}>
        <DataTable columns={["Employee", "Dept / Role", "Manager", "Cycle", "Goals", "KPI", "Task", "Quality", "Rating", "Stage", "Status", "Actions"]}>
          {filteredEmployees.map((employee) => (
            <tr key={employee.id} className="text-sm transition-colors hover:bg-slate-50">
              <td className="px-4 py-5">
                <button type="button" onClick={() => setSelectedEmployee(employee)} className="flex items-center gap-3 text-left">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-white shadow-sm">
                    {employee.name.split(" ").map((item) => item[0]).join("")}
                  </div>
                  <div>
                    <p className="font-black text-primary">{employee.name}</p>
                    <p className="text-[10px] font-black uppercase text-slate-400">{employee.employeeId}</p>
                  </div>
                </button>
              </td>
              <td className="px-4 py-5 font-bold text-slate-600">{employee.dept}<br/><span className="text-[10px] font-black uppercase text-slate-400">{employee.role}</span></td>
              <td className="px-4 py-5 font-semibold text-slate-500">{employee.manager}</td>
              <td className="px-4 py-5 font-black text-primary">{employee.reviewCycle}</td>
              <td className="px-4 py-5 text-center"><span className="font-black text-emerald-600">{employee.goalsCompleted}</span><span className="mx-1 text-slate-200">/</span><span className="font-black text-primary">{employee.goalsAssigned}</span></td>
              <td className="px-4 py-5"><StatusBadge tone={employee.kpiScore >= 85 ? "green" : employee.kpiScore >= 70 ? "amber" : "red"}>{employee.kpiScore}%</StatusBadge></td>
              <td className="px-4 py-5 min-w-28"><ProgressBar value={employee.taskCompletion} tone={employee.taskCompletion >= 85 ? "green" : "blue"} /></td>
              <td className="px-4 py-5 text-center font-black text-indigo-600">{employee.qualityScore}</td>
              <td className="px-4 py-5 text-center"><span className="inline-flex items-center gap-1 font-black text-primary"><Star size={12} className="fill-amber-500 text-amber-500" />{employee.rating}</span></td>
              <td className="px-4 py-5"><StatusBadge tone={stageTone(employee.reviewStage)}>{employee.reviewStage}</StatusBadge></td>
              <td className="px-4 py-5"><StatusBadge tone={statusTone(employee.status)}>{employee.status}</StatusBadge></td>
              <td className="px-4 py-5">
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedEmployee(employee)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                    <TrendingUp size={14} /> View
                  </button>
                  <button type="button" onClick={() => openEditReview(employee)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                    <Edit3 size={14} /> Edit
                  </button>
                  <button type="button" onClick={() => handleArchive(employee.id)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                    <Archive size={14} /> {employee.status === "Archived" ? "Restore" : "Archive"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </DataTable>
        {filteredEmployees.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
            No performance records match the selected filters
          </div>
        ) : null}
      </Panel>

      {selectedEmployee ? (
        <ProfileDrawer
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onEdit={(employee) => {
            setSelectedEmployee(null);
            openEditReview(employee);
          }}
        />
      ) : null}
    </AccountingPage>
  );
}
