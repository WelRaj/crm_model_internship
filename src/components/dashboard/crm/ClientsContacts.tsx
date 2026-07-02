"use client";

import { useMemo, useState } from "react";
import { Briefcase, CheckCircle2, Download, Mail, Phone, Search, Users } from "lucide-react";
import { projectLeadSeedData } from "@/components/dashboard/leads/leadTypes";

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

type ProjectClientForm = {
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
  agreementStatus: ProjectClient["agreementStatus"];
  value: string;
  nextAction: string;
};

type ContactForm = {
  role: ContactRole;
  name: string;
  designation: string;
  phone: string;
  email: string;
  responsibility: string;
};

function money(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function makeProjectClients(): ProjectClient[] {
  const finalProjectLeads = projectLeadSeedData.filter((lead) => lead.status === "Won" || lead.status === "Project Created");

  return finalProjectLeads.map((lead, index) => {
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
      internalTeam: ["Project Owner", "Frontend Dev", "Backend Dev", "QA", "Telecaller Handoff"],
      nextAction: lead.status === "Project Created" ? "Sync with Projects module team tracking" : "Create agreement and then open project record",
    };
  });
}

function makeBlankClientForm(): ProjectClientForm {
  return {
    clientId: `ACC-${Date.now().toString().slice(-5)}`,
    projectId: `PRJ-${Date.now().toString().slice(-3)}`,
    sourceLeadId: "",
    company: "",
    projectName: "",
    projectType: "",
    projectStatus: "Agreement Pending",
    projectOwner: "",
    teamLeader: "Rajkumar Rathore (TL-1)",
    telecaller: "",
    agreementStatus: "Pending",
    value: "",
    nextAction: "Collect client contacts and create project agreement",
  };
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

function statusTone(status: ProjectStatus) {
  if (status === "Development") return "border-blue-100 bg-blue-50 text-blue-700";
  if (status === "UAT") return "border-purple-100 bg-purple-50 text-purple-700";
  if (status === "Agreement Pending") return "border-amber-100 bg-amber-50 text-amber-700";
  return "border-emerald-100 bg-emerald-50 text-emerald-700";
}

export default function ClientsContacts() {
  const [clients, setClients] = useState<ProjectClient[]>(makeProjectClients);
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.clientId || "");
  const [roleFilter, setRoleFilter] = useState<"All" | ContactRole>("All");
  const [search, setSearch] = useState("");
  const [clientForm, setClientForm] = useState<ProjectClientForm>(makeBlankClientForm);
  const [contactForm, setContactForm] = useState<ContactForm>(makeBlankContactForm);
  const [formMessage, setFormMessage] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const selectedClient = clients.find((client) => client.clientId === selectedClientId) || clients[0];

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

  const addProjectClient = () => {
    if (!clientForm.company.trim() || !clientForm.projectName.trim() || !clientForm.projectId.trim()) {
      setFormMessage("Company, project name and project ID required hai.");
      return;
    }

    const newClient: ProjectClient = {
      clientId: clientForm.clientId.trim() || `ACC-${Date.now().toString().slice(-5)}`,
      projectId: clientForm.projectId.trim(),
      sourceLeadId: clientForm.sourceLeadId.trim() || "Manual",
      company: clientForm.company.trim(),
      projectName: clientForm.projectName.trim(),
      projectType: clientForm.projectType.trim() || "Project",
      projectStatus: clientForm.projectStatus,
      projectOwner: clientForm.projectOwner.trim() || "Development Team",
      teamLeader: clientForm.teamLeader.trim() || "Rajkumar Rathore (TL-1)",
      telecaller: clientForm.telecaller.trim() || "Manual Handoff",
      agreementStatus: clientForm.agreementStatus,
      value: Number(clientForm.value) || 0,
      contacts: [],
      internalTeam: ["Project Owner", "Development Team", "Telecaller Handoff"],
      nextAction: clientForm.nextAction.trim() || "Collect project contacts",
    };

    setClients((current) => [newClient, ...current]);
    setSelectedClientId(newClient.clientId);
    setClientForm(makeBlankClientForm());
    setShowClientForm(false);
    setFormMessage("Project client add ho gaya. Ab uske contact persons add karo.");
  };

  const addContactToSelectedClient = () => {
    if (!selectedClient) {
      setFormMessage("Pehle project client select karo.");
      return;
    }
    if (!contactForm.name.trim() || !contactForm.phone.trim()) {
      setFormMessage("Contact name aur phone required hai.");
      return;
    }

    const newContact: ClientContact = {
      id: `${selectedClient.clientId}-${contactForm.role}-${Date.now()}`,
      role: contactForm.role,
      name: contactForm.name.trim(),
      designation: contactForm.designation.trim() || contactForm.role,
      phone: contactForm.phone.trim(),
      email: contactForm.email.trim() || "not-provided@example.com",
      responsibility: contactForm.responsibility.trim() || "Project coordination",
    };

    setClients((current) =>
      current.map((client) =>
        client.clientId === selectedClient.clientId ? { ...client, contacts: [...client.contacts, newContact] } : client,
      ),
    );
    setContactForm(makeBlankContactForm());
    setShowContactForm(false);
    setFormMessage("Contact add ho gaya.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Project Client Directory</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-primary">Clients & Contacts</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-secondary">
            Lead Outcomes me project deal final hote hi client contacts yaha automatic aayenge. Ye page Projects module ke clientId, projectId, sourceLeadId aur project owner se linked hai.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setShowClientForm((current) => !current); setShowContactForm(false); }} className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white shadow-sm hover:bg-primary/90">
            <Briefcase size={16} /> Add Project Client
          </button>
          <button onClick={() => { setShowContactForm((current) => !current); setShowClientForm(false); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black uppercase tracking-widest text-primary shadow-sm hover:border-primary">
            <Users size={16} /> Add Contact To Project
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

      {(showClientForm || showContactForm) && (
      <section className={`grid gap-5 ${showClientForm && showContactForm ? "xl:grid-cols-2" : "xl:grid-cols-1"}`}>
        {showClientForm && <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Manual Entry</p>
            <h3 className="mt-1 text-lg font-black text-primary">Add Project Client</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Final project deal automatic aaye ya manually add karni ho, dono yaha se handle hoga.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input value={clientForm.clientId} onChange={(event) => setClientForm((current) => ({ ...current, clientId: event.target.value }))} placeholder="Client ID" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={clientForm.projectId} onChange={(event) => setClientForm((current) => ({ ...current, projectId: event.target.value }))} placeholder="Project ID" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={clientForm.sourceLeadId} onChange={(event) => setClientForm((current) => ({ ...current, sourceLeadId: event.target.value }))} placeholder="Source Lead ID" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={clientForm.company} onChange={(event) => setClientForm((current) => ({ ...current, company: event.target.value }))} placeholder="Client / Company name" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={clientForm.projectName} onChange={(event) => setClientForm((current) => ({ ...current, projectName: event.target.value }))} placeholder="Project name" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={clientForm.projectType} onChange={(event) => setClientForm((current) => ({ ...current, projectType: event.target.value }))} placeholder="Project type" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={clientForm.projectOwner} onChange={(event) => setClientForm((current) => ({ ...current, projectOwner: event.target.value }))} placeholder="Project owner" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={clientForm.telecaller} onChange={(event) => setClientForm((current) => ({ ...current, telecaller: event.target.value }))} placeholder="Telecaller handoff" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
            <select value={clientForm.projectStatus} onChange={(event) => setClientForm((current) => ({ ...current, projectStatus: event.target.value as ProjectStatus }))} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10">
              {(["Agreement Pending", "Discovery", "Development", "UAT"] as ProjectStatus[]).map((status) => <option key={status}>{status}</option>)}
            </select>
            <select value={clientForm.agreementStatus} onChange={(event) => setClientForm((current) => ({ ...current, agreementStatus: event.target.value as ProjectClient["agreementStatus"] }))} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10">
              {(["Pending", "Drafted", "Signed"] as ProjectClient["agreementStatus"][]).map((status) => <option key={status}>{status}</option>)}
            </select>
            <input type="number" value={clientForm.value} onChange={(event) => setClientForm((current) => ({ ...current, value: event.target.value }))} placeholder="Project value" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={clientForm.nextAction} onChange={(event) => setClientForm((current) => ({ ...current, nextAction: event.target.value }))} placeholder="Next action" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <button onClick={addProjectClient} className="h-11 rounded-xl bg-primary px-5 text-xs font-black uppercase tracking-widest text-white">
              Add Project Client
            </button>
            <button onClick={() => setShowClientForm(false)} className="h-11 rounded-xl border border-border bg-white px-5 text-xs font-black uppercase tracking-widest text-primary">
              Cancel
            </button>
          </div>
        </div>}

        {showContactForm && <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Contact Entry</p>
            <h3 className="mt-1 text-lg font-black text-primary">Add Contact Person</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Selected project client: {selectedClient?.company || "No client selected"}</p>
          </div>
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
              Add Contact To Project
            </button>
            <button onClick={() => setShowContactForm(false)} className="h-11 rounded-xl border border-border bg-white px-5 text-xs font-black uppercase tracking-widest text-primary">
              Cancel
            </button>
          </div>
          {formMessage && <p className="mt-3 text-xs font-black uppercase tracking-widest text-slate-500">{formMessage}</p>}
        </div>}
      </section>
      )}

      {selectedClient && (
        <section className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <aside className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Project Link</p>
            <h3 className="mt-2 text-xl font-black text-primary">{selectedClient.company}</h3>
            <p className="mt-1 text-sm font-semibold text-secondary">{selectedClient.projectName}</p>
            <div className="mt-5 space-y-3">
              {[
                ["Client ID", selectedClient.clientId],
                ["Project ID", selectedClient.projectId],
                ["Source Lead", selectedClient.sourceLeadId],
                ["Project Owner", selectedClient.projectOwner],
                ["Team Leader", selectedClient.teamLeader],
                ["Telecaller Handoff", selectedClient.telecaller],
                ["Agreement", selectedClient.agreementStatus],
                ["Value", money(selectedClient.value)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 text-sm font-black text-primary">{value}</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-lg font-black text-primary">Project Contact People</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Client side ke saare important project contacts proper role ke saath.</p>
              </div>
              <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusTone(selectedClient.projectStatus)}`}>{selectedClient.projectStatus}</span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {selectedClient.contacts.map((contact) => (
                <div key={contact.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{contact.role}</p>
                      <h4 className="mt-1 text-lg font-black text-primary">{contact.name}</h4>
                      <p className="text-xs font-bold text-secondary">{contact.designation}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{contact.role}</span>
                  </div>
                  <div className="mt-4 space-y-2 text-sm font-semibold text-secondary">
                    <p className="flex items-center gap-2"><Phone size={15} /> {contact.phone}</p>
                    <p className="flex items-center gap-2"><Mail size={15} /> {contact.email}</p>
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{contact.responsibility}</p>
                </div>
              ))}
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
