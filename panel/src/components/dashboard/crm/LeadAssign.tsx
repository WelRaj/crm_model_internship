"use client";

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { projectLeadSeedData, telecallers, tradingLeadSeedData, type TelecallerId } from "@/components/dashboard/leads/leadTypes";
import { listUsers } from "@/services/accounts-api";
import { type AuthUser } from "@/services/auth-api";
import { assignLead as assignBackendLead, listLeadFollowUps, listLeads, type LeadFollowUpRecord, type LeadRecord } from "@/services/leads-api";

type LeadKind = "Project Lead" | "Trading Lead";
type AssignmentStatus = "Waiting Assignment" | "Assigned" | "Reassigned" | "Escalated" | "Done";
type AssignmentPriority = "High" | "Medium" | "Low";
type LeadFilter = "All" | "Waiting Assignment" | "Assigned" | "Reassigned" | "Escalated" | "Project Lead" | "Trading Lead";

type AssignmentRow = {
  id: string;
  backendId: string;
  leadType: LeadKind;
  customer: string;
  phone: string;
  email: string;
  source: string;
  leadStatus: string;
  detail: string;
  value: number;
  assignedTo: string;
  ownerId: string;
  assignedUserId: number | null;
  assignedEmployeeId: string;
  assignedBy: string;
  teamLeader: string;
  projectOwner: string;
  assignmentStatus: AssignmentStatus;
  priority: AssignmentPriority;
  followUpDate: string;
  createdBy: string;
  note: string;
  lastActivity: string;
};

type AssignmentForm = {
  telecallerId: string;
  assignedUserId: number | null;
  telecallerEmployeeId: string;
  telecallerName: string;
  teamLeader: string;
  priority: AssignmentPriority;
  followUpDate: string;
  note: string;
};

const teamLeaders = ["Rajkumar Rathore (TL-1)", "CRM Manager", "Project Team Lead"];
const telecallerProfiles: Record<TelecallerId, { knowledge: string[]; bestFor: string; shift: string; quality: string }> = {
  "Tele-1": {
    knowledge: ["Account Opening", "KYC", "Trading App Support"],
    bestFor: "Trading support and account opening leads",
    shift: "10:00 AM - 7:00 PM",
    quality: "Fast issue closure",
  },
  "Tele-2": {
    knowledge: ["Project Discovery", "Requirement Calls", "Proposal Follow-up"],
    bestFor: "Project lead qualification and requirement discussion",
    shift: "11:00 AM - 8:00 PM",
    quality: "Strong requirement notes",
  },
  "Tele-3": {
    knowledge: ["WhatsApp Leads", "Callback Handling", "Payment Queries"],
    bestFor: "Busy customers, callbacks and social media leads",
    shift: "9:30 AM - 6:30 PM",
    quality: "High callback recovery",
  },
};

const filters: Array<{ id: LeadFilter; label: string }> = [
  { id: "All", label: "All" },
  { id: "Waiting Assignment", label: "Waiting" },
  { id: "Assigned", label: "Assigned" },
  { id: "Reassigned", label: "Reassigned" },
  { id: "Escalated", label: "Escalated" },
  { id: "Project Lead", label: "Project" },
  { id: "Trading Lead", label: "Trading" },
];

function findTelecallerById(ownerId: string) {
  return telecallers.find((telecaller) => telecaller.id === ownerId);
}

function findTelecallerByInput(value: string) {
  const normalizedValue = value.trim().toLowerCase();
  return telecallers.find((telecaller) =>
    telecaller.name.toLowerCase() === normalizedValue ||
    telecaller.id.toLowerCase() === normalizedValue ||
    telecaller.employeeId.toLowerCase() === normalizedValue ||
    `${telecaller.id} - ${telecaller.employeeId} - ${telecaller.name}`.toLowerCase() === normalizedValue,
  );
}

function employeeIdForOwner(ownerId: string) {
  return findTelecallerById(ownerId)?.employeeId || "";
}

function telecallerAssignmentLabel(name: string, ownerId: string) {
  const employeeId = employeeIdForOwner(ownerId);
  return `${name}${ownerId ? ` (${ownerId} | ${employeeId || "Employee ID pending"})` : ""}`;
}

function makeInitialRows(): AssignmentRow[] {
  const projectRows: AssignmentRow[] = projectLeadSeedData.map((lead, index) => {
    const waiting = index % 5 === 0;
    const priority: AssignmentPriority = index % 3 === 0 ? "High" : index % 3 === 1 ? "Medium" : "Low";

    return {
      id: lead.id,
      backendId: lead.id,
      leadType: "Project Lead",
      customer: `${lead.firstName} ${lead.lastName}`,
      phone: lead.mobile,
      email: lead.email,
      source: lead.source,
      leadStatus: lead.status,
      detail: lead.projectType,
      value: lead.budget,
      assignedTo: waiting ? "Unassigned" : lead.assignedTo,
      ownerId: waiting ? "" : (lead.currentOwnerId as TelecallerId),
      assignedUserId: null,
      assignedEmployeeId: waiting ? "" : employeeIdForOwner(lead.currentOwnerId),
      assignedBy: waiting ? "Pending" : "Rajkumar Rathore (TL-1)",
      teamLeader: "Rajkumar Rathore (TL-1)",
      projectOwner: waiting ? "Not Required" : lead.developmentOwner || "Development Team",
      assignmentStatus: waiting ? "Waiting Assignment" : "Assigned",
      priority,
      followUpDate: lead.followUpDate,
      createdBy: index % 2 === 0 ? "Marketing" : "Admin",
      note: waiting ? "Fresh project lead waiting for leader assignment." : "Assigned for requirement discussion and proposal follow-up.",
      lastActivity: waiting ? "Lead created, assignment pending" : `Assigned to ${telecallerAssignmentLabel(lead.assignedTo, lead.currentOwnerId)}`,
    };
  });

  const tradingRows: AssignmentRow[] = tradingLeadSeedData.map((lead, index) => {
    const waiting = index % 4 === 0;
    const priority: AssignmentPriority = lead.interestLevel === "High" ? "High" : lead.interestLevel === "Medium" ? "Medium" : "Low";

    return {
      id: lead.id,
      backendId: lead.id,
      leadType: "Trading Lead",
      customer: `${lead.firstName} ${lead.lastName}`,
      phone: lead.mobile,
      email: lead.email,
      source: lead.source,
      leadStatus: lead.status,
      detail: lead.issueType || lead.tradingInterest,
      value: lead.budget,
      assignedTo: waiting ? "Unassigned" : lead.assignedTo,
      ownerId: waiting ? "" : (lead.currentOwnerId as TelecallerId),
      assignedUserId: null,
      assignedEmployeeId: waiting ? "" : employeeIdForOwner(lead.currentOwnerId),
      assignedBy: waiting ? "Pending" : "Rajkumar Rathore (TL-1)",
      teamLeader: "Rajkumar Rathore (TL-1)",
      projectOwner: "Not Required",
      assignmentStatus: waiting ? "Waiting Assignment" : "Assigned",
      priority,
      followUpDate: lead.followUpDate,
      createdBy: index % 2 === 0 ? "Website/API" : "Marketing",
      note: waiting ? "Fresh trading lead waiting for calling owner assignment." : "Assigned for account opening, app support, or trading query.",
      lastActivity: waiting ? "Lead created, assignment pending" : `Assigned to ${telecallerAssignmentLabel(lead.assignedTo, lead.currentOwnerId)}`,
    };
  });

  return [...projectRows, ...tradingRows];
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value);
}

function statusTone(status: AssignmentStatus) {
  if (status === "Waiting Assignment") return "bg-amber-50 text-amber-700 border-amber-100";
  if (status === "Assigned") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "Reassigned") return "bg-blue-50 text-blue-700 border-blue-100";
  if (status === "Escalated") return "bg-rose-50 text-rose-700 border-rose-100";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function priorityTone(priority: AssignmentPriority) {
  if (priority === "High") return "bg-rose-50 text-rose-700";
  if (priority === "Medium") return "bg-orange-50 text-orange-700";
  return "bg-slate-100 text-slate-600";
}

function availabilityFromLoad(assignedNow: number) {
  if (assignedNow >= 16) return "Busy";
  if (assignedNow >= 12) return "Limited";
  return "Available";
}

function availabilityTone(availability: string) {
  if (availability === "Available") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (availability === "Limited") return "bg-amber-50 text-amber-700 border-amber-100";
  return "bg-rose-50 text-rose-700 border-rose-100";
}

function userDisplayName(user: AuthUser) {
  return user.full_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || user.mobile || `User ${user.id}`;
}

function backendLeadToAssignmentRow(lead: LeadRecord): AssignmentRow {
  const assignedUser = lead.assigned_to;
  const waiting = !assignedUser;
  return {
    id: lead.lead_number,
    backendId: lead.id,
    leadType: lead.lead_type === "project" ? "Project Lead" : "Trading Lead",
    customer: lead.contact_name || "Unnamed Lead",
    phone: lead.mobile,
    email: lead.email || "N/A",
    source: lead.source || "Direct",
    leadStatus: lead.status,
    detail: lead.lead_type === "project" ? lead.company_name || "Project Enquiry" : lead.requirement_summary || "Trading Enquiry",
    value: Number(lead.estimated_value || 0),
    assignedTo: assignedUser ? userDisplayName(assignedUser) : "Unassigned",
    ownerId: assignedUser ? String(assignedUser.id) : "",
    assignedUserId: assignedUser?.id ?? null,
    assignedEmployeeId: assignedUser?.employee_id || "",
    assignedBy: waiting ? "Pending" : "Backend",
    teamLeader: "CRM Manager",
    projectOwner: lead.lead_type === "project" ? "Project Team" : "Not Required",
    assignmentStatus: waiting ? "Waiting Assignment" : "Assigned",
    priority: Number(lead.estimated_value || 0) >= 200000 ? "High" : "Medium",
    followUpDate: lead.created_at.split("T")[0],
    createdBy: lead.source || "CRM",
    note: lead.requirement_summary || (waiting ? "Lead waiting for owner assignment." : "Lead assigned from backend."),
    lastActivity: waiting ? "Lead created, assignment pending" : `Assigned to ${userDisplayName(assignedUser)}`,
  };
}

function followUpSummary(item: LeadFollowUpRecord) {
  return `${item.channel} / ${item.outcome.replace("_", " ")}`;
}

function formatHistoryTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function LeadAssign() {
  const [rows, setRows] = useState<AssignmentRow[]>(makeInitialRows);
  const [selectedLeadId, setSelectedLeadId] = useState(() => makeInitialRows()[0]?.id || "");
  const [selectedLeadHistory, setSelectedLeadHistory] = useState<LeadFollowUpRecord[]>([]);
  const [activeUsers, setActiveUsers] = useState<AuthUser[]>([]);
  const [activeFilter, setActiveFilter] = useState<LeadFilter>("Waiting Assignment");
  const [search, setSearch] = useState("");
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const [form, setForm] = useState<AssignmentForm>(() => {
    const firstLead = makeInitialRows()[0];
    return {
      telecallerId: firstLead?.ownerId || "",
      assignedUserId: firstLead?.assignedUserId ?? null,
      telecallerEmployeeId: firstLead?.assignedEmployeeId || "",
      telecallerName: firstLead?.assignedTo === "Unassigned" ? "" : firstLead?.assignedTo || "",
      teamLeader: firstLead?.teamLeader || teamLeaders[0],
      priority: firstLead?.priority || "High",
      followUpDate: firstLead?.followUpDate || "2026-07-01",
      note: firstLead?.note || "",
    };
  });

  const loadLeadHistory = async (leadBackendId: string) => {
    try {
      const response = await listLeadFollowUps(leadBackendId);
      setSelectedLeadHistory(response);
    } catch {
      setSelectedLeadHistory([]);
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function loadBackendAssignments() {
      try {
        const leadResponse = await listLeads({ limit: 100 });
        if (!isMounted) return;

        const backendRows = leadResponse.data.map(backendLeadToAssignmentRow);
        setRows(backendRows);
        setSelectedLeadId(backendRows[0]?.id || "");
        if (backendRows[0]) {
          setForm({
            telecallerId: backendRows[0].ownerId,
            assignedUserId: backendRows[0].assignedUserId,
            telecallerEmployeeId: backendRows[0].assignedEmployeeId,
            telecallerName: backendRows[0].assignedTo === "Unassigned" ? "" : backendRows[0].assignedTo,
            teamLeader: backendRows[0].teamLeader,
            priority: backendRows[0].priority,
            followUpDate: backendRows[0].followUpDate,
            note: backendRows[0].note,
          });
          void loadLeadHistory(backendRows[0].backendId);
        }
        setApiError("");

        try {
          const userResponse = await listUsers({ limit: 100, status: "active" });
          if (!isMounted) return;
          setActiveUsers(userResponse.data);
        } catch {
          if (!isMounted) return;
          setActiveUsers([]);
          setApiError("Assignment queue loaded, but active users could not be loaded. Sign in as admin or check user API permission.");
        }
      } catch (error) {
        if (isMounted) setApiError(error instanceof Error ? error.message : "Unable to load assignment queue.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadBackendAssignments();
    return () => {
      isMounted = false;
    };
  }, []);

  const selectedLead = rows.find((lead) => lead.id === selectedLeadId) || rows[0];

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((lead) => {
      const matchesFilter =
        activeFilter === "All" ||
        lead.assignmentStatus === activeFilter ||
        lead.leadType === activeFilter;
      const matchesSearch =
        !query ||
        lead.id.toLowerCase().includes(query) ||
        lead.customer.toLowerCase().includes(query) ||
        lead.phone.includes(query) ||
        lead.source.toLowerCase().includes(query) ||
        lead.ownerId.toLowerCase().includes(query) ||
        lead.assignedEmployeeId.toLowerCase().includes(query) ||
        lead.assignedTo.toLowerCase().includes(query) ||
        lead.detail.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, rows, search]);

  const metrics = useMemo(() => {
    const waiting = rows.filter((lead) => lead.assignmentStatus === "Waiting Assignment").length;
    const assigned = rows.filter((lead) => lead.assignmentStatus === "Assigned" || lead.assignmentStatus === "Reassigned").length;
    const escalated = rows.filter((lead) => lead.assignmentStatus === "Escalated").length;
    const highPriority = rows.filter((lead) => lead.priority === "High").length;

    return { waiting, assigned, escalated, highPriority };
  }, [rows]);

  const workload = useMemo(
    () => {
      if (activeUsers.length > 0) {
        return activeUsers.map((user) => {
          const assignedNow = rows.filter((lead) => lead.assignedUserId === user.id && lead.assignmentStatus !== "Done").length;
          const availability = availabilityFromLoad(assignedNow);
          return {
            id: String(user.id),
            employeeId: user.employee_id || "Employee ID pending",
            name: userDisplayName(user),
            group: user.department || "CRM",
            knowledge: [user.designation || "Lead Assignment", user.department || "Client Operations"],
            bestFor: user.designation || "Lead follow-up and customer handling",
            shift: "Active CRM user",
            quality: user.is_verified ? "Verified account" : "Verification pending",
            assignedNow,
            availability,
            backendUserId: user.id,
          };
        });
      }

      return telecallers.map((telecaller) => {
        const assignedNow = rows.filter((lead) => lead.ownerId === telecaller.id && lead.assignmentStatus !== "Done").length;
        const availability = availabilityFromLoad(assignedNow);
        return {
          ...telecaller,
          ...telecallerProfiles[telecaller.id],
          assignedNow,
          availability,
          backendUserId: null,
        };
      });
    },
    [activeUsers, rows],
  );

  const selectLead = (lead: AssignmentRow) => {
    setSelectedLeadId(lead.id);
    setForm({
      telecallerId: lead.ownerId,
      assignedUserId: lead.assignedUserId,
      telecallerEmployeeId: lead.assignedEmployeeId,
      telecallerName: lead.assignedTo === "Unassigned" ? "" : lead.assignedTo,
      teamLeader: lead.teamLeader,
      priority: lead.priority,
      followUpDate: lead.followUpDate,
      note: lead.note,
    });
    void loadLeadHistory(lead.backendId);
  };

  const assignLead = async () => {
    const typedTelecaller = form.telecallerName.trim();
    if (!selectedLead || !typedTelecaller) return;

    if (activeUsers.length === 0) {
      setApiError("Active backend users are not loaded, so this assignment cannot be saved yet.");
      return;
    }
    const matchedUser = activeUsers.find((user) => user.id === form.assignedUserId) || null;
    const matchedTelecaller = matchedUser ? null : findTelecallerByInput(typedTelecaller);
    if (!matchedUser) {
      setApiError("Choose an active backend user from Calling Owner dropdown.");
      return;
    }

    const assignedName = matchedUser ? userDisplayName(matchedUser) : matchedTelecaller?.name || typedTelecaller;
    const assignedOwnerId = matchedUser ? String(matchedUser.id) : matchedTelecaller?.id || "";
    const assignedUserId = matchedUser?.id ?? null;
    const assignedEmployeeId = matchedUser?.employee_id || matchedTelecaller?.employeeId || "";

    const nextStatus: AssignmentStatus = selectedLead.assignmentStatus === "Waiting Assignment" ? "Assigned" : "Reassigned";
    const nextActivity = `${selectedLead.id} assigned to ${assignedName}${assignedOwnerId ? ` (${assignedOwnerId} | ${assignedEmployeeId})` : ""}`;

    setIsSavingAssignment(true);
    setApiError("");

    try {
      const updatedLead = await assignBackendLead(selectedLead.backendId, { assigned_to_id: assignedUserId });

      setRows((current) =>
        current.map((lead) =>
          lead.id === selectedLead.id
            ? {
                ...lead,
                ...backendLeadToAssignmentRow(updatedLead),
                assignedBy: form.teamLeader,
                teamLeader: form.teamLeader,
                assignmentStatus: nextStatus,
                priority: form.priority,
                followUpDate: form.followUpDate,
                note: form.note || `Assigned by ${form.teamLeader}.`,
                lastActivity: nextActivity,
              }
            : lead,
        ),
      );

      setForm((current) => ({
        ...current,
        telecallerId: assignedOwnerId,
        assignedUserId,
        telecallerEmployeeId: assignedEmployeeId,
        telecallerName: assignedName,
      }));

      await loadLeadHistory(selectedLead.backendId);
    } catch (error) {
      setApiError(error instanceof Error ? error.message : "Unable to assign lead.");
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const markEscalated = () => {
    if (!selectedLead) return;

    setRows((current) =>
      current.map((lead) =>
        lead.id === selectedLead.id
          ? {
              ...lead,
              assignmentStatus: "Escalated",
              assignedBy: form.teamLeader,
              teamLeader: form.teamLeader,
              priority: "High",
              note: form.note || "Escalated for manager review before assignment.",
              lastActivity: "Escalated to manager",
            }
          : lead,
      ),
    );

  };

  const markDone = () => {
    if (!selectedLead) return;

    setRows((current) =>
      current.map((lead) =>
        lead.id === selectedLead.id
          ? {
              ...lead,
              assignmentStatus: "Done",
              lastActivity: "Assignment closed",
              note: form.note || "Assignment work closed.",
            }
          : lead,
      ),
    );

  };

  const exportAssignments = () => {
    const header = ["Lead ID", "Type", "Customer", "Source", "Status", "Calling Owner", "Owner ID", "Employee ID", "Assigned By", "Project Owner", "Priority", "Follow Up", "Note"];
    const csvRows = rows.map((lead) =>
      [
        lead.id,
        lead.leadType,
        lead.customer,
        lead.source,
        lead.assignmentStatus,
        lead.assignedTo,
        lead.ownerId || "Manual",
        lead.assignedEmployeeId || "Not Linked",
        lead.assignedBy,
        lead.projectOwner,
        lead.priority,
        lead.followUpDate,
        lead.note,
      ]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "lead-assignments.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Client Operations</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Lead Assignment</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-secondary">
            Assign each project or trading enquiry to the right calling owner, manager, and follow-up priority without changing the original lead details.
          </p>
        </div>

        <button onClick={exportAssignments} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary shadow-sm transition-all hover:border-primary">
          <Download size={16} /> Export
        </button>
      </div>

      {apiError ? <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{apiError}</div> : null}
      {isLoading ? <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">Loading backend assignment queue...</div> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Waiting Assignment" value={String(metrics.waiting)} helper="Leader action required" icon={Clock} tone="bg-amber-50 text-amber-700" />
        <MetricCard label="Assigned Leads" value={String(metrics.assigned)} helper="Calling queue ready" icon={UserCheck} tone="bg-emerald-50 text-emerald-700" />
        <MetricCard label="Escalated" value={String(metrics.escalated)} helper="Manager review" icon={AlertTriangle} tone="bg-rose-50 text-rose-700" />
        <MetricCard label="High Priority" value={String(metrics.highPriority)} helper="Call first" icon={CalendarClock} tone="bg-blue-50 text-blue-700" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-3">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Assignment Queue</p>
              <h3 className="mt-1 text-xl font-black text-primary">Created Leads Ready For Assignment</h3>
            </div>
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search lead, phone, source..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm font-semibold outline-none transition-all focus:border-primary focus:bg-white"
              />
            </div>
          </div>

          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeFilter === filter.id ? "bg-primary text-white" : "bg-slate-100 text-slate-500 hover:text-primary"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="max-h-[620px] space-y-3 overflow-y-auto pr-1">
            {filteredRows.map((lead) => {
              const isActive = selectedLead?.id === lead.id;
              return (
                <button
                  key={lead.id}
                  onClick={() => selectLead(lead)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isActive ? "border-primary bg-primary/5 shadow-sm" : "border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-black text-primary">{lead.customer}</span>
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(lead.assignmentStatus)}`}>
                          {lead.assignmentStatus}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${priorityTone(lead.priority)}`}>{lead.priority}</span>
                      </div>
                      <p className="mt-2 text-xs font-bold text-secondary">
                        {lead.id} . {lead.leadType} . {lead.source} . {lead.detail}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold text-slate-500">
                        <span className="inline-flex items-center gap-1"><Phone size={13} /> {lead.phone}</span>
                        <span className="inline-flex items-center gap-1"><Mail size={13} /> {lead.email}</span>
                        <span className="inline-flex items-center gap-1"><CalendarClock size={13} /> {lead.followUpDate}</span>
                      </div>
                    </div>
                    <div className="rounded-xl bg-slate-50 px-4 py-3 text-left lg:text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assigned To</p>
                      <p className="mt-1 text-sm font-black text-primary">{lead.assignedTo}</p>
                      <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {lead.ownerId || "Manual"} {lead.assignedEmployeeId ? `| ${lead.assignedEmployeeId}` : "| Not linked"}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-secondary">Value INR {formatMoney(lead.value)}</p>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
                <p className="text-sm font-black text-primary">No lead found</p>
                <p className="mt-1 text-xs font-semibold text-secondary">Change the filter or search term.</p>
              </div>
            ) : null}
          </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Assignment History</p>
                <h3 className="mt-1 text-xl font-black text-primary">Latest Leader Actions</h3>
              </div>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">Visible to manager and team leader</span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <tr>
                    <th className="px-4 py-3">When</th>
                    <th className="px-4 py-3">History</th>
                    <th className="px-4 py-3">Created By</th>
                    <th className="px-4 py-3">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedLeadHistory.slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <p className="font-black text-primary">{formatHistoryTime(item.created_at)}</p>
                      </td>
                      <td className="px-4 py-4 font-bold text-primary">{followUpSummary(item)}</td>
                      <td className="px-4 py-4 font-semibold text-secondary">{item.created_by?.full_name || item.created_by?.email || "Backend"}</td>
                      <td className="px-4 py-4 font-semibold text-secondary">{item.note}</td>
                    </tr>
                  ))}
                  {selectedLeadHistory.length === 0 ? (
                    <tr>
                      <td className="px-4 py-5 text-sm font-semibold text-secondary" colSpan={4}>
                        No backend history for this lead yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="mb-5">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Team Leader Action</p>
              <h3 className="mt-1 text-xl font-black text-primary">Assign Selected Lead</h3>
              <p className="mt-1 text-xs font-semibold text-secondary">{selectedLead?.id} . {selectedLead?.customer}</p>
            </div>

            <div className="space-y-4">
              <Field label="Team Leader / Manager">
                <input
                  value={form.teamLeader}
                  onChange={(event) => setForm((current) => ({ ...current, teamLeader: event.target.value }))}
                  list="team-leader-name-options"
                  placeholder="Type team leader or manager name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
                />
                <datalist id="team-leader-name-options">
                  {teamLeaders.map((leader) => (
                    <option key={leader} value={leader} />
                  ))}
                </datalist>
                <p className="mt-2 text-[11px] font-semibold text-slate-500">Choose a suggestion or type a team leader name manually.</p>
              </Field>

              <Field label="Assign Calling Owner">
                <select
                  value={form.assignedUserId?.toString() || ""}
                  onChange={(event) => {
                    const userId = event.target.value ? Number(event.target.value) : null;
                    const user = activeUsers.find((item) => item.id === userId) || null;
                    setForm((current) => ({
                      ...current,
                      telecallerName: user ? userDisplayName(user) : "",
                      telecallerId: user ? String(user.id) : "",
                      assignedUserId: user?.id ?? null,
                      telecallerEmployeeId: user?.employee_id || "",
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
                >
                  <option value="">Select active backend user</option>
                  {activeUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {userDisplayName(user)} | {user.employee_id || "No employee ID"} | {user.department || "CRM"}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-[11px] font-semibold text-slate-500">
                  This list comes from backend active users. Linked: {form.telecallerId || "Pending"} {form.telecallerEmployeeId ? `| ${form.telecallerEmployeeId}` : "| Employee ID not linked"}
                </p>
                <div className="mt-3 grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-[11px] font-black uppercase tracking-widest text-slate-500 sm:grid-cols-3">
                  <span>Name: {form.telecallerName.trim() || "Pending"}</span>
                  <span>Owner ID: {form.telecallerId || "Manual"}</span>
                  <span>Emp ID: {form.telecallerEmployeeId || "Not Linked"}</span>
                </div>
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Priority">
                  <select
                    value={form.priority}
                    onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as AssignmentPriority }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </Field>

                <Field label="First Follow-up">
                  <input
                    type="date"
                    value={form.followUpDate}
                    onChange={(event) => setForm((current) => ({ ...current, followUpDate: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold outline-none focus:border-primary"
                  />
                </Field>
              </div>

              <Field label="Assignment Note">
                <textarea
                  value={form.note}
                  onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  rows={4}
                  placeholder="Reason, customer need, callback instruction..."
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 outline-none focus:border-primary"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-3">
                <button onClick={assignLead} disabled={!form.assignedUserId || isSavingAssignment} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-all disabled:cursor-not-allowed disabled:bg-slate-300">
                  <UserCheck size={16} /> {isSavingAssignment ? "Saving" : "Assign"}
                </button>
                <button onClick={markEscalated} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-rose-700 transition-all hover:border-rose-200">
                  <AlertTriangle size={16} /> Escalate
                </button>
                <button onClick={markDone} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-emerald-700 transition-all hover:border-emerald-200">
                  <CheckCircle2 size={16} /> Done
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Calling Owner Load</p>
            <h3 className="mt-1 text-xl font-black text-primary">Team Capacity</h3>
            <div className="mt-4 space-y-3">
              {workload.map((member) => (
                <div key={member.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-primary">{member.name}</p>
                      <p className="text-xs font-semibold text-secondary">{member.id} | {member.employeeId} | {member.group}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-primary">{member.assignedNow} active</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, member.assignedNow * 5)}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-slate-100 pt-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Calling Owner Intelligence</p>
                <h3 className="mt-1 text-xl font-black text-primary">Availability & Knowledge</h3>
              </div>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                <ShieldCheck size={18} />
              </div>
            </div>

            <div className="space-y-3">
              {workload.map((member) => (
                <div key={`knowledge-${member.id}`} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-primary">{member.name}</p>
                      <p className="mt-1 text-xs font-semibold text-secondary">{member.id} | {member.employeeId}</p>
                      <p className="mt-1 text-xs font-semibold text-secondary">{member.bestFor}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${availabilityTone(member.availability)}`}>
                      {member.availability}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {member.knowledge.map((skill) => (
                      <span key={skill} className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-2 text-xs font-semibold text-secondary sm:grid-cols-2">
                    <p>Employee ID: {member.employeeId}</p>
                    <p>Shift: {member.shift}</p>
                    <p>Quality: {member.quality}</p>
                  </div>

                  <button
                    onClick={() => setForm((current) => ({ ...current, telecallerId: member.id, assignedUserId: member.backendUserId, telecallerEmployeeId: member.employeeId, telecallerName: member.name }))}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-primary hover:text-white"
                  >
                    <UserCheck size={15} /> Use For Assign
                  </button>
                </div>
              ))}
            </div>
            </div>
          </div>
        </section>
      </div>

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
  icon: ComponentType<{ size?: number; className?: string }>;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
          <p className="mt-2 text-3xl font-black text-primary">{value}</p>
          <p className="mt-1 text-xs font-semibold text-secondary">{helper}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      {children}
    </label>
  );
}
