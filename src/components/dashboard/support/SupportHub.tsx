"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  ShieldCheck,
} from "lucide-react";

type TicketPriority = "Low" | "Medium" | "High" | "Critical";
type TicketStatus = "Open" | "In Progress" | "Waiting" | "Resolved";
type SupportTicket = {
  id: string;
  subject: string;
  module: string;
  requester: string;
  priority: TicketPriority;
  status: TicketStatus;
  channel: string;
  owner: string;
  createdAt: string;
  responseDue: string;
  description: string;
};

const initialTickets: SupportTicket[] = [
  {
    id: "SUP-2401",
    subject: "Lead assignment rule review",
    module: "Client Operations",
    requester: "Lead Desk",
    priority: "High",
    status: "In Progress",
    channel: "Internal",
    owner: "Admin Desk",
    createdAt: "2026-07-01 10:20",
    responseDue: "Today 05:00 PM",
    description: "Need to verify calling owner routing and follow-up ownership for new project enquiries.",
  },
  {
    id: "SUP-2402",
    subject: "Payroll export format",
    module: "People Operations",
    requester: "Finance Control",
    priority: "Medium",
    status: "Waiting",
    channel: "Email",
    owner: "People Ops",
    createdAt: "2026-07-02 12:15",
    responseDue: "Tomorrow 11:00 AM",
    description: "Confirm column order before sending payroll CSV to Finance Control.",
  },
  {
    id: "SUP-2403",
    subject: "Invoice approval clarification",
    module: "Finance Control",
    requester: "Accounts Executive",
    priority: "Critical",
    status: "Open",
    channel: "Phone",
    owner: "Finance Admin",
    createdAt: "2026-07-03 09:40",
    responseDue: "Today 12:00 PM",
    description: "Approval owner needs confirmation before invoice can move to sent state.",
  },
];

const blankTicket = {
  subject: "",
  module: "Client Operations",
  requester: "",
  priority: "Medium" as TicketPriority,
  channel: "Internal",
  description: "",
};

function statusTone(status: TicketStatus) {
  if (status === "Resolved") return "border-emerald-100 bg-emerald-50 text-emerald-700";
  if (status === "In Progress") return "border-blue-100 bg-blue-50 text-blue-700";
  if (status === "Waiting") return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-rose-100 bg-rose-50 text-rose-700";
}

function priorityTone(priority: TicketPriority) {
  if (priority === "Critical") return "bg-rose-500";
  if (priority === "High") return "bg-orange-500";
  if (priority === "Medium") return "bg-amber-500";
  return "bg-emerald-500";
}

export default function SupportHub() {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TicketStatus>("All");
  const [form, setForm] = useState(blankTicket);
  const [error, setError] = useState("");

  const filteredTickets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return tickets.filter((ticket) => {
      const matchesStatus = statusFilter === "All" || ticket.status === statusFilter;
      const matchesSearch =
        !normalizedQuery ||
        [ticket.id, ticket.subject, ticket.module, ticket.requester, ticket.owner, ticket.description]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return matchesStatus && matchesSearch;
    });
  }, [tickets, query, statusFilter]);

  const metrics = {
    open: tickets.filter((ticket) => ticket.status !== "Resolved").length,
    critical: tickets.filter((ticket) => ticket.priority === "Critical").length,
    resolved: tickets.filter((ticket) => ticket.status === "Resolved").length,
  };

  const saveTicket = () => {
    if (!form.subject.trim() || !form.requester.trim() || !form.description.trim()) {
      setError("Subject, requester and issue detail are required.");
      return;
    }

    const newTicket: SupportTicket = {
      id: `SUP-${Math.floor(3000 + Math.random() * 6000)}`,
      subject: form.subject,
      module: form.module,
      requester: form.requester,
      priority: form.priority,
      status: "Open",
      channel: form.channel,
      owner: "Support Desk",
      createdAt: new Date().toLocaleString("en-IN"),
      responseDue: form.priority === "Critical" ? "Within 2 hours" : "Next business day",
      description: form.description,
    };

    setTickets((current) => [newTicket, ...current]);
    setForm(blankTicket);
    setShowForm(false);
    setError("");
  };

  const updateStatus = (ticketId: string, status: TicketStatus) => {
    setTickets((current) => current.map((ticket) => (ticket.id === ticketId ? { ...ticket, status } : ticket)));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Support Desk</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Internal Support Desk</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Internal support queue for user issues, module questions, approvals, and operational help.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((current) => !current);
            setError("");
          }}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-xs font-black uppercase tracking-widest text-slate-950 shadow-sm"
        >
          <Plus size={16} /> New Ticket
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Metric label="Open Tickets" value={String(metrics.open)} icon={Clock} tone="bg-blue-50 text-blue-700" />
        <Metric label="Critical" value={String(metrics.critical)} icon={AlertTriangle} tone="bg-rose-50 text-rose-700" />
        <Metric label="Resolved" value={String(metrics.resolved)} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black text-primary">Ticket Queue</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Track frontend-support requests without backend dependency.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search tickets..."
                  className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm font-semibold outline-none focus:border-primary focus:bg-white md:w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as "All" | TicketStatus)}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none"
              >
                <option>All</option>
                <option>Open</option>
                <option>In Progress</option>
                <option>Waiting</option>
                <option>Resolved</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-black text-primary">{ticket.id}</span>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(ticket.status)}`}>
                        {ticket.status}
                      </span>
                      <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span className={`h-2 w-2 rounded-full ${priorityTone(ticket.priority)}`} />
                        {ticket.priority}
                      </span>
                    </div>
                    <h4 className="mt-2 text-base font-black text-primary">{ticket.subject}</h4>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{ticket.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>{ticket.module}</span>
                      <span>{ticket.requester}</span>
                      <span>{ticket.channel}</span>
                      <span>Due: {ticket.responseDue}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <SmallButton onClick={() => updateStatus(ticket.id, "In Progress")}>Start</SmallButton>
                    <SmallButton onClick={() => updateStatus(ticket.id, "Waiting")}>Wait</SmallButton>
                    <SmallButton onClick={() => updateStatus(ticket.id, "Resolved")}>Resolve</SmallButton>
                  </div>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-bold text-slate-400">
                No support tickets match the current filters.
              </div>
            ) : null}
          </div>
        </section>

        <div className="space-y-5">
          {showForm ? (
            <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-black text-primary">Create Ticket</h3>
              {error ? <div className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-black text-red-600">{error}</div> : null}
              <div className="mt-5 grid gap-4">
                <Input label="Subject" value={form.subject} onChange={(value) => setForm((current) => ({ ...current, subject: value }))} />
                <Input label="Requester" value={form.requester} onChange={(value) => setForm((current) => ({ ...current, requester: value }))} />
                <Select label="Module" value={form.module} options={["Client Operations", "Lead Desk", "Delivery Projects", "People Operations", "Finance Control", "Growth Marketing", "Admin Control"]} onChange={(value) => setForm((current) => ({ ...current, module: value }))} />
                <Select label="Priority" value={form.priority} options={["Low", "Medium", "High", "Critical"]} onChange={(value) => setForm((current) => ({ ...current, priority: value as TicketPriority }))} />
                <Select label="Channel" value={form.channel} options={["Internal", "Phone", "Email", "WhatsApp"]} onChange={(value) => setForm((current) => ({ ...current, channel: value }))} />
                <Input label="Issue Detail" multiline value={form.description} onChange={(value) => setForm((current) => ({ ...current, description: value }))} />
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="h-11 rounded-xl border border-border bg-white px-4 text-xs font-black uppercase tracking-widest text-primary">
                  Cancel
                </button>
                <button type="button" onClick={saveTicket} className="h-11 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-white">
                  Save Ticket
                </button>
              </div>
            </section>
          ) : null}

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-primary">Quick Help</h3>
            <div className="mt-5 space-y-3">
              {[
                { icon: Phone, title: "Call Support", detail: "+91 98765 43210" },
                { icon: Mail, title: "Email Desk", detail: "support@crmpro.local" },
                { icon: MessageSquare, title: "WhatsApp", detail: "Internal support group" },
                { icon: ShieldCheck, title: "Escalation", detail: "Critical approvals and access issues" },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <item.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-primary">{item.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof HelpCircle; tone: string }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tone}`}>
        <Icon size={21} />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-black text-primary">{value}</p>
      </div>
    </div>
  );
}

function SmallButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="h-9 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
      {children}
    </button>
  );
}

function Input({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} className="w-full rounded-xl border border-border px-3 py-3 text-sm font-semibold text-primary outline-none focus:border-primary" />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:border-primary" />
      )}
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:border-primary">
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
