"use client";

import { useEffect, useMemo, useState } from "react";
import { Briefcase, CalendarClock, CheckCircle2, Download, Link2, Mail, Phone, Rocket, Search, Users } from "lucide-react";
import { projectLeadSeedData, wonProjectLeadStorageKey, type ProjectLead } from "@/components/dashboard/leads/leadTypes";
import { projectHandoffEventName, projectHandoffStorageKey, type BillingModel, type ClientContactSnapshot, type CreatedProjectRecord, type DeliveryMethod, type ProjectPriority } from "@/components/dashboard/projects/projectHandoff";

type ContactRole = "Decision Maker" | "Technical" | "Finance" | "Daily Coordinator";
type ProjectStatus = "Discovery" | "Development" | "UAT" | "Agreement Pending";

type ClientContact = {
  id: string;
  role: ContactRole;
  name: string;
  designation: string;
  phone: string;
  email: string;
  responsibility: string;
};

type ProjectClient = {
  clientId: string;
  projectId: string;
  sourceLeadId: string;
  company: string;
  projectName: string;
  projectType: string;
  projectStatus: ProjectStatus;
  projectOwner: string;
  teamLeader: string;
  telecaller: string;
  agreementStatus: "Pending" | "Drafted" | "Signed";
  value: number;
  contacts: ClientContact[];
  internalTeam: string[];
  nextAction: string;
};

const contactRoles: ContactRole[] = ["Decision Maker", "Technical", "Finance", "Daily Coordinator"];

type ContactForm = {
  role: ContactRole;
  name: string;
  designation: string;
  phone: string;
  email: string;
  responsibility: string;
};

type SourceEntryMode = "dropdown" | "manual";

type ManualSourceForm = {
  clientId: string;
  sourceLeadId: string;
  company: string;
  projectName: string;
  projectType: string;
  projectOwner: string;
  teamLeader: string;
  telecaller: string;
  agreementStatus: ProjectClient["agreementStatus"];
  value: string;
  primaryContactName: string;
  primaryContactPhone: string;
  primaryContactEmail: string;
};

type CreateProjectForm = {
  projectCode: string;
  projectManager: string;
  startDate: string;
  targetEndDate: string;
  priority: ProjectPriority;
  billingModel: BillingModel;
  deliveryMethod: DeliveryMethod;
  communicationChannel: string;
  repositoryUrl: string;
  kickoffNotes: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function makeProjectClientFromLead(lead: ProjectLead, index: number): ProjectClient {
    const company = `${lead.lastName} ${lead.projectType.replace(/\s+/g, " ")} Pvt Ltd`;
    const clientId = `ACC-${24001 + index}`;
    const projectId = `PRJ-${String(index + 1).padStart(3, "0")}`;
    const basePhone = Number(lead.mobile.slice(-8));

    return {
      clientId,
      projectId,
      sourceLeadId: lead.id,
      company,
      projectName: `${company} - ${lead.projectType}`,
      projectType: lead.projectType,
      projectStatus: lead.status === "Project Created" ? "Development" : "Discovery",
      projectOwner: lead.developmentOwner || "Development Team",
      teamLeader: "Rajkumar Rathore (TL-1)",
      telecaller: lead.assignedTo,
      agreementStatus: lead.status === "Project Created" ? "Signed" : "Drafted",
      value: lead.budget,
      contacts: [
        {
          id: `${clientId}-DM`,
          role: "Decision Maker",
          name: `${lead.firstName} ${lead.lastName}`,
          designation: "Founder / Project Sponsor",
          phone: lead.mobile,
          email: lead.email,
          responsibility: "Budget, scope approval, final sign-off",
        },
        {
          id: `${clientId}-TECH`,
          role: "Technical",
          name: ["Raghav Sinha", "Komal Arora", "Imran Sheikh", "Neel Patel"][index % 4],
          designation: "Technical Coordinator",
          phone: `9${String(basePhone + 10101).slice(0, 9)}`,
          email: `tech.${lead.id.toLowerCase()}@example.com`,
          responsibility: "API, access, testing, technical clarification",
        },
        {
          id: `${clientId}-FIN`,
          role: "Finance",
          name: ["Pallavi Rao", "Gaurav Jain", "Sneha Mehta", "Farhan Ali"][index % 4],
          designation: "Accounts / Billing",
          phone: `8${String(basePhone + 20202).slice(0, 9)}`,
          email: `billing.${lead.id.toLowerCase()}@example.com`,
          responsibility: "Invoice, payment schedule, GST details",
        },
        {
          id: `${clientId}-OPS`,
          role: "Daily Coordinator",
          name: ["Ankit Verma", "Ritika Nair", "Sahil Khan", "Mansi Joshi"][index % 4],
          designation: "Operations Coordinator",
          phone: `7${String(basePhone + 30303).slice(0, 9)}`,
          email: `ops.${lead.id.toLowerCase()}@example.com`,
          responsibility: "Daily updates, meeting coordination, UAT feedback",
        },
      ],
      internalTeam: ["Project Owner", "Frontend Dev", "Backend Dev", "QA", "Calling Handoff"],
      nextAction: lead.status === "Project Created" ? "Sync with Projects module team tracking" : "Create agreement and then open project record",
    };
}

function readStoredWonProjectLeads(): ProjectLead[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(wonProjectLeadStorageKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((lead): lead is ProjectLead => lead?.department === "Projects" && (lead.status === "Won" || lead.status === "Project Created"));
  } catch {
    return [];
  }
}

function makeProjectClients(): ProjectClient[] {
  const finalProjectLeads = [
    ...readStoredWonProjectLeads(),
    ...projectLeadSeedData.filter((lead) => lead.status === "Won" || lead.status === "Project Created"),
  ];
  const uniqueLeads = Array.from(new Map(finalProjectLeads.map((lead) => [lead.id, lead])).values());

  return uniqueLeads.map(makeProjectClientFromLead);
}

function makeBlankContactForm(): ContactForm {
  return {
    role: "Decision Maker",
    name: "",
    designation: "",
    phone: "",
    email: "",
    responsibility: "",
  };
}

function makeBlankManualSourceForm(): ManualSourceForm {
  return {
    clientId: "",
    sourceLeadId: "Manual",
    company: "",
    projectName: "",
    projectType: "Project",
    projectOwner: "",
    teamLeader: "Rajkumar Rathore (TL-1)",
    telecaller: "Manual Handoff",
    agreementStatus: "Pending",
    value: "",
    primaryContactName: "",
    primaryContactPhone: "",
    primaryContactEmail: "",
  };
}

function makeBlankProjectForm(client?: ProjectClient): CreateProjectForm {
  return {
    projectCode: client?.projectId || `PRJ-${Date.now().toString().slice(-4)}`,
    projectManager: client?.projectOwner || "",
    startDate: "",
    targetEndDate: "",
    priority: "High",
    billingModel: "Milestone Based",
    deliveryMethod: "Agile",
    communicationChannel: "",
    repositoryUrl: "",
    kickoffNotes: "",
  };
}

function readCreatedProjectRecords(): CreatedProjectRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(window.localStorage.getItem(projectHandoffStorageKey) || "[]");
    if (!Array.isArray(parsed)) return [];
    const validProjects = parsed.filter((project): project is CreatedProjectRecord => Boolean(project?.projectId && project?.clientId && project?.sourceLeadId));
    return Array.from(new Map(validProjects.map((project) => [`${project.projectId}-${project.sourceLeadId}`, project])).values());
  } catch {
    return [];
  }
}

function syncCreatedProjectRecord(project: CreatedProjectRecord) {
  if (typeof window === "undefined") return;

  const existingProjects = readCreatedProjectRecords();
  const withoutCurrent = existingProjects.filter((item) => item.id !== project.id && item.projectId !== project.projectId && item.sourceLeadId !== project.sourceLeadId);
  window.localStorage.setItem(projectHandoffStorageKey, JSON.stringify([project, ...withoutCurrent]));
  window.dispatchEvent(new Event(projectHandoffEventName));
}

export default function ClientsContacts() {
  const [clients, setClients] = useState<ProjectClient[]>(makeProjectClients);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [roleFilter, setRoleFilter] = useState<"All" | ContactRole>("All");
  const [search, setSearch] = useState("");
  const [contactForm, setContactForm] = useState<ContactForm>(makeBlankContactForm);
  const [sourceEntryMode, setSourceEntryMode] = useState<SourceEntryMode>("dropdown");
  const [manualSourceForm, setManualSourceForm] = useState<ManualSourceForm>(makeBlankManualSourceForm);
  const [formMessage, setFormMessage] = useState("");
  const [showContactForm, setShowContactForm] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectForm, setProjectForm] = useState<CreateProjectForm>(makeBlankProjectForm);
  const [createdProjects, setCreatedProjects] = useState<CreatedProjectRecord[]>(readCreatedProjectRecords);
  const [activeProjectId, setActiveProjectId] = useState("");
  const [editingProjectId, setEditingProjectId] = useState("");
  const selectedClient = clients.find((client) => client.clientId === selectedClientId);
  const activeProject = activeProjectId ? createdProjects.find((project) => project.id === activeProjectId) : undefined;
  const activeProjectClient = activeProject
    ? clients.find((client) => client.clientId === activeProject.clientId || client.sourceLeadId === activeProject.sourceLeadId)
    : undefined;
  const activeProjectContacts = activeProjectClient?.contacts || [];

  useEffect(() => {
    const refreshWonProjectClients = () => {
      setClients((current) => {
        const syncedClients = makeProjectClients();
        const manualClients = current.filter((client) => !syncedClients.some((synced) => synced.sourceLeadId === client.sourceLeadId));
        return [...syncedClients, ...manualClients];
      });
    };

    refreshWonProjectClients();
    window.addEventListener("storage", refreshWonProjectClients);
    window.addEventListener("crm-won-project-leads-updated", refreshWonProjectClients);

    return () => {
      window.removeEventListener("storage", refreshWonProjectClients);
      window.removeEventListener("crm-won-project-leads-updated", refreshWonProjectClients);
    };
  }, []);

  const visibleContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients
      .filter((client) => !query || client.company.toLowerCase().includes(query) || client.projectName.toLowerCase().includes(query) || client.sourceLeadId.toLowerCase().includes(query) || client.projectId.toLowerCase().includes(query))
      .flatMap((client) =>
        client.contacts
          .filter((contact) => roleFilter === "All" || contact.role === roleFilter)
          .map((contact) => ({ ...contact, client })),
      );
  }, [clients, roleFilter, search]);

  const exportContacts = () => {
    const header = ["Client ID", "Project ID", "Source Lead", "Company", "Project", "Role", "Name", "Designation", "Phone", "Email", "Responsibility"];
    const csvRows = visibleContacts.map((row) =>
      [row.client.clientId, row.client.projectId, row.client.sourceLeadId, row.client.company, row.client.projectName, row.role, row.name, row.designation, row.phone, row.email, row.responsibility]
        .map((value) => `"${String(value).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...csvRows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "project-client-contacts.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const openCreateProject = () => {
    setSelectedClientId("");
    setSourceEntryMode("dropdown");
    setManualSourceForm(makeBlankManualSourceForm());
    setProjectForm(makeBlankProjectForm());
    setEditingProjectId("");
    setShowCreateProject(true);
    setShowContactForm(false);
    setActiveProjectId("");
    setFormMessage("");
  };

  const switchSourceEntryMode = (mode: SourceEntryMode) => {
    setSourceEntryMode(mode);
    setSelectedClientId("");
    setManualSourceForm(makeBlankManualSourceForm());
    setProjectForm(makeBlankProjectForm());
    setFormMessage("");
  };

  const selectSourceClient = (clientId: string) => {
    const sourceClient = clients.find((client) => client.clientId === clientId);
    setSelectedClientId(clientId);
    setProjectForm(makeBlankProjectForm(sourceClient));
    setFormMessage("");
  };

  const openProjectDetail = (project: CreatedProjectRecord) => {
    setActiveProjectId(project.id);
    setSelectedClientId(project.clientId);
    setShowCreateProject(false);
    setShowContactForm(false);
    setFormMessage("");
  };

  const openProjectEdit = (project: CreatedProjectRecord) => {
    setActiveProjectId(project.id);
    setSelectedClientId(project.clientId);
    setEditingProjectId(project.id);
    setProjectForm({
      projectCode: project.projectId,
      projectManager: project.projectManager,
      startDate: project.startDate,
      targetEndDate: project.targetEndDate,
      priority: project.priority,
      billingModel: project.billingModel,
      deliveryMethod: project.deliveryMethod,
      communicationChannel: project.communicationChannel === "Not defined" ? "" : project.communicationChannel,
      repositoryUrl: project.repositoryUrl === "Not defined" ? "" : project.repositoryUrl,
      kickoffNotes: project.kickoffNotes,
    });
    setShowCreateProject(true);
    setShowContactForm(false);
    setFormMessage("");
  };

  const addContactToSelectedClient = () => {
    const targetClient = activeProjectClient || selectedClient;
    if (!targetClient) {
      setFormMessage("Open a project before adding contacts.");
      return;
    }
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      setFormMessage("Contact name and phone are required.");
      return;
    }

    const newContact: ClientContact = {
      id: `${targetClient.clientId}-${contactForm.role}-${targetClient.contacts.length + 1}`,
      role: contactForm.role,
      name: contactForm.name.trim(),
      designation: contactForm.designation.trim() || contactForm.role,
      phone: contactForm.phone.trim(),
      email: contactForm.email.trim() || "not-provided@example.com",
      responsibility: contactForm.responsibility.trim() || "Project coordination",
    };

    setClients((current) =>
      current.map((client) =>
        client.clientId === targetClient.clientId ? { ...client, contacts: [...client.contacts, newContact] } : client,
      ),
    );
    setContactForm(makeBlankContactForm());
    setShowContactForm(false);
    setFormMessage("Contact added.");
  };

  const createProjectFromSelectedClient = () => {
    const sourceClient: ProjectClient | undefined = sourceEntryMode === "manual"
      ? {
          clientId: manualSourceForm.clientId.trim() || `ACC-MAN-${projectForm.projectCode.trim() || "DRAFT"}`,
          projectId: projectForm.projectCode.trim(),
          sourceLeadId: manualSourceForm.sourceLeadId.trim() || "Manual",
          company: manualSourceForm.company.trim(),
          projectName: manualSourceForm.projectName.trim(),
          projectType: manualSourceForm.projectType.trim() || "Project",
          projectStatus: "Agreement Pending",
          projectOwner: manualSourceForm.projectOwner.trim() || projectForm.projectManager.trim() || "Development Team",
          teamLeader: manualSourceForm.teamLeader.trim() || "Rajkumar Rathore (TL-1)",
          telecaller: manualSourceForm.telecaller.trim() || "Manual Handoff",
          agreementStatus: manualSourceForm.agreementStatus,
          value: Number(manualSourceForm.value) || 0,
          contacts: manualSourceForm.primaryContactName.trim()
            ? [{
                id: `${manualSourceForm.clientId.trim() || "MANUAL"}-DM`,
                role: "Decision Maker",
                name: manualSourceForm.primaryContactName.trim(),
                designation: "Project Sponsor",
                phone: manualSourceForm.primaryContactPhone.trim(),
                email: manualSourceForm.primaryContactEmail.trim() || "not-provided@example.com",
                responsibility: "Budget, scope approval, final sign-off",
              }]
            : [],
          internalTeam: ["Project Owner", "Development Team", "Manual Handoff"],
          nextAction: "Create project and assign delivery team",
        }
      : selectedClient;

    if (!sourceClient) {
      setFormMessage("Select a source project client or switch to manual entry.");
      return;
    }

    if (sourceEntryMode === "manual" && (!sourceClient.company || !sourceClient.projectName || !sourceClient.contacts[0]?.name || !sourceClient.contacts[0]?.phone || sourceClient.value <= 0)) {
      setFormMessage("Manual source requires company, project name, primary contact name, primary contact phone, and project value.");
      return;
    }

    if (!projectForm.projectCode.trim() || !projectForm.projectManager.trim() || !projectForm.startDate || !projectForm.targetEndDate) {
      setFormMessage("Project code, project manager, start date, and target end date are required.");
      return;
    }

    if (new Date(projectForm.targetEndDate) < new Date(projectForm.startDate)) {
      setFormMessage("Target end date cannot be earlier than start date.");
      return;
    }

    if (projectForm.kickoffNotes.trim().length < 10) {
      setFormMessage("Kickoff notes must include at least 10 characters.");
      return;
    }

    const primaryContact = sourceClient.contacts.find((contact) => contact.role === "Decision Maker") || sourceClient.contacts[0];
    const createdProject: CreatedProjectRecord = {
      id: editingProjectId || `${sourceClient.clientId}-${projectForm.projectCode.trim()}`,
      clientId: sourceClient.clientId,
      projectId: projectForm.projectCode.trim(),
      sourceLeadId: sourceClient.sourceLeadId,
      company: sourceClient.company,
      projectName: sourceClient.projectName,
      projectType: sourceClient.projectType,
      projectOwner: sourceClient.projectOwner,
      value: sourceClient.value,
      primaryContact: primaryContact?.name || "Not assigned",
      projectManager: projectForm.projectManager.trim(),
      startDate: projectForm.startDate,
      targetEndDate: projectForm.targetEndDate,
      priority: projectForm.priority,
      billingModel: projectForm.billingModel,
      deliveryMethod: projectForm.deliveryMethod,
      communicationChannel: projectForm.communicationChannel.trim() || "Not defined",
      repositoryUrl: projectForm.repositoryUrl.trim() || "Not defined",
      kickoffNotes: projectForm.kickoffNotes.trim(),
      clientContacts: sourceClient.contacts as ClientContactSnapshot[],
      teamLeaderName: sourceClient.teamLeader,
      status: "Planning",
      createdAt: createdProjects.find((project) => project.id === editingProjectId)?.createdAt || projectForm.startDate,
    };

    setCreatedProjects((current) => [
      createdProject,
      ...current.filter((project) => project.id !== createdProject.id && project.projectId !== createdProject.projectId && project.sourceLeadId !== createdProject.sourceLeadId),
    ]);
    syncCreatedProjectRecord(createdProject);
    setClients((current) =>
      current.some((client) => client.clientId === sourceClient.clientId)
        ? current.map((client) =>
            client.clientId === sourceClient.clientId
              ? { ...client, projectId: createdProject.projectId, projectStatus: "Discovery", nextAction: "Project created. Prepare kickoff and delivery tracking." }
              : client,
          )
        : [{ ...sourceClient, projectId: createdProject.projectId, projectStatus: "Discovery", nextAction: "Project created. Prepare kickoff and delivery tracking." }, ...current],
    );
    setShowCreateProject(false);
    setActiveProjectId(createdProject.id);
    setEditingProjectId("");
    setFormMessage(editingProjectId ? "Project updated." : "Project created from client contact record.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Project Client Directory</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Project Clients & Contacts</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-secondary">
            Won project leads automatically become project client records here. This page links client ID, project ID, source lead ID, project owner, and contact people.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={openCreateProject} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-primary/90">
            <Rocket size={16} /> Add New Project
          </button>
          <button onClick={exportContacts} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary shadow-sm hover:border-primary">
            <Download size={16} /> Export Contacts
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Final Project Clients", value: clients.length, icon: Briefcase, detail: "Won / Project Created" },
          { label: "Client Contacts", value: clients.reduce((sum, client) => sum + client.contacts.length, 0), icon: Users, detail: "Decision + Tech + Finance + Ops" },
          { label: "Signed Agreements", value: clients.filter((client) => client.agreementStatus === "Signed").length, icon: CheckCircle2, detail: "Ready for delivery" },
          { label: "Total Project Value", value: money(clients.reduce((sum, client) => sum + client.value, 0)), icon: Briefcase, detail: "Final project pipeline" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                <p className="mt-2 text-2xl font-black text-primary">{item.value}</p>
                <p className="mt-1 text-xs font-bold text-secondary">{item.detail}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <item.icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {formMessage && !showCreateProject && !showContactForm && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-sm font-black text-emerald-700">
          {formMessage}
        </div>
      )}

      {showCreateProject && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Create Project</p>
              <h3 className="mt-1 text-xl font-black text-primary">{editingProjectId ? "Edit Project" : selectedClient?.projectName || "Select Source Project Client"}</h3>
              <p className="mt-1 text-sm font-semibold text-secondary">Lead-sourced details are prefilled from the selected project client. Delivery setup fields must be completed before project creation.</p>
            </div>
            <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">{editingProjectId ? "Editing" : "Frontend Draft"}</span>
          </div>

          {!editingProjectId && (
            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Source Project Client *</p>
                <div className="inline-flex w-fit rounded-xl border border-border bg-white p-1">
                  {(["dropdown", "manual"] as SourceEntryMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => switchSourceEntryMode(mode)}
                      className={`h-8 rounded-lg px-3 text-[10px] font-black uppercase tracking-widest transition-all ${sourceEntryMode === mode ? "bg-primary text-white" : "text-slate-400 hover:text-primary"}`}
                    >
                      {mode === "dropdown" ? "Dropdown" : "Manual"}
                    </button>
                  ))}
                </div>
              </div>

              {sourceEntryMode === "dropdown" ? (
                <label className="mt-3 block space-y-2">
                  <select value={selectedClientId} onChange={(event) => selectSourceClient(event.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                    <option value="">Select the won project lead/client...</option>
                    {clients.map((client) => (
                      <option key={`${client.clientId}-${client.sourceLeadId}`} value={client.clientId}>
                        {client.company} | {client.projectName} | {client.sourceLeadId}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <input value={manualSourceForm.clientId} onChange={(event) => setManualSourceForm((current) => ({ ...current, clientId: event.target.value }))} placeholder="Client ID (optional)" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={manualSourceForm.sourceLeadId} onChange={(event) => setManualSourceForm((current) => ({ ...current, sourceLeadId: event.target.value }))} placeholder="Source lead ID" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={manualSourceForm.company} onChange={(event) => setManualSourceForm((current) => ({ ...current, company: event.target.value }))} placeholder="Company / client name *" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={manualSourceForm.projectName} onChange={(event) => setManualSourceForm((current) => ({ ...current, projectName: event.target.value }))} placeholder="Project name *" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={manualSourceForm.projectType} onChange={(event) => setManualSourceForm((current) => ({ ...current, projectType: event.target.value }))} placeholder="Project type" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={manualSourceForm.value} onChange={(event) => setManualSourceForm((current) => ({ ...current, value: event.target.value }))} type="number" placeholder="Project value *" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={manualSourceForm.projectOwner} onChange={(event) => setManualSourceForm((current) => ({ ...current, projectOwner: event.target.value }))} placeholder="Project owner" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={manualSourceForm.telecaller} onChange={(event) => setManualSourceForm((current) => ({ ...current, telecaller: event.target.value }))} placeholder="Handoff owner" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <select value={manualSourceForm.agreementStatus} onChange={(event) => setManualSourceForm((current) => ({ ...current, agreementStatus: event.target.value as ProjectClient["agreementStatus"] }))} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10">
                    {(["Pending", "Drafted", "Signed"] as ProjectClient["agreementStatus"][]).map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <input value={manualSourceForm.primaryContactName} onChange={(event) => setManualSourceForm((current) => ({ ...current, primaryContactName: event.target.value }))} placeholder="Primary contact name *" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={manualSourceForm.primaryContactPhone} onChange={(event) => setManualSourceForm((current) => ({ ...current, primaryContactPhone: event.target.value }))} placeholder="Primary contact phone *" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={manualSourceForm.primaryContactEmail} onChange={(event) => setManualSourceForm((current) => ({ ...current, primaryContactEmail: event.target.value }))} placeholder="Primary contact email" className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                </div>
              )}
            </div>
          )}

          <div className="mt-5 grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary">Lead-Sourced Information</h4>
              {selectedClient || sourceEntryMode === "manual" ? (
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {[
                    ["Client ID", selectedClient?.clientId || manualSourceForm.clientId || "Auto-generated"],
                    ["Source Lead", selectedClient?.sourceLeadId || manualSourceForm.sourceLeadId || "Manual"],
                    ["Company", selectedClient?.company || manualSourceForm.company || "Not entered"],
                    ["Project Name", selectedClient?.projectName || manualSourceForm.projectName || "Not entered"],
                    ["Project Type", selectedClient?.projectType || manualSourceForm.projectType || "Project"],
                    ["Project Value", selectedClient ? money(selectedClient.value) : manualSourceForm.value ? money(Number(manualSourceForm.value)) : "Not entered"],
                    ["Project Owner", selectedClient?.projectOwner || manualSourceForm.projectOwner || "Development Team"],
                    ["Calling Handoff", selectedClient?.telecaller || manualSourceForm.telecaller || "Manual Handoff"],
                    ["Agreement Status", selectedClient?.agreementStatus || manualSourceForm.agreementStatus],
                    ["Primary Contact", selectedClient?.contacts.find((contact) => contact.role === "Decision Maker")?.name || selectedClient?.contacts[0]?.name || manualSourceForm.primaryContactName || "Not entered"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                      <p className="mt-1 text-sm font-black text-primary">{value}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                  Select a source project client to load lead information
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-black uppercase tracking-widest text-primary">Project Setup Details</h4>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Code *</span>
                  <input value={projectForm.projectCode} onChange={(event) => setProjectForm((current) => ({ ...current, projectCode: event.target.value }))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Manager *</span>
                  <input value={projectForm.projectManager} onChange={(event) => setProjectForm((current) => ({ ...current, projectManager: event.target.value }))} placeholder="Project manager" className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date *</span>
                  <input type="date" value={projectForm.startDate} onChange={(event) => setProjectForm((current) => ({ ...current, startDate: event.target.value }))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target End Date *</span>
                  <input type="date" value={projectForm.targetEndDate} onChange={(event) => setProjectForm((current) => ({ ...current, targetEndDate: event.target.value }))} className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Priority</span>
                  <select value={projectForm.priority} onChange={(event) => setProjectForm((current) => ({ ...current, priority: event.target.value as ProjectPriority }))} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10">
                    {(["Low", "Medium", "High", "Critical"] as ProjectPriority[]).map((priority) => <option key={priority}>{priority}</option>)}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Billing Model</span>
                  <select value={projectForm.billingModel} onChange={(event) => setProjectForm((current) => ({ ...current, billingModel: event.target.value as BillingModel }))} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10">
                    {(["Fixed Cost", "Milestone Based", "Monthly Retainer"] as BillingModel[]).map((model) => <option key={model}>{model}</option>)}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Delivery Method</span>
                  <select value={projectForm.deliveryMethod} onChange={(event) => setProjectForm((current) => ({ ...current, deliveryMethod: event.target.value as DeliveryMethod }))} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10">
                    {(["Agile", "Waterfall", "Hybrid"] as DeliveryMethod[]).map((method) => <option key={method}>{method}</option>)}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Communication Channel</span>
                  <input value={projectForm.communicationChannel} onChange={(event) => setProjectForm((current) => ({ ...current, communicationChannel: event.target.value }))} placeholder="Slack, Teams, WhatsApp, Email" className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Repository / Workspace URL</span>
                  <input value={projectForm.repositoryUrl} onChange={(event) => setProjectForm((current) => ({ ...current, repositoryUrl: event.target.value }))} placeholder="https://..." className="h-11 w-full rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                </label>
                <label className="space-y-1 md:col-span-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kickoff Notes *</span>
                  <textarea value={projectForm.kickoffNotes} onChange={(event) => setProjectForm((current) => ({ ...current, kickoffNotes: event.target.value }))} placeholder="Scope handoff, immediate risks, access needed, first milestone..." className="min-h-24 w-full rounded-xl border border-border px-3 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                </label>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={createProjectFromSelectedClient} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-xs font-black uppercase tracking-widest text-white">
                  <Rocket size={15} /> {editingProjectId ? "Update Project" : "Save Project"}
                </button>
                <button onClick={() => { setShowCreateProject(false); setEditingProjectId(""); }} className="h-11 rounded-xl border border-border bg-white px-5 text-xs font-black uppercase tracking-widest text-primary">
                  Cancel
                </button>
              </div>
              {formMessage && <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-500">{formMessage}</p>}
            </div>
          </div>
        </section>
      )}

      {createdProjects.length > 0 && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Created Projects</p>
              <h3 className="mt-1 text-lg font-black text-primary">Project Creation Output</h3>
            </div>
            <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">{createdProjects.length} Drafted</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {createdProjects.map((project) => (
              <article key={project.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{project.company}</p>
                    <h4 className="mt-1 text-base font-black text-primary">{project.projectName}</h4>
                    <p className="mt-1 text-xs font-bold text-secondary">{project.projectId} | {project.sourceLeadId} | {project.status}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="w-fit rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700">{project.priority}</span>
                    <button onClick={() => openProjectDetail(project)} className="rounded-xl border border-border bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                      Open
                    </button>
                    <button onClick={() => openProjectEdit(project)} className="rounded-xl bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary/90">
                      Edit
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-start gap-2 rounded-xl bg-white p-3">
                    <Users className="mt-0.5 text-slate-400" size={15} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Manager / Contact</p>
                      <p className="mt-1 text-xs font-black text-primary">{project.projectManager}</p>
                      <p className="text-xs font-semibold text-secondary">{project.primaryContact}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl bg-white p-3">
                    <CalendarClock className="mt-0.5 text-slate-400" size={15} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Timeline</p>
                      <p className="mt-1 text-xs font-black text-primary">{project.startDate} to {project.targetEndDate}</p>
                      <p className="text-xs font-semibold text-secondary">{project.deliveryMethod} | {project.billingModel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-xl bg-white p-3 sm:col-span-2">
                    <Link2 className="mt-0.5 text-slate-400" size={15} />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Workspace / Notes</p>
                      <p className="mt-1 break-all text-xs font-black text-primary">{project.repositoryUrl}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-secondary">{project.kickoffNotes}</p>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {activeProject && (
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Project Detail</p>
              <h3 className="mt-1 text-xl font-black text-primary">{activeProject.projectName}</h3>
              <p className="mt-1 text-sm font-semibold text-secondary">{activeProject.company} | {activeProject.projectId} | {activeProject.sourceLeadId}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => openProjectEdit(activeProject)} className="rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white">
                Edit Project
              </button>
              <button onClick={() => { setShowContactForm((current) => !current); setContactForm(makeBlankContactForm()); }} className="rounded-xl border border-border bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                Add Contact
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Project Manager", activeProject.projectManager],
                ["Primary Contact", activeProject.primaryContact],
                ["Timeline", `${activeProject.startDate} to ${activeProject.targetEndDate}`],
                ["Billing Model", activeProject.billingModel],
                ["Delivery Method", activeProject.deliveryMethod],
                ["Value", money(activeProject.value)],
                ["Communication", activeProject.communicationChannel],
                ["Workspace", activeProject.repositoryUrl],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 break-all text-sm font-black text-primary">{value}</p>
                </div>
              ))}
              <div className="rounded-xl bg-slate-50 p-3 sm:col-span-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Kickoff Notes</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-secondary">{activeProject.kickoffNotes}</p>
              </div>
            </div>

            <div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-lg font-black text-primary">Contact People</h4>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Contacts are linked to this project client record.</p>
                </div>
                <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{activeProjectContacts.length} Contacts</span>
              </div>

              {showContactForm && (
                <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <select value={contactForm.role} onChange={(event) => setContactForm((current) => ({ ...current, role: event.target.value as ContactRole }))} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10">
                      {contactRoles.map((role) => <option key={role}>{role}</option>)}
                    </select>
                    <input value={contactForm.name} onChange={(event) => setContactForm((current) => ({ ...current, name: event.target.value }))} placeholder="Contact name" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                    <input value={contactForm.designation} onChange={(event) => setContactForm((current) => ({ ...current, designation: event.target.value }))} placeholder="Designation" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                    <input value={contactForm.phone} onChange={(event) => setContactForm((current) => ({ ...current, phone: event.target.value }))} placeholder="Phone / WhatsApp" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                    <input value={contactForm.email} onChange={(event) => setContactForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                    <input value={contactForm.responsibility} onChange={(event) => setContactForm((current) => ({ ...current, responsibility: event.target.value }))} placeholder="Responsibility" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button onClick={addContactToSelectedClient} className="h-11 rounded-xl bg-primary px-5 text-xs font-black uppercase tracking-widest text-white">
                      Save Contact
                    </button>
                    <button onClick={() => setShowContactForm(false)} className="h-11 rounded-xl border border-border bg-white px-5 text-xs font-black uppercase tracking-widest text-primary">
                      Cancel
                    </button>
                  </div>
                  {formMessage && <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-500">{formMessage}</p>}
                </div>
              )}

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {activeProjectContacts.map((contact) => (
                  <div key={contact.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{contact.role}</p>
                    <h5 className="mt-1 text-base font-black text-primary">{contact.name}</h5>
                    <p className="text-xs font-bold text-secondary">{contact.designation}</p>
                    <div className="mt-3 space-y-2 text-xs font-semibold text-secondary">
                      <p className="flex items-center gap-2"><Phone size={14} /> {contact.phone}</p>
                      <p className="flex items-center gap-2"><Mail size={14} /> {contact.email}</p>
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{contact.responsibility}</p>
                  </div>
                ))}
                {activeProjectContacts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400 md:col-span-2">
                    No contacts added for this project
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-border bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            {["All", ...contactRoles].map((role) => (
              <button key={role} onClick={() => setRoleFilter(role as "All" | ContactRole)} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all ${roleFilter === role ? "bg-primary text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                {role}
              </button>
            ))}
          </div>
          <div className="relative w-full xl:max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search company, project, lead..." className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-semibold outline-none focus:border-primary focus:bg-white" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/60">
                {["Company / Project", "Linked IDs", "Role", "Contact", "Phone", "Responsibility", "Action"].map((head) => (
                  <th key={head} className="px-5 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleContacts.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-4">
                    <p className="text-sm font-black text-primary">{row.client.company}</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">{row.client.projectName}</p>
                  </td>
                  <td className="px-5 py-4 text-xs font-black text-slate-500">{row.client.clientId}<br />{row.client.projectId}<br />{row.client.sourceLeadId}</td>
                  <td className="px-5 py-4 text-sm font-bold text-secondary">{row.role}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-black text-primary">{row.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{row.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-secondary">{row.phone}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-secondary">{row.responsibility}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => setSelectedClientId(row.client.clientId)} className="rounded-xl border border-border bg-white px-3 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                      Open Project Client
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
