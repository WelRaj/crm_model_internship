"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Filter,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Target,
  Users,
  Video,
} from "lucide-react";

type FollowUpStatus = "Overdue" | "Due Today" | "Upcoming" | "Completed" | "No Response";
type FollowUpPriority = "High" | "Medium" | "Low";
type FollowUpMode = "Call" | "WhatsApp" | "Email" | "Meeting" | "Video Call";

type FollowUp = {
  id: string;
  client: string;
  contact: string;
  phone: string;
  owner: string;
  mode: FollowUpMode;
  status: FollowUpStatus;
  priority: FollowUpPriority;
  dueDate: string;
  dueTime: string;
  purpose: string;
  lastNote: string;
  leadStage: string;
};

const followUps: FollowUp[] = [
  {
    id: "FU-24091",
    client: "Bluebird Logistics",
    contact: "Amit Soni",
    phone: "+91 97111 88990",
    owner: "Rajesh Kumar",
    mode: "Call",
    status: "Overdue",
    priority: "High",
    dueDate: "10 Jun",
    dueTime: "11:30 AM",
    purpose: "Payment escalation and renewal decision",
    lastNote: "Client asked to reconnect after internal finance discussion.",
    leadStage: "Renewal",
  },
  {
    id: "FU-24092",
    client: "Apex Finserve Pvt Ltd",
    contact: "Rohit Mehta",
    phone: "+91 98765 43210",
    owner: "Vikram Rathore",
    mode: "WhatsApp",
    status: "Due Today",
    priority: "High",
    dueDate: "11 Jun",
    dueTime: "02:00 PM",
    purpose: "Share phase-2 proposal and collect confirmation",
    lastNote: "Founder liked dashboard demo. Needs commercial proposal.",
    leadStage: "Proposal",
  },
  {
    id: "FU-24093",
    client: "Nexa Retail Cloud",
    contact: "Priya Nair",
    phone: "+91 99887 77665",
    owner: "Sunita Sharma",
    mode: "Video Call",
    status: "Due Today",
    priority: "Medium",
    dueDate: "11 Jun",
    dueTime: "04:30 PM",
    purpose: "Mobile app expansion demo",
    lastNote: "CTO wants architecture and timeline clarity.",
    leadStage: "Expansion",
  },
  {
    id: "FU-24094",
    client: "Orbit HR Tech",
    contact: "Neel Kulkarni",
    phone: "+91 90222 54321",
    owner: "Anjali Singh",
    mode: "Email",
    status: "Upcoming",
    priority: "Medium",
    dueDate: "12 Jun",
    dueTime: "10:00 AM",
    purpose: "Send requirements checklist",
    lastNote: "Discovery completed. Waiting for HRMS module priorities.",
    leadStage: "Discovery",
  },
  {
    id: "FU-24095",
    client: "KraftEdge Export LLP",
    contact: "Neha Jain",
    phone: "+91 90999 11122",
    owner: "Rajesh Kumar",
    mode: "Call",
    status: "No Response",
    priority: "Low",
    dueDate: "11 Jun",
    dueTime: "06:00 PM",
    purpose: "Re-open dormant e-commerce inquiry",
    lastNote: "Two WhatsApp messages sent. No response yet.",
    leadStage: "Dormant",
  },
];

const calendarDays = [
  { day: "Mon", date: "09", count: 4, active: false },
  { day: "Tue", date: "10", count: 7, active: false },
  { day: "Wed", date: "11", count: 12, active: true },
  { day: "Thu", date: "12", count: 5, active: false },
  { day: "Fri", date: "13", count: 8, active: false },
  { day: "Sat", date: "14", count: 2, active: false },
  { day: "Sun", date: "15", count: 1, active: false },
];

const activityLog = [
  { time: "11:20 AM", owner: "Rajesh", action: "Call attempted", result: "No answer", client: "Bluebird Logistics" },
  { time: "10:45 AM", owner: "Vikram", action: "WhatsApp sent", result: "Proposal reminder delivered", client: "Apex Finserve" },
  { time: "09:30 AM", owner: "Sunita", action: "Meeting completed", result: "Demo scheduled", client: "Nexa Retail Cloud" },
  { time: "Yesterday", owner: "Anjali", action: "Email sent", result: "Requirements checklist shared", client: "Orbit HR Tech" },
];

function modeIcon(mode: FollowUpMode) {
  if (mode === "Call") return Phone;
  if (mode === "WhatsApp") return MessageCircle;
  if (mode === "Email") return Mail;
  if (mode === "Meeting") return Users;
  return Video;
}

function statusTone(status: FollowUpStatus) {
  if (status === "Overdue") return "border-red-200 bg-red-50 text-red-700";
  if (status === "Due Today") return "border-amber-200 bg-amber-50 text-amber-700";
  if (status === "Completed") return "border-green-200 bg-green-50 text-green-700";
  if (status === "No Response") return "border-slate-200 bg-slate-100 text-slate-600";
  return "border-blue-200 bg-blue-50 text-blue-700";
}

function priorityTone(priority: FollowUpPriority) {
  if (priority === "High") return "bg-red-500";
  if (priority === "Medium") return "bg-amber-500";
  return "bg-green-500";
}

function Badge({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${className}`}>
      {children}
    </span>
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
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-primary">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

export default function FollowUps() {
  const [selectedStatus, setSelectedStatus] = useState<"All" | FollowUpStatus>("All");
  const filteredFollowUps = useMemo(
    () => (selectedStatus === "All" ? followUps : followUps.filter((followUp) => followUp.status === selectedStatus)),
    [selectedStatus]
  );

  const overdueCount = followUps.filter((followUp) => followUp.status === "Overdue").length;
  const todayCount = followUps.filter((followUp) => followUp.status === "Due Today").length;
  const upcomingCount = followUps.filter((followUp) => followUp.status === "Upcoming").length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            <CalendarClock size={26} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#1E293B]">Follow-ups Calendar</h2>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">
              Daily sales command center for calls, WhatsApp reminders, emails, meetings, overdue recovery, and next-action discipline.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-black uppercase tracking-widest text-primary shadow-sm hover:bg-slate-50">
            <Download size={16} /> Export
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-black uppercase tracking-widest text-primary shadow-sm hover:bg-slate-50">
            <Filter size={16} /> Filter
          </button>
          <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-black uppercase tracking-widest text-primary shadow-lg hover:bg-accent/90">
            <Plus size={16} /> New Follow-up
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Due Today" value={String(todayCount)} helper="Needs action before EOD" icon={Clock} tone="bg-amber-100 text-amber-700" />
        <MetricCard label="Overdue" value={String(overdueCount)} helper="Escalate high priority" icon={AlertTriangle} tone="bg-red-100 text-red-700" />
        <MetricCard label="Upcoming" value={String(upcomingCount)} helper="Next 48 hours" icon={Calendar} tone="bg-blue-100 text-blue-700" />
        <MetricCard label="Completion Rate" value="78%" helper="This week" icon={CheckCircle2} tone="bg-green-100 text-green-700" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Week Calendar</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Click a day to review queue, overdue carry-forward, and owner load.</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-primary hover:bg-slate-100">
              <ChevronLeft size={18} />
            </button>
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">June 2026</Badge>
            <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-primary hover:bg-slate-100">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-7">
          {calendarDays.map((day) => (
            <button
              key={day.date}
              type="button"
              className={`rounded-2xl border p-4 text-left transition-all ${
                day.active ? "border-accent bg-accent/10 shadow-md" : "border-border bg-slate-50 hover:border-accent/50"
              }`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{day.day}</p>
              <p className="mt-2 text-3xl font-black text-primary">{day.date}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">{day.count} tasks</span>
                {day.active ? <span className="h-2 w-2 rounded-full bg-accent" /> : null}
              </div>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-lg font-black text-primary">Follow-up Queue</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Prioritized list for sales owners. Every item should end with next action.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["All", "Overdue", "Due Today", "Upcoming", "No Response"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setSelectedStatus(status)}
                  className={`h-9 rounded-xl px-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedStatus === status ? "bg-primary text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredFollowUps.map((followUp) => {
              const ModeIcon = modeIcon(followUp.mode);
              return (
                <div key={followUp.id} className="rounded-2xl border border-border bg-slate-50 p-4 transition-all hover:border-accent/60 hover:bg-white hover:shadow-md">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="relative">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                          <ModeIcon size={20} />
                        </div>
                        <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white ${priorityTone(followUp.priority)}`} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-primary">{followUp.client}</p>
                          <Badge className={statusTone(followUp.status)}>{followUp.status}</Badge>
                          <Badge className="border-slate-200 bg-white text-slate-500">{followUp.leadStage}</Badge>
                        </div>
                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {followUp.contact} - {followUp.phone}
                        </p>
                        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{followUp.purpose}</p>
                        <p className="mt-2 text-xs font-semibold text-slate-400">Last note: {followUp.lastNote}</p>
                      </div>
                    </div>

                    <div className="min-w-44 rounded-xl bg-white p-3 text-sm shadow-sm">
                      <div className="flex items-center gap-2 text-primary">
                        <CalendarClock size={16} />
                        <span className="font-black">{followUp.dueDate}</span>
                      </div>
                      <p className="mt-1 text-xs font-bold text-slate-500">{followUp.dueTime}</p>
                      <p className="mt-3 text-xs font-bold text-slate-500">Owner: <span className="text-primary">{followUp.owner}</span></p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 md:flex">
                    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-white">
                      <Phone size={14} /> Call
                    </button>
                    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black uppercase tracking-widest text-primary shadow-sm">
                      <MessageCircle size={14} /> WhatsApp
                    </button>
                    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black uppercase tracking-widest text-primary shadow-sm">
                      <Mail size={14} /> Email
                    </button>
                    <button className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs font-black uppercase tracking-widest text-primary">
                      <CheckCircle2 size={14} /> Mark Done
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-primary">Quick Log</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Capture outcome and schedule next follow-up.</p>
              </div>
              <Search className="text-slate-300" size={20} />
            </div>
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Outcome</span>
                <select className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-bold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                  <option>Interested</option>
                  <option>Call Back</option>
                  <option>No Response</option>
                  <option>Not Interested</option>
                  <option>Escalate</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Notes</span>
                <textarea className="w-full rounded-xl border border-border px-3 py-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" rows={4} placeholder="Write call summary..." />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Next Date</span>
                  <input type="date" className="h-11 w-full rounded-xl border border-border px-3 text-sm font-bold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
                </label>
                <label className="block space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-widest text-slate-500">Time</span>
                  <input type="time" className="h-11 w-full rounded-xl border border-border px-3 text-sm font-bold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
                </label>
              </div>
              <button className="h-11 w-full rounded-xl bg-accent text-xs font-black uppercase tracking-widest text-primary shadow-lg">
                Save Follow-up
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
            <div className="flex items-center gap-3">
              <Target className="text-accent" size={22} />
              <h3 className="text-lg font-black">Today Plan</h3>
            </div>
            <div className="mt-6 space-y-4">
              {[
                ["High priority first", "Clear overdue and proposal follow-ups before new discovery calls."],
                ["No response rule", "After 3 attempts, move contact to nurture or escalation."],
                ["Every call ends with date", "Never close a follow-up without next date or final outcome."],
              ].map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-black text-white">{title}</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{text}</p>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Activity Log</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Latest communication outcomes for the sales team.</p>
          </div>
          <Badge className="border-green-200 bg-green-50 text-green-700">Live</Badge>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[760px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Time", "Owner", "Client", "Action", "Result"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {activityLog.map((item) => (
                <tr key={`${item.time}-${item.client}`} className="text-sm">
                  <td className="px-4 py-4 font-black text-primary">{item.time}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{item.owner}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{item.client}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{item.action}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{item.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
