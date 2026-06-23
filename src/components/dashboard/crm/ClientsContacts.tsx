"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Search,
  ShieldAlert,
  Star,
  Target,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";

type Contact = {
  name: string;
  role: string;
  email: string;
  phone: string;
  influence: "Decision Maker" | "Finance" | "Technical" | "User" | "Gatekeeper";
  status: "Primary" | "Active" | "Warm" | "Inactive";
};

type ClientAccount = {
  id: string;
  company: string;
  industry: string;
  city: string;
  owner: string;
  health: "Excellent" | "Good" | "At Risk" | "New";
  stage: "Prospect" | "Active Client" | "Expansion" | "Renewal" | "Dormant";
  value: string;
  openDeals: number;
  lastTouch: string;
  nextAction: string;
  tags: string[];
  contacts: Contact[];
};

type NewClientForm = Omit<ClientAccount, "id" | "contacts" | "openDeals" | "tags"> & {
  tags: string;
};

const initialAccounts: ClientAccount[] = [
  {
    id: "ACC-24001",
    company: "Apex Finserve Pvt Ltd",
    industry: "FinTech",
    city: "Mumbai",
    owner: "Vikram Rathore",
    health: "Good",
    stage: "Active Client",
    value: "INR 18.4L",
    openDeals: 2,
    lastTouch: "Today, 11:20 AM",
    nextAction: "Send phase-2 CRM proposal",
    tags: ["High Value", "GST Verified", "TDS"],
    contacts: [
      { name: "Rohit Mehta", role: "Founder", email: "rohit@apexfin.com", phone: "+91 98765 43210", influence: "Decision Maker", status: "Primary" },
      { name: "Kavita Shah", role: "Finance Head", email: "accounts@apexfin.com", phone: "+91 98111 22334", influence: "Finance", status: "Active" },
      { name: "Aman Gupta", role: "Product Manager", email: "aman@apexfin.com", phone: "+91 97654 11220", influence: "Technical", status: "Warm" },
    ],
  },
  {
    id: "ACC-24002",
    company: "Nexa Retail Cloud",
    industry: "Retail SaaS",
    city: "Bengaluru",
    owner: "Sunita Sharma",
    health: "Excellent",
    stage: "Expansion",
    value: "INR 27.2L",
    openDeals: 3,
    lastTouch: "Yesterday, 04:45 PM",
    nextAction: "Schedule mobile app demo",
    tags: ["Expansion", "Mobile App", "Fast Payer"],
    contacts: [
      { name: "Priya Nair", role: "CEO", email: "priya@nexa.com", phone: "+91 99887 77665", influence: "Decision Maker", status: "Primary" },
      { name: "Manish Rao", role: "CTO", email: "manish@nexa.com", phone: "+91 99002 44002", influence: "Technical", status: "Active" },
      { name: "Ritu Menon", role: "Operations Lead", email: "ritu@nexa.com", phone: "+91 98450 76211", influence: "User", status: "Active" },
    ],
  },
  {
    id: "ACC-24003",
    company: "Bluebird Logistics",
    industry: "Logistics",
    city: "Delhi NCR",
    owner: "Rajesh Kumar",
    health: "At Risk",
    stage: "Renewal",
    value: "INR 9.6L",
    openDeals: 1,
    lastTouch: "3 days ago",
    nextAction: "Resolve payment escalation",
    tags: ["Renewal", "Payment Risk", "Support Open"],
    contacts: [
      { name: "Amit Soni", role: "Director", email: "amit@bluebird.in", phone: "+91 97111 88990", influence: "Decision Maker", status: "Warm" },
      { name: "Harshita Jain", role: "Accounts", email: "accounts@bluebird.in", phone: "+91 98102 22991", influence: "Finance", status: "Active" },
    ],
  },
  {
    id: "ACC-24004",
    company: "Orbit HR Tech",
    industry: "HRTech",
    city: "Pune",
    owner: "Anjali Singh",
    health: "New",
    stage: "Prospect",
    value: "INR 4.8L",
    openDeals: 1,
    lastTouch: "Today, 09:10 AM",
    nextAction: "Collect technical requirements",
    tags: ["New", "HRMS", "Discovery"],
    contacts: [
      { name: "Neel Kulkarni", role: "Co-founder", email: "neel@orbithr.com", phone: "+91 90222 54321", influence: "Decision Maker", status: "Primary" },
      { name: "Smita Patil", role: "HR Lead", email: "smita@orbithr.com", phone: "+91 90909 80808", influence: "User", status: "Active" },
    ],
  },
];

const blankClientForm: NewClientForm = {
  company: "",
  industry: "",
  city: "",
  owner: "Rajkumar Rathore",
  health: "New",
  stage: "Prospect",
  value: "INR 0.0L",
  lastTouch: "Just now",
  nextAction: "",
  tags: "New",
};

const blankContactForm: Contact = {
  name: "",
  role: "",
  email: "",
  phone: "",
  influence: "Decision Maker",
  status: "Primary",
};

const timeline = [
  { type: "Call", title: "Discovery call completed", detail: "Discussed lead scoring, loan officer dashboard, and reporting needs.", time: "Today, 11:20 AM", icon: Phone },
  { type: "Email", title: "Proposal draft shared internally", detail: "Finance needs milestone payment split before client send.", time: "Today, 12:05 PM", icon: Mail },
  { type: "Meeting", title: "Product demo scheduled", detail: "Demo with founder, finance head, and product manager.", time: "Tomorrow, 03:30 PM", icon: CalendarClock },
  { type: "Task", title: "Prepare account growth plan", detail: "Identify phase-2 modules: collections, reporting, WhatsApp automation.", time: "Friday", icon: Target },
];

const opportunities = [
  { id: "OPP-1021", name: "Phase-2 Collections CRM", stage: "Proposal", value: "INR 8.4L", probability: "70%", closeDate: "28 Jun 2026", owner: "Vikram" },
  { id: "OPP-1022", name: "WhatsApp Automation Pack", stage: "Discovery", value: "INR 2.8L", probability: "45%", closeDate: "12 Jul 2026", owner: "Anjali" },
  { id: "OPP-1023", name: "BI Dashboard Retainer", stage: "Negotiation", value: "INR 4.2L", probability: "80%", closeDate: "20 Jun 2026", owner: "Rajesh" },
];

const accountSignals = [
  { label: "Decision maker mapped", status: "Done", icon: CheckCircle2 },
  { label: "Finance contact mapped", status: "Done", icon: Wallet },
  { label: "Technical owner mapped", status: "Done", icon: BadgeIcon },
  { label: "Next follow-up scheduled", status: "Due", icon: CalendarClock },
  { label: "Open support escalation", status: "None", icon: ShieldAlert },
];

function toneForHealth(health: ClientAccount["health"]) {
  if (health === "Excellent") return "bg-green-50 text-green-700 border-green-200";
  if (health === "Good") return "bg-blue-50 text-blue-700 border-blue-200";
  if (health === "At Risk") return "bg-red-50 text-red-700 border-red-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

function toneForContact(status: Contact["status"]) {
  if (status === "Primary") return "bg-primary text-white border-primary";
  if (status === "Active") return "bg-green-50 text-green-700 border-green-200";
  if (status === "Warm") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
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
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
          <p className="mt-2 text-2xl font-black text-primary">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{helper}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-primary">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function BadgeIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return <BadgeCheckSvg size={size} className={className} />;
}

function BadgeCheckSvg({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" aria-hidden="true">
      <path d="M9 12.2l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 2.8l2.2 1.6 2.7-.1.8 2.6 2.2 1.6-.9 2.6.9 2.6-2.2 1.6-.8 2.6-2.7-.1L12 21.2l-2.2-1.6-2.7.1-.8-2.6-2.2-1.6.9-2.6-.9-2.6 2.2-1.6.8-2.6 2.7.1L12 2.8z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

export default function ClientsContacts() {
  const [accountItems, setAccountItems] = useState<ClientAccount[]>(initialAccounts);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccounts[0].id);
  const [searchTerm, setSearchTerm] = useState("");
  const [showClientForm, setShowClientForm] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [newClient, setNewClient] = useState<NewClientForm>(blankClientForm);
  const [newContact, setNewContact] = useState<Contact>(blankContactForm);

  const selectedAccount = useMemo(
    () => accountItems.find((account) => account.id === selectedAccountId) || accountItems[0],
    [accountItems, selectedAccountId]
  );

  const filteredAccounts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    if (!normalizedSearch) return accountItems;
    return accountItems.filter((account) =>
      [
        account.company,
        account.industry,
        account.city,
        account.owner,
        account.stage,
        account.health,
        ...account.tags,
        ...account.contacts.flatMap((contact) => [contact.name, contact.email, contact.phone, contact.role]),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [accountItems, searchTerm]);

  const totalContacts = accountItems.reduce((sum, account) => sum + account.contacts.length, 0);
  const atRiskCount = accountItems.filter((account) => account.health === "At Risk").length;

  const handleCreateClient = () => {
    if (!newClient.company.trim() || !newClient.owner.trim()) return;

    const client: ClientAccount = {
      ...newClient,
      id: `ACC-${Date.now().toString().slice(-5)}`,
      openDeals: 0,
      tags: newClient.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      contacts: [],
    };
    setAccountItems((current) => [client, ...current]);
    setSelectedAccountId(client.id);
    setNewClient(blankClientForm);
    setShowClientForm(false);
  };

  const handleCreateContact = () => {
    if (!newContact.name.trim() || !newContact.email.trim()) return;

    setAccountItems((current) =>
      current.map((account) =>
        account.id === selectedAccount.id
          ? {
              ...account,
              contacts: [newContact, ...account.contacts],
              lastTouch: "Just now",
              nextAction: `Follow up with ${newContact.name}`,
            }
          : account
      )
    );
    setNewContact(blankContactForm);
    setShowContactForm(false);
  };

  const handleExport = () => {
    const csvRows = [
      ["ID", "Company", "Industry", "City", "Owner", "Health", "Stage", "Value", "Contacts", "Next Action"],
      ...filteredAccounts.map((account) => [
        account.id,
        account.company,
        account.industry,
        account.city,
        account.owner,
        account.health,
        account.stage,
        account.value,
        String(account.contacts.length),
        account.nextAction,
      ]),
    ];
    const csv = csvRows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "clients-contacts.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
              <Building2 size={26} />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-[#1E293B]">Clients & Contacts</h2>
              <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                Relationship-first CRM view for accounts, decision makers, communication history, open deals, health, and next actions.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-black uppercase tracking-widest text-primary shadow-sm hover:bg-slate-50">
            <Download size={16} /> Export
          </button>
          <button onClick={() => setShowClientForm((current) => !current)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-white shadow-lg hover:bg-primary/90">
            <Plus size={16} /> Add Client
          </button>
          <button onClick={() => setShowContactForm((current) => !current)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-accent px-4 text-xs font-black uppercase tracking-widest text-primary shadow-lg hover:bg-accent/90">
            <UserCheck size={16} /> Add Contact
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Client Accounts" value={String(accountItems.length)} helper="Active CRM accounts" icon={Building2} />
        <MetricCard label="Contacts Mapped" value={String(totalContacts)} helper="Decision makers and users" icon={Users} />
        <MetricCard label="Open Deal Value" value="INR 60.0L" helper="Across active accounts" icon={Wallet} />
        <MetricCard label="At-risk Accounts" value={String(atRiskCount).padStart(2, "0")} helper="Needs escalation" icon={ShieldAlert} />
      </div>

      {showClientForm ? (
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-black text-primary">Add Client Account</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Create a local CRM account record for frontend validation.</p>
            </div>
            <button onClick={() => setShowClientForm(false)} className="h-9 rounded-xl bg-slate-50 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100">Close</button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input value={newClient.company} onChange={(e) => setNewClient((current) => ({ ...current, company: e.target.value }))} placeholder="Company name" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={newClient.industry} onChange={(e) => setNewClient((current) => ({ ...current, industry: e.target.value }))} placeholder="Industry" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={newClient.city} onChange={(e) => setNewClient((current) => ({ ...current, city: e.target.value }))} placeholder="City" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={newClient.owner} onChange={(e) => setNewClient((current) => ({ ...current, owner: e.target.value }))} placeholder="Owner" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <select value={newClient.health} onChange={(e) => setNewClient((current) => ({ ...current, health: e.target.value as ClientAccount["health"] }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
              {(["Excellent", "Good", "At Risk", "New"] as const).map((health) => <option key={health}>{health}</option>)}
            </select>
            <select value={newClient.stage} onChange={(e) => setNewClient((current) => ({ ...current, stage: e.target.value as ClientAccount["stage"] }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
              {(["Prospect", "Active Client", "Expansion", "Renewal", "Dormant"] as const).map((stage) => <option key={stage}>{stage}</option>)}
            </select>
            <input value={newClient.value} onChange={(e) => setNewClient((current) => ({ ...current, value: e.target.value }))} placeholder="Account value" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={newClient.tags} onChange={(e) => setNewClient((current) => ({ ...current, tags: e.target.value }))} placeholder="Tags comma separated" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={newClient.nextAction} onChange={(e) => setNewClient((current) => ({ ...current, nextAction: e.target.value }))} placeholder="Next action" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={handleCreateClient} className="h-11 rounded-xl bg-primary px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg">Save Client</button>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-primary">Account Directory</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Scan ownership, health, stage, and next action.</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="h-10 w-40 rounded-xl border border-border bg-slate-50 pl-9 pr-3 text-xs font-bold text-primary outline-none focus:ring-4 focus:ring-primary/10"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredAccounts.map((account) => {
              const isSelected = account.id === selectedAccountId;
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setSelectedAccountId(account.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isSelected ? "border-accent bg-accent/10 shadow-md" : "border-border bg-white hover:border-accent/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-primary">{account.company}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">{account.id} - {account.industry} - {account.city}</p>
                    </div>
                    <Badge className={toneForHealth(account.health)}>{account.health}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="font-black text-primary">{account.value}</p>
                      <p className="mt-1 font-semibold text-slate-400">Value</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="font-black text-primary">{account.openDeals}</p>
                      <p className="mt-1 font-semibold text-slate-400">Deals</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="font-black text-primary">{account.contacts.length}</p>
                      <p className="mt-1 font-semibold text-slate-400">Contacts</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs font-bold text-slate-500">
                    Owner: <span className="text-primary">{account.owner}</span>
                  </p>
                </button>
              );
            })}
            {filteredAccounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
                No accounts found
              </div>
            ) : null}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-black text-primary">{selectedAccount.company}</h3>
                  <Badge className={toneForHealth(selectedAccount.health)}>{selectedAccount.health}</Badge>
                  <Badge className="border-blue-200 bg-blue-50 text-blue-700">{selectedAccount.stage}</Badge>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {selectedAccount.industry} - {selectedAccount.city} - Account Owner: {selectedAccount.owner}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedAccount.tags.map((tag) => (
                  <Badge key={tag} className="border-slate-200 bg-slate-50 text-slate-600">{tag}</Badge>
                ))}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Wallet size={18} />
                  <p className="text-xs font-black uppercase tracking-widest">Account Value</p>
                </div>
                <p className="mt-2 text-2xl font-black text-primary">{selectedAccount.value}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Clock size={18} />
                  <p className="text-xs font-black uppercase tracking-widest">Last Touch</p>
                </div>
                <p className="mt-2 text-lg font-black text-primary">{selectedAccount.lastTouch}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-primary">
                  <Target size={18} />
                  <p className="text-xs font-black uppercase tracking-widest">Next Action</p>
                </div>
                <p className="mt-2 text-sm font-black leading-6 text-primary">{selectedAccount.nextAction}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-lg font-black text-primary">Contact Map</h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">Decision makers, finance contacts, technical owners, and daily users.</p>
              </div>
              <button onClick={() => setShowContactForm((current) => !current)} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-white px-4 text-xs font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                <Plus size={15} /> Add Contact
              </button>
            </div>

            {showContactForm ? (
              <div className="mb-5 rounded-2xl border border-border bg-slate-50 p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input value={newContact.name} onChange={(e) => setNewContact((current) => ({ ...current, name: e.target.value }))} placeholder="Contact name" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={newContact.role} onChange={(e) => setNewContact((current) => ({ ...current, role: e.target.value }))} placeholder="Role" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={newContact.email} onChange={(e) => setNewContact((current) => ({ ...current, email: e.target.value }))} placeholder="Email" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
                  <input value={newContact.phone} onChange={(e) => setNewContact((current) => ({ ...current, phone: e.target.value }))} placeholder="Phone" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
                  <select value={newContact.influence} onChange={(e) => setNewContact((current) => ({ ...current, influence: e.target.value as Contact["influence"] }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                    {(["Decision Maker", "Finance", "Technical", "User", "Gatekeeper"] as const).map((influence) => <option key={influence}>{influence}</option>)}
                  </select>
                  <select value={newContact.status} onChange={(e) => setNewContact((current) => ({ ...current, status: e.target.value as Contact["status"] }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
                    {(["Primary", "Active", "Warm", "Inactive"] as const).map((status) => <option key={status}>{status}</option>)}
                  </select>
                </div>
                <div className="mt-4 flex justify-end">
                  <button onClick={handleCreateContact} className="h-10 rounded-xl bg-accent px-5 text-xs font-black uppercase tracking-widest text-primary shadow-lg">
                    Save Contact
                  </button>
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {selectedAccount.contacts.map((contact) => (
                <div key={contact.email} className="rounded-2xl border border-border bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-sm font-black text-white">
                        {contact.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-primary">{contact.name}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{contact.role} - {contact.influence}</p>
                      </div>
                    </div>
                    <Badge className={toneForContact(contact.status)}>{contact.status}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 text-xs font-bold text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-primary" /> {contact.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-primary" /> {contact.phone}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-primary shadow-sm hover:bg-slate-100">
                      <Phone size={14} /> Call
                    </a>
                    <a href={`https://wa.me/${contact.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-primary shadow-sm hover:bg-slate-100">
                      <MessageSquare size={14} /> WhatsApp
                    </a>
                    <a href={`mailto:${contact.email}`} className="flex h-9 flex-1 items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-primary shadow-sm hover:bg-slate-100">
                      <Mail size={14} /> Email
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2 rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-primary">Relationship Timeline</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Unified activity history for account management.</p>
            </div>
            <Badge className="border-green-200 bg-green-50 text-green-700">Live CRM Feed</Badge>
          </div>
          <div className="space-y-4">
            {timeline.map((item) => {
              const Icon = item.icon;
              return (
                <div key={`${item.type}-${item.time}`} className="relative border-l-2 border-slate-100 pl-6">
                  <div className="absolute -left-[11px] top-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-accent bg-white">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                  <div className="rounded-2xl border border-border bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                          <Icon size={18} />
                        </div>
                        <div>
                          <p className="font-black text-primary">{item.title}</p>
                          <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{item.detail}</p>
                        </div>
                      </div>
                      <Badge className="border-slate-200 bg-white text-slate-500">{item.time}</Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-black text-primary">Account Intelligence</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Quick relationship quality checks for account managers.</p>
          </div>
          <div className="space-y-3">
            {accountSignals.map((signal) => {
              const Icon = signal.icon;
              const tone =
                signal.status === "Done"
                  ? "border-green-200 bg-green-50 text-green-700"
                  : signal.status === "Due"
                    ? "border-amber-200 bg-amber-50 text-amber-700"
                    : "border-blue-200 bg-blue-50 text-blue-700";
              return (
                <div key={signal.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                      <Icon size={17} />
                    </div>
                    <p className="text-sm font-black text-primary">{signal.label}</p>
                  </div>
                  <Badge className={tone}>{signal.status}</Badge>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Open Opportunities</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Account-level sales opportunities linked with the client relationship.</p>
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-white">
            <Plus size={15} /> New Opportunity
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Opportunity", "Stage", "Value", "Probability", "Close Date", "Owner"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {opportunities.map((opportunity) => (
                <tr key={opportunity.id} className="text-sm">
                  <td className="px-4 py-4">
                    <p className="font-black text-primary">{opportunity.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{opportunity.id}</p>
                  </td>
                  <td className="px-4 py-4">
                    <Badge className="border-blue-200 bg-blue-50 text-blue-700">{opportunity.stage}</Badge>
                  </td>
                  <td className="px-4 py-4 font-black text-primary">{opportunity.value}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{opportunity.probability}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{opportunity.closeDate}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{opportunity.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <Star className="text-accent" size={24} />
            <h3 className="text-lg font-black">Account Playbook</h3>
          </div>
          <div className="mt-6 space-y-4">
            {[
              ["Primary contact", "Always map at least one decision maker and one finance contact."],
              ["Next action", "Every active client must have one upcoming task or meeting."],
              ["Health score", "At-risk accounts should trigger support and collection review."],
              ["Expansion", "Track open deal value separately from billed accounting revenue."],
            ].map(([title, detail]) => (
              <div key={title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-accent" />
                  <p className="text-sm font-black">{title}</p>
                </div>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{detail}</p>
              </div>
            ))}
          </div>
      </section>
    </div>
  );
}
