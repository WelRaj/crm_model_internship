"use client";

import {
  AlertTriangle,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Code2,
  Download,
  Filter,
  Flag,
  GitBranch,
  KanbanSquare,
  Layers3,
  ListChecks,
  Milestone,
  Plus,
  Rocket,
  Shield,
  SquareCheck,
  TimerReset,
} from "lucide-react";
import type { ComponentType, ReactNode } from "react";

type ProjectView = "projects" | "tasks" | "milestones" | "deadlines";
type Tone = "blue" | "green" | "amber" | "red" | "purple" | "slate" | "cyan";

const toneClasses: Record<Tone, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

const projects = [
  { id: "PRJ-CRM-102", name: "Apex Loan CRM", client: "Apex Finserve", manager: "Vikram", team: 7, phase: "UAT", progress: 78, budget: "INR 9.4L", due: "26 Jun 2026", health: "Good" },
  { id: "PRJ-MOB-118", name: "Nexa Retail App", client: "Nexa Retail Cloud", manager: "Sunita", team: 9, phase: "Sprint 3", progress: 54, budget: "INR 12.7L", due: "18 Jul 2026", health: "Excellent" },
  { id: "PRJ-FLT-089", name: "Bluebird Fleet Dashboard", client: "Bluebird Logistics", manager: "Rajesh", team: 5, phase: "Support", progress: 91, budget: "INR 3.2L", due: "15 Jun 2026", health: "At Risk" },
  { id: "PRJ-HR-141", name: "Orbit HRMS Discovery", client: "Orbit HR Tech", manager: "Anjali", team: 4, phase: "Discovery", progress: 22, budget: "INR 4.8L", due: "05 Jul 2026", health: "New" },
];

const taskColumns = [
  {
    title: "Backlog",
    tone: "slate" as Tone,
    tasks: [
      { id: "TSK-991", title: "Define loan lead scoring fields", project: "Apex Loan CRM", owner: "Aman", priority: "High", estimate: "6h" },
      { id: "TSK-992", title: "Prepare HRMS module scope", project: "Orbit HRMS", owner: "Neha", priority: "Medium", estimate: "4h" },
    ],
  },
  {
    title: "In Progress",
    tone: "blue" as Tone,
    tasks: [
      { id: "TSK-993", title: "Build collection dashboard widgets", project: "Apex Loan CRM", owner: "Rahul", priority: "High", estimate: "12h" },
      { id: "TSK-994", title: "Mobile app cart API integration", project: "Nexa App", owner: "Swati", priority: "Medium", estimate: "9h" },
    ],
  },
  {
    title: "Review",
    tone: "amber" as Tone,
    tasks: [
      { id: "TSK-995", title: "GST invoice PDF template QA", project: "Apex Loan CRM", owner: "Priya", priority: "High", estimate: "3h" },
    ],
  },
  {
    title: "Done",
    tone: "green" as Tone,
    tasks: [
      { id: "TSK-996", title: "Client onboarding checklist", project: "Nexa App", owner: "DevOps", priority: "Low", estimate: "2h" },
    ],
  },
];

const milestones = [
  { project: "Apex Loan CRM", milestone: "UAT Sign-off", owner: "Vikram", due: "18 Jun 2026", completion: 72, status: "On Track" },
  { project: "Nexa Retail App", milestone: "Beta Release", owner: "Sunita", due: "30 Jun 2026", completion: 48, status: "Watch" },
  { project: "Bluebird Fleet Dashboard", milestone: "Renewal Fixes", owner: "Rajesh", due: "15 Jun 2026", completion: 88, status: "At Risk" },
  { project: "Orbit HRMS Discovery", milestone: "Scope Freeze", owner: "Anjali", due: "21 Jun 2026", completion: 25, status: "New" },
];

const deadlines = [
  { date: "12 Jun", title: "Apex payment gateway demo", project: "Apex Loan CRM", owner: "Rahul", risk: "Medium", type: "Client Demo" },
  { date: "15 Jun", title: "Bluebird bugfix SLA closure", project: "Bluebird Fleet Dashboard", owner: "Rajesh", risk: "High", type: "SLA" },
  { date: "18 Jun", title: "UAT sign-off document", project: "Apex Loan CRM", owner: "Vikram", risk: "High", type: "Milestone" },
  { date: "21 Jun", title: "Orbit discovery report", project: "Orbit HRMS Discovery", owner: "Anjali", risk: "Low", type: "Deliverable" },
  { date: "30 Jun", title: "Nexa beta release", project: "Nexa Retail App", owner: "Sunita", risk: "Medium", type: "Release" },
];

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

function toneForHealth(health: string): Tone {
  if (health === "Excellent") return "green";
  if (health === "Good") return "blue";
  if (health === "At Risk") return "red";
  return "amber";
}

function toneForRisk(risk: string): Tone {
  if (risk === "High") return "red";
  if (risk === "Medium") return "amber";
  return "green";
}

function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "blue" | "amber" | "red" | "purple" }) {
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${colors[tone]}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: ComponentType<{ size?: number }>;
  tone: Tone;
}) {
  const iconBg: Record<Tone, string> = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    slate: "bg-slate-100 text-slate-700",
    cyan: "bg-cyan-100 text-cyan-700",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-primary">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  children,
  variant = "outline",
}: {
  icon: ComponentType<{ size?: number }>;
  children: ReactNode;
  variant?: "primary" | "outline" | "accent";
}) {
  const styles = {
    primary: "bg-primary text-white border-primary",
    outline: "bg-white text-primary border-border hover:bg-slate-50",
    accent: "bg-accent text-primary border-accent hover:bg-accent/90",
  };

  return (
    <button className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all ${styles[variant]}`}>
      <Icon size={16} />
      {children}
    </button>
  );
}

function ProjectsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Projects" value="18" helper="4 critical accounts" icon={Briefcase} tone="blue" />
        <MetricCard label="Delivery Health" value="82%" helper="Weighted project score" icon={Shield} tone="green" />
        <MetricCard label="Open Tasks" value="146" helper="32 due this week" icon={ListChecks} tone="amber" />
        <MetricCard label="At Risk" value="03" helper="Needs manager review" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Project Portfolio</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Client delivery view with phase, team, progress, budget, deadline, and health.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">Client Linked</Badge>
            <Badge tone="purple">Sprint Ready</Badge>
            <Badge tone="green">Billing Aware</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {projects.map((project) => (
            <div key={project.id} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black text-primary">{project.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{project.id} - {project.client}</p>
                </div>
                <Badge tone={toneForHealth(project.health)}>{project.health}</Badge>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{project.phase}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Phase</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{project.team}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Team</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{project.budget}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Budget</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-sm font-black text-primary">{project.due}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Due</p>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} tone={project.health === "At Risk" ? "red" : project.health === "Excellent" ? "green" : "blue"} />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>PM: <span className="text-primary">{project.manager}</span></span>
                <button className="flex items-center gap-1 text-primary">
                  Open Project <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function TasksView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Tasks" value="146" helper="Across 18 projects" icon={SquareCheck} tone="blue" />
        <MetricCard label="In Progress" value="42" helper="Developer active work" icon={Code2} tone="purple" />
        <MetricCard label="Review Queue" value="18" helper="QA / PM review" icon={GitBranch} tone="amber" />
        <MetricCard label="Completed Week" value="64" helper="+16% velocity" icon={CheckCircle2} tone="green" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Task Board</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Delivery kanban for backlog, progress, review, and completed tasks.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          {taskColumns.map((column) => (
            <div key={column.title} className="rounded-2xl border border-border bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between">
                <Badge tone={column.tone}>{column.title}</Badge>
                <span className="text-xs font-black text-slate-400">{column.tasks.length}</span>
              </div>
              <div className="space-y-3">
                {column.tasks.map((task) => (
                  <div key={task.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
                    <p className="text-sm font-black text-primary">{task.title}</p>
                    <p className="mt-2 text-xs font-semibold text-slate-500">{task.project}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-white">
                          {task.owner.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-slate-500">{task.estimate}</span>
                      </div>
                      <Badge tone={task.priority === "High" ? "red" : task.priority === "Medium" ? "amber" : "green"}>{task.priority}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function MilestonesView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Milestones" value="27" helper="Across active projects" icon={Milestone} tone="blue" />
        <MetricCard label="On Track" value="19" helper="No escalation" icon={CheckCircle2} tone="green" />
        <MetricCard label="Watch List" value="05" helper="PM follow-up needed" icon={Clock} tone="amber" />
        <MetricCard label="At Risk" value="03" helper="Client visible impact" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Milestone Tracker</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Track delivery commitments against client-facing checkpoints.</p>
        </div>
        <div className="space-y-4">
          {milestones.map((item) => (
            <div key={`${item.project}-${item.milestone}`} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-black text-primary">{item.milestone}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.project} - Owner: {item.owner}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={item.status === "On Track" ? "green" : item.status === "At Risk" ? "red" : item.status === "Watch" ? "amber" : "blue"}>{item.status}</Badge>
                  <Badge tone="slate">{item.due}</Badge>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>Completion</span>
                  <span>{item.completion}%</span>
                </div>
                <ProgressBar value={item.completion} tone={item.status === "At Risk" ? "red" : item.status === "Watch" ? "amber" : "green"} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function DeadlinesView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Due This Week" value="21" helper="Client and internal" icon={Calendar} tone="blue" />
        <MetricCard label="High Risk" value="04" helper="Escalation required" icon={AlertTriangle} tone="red" />
        <MetricCard label="Release Dates" value="06" helper="Next 30 days" icon={Rocket} tone="purple" />
        <MetricCard label="SLA Deadlines" value="09" helper="Support commitments" icon={TimerReset} tone="amber" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Deadline Calendar</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Upcoming client demos, releases, SLA closures, and deliverable commitments.</p>
        </div>
        <div className="space-y-3">
          {deadlines.map((deadline) => (
            <div key={`${deadline.date}-${deadline.title}`} className="flex flex-col gap-4 rounded-2xl border border-border bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex gap-4">
                <div className="flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-primary text-white">
                  <span className="text-lg font-black">{deadline.date.split(" ")[0]}</span>
                  <span className="text-[10px] font-black uppercase">{deadline.date.split(" ")[1]}</span>
                </div>
                <div>
                  <p className="font-black text-primary">{deadline.title}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">{deadline.project} - Owner: {deadline.owner}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge tone={toneForRisk(deadline.risk)}>{deadline.risk} Risk</Badge>
                <Badge tone="blue">{deadline.type}</Badge>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function ProjectHub({ activeView }: { activeView: ProjectView }) {
  const title = activeView === "projects" ? "Projects" : activeView === "tasks" ? "Tasks" : activeView === "milestones" ? "Milestones" : "Deadlines";
  const description =
    activeView === "projects"
      ? "Delivery portfolio for IT/software projects with client, budget, team, phase, progress and health."
      : activeView === "tasks"
        ? "Kanban-style execution board for project tasks, owners, estimates, priority and review flow."
        : activeView === "milestones"
          ? "Client-facing checkpoints, sign-offs, completion and delivery risk tracking."
          : "Calendar view of demos, releases, SLA commitments and critical delivery dates.";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            {activeView === "projects" ? <Briefcase size={26} /> : activeView === "tasks" ? <KanbanSquare size={26} /> : activeView === "milestones" ? <Flag size={26} /> : <Calendar size={26} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-[#1E293B]">{title}</h2>
              <Badge tone="green">Delivery CRM</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton icon={Download}>Export</ActionButton>
          <ActionButton icon={Filter}>Filter</ActionButton>
          <ActionButton icon={activeView === "tasks" ? SquareCheck : Plus} variant="accent">
            {activeView === "tasks" ? "New Task" : activeView === "milestones" ? "New Milestone" : activeView === "deadlines" ? "Add Deadline" : "New Project"}
          </ActionButton>
        </div>
      </div>

      {activeView === "projects" && <ProjectsView />}
      {activeView === "tasks" && <TasksView />}
      {activeView === "milestones" && <MilestonesView />}
      {activeView === "deadlines" && <DeadlinesView />}

      <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Layers3 className="text-accent" size={24} />
          <h3 className="text-lg font-black">Practical Project Rules</h3>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ["Every project has owner", "PM, client contact, tech lead and QA owner must be visible."],
            ["Milestone linked to billing", "Delivery checkpoints should connect with invoice/payment milestones."],
            ["Risk is visible early", "At-risk dates and blockers should surface before client escalation."],
            ["Tasks end in outcome", "Each task needs owner, estimate, due date, stage and acceptance criteria."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-black">{title}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
