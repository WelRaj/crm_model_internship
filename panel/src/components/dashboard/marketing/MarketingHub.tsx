"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BadgeIndianRupee,
  Bot,
  CalendarClock,
  Download,
  Edit3,
  Filter,
  Gauge,
  Globe2,
  IndianRupee,
  LineChart,
  Megaphone,
  MessageCircle,
  MousePointerClick,
  Plus,
  Search,
  Send,
  Share2,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

import {
  createMarketingCampaign,
  createMarketingSource,
  listMarketingCampaigns,
  listMarketingSources,
  updateMarketingCampaign,
  updateMarketingSource,
  type CampaignChannel,
  type CampaignStatus,
  type LeadSourcePayload,
  type SourceQuality,
  type SourceStatus,
  type SourceType,
  type MarketingCampaignPayload,
} from "@/services/marketing-api";

type MarketingView = "campaigns" | "roi" | "sources";
type Tone = "blue" | "green" | "amber" | "red" | "purple" | "slate" | "cyan";

type CampaignRecord = {
  backendId: string;
  id: string;
  name: string;
  channel: CampaignChannel;
  objective: string;
  audienceSegment: string;
  budgetAmount: number;
  spentAmount: number;
  leads: number;
  mql: number;
  pipelineAmount: number;
  startDate: string;
  endDate: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  landingPage: string;
  leadForm: string;
  owner: string;
  status: CampaignStatus;
  nextAction: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type CampaignFormState = Omit<CampaignRecord, "backendId" | "id" | "isActive" | "createdAt" | "updatedAt">;
type RoiChannelRow = {
  channel: CampaignChannel;
  spendAmount: number;
  leads: number;
  cpl: number;
  mql: number;
  cac: number;
  pipelineAmount: number;
  roi: number;
  campaignCount: number;
};

type LeadSourceRecord = {
  backendId: string;
  id: string;
  source: string;
  type: SourceType;
  normalizedKey: string;
  defaultUtmSource: string;
  defaultUtmMedium: string;
  owner: string;
  quality: SourceQuality;
  leads: number;
  mql: number;
  sql: number;
  won: number;
  last30Change: number;
  status: SourceStatus;
  nextAction: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type LeadSourceFormState = Omit<LeadSourceRecord, "backendId" | "id" | "isActive" | "createdAt" | "updatedAt">;

const toneClasses: Record<Tone, string> = {
  blue: "border-blue-200 bg-blue-50 text-blue-700",
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-700",
  purple: "border-purple-200 bg-purple-50 text-purple-700",
  slate: "border-slate-200 bg-slate-50 text-slate-600",
  cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
};

const campaignChannels: CampaignChannel[] = ["Google Search", "LinkedIn Ads", "Meta Ads", "WhatsApp", "Email", "Webinar", "Marketplace"];
const campaignStatuses: CampaignStatus[] = ["Draft", "Active", "Review", "Scale", "Archived"];
const sourceTypes: SourceType[] = ["Organic", "Paid", "Referral", "Outbound", "Event", "Partner", "Offline"];
const sourceStatuses: SourceStatus[] = ["Active", "Review", "Paused", "Archived"];
const sourceQualities: SourceQuality[] = ["High", "High Intent", "Enterprise", "Warm", "Mixed", "Nurture", "Low"];

const blankCampaignForm: CampaignFormState = {
  name: "",
  channel: "Google Search",
  objective: "",
  audienceSegment: "",
  budgetAmount: 0,
  spentAmount: 0,
  leads: 0,
  mql: 0,
  pipelineAmount: 0,
  startDate: "2026-06-23",
  endDate: "2026-07-23",
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  landingPage: "",
  leadForm: "",
  owner: "Marketing",
  status: "Draft",
  nextAction: "",
};

const blankSourceForm: LeadSourceFormState = {
  source: "",
  type: "Organic",
  normalizedKey: "",
  defaultUtmSource: "",
  defaultUtmMedium: "",
  owner: "Marketing",
  quality: "Mixed",
  leads: 0,
  mql: 0,
  sql: 0,
  won: 0,
  last30Change: 0,
  status: "Active",
  nextAction: "",
};

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString("en-IN")}`;
}

function formatRoas(campaign: Pick<CampaignRecord, "spentAmount" | "pipelineAmount">) {
  if (campaign.spentAmount <= 0) return "0.0x";
  return `${(campaign.pipelineAmount / campaign.spentAmount).toFixed(1)}x`;
}

function formatRatio(value: number) {
  return `${value.toFixed(1)}x`;
}

function roiTone(value: number): Tone {
  if (value >= 5) return "green";
  if (value >= 3) return "blue";
  if (value >= 1.5) return "amber";
  return "red";
}

function aggregateRoiByChannel(campaigns: CampaignRecord[]): RoiChannelRow[] {
  const rows = new Map<CampaignChannel, RoiChannelRow>();
  campaigns.forEach((campaign) => {
    const current = rows.get(campaign.channel) || {
      channel: campaign.channel,
      spendAmount: 0,
      leads: 0,
      cpl: 0,
      mql: 0,
      cac: 0,
      pipelineAmount: 0,
      roi: 0,
      campaignCount: 0,
    };
    current.spendAmount += campaign.spentAmount;
    current.leads += campaign.leads;
    current.mql += campaign.mql;
    current.pipelineAmount += campaign.pipelineAmount;
    current.campaignCount += 1;
    rows.set(campaign.channel, current);
  });

  return Array.from(rows.values())
    .map((row) => ({
      ...row,
      cpl: row.leads > 0 ? row.spendAmount / row.leads : 0,
      cac: row.mql > 0 ? row.spendAmount / row.mql : 0,
      roi: row.spendAmount > 0 ? row.pipelineAmount / row.spendAmount : 0,
    }))
    .sort((a, b) => b.pipelineAmount - a.pipelineAmount);
}

function campaignStatusTone(status: CampaignStatus): Tone {
  if (status === "Scale") return "green";
  if (status === "Review") return "amber";
  if (status === "Active") return "blue";
  if (status === "Archived") return "slate";
  return "purple";
}

function csvEscape(value: string | number) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function sourceConversion(source: Pick<LeadSourceRecord, "leads" | "sql">) {
  if (source.leads <= 0) return 0;
  return (source.sql / source.leads) * 100;
}

function sourceQualityTone(quality: SourceQuality): Tone {
  if (quality === "High" || quality === "High Intent" || quality === "Warm") return "green";
  if (quality === "Enterprise") return "blue";
  if (quality === "Nurture") return "cyan";
  if (quality === "Mixed") return "amber";
  return "red";
}

function sourceStatusTone(status: SourceStatus): Tone {
  if (status === "Active") return "green";
  if (status === "Review") return "amber";
  if (status === "Paused") return "blue";
  return "slate";
}

function normalizeSourceKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
}

function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

function ActionButton({
  icon: Icon,
  children,
  variant = "outline",
  onClick,
  type = "button",
}: {
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
  variant?: "primary" | "outline" | "accent";
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  const styles = {
    primary: "bg-primary text-white border-primary",
    outline: "bg-white text-primary border-border hover:bg-slate-50",
    accent: "bg-accent text-primary border-accent hover:bg-accent/90",
  };

  return (
    <button type={type} onClick={onClick} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all ${styles[variant]}`}>
      <Icon size={16} />
      {children}
    </button>
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
  icon: React.ComponentType<{ size?: number }>;
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

function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "blue" | "amber" | "purple" }) {
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${colors[tone]}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function CampaignsView({ campaigns }: { campaigns: CampaignRecord[] }) {
  const [campaignItems, setCampaignItems] = useState<CampaignRecord[]>(campaigns);
  const [form, setForm] = useState<CampaignFormState>(blankCampaignForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<"All" | CampaignChannel>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | CampaignStatus>("All");
  const [validationError, setValidationError] = useState("");

  const filteredCampaigns = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return campaignItems.filter((campaign) => {
      const matchesSearch = !normalizedSearch || [
        campaign.id,
        campaign.name,
        campaign.channel,
        campaign.objective,
        campaign.audienceSegment,
        campaign.owner,
        campaign.utmSource,
        campaign.utmMedium,
        campaign.utmCampaign,
        campaign.landingPage,
        campaign.leadForm,
        campaign.nextAction,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesChannel = channelFilter === "All" || campaign.channel === channelFilter;
      const matchesStatus = statusFilter === "All" || campaign.status === statusFilter;
      return matchesSearch && matchesChannel && matchesStatus;
    });
  }, [campaignItems, channelFilter, searchTerm, statusFilter]);

  const activeCampaigns = campaignItems.filter((campaign) => campaign.status !== "Archived");
  const activeSpend = activeCampaigns.reduce((sum, campaign) => sum + campaign.spentAmount, 0);
  const activeBudget = activeCampaigns.reduce((sum, campaign) => sum + campaign.budgetAmount, 0);
  const generatedLeads = activeCampaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
  const qualifiedLeads = activeCampaigns.reduce((sum, campaign) => sum + campaign.mql, 0);
  const spendPercent = activeBudget > 0 ? Math.round((activeSpend / activeBudget) * 100) : 0;

  const resetForm = () => {
    setForm(blankCampaignForm);
    setEditingId(null);
    setValidationError("");
  };

  const openNewCampaign = () => {
    resetForm();
    setShowForm(true);
  };

  const handleExport = () => {
    const rows = [
      ["ID", "Name", "Channel", "Objective", "Audience", "Budget", "Spent", "Leads", "MQL", "Pipeline", "ROAS", "Start Date", "End Date", "UTM Source", "UTM Medium", "UTM Campaign", "Landing Page", "Lead Form", "Owner", "Status", "Next Action"],
      ...filteredCampaigns.map((campaign) => [
        campaign.id,
        campaign.name,
        campaign.channel,
        campaign.objective,
        campaign.audienceSegment,
        campaign.budgetAmount,
        campaign.spentAmount,
        campaign.leads,
        campaign.mql,
        campaign.pipelineAmount,
        formatRoas(campaign),
        campaign.startDate,
        campaign.endDate,
        campaign.utmSource,
        campaign.utmMedium,
        campaign.utmCampaign,
        campaign.landingPage,
        campaign.leadForm,
        campaign.owner,
        campaign.status,
        campaign.nextAction,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "marketing-campaigns.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleNumberChange = (field: "budgetAmount" | "spentAmount" | "leads" | "mql" | "pipelineAmount", value: string) => {
    setForm((current) => ({ ...current, [field]: Math.max(0, Number(value) || 0) }));
  };

  const handleEdit = (campaign: CampaignRecord) => {
    setForm({
      name: campaign.name,
      channel: campaign.channel,
      objective: campaign.objective,
      audienceSegment: campaign.audienceSegment,
      budgetAmount: campaign.budgetAmount,
      spentAmount: campaign.spentAmount,
      leads: campaign.leads,
      mql: campaign.mql,
      pipelineAmount: campaign.pipelineAmount,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      utmSource: campaign.utmSource,
      utmMedium: campaign.utmMedium,
      utmCampaign: campaign.utmCampaign,
      landingPage: campaign.landingPage,
      leadForm: campaign.leadForm,
      owner: campaign.owner,
      status: campaign.status,
      nextAction: campaign.nextAction,
    });
    setEditingId(campaign.backendId);
    setValidationError("");
    setShowForm(true);
  };

  const handleArchiveToggle = async (campaign: CampaignRecord) => {
    try {
      const nextStatus: CampaignStatus = campaign.status === "Archived" ? "Review" : "Archived";
      const saved = await updateMarketingCampaign(campaign.backendId, {
        status: nextStatus,
        next_action: nextStatus === "Archived" ? "Archived from active campaign view" : "Review restored campaign before scaling",
      });
      setCampaignItems((current) => current.map((item) => (item.backendId === saved.backendId ? saved : item)));
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleSave = async () => {
    const requiredFields = [form.name, form.objective, form.audienceSegment, form.owner, form.utmSource, form.utmMedium, form.utmCampaign, form.landingPage, form.leadForm, form.nextAction];
    if (requiredFields.some((field) => !field.trim())) {
      setValidationError("Campaign name, objective, audience, owner, UTM, landing page, lead form and next action are required.");
      return;
    }
    if (form.budgetAmount <= 0) {
      setValidationError("Budget must be greater than zero.");
      return;
    }
    if (form.spentAmount > form.budgetAmount) {
      setValidationError("Spent amount cannot be higher than budget.");
      return;
    }
    if (form.mql > form.leads) {
      setValidationError("MQL count cannot be higher than total leads.");
      return;
    }
    if (form.startDate > form.endDate) {
      setValidationError("End date must be after start date.");
      return;
    }

    const payload: MarketingCampaignPayload = {
      name: form.name,
      channel: form.channel,
      objective: form.objective,
      audience_segment: form.audienceSegment,
      budget_amount: String(form.budgetAmount),
      spent_amount: String(form.spentAmount),
      leads: form.leads,
      mql: form.mql,
      pipeline_amount: String(form.pipelineAmount),
      start_date: form.startDate,
      end_date: form.endDate,
      utm_source: form.utmSource,
      utm_medium: form.utmMedium,
      utm_campaign: form.utmCampaign,
      landing_page: form.landingPage,
      lead_form: form.leadForm,
      owner: form.owner,
      status: form.status,
      next_action: form.nextAction,
    };

    try {
      const saved = editingId ? await updateMarketingCampaign(editingId, payload) : await createMarketingCampaign(payload);
      setCampaignItems((current) =>
        editingId ? current.map((item) => (item.backendId === saved.backendId ? saved : item)) : [saved, ...current]
      );
      resetForm();
      setShowForm(false);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <ActionButton icon={Download} onClick={handleExport}>Export</ActionButton>
        <ActionButton icon={Filter} onClick={() => setStatusFilter((current) => current === "Archived" ? "All" : "Archived")}>Archived</ActionButton>
        <ActionButton icon={Plus} variant="accent" onClick={openNewCampaign}>New Campaign</ActionButton>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Campaigns" value={String(activeCampaigns.length)} helper={`${new Set(activeCampaigns.map((campaign) => campaign.channel)).size} channels live`} icon={Megaphone} tone="blue" />
        <MetricCard label="Monthly Spend" value={formatCurrency(activeSpend)} helper={`${spendPercent}% budget consumed`} icon={Wallet} tone="amber" />
        <MetricCard label="Generated Leads" value={generatedLeads.toLocaleString("en-IN")} helper="From active campaigns" icon={Users} tone="green" />
        <MetricCard label="Qualified Leads" value={qualifiedLeads.toLocaleString("en-IN")} helper="MQL captured for Client Operations handoff" icon={Bot} tone="purple" />
      </div>

      {showForm ? (
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-black text-primary">{editingId ? "Edit Campaign" : "Create Campaign"}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Required fields keep campaign attribution clean for leads, ROI and future backend sync.</p>
            </div>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
              <X size={14} /> Close
            </button>
          </div>
          {validationError ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{validationError}</div> : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Campaign name" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <select value={form.channel} onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value as CampaignChannel }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
              {campaignChannels.map((channel) => <option key={channel}>{channel}</option>)}
            </select>
            <input value={form.objective} onChange={(event) => setForm((current) => ({ ...current, objective: event.target.value }))} placeholder="Objective" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.audienceSegment} onChange={(event) => setForm((current) => ({ ...current, audienceSegment: event.target.value }))} placeholder="Audience segment" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="number" min="0" value={form.budgetAmount} onChange={(event) => handleNumberChange("budgetAmount", event.target.value)} placeholder="Budget amount" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="number" min="0" value={form.spentAmount} onChange={(event) => handleNumberChange("spentAmount", event.target.value)} placeholder="Spent amount" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="number" min="0" value={form.leads} onChange={(event) => handleNumberChange("leads", event.target.value)} placeholder="Leads" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="number" min="0" value={form.mql} onChange={(event) => handleNumberChange("mql", event.target.value)} placeholder="MQL" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="number" min="0" value={form.pipelineAmount} onChange={(event) => handleNumberChange("pipelineAmount", event.target.value)} placeholder="Pipeline amount" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="date" value={form.startDate} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="date" value={form.endDate} onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as CampaignStatus }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
              {campaignStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <input value={form.utmSource} onChange={(event) => setForm((current) => ({ ...current, utmSource: event.target.value }))} placeholder="UTM source" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.utmMedium} onChange={(event) => setForm((current) => ({ ...current, utmMedium: event.target.value }))} placeholder="UTM medium" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.utmCampaign} onChange={(event) => setForm((current) => ({ ...current, utmCampaign: event.target.value }))} placeholder="UTM campaign" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.landingPage} onChange={(event) => setForm((current) => ({ ...current, landingPage: event.target.value }))} placeholder="Landing page" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.leadForm} onChange={(event) => setForm((current) => ({ ...current, leadForm: event.target.value }))} placeholder="Lead form" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.owner} onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))} placeholder="Owner" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.nextAction} onChange={(event) => setForm((current) => ({ ...current, nextAction: event.target.value }))} placeholder="Next action" className="md:col-span-3 h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <div className="mt-5 flex justify-end">
            <ActionButton icon={Plus} variant="primary" onClick={handleSave}>{editingId ? "Save Changes" : "Save Campaign"}</ActionButton>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Growth Campaign Control</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Track channel, objective, spend, MQLs, pipeline, and scale decisions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">UTM Tracked</Badge>
            <Badge tone="purple">AI Lead Scoring</Badge>
            <Badge tone="blue">Attribution Ready</Badge>
          </div>
        </div>
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search campaign, owner, UTM, landing page..." className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value as "All" | CampaignChannel)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {campaignChannels.map((channel) => <option key={channel}>{channel}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | CampaignStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {campaignStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[1320px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Campaign", "Channel", "Objective", "Budget", "Spent", "Leads", "MQL", "Pipeline", "ROAS", "Dates", "Owner", "Status", "Actions"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCampaigns.map((campaign) => (
                <tr key={campaign.id} className="text-sm">
                  <td className="px-4 py-4">
                    <p className="font-black text-primary">{campaign.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{campaign.id} - {campaign.utmCampaign}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{campaign.channel}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{campaign.objective}</td>
                  <td className="px-4 py-4 font-black text-primary">{formatCurrency(campaign.budgetAmount)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{formatCurrency(campaign.spentAmount)}</td>
                  <td className="px-4 py-4 font-black text-primary">{campaign.leads}</td>
                  <td className="px-4 py-4 font-black text-primary">{campaign.mql}</td>
                  <td className="px-4 py-4 font-black text-primary">{formatCurrency(campaign.pipelineAmount)}</td>
                  <td className="px-4 py-4 font-black text-green-600">{formatRoas(campaign)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{campaign.startDate} to {campaign.endDate}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{campaign.owner}</td>
                  <td className="px-4 py-4">
                    <Badge tone={campaignStatusTone(campaign.status)}>{campaign.status}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => handleEdit(campaign)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                        <Edit3 size={14} /> Edit
                      </button>
                      <button type="button" onClick={() => void handleArchiveToggle(campaign)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                        <Archive size={14} /> {campaign.status === "Archived" ? "Restore" : "Archive"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCampaigns.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
            No campaigns match the current search or filters
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-primary">2026 Growth Campaign Stack</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Campaign setup expected for fintech acquisition and trading software demand generation.</p>
          <div className="mt-5 space-y-3">
            {[
              [Sparkles, "AI lead scoring", "Auto score based on source, behavior, budget, role and urgency."],
              [Globe2, "UTM discipline", "Campaign, source, medium, ad group and keyword captured on every lead."],
              [MessageCircle, "WhatsApp nurture", "Warm leads get automated but human-controlled WhatsApp follow-ups."],
              [CalendarClock, "Retargeting windows", "7-day, 15-day and 30-day audiences by intent level."],
            ].map(([Icon, title, text]) => {
              const StackIcon = Icon as typeof Sparkles;
              return (
                <div key={title as string} className="flex gap-3 rounded-2xl border border-border bg-slate-50 p-4">
                  <StackIcon className="mt-1 text-primary" size={18} />
                  <div>
                    <p className="text-sm font-black text-primary">{title as string}</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{text as string}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="xl:col-span-2 rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
          <div className="flex items-center gap-3">
            <Target className="text-accent" size={24} />
            <h3 className="text-lg font-black">Campaign Backend Shape</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {["name", "objective", "channel", "audienceSegment", "budgetAmount", "spentAmount", "startDate / endDate", "utmSource / utmMedium / utmCampaign", "landingPage", "leadForm", "owner", "nextAction"].map((field) => (
              <div key={field} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-black">{field}</p>
                <p className="mt-1 text-xs font-semibold text-slate-300">Required for clean attribution and follow-up automation.</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function RoiView({ campaigns }: { campaigns: CampaignRecord[] }) {
  const [channelFilter, setChannelFilter] = useState<"All" | CampaignChannel>("All");
  const [campaignFilter, setCampaignFilter] = useState("All");
  const [startDate, setStartDate] = useState("2026-06-01");
  const [endDate, setEndDate] = useState("2026-07-05");
  const [reportMessage, setReportMessage] = useState("");

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesChannel = channelFilter === "All" || campaign.channel === channelFilter;
      const matchesCampaign = campaignFilter === "All" || campaign.id === campaignFilter;
      const overlapsDateRange = campaign.endDate >= startDate && campaign.startDate <= endDate;
      return campaign.status !== "Archived" && matchesChannel && matchesCampaign && overlapsDateRange;
    });
  }, [campaignFilter, campaigns, channelFilter, endDate, startDate]);

  const channelRows = useMemo(() => aggregateRoiByChannel(filteredCampaigns), [filteredCampaigns]);
  const totalSpend = filteredCampaigns.reduce((sum, campaign) => sum + campaign.spentAmount, 0);
  const totalPipeline = filteredCampaigns.reduce((sum, campaign) => sum + campaign.pipelineAmount, 0);
  const totalLeads = filteredCampaigns.reduce((sum, campaign) => sum + campaign.leads, 0);
  const totalMql = filteredCampaigns.reduce((sum, campaign) => sum + campaign.mql, 0);
  const blendedRoi = totalSpend > 0 ? totalPipeline / totalSpend : 0;
  const avgCac = totalMql > 0 ? totalSpend / totalMql : 0;
  const bestChannel = channelRows[0]?.channel || "No channel";
  const funnelSteps = [
    { label: "Campaigns", value: String(filteredCampaigns.length), percent: 100 },
    { label: "Leads", value: totalLeads.toLocaleString("en-IN"), percent: totalLeads > 0 ? 78 : 0 },
    { label: "MQL", value: totalMql.toLocaleString("en-IN"), percent: totalLeads > 0 ? Math.round((totalMql / totalLeads) * 100) : 0 },
    { label: "Pipeline", value: formatCurrency(totalPipeline), percent: blendedRoi > 0 ? Math.min(100, Math.round(blendedRoi * 12)) : 0 },
  ];

  const handleExport = () => {
    const rows = [
      ["Channel", "Spend", "Leads", "CPL", "MQL", "CAC", "Pipeline", "ROI", "Campaigns"],
      ...channelRows.map((row) => [
        row.channel,
        row.spendAmount,
        row.leads,
        Math.round(row.cpl),
        row.mql,
        Math.round(row.cac),
        row.pipelineAmount,
        formatRatio(row.roi),
        row.campaignCount,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "marketing-roi.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleSendReport = () => {
    setReportMessage(`ROI report prepared for ${filteredCampaigns.length} campaigns from ${startDate} to ${endDate}. Blended ROI: ${formatRatio(blendedRoi)}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <ActionButton icon={Download} onClick={handleExport}>Export</ActionButton>
        <ActionButton icon={Filter} onClick={() => { setChannelFilter("All"); setCampaignFilter("All"); }}>Clear Filters</ActionButton>
        <ActionButton icon={Send} variant="accent" onClick={handleSendReport}>Send Report</ActionButton>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Marketing Spend" value={formatCurrency(totalSpend)} helper={`${filteredCampaigns.length} campaign records`} icon={IndianRupee} tone="amber" />
        <MetricCard label="Pipeline Created" value={formatCurrency(totalPipeline)} helper="Attributed campaign pipeline" icon={TrendingUp} tone="green" />
        <MetricCard label="Blended ROI" value={formatRatio(blendedRoi)} helper="Pipeline divided by spend" icon={Gauge} tone="blue" />
        <MetricCard label="Avg CAC" value={formatCurrency(Math.round(avgCac))} helper="Spend per qualified lead" icon={BadgeIndianRupee} tone="purple" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[180px_220px_1fr_1fr]">
          <select value={channelFilter} onChange={(event) => setChannelFilter(event.target.value as "All" | CampaignChannel)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {campaignChannels.map((channel) => <option key={channel}>{channel}</option>)}
          </select>
          <select value={campaignFilter} onChange={(event) => setCampaignFilter(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option value="All">All Campaigns</option>
            {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
        </div>
        {reportMessage ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-xs font-black text-green-700">{reportMessage}</div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-black text-primary">ROI by Channel</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Calculated from campaign spend, leads, MQL, and attributed pipeline.</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {["Channel", "Campaigns", "Spend", "Leads", "CPL", "MQL", "CAC", "Pipeline", "ROI"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {channelRows.map((row) => (
                  <tr key={row.channel} className="text-sm">
                    <td className="px-4 py-4 font-black text-primary">{row.channel}</td>
                    <td className="px-4 py-4 font-black text-primary">{row.campaignCount}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{formatCurrency(row.spendAmount)}</td>
                    <td className="px-4 py-4 font-black text-primary">{row.leads}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{formatCurrency(Math.round(row.cpl))}</td>
                    <td className="px-4 py-4 font-black text-primary">{row.mql}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{formatCurrency(Math.round(row.cac))}</td>
                    <td className="px-4 py-4 font-black text-primary">{formatCurrency(row.pipelineAmount)}</td>
                    <td className="px-4 py-4">
                      <Badge tone={roiTone(row.roi)}>{formatRatio(row.roi)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {channelRows.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
              No ROI records match the selected filters
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-primary">Funnel Conversion</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Filtered campaign-to-pipeline snapshot.</p>
          <div className="mt-6 space-y-5">
            {funnelSteps.map((step, index) => (
              <div key={step.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-primary">{step.label}</p>
                    <p className="text-xs font-semibold text-slate-500">{step.value}</p>
                  </div>
                  <Badge tone={index < 2 ? "blue" : index < 4 ? "amber" : "green"}>{step.percent}%</Badge>
                </div>
                <ProgressBar value={step.percent} tone={index < 2 ? "blue" : index < 4 ? "amber" : "green"} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <LineChart className="text-primary" size={22} />
          <div>
            <h3 className="text-lg font-black text-primary">Attribution Model</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">2026-ready growth analytics should not judge ROI only by first lead source.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ["Best Channel", `${bestChannel} has the highest attributed pipeline in the current filter.`],
            ["Spend Source", "Spend comes from campaign records and should later map to Finance Control bills."],
            ["Revenue Source", "Pipeline is still marketing-attributed and must later reconcile with Client Operations, Delivery Projects, and Finance Control APIs."],
            ["Report State", "Export and report actions use the selected date, campaign, and channel filters."],
          ].map(([title, text]) => (
            <div key={title} className="rounded-2xl border border-border bg-slate-50 p-4">
              <p className="text-sm font-black text-primary">{title}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SourcesView({ sources }: { sources: LeadSourceRecord[] }) {
  const [sourceItems, setSourceItems] = useState<LeadSourceRecord[]>(sources);
  const [form, setForm] = useState<LeadSourceFormState>(blankSourceForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | SourceType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | SourceStatus>("All");
  const [validationError, setValidationError] = useState("");

  const filteredSources = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return sourceItems.filter((source) => {
      const matchesSearch = !normalizedSearch || [
        source.id,
        source.source,
        source.type,
        source.normalizedKey,
        source.defaultUtmSource,
        source.defaultUtmMedium,
        source.owner,
        source.quality,
        source.nextAction,
      ].join(" ").toLowerCase().includes(normalizedSearch);
      const matchesType = typeFilter === "All" || source.type === typeFilter;
      const matchesStatus = statusFilter === "All" || source.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, sourceItems, statusFilter, typeFilter]);

  const activeSources = sourceItems.filter((source) => source.status !== "Archived");
  const totalLeads = activeSources.reduce((sum, source) => sum + source.leads, 0);
  const totalSql = activeSources.reduce((sum, source) => sum + source.sql, 0);
  const activeReviewCount = activeSources.filter((source) => source.status === "Review" || source.quality === "Mixed" || source.quality === "Low").length;
  const topSource = [...activeSources].sort((a, b) => b.sql - a.sql)[0];
  const warmestSource = [...activeSources].sort((a, b) => sourceConversion(b) - sourceConversion(a))[0];

  const resetForm = () => {
    setForm(blankSourceForm);
    setEditingId(null);
    setValidationError("");
  };

  const openNewSource = () => {
    resetForm();
    setShowForm(true);
  };

  const handleNumberChange = (field: "leads" | "mql" | "sql" | "won" | "last30Change", value: string) => {
    const nextValue = field === "last30Change" ? Number(value) || 0 : Math.max(0, Number(value) || 0);
    setForm((current) => ({ ...current, [field]: nextValue }));
  };

  const handleEdit = (source: LeadSourceRecord) => {
    setForm({
      source: source.source,
      type: source.type,
      normalizedKey: source.normalizedKey,
      defaultUtmSource: source.defaultUtmSource,
      defaultUtmMedium: source.defaultUtmMedium,
      owner: source.owner,
      quality: source.quality,
      leads: source.leads,
      mql: source.mql,
      sql: source.sql,
      won: source.won,
      last30Change: source.last30Change,
      status: source.status,
      nextAction: source.nextAction,
    });
    setEditingId(source.backendId);
    setValidationError("");
    setShowForm(true);
  };

  const handleArchiveToggle = async (source: LeadSourceRecord) => {
    try {
      const nextStatus: SourceStatus = source.status === "Archived" ? "Review" : "Archived";
      const saved = await updateMarketingSource(source.backendId, {
        status: nextStatus,
        next_action: nextStatus === "Archived" ? "Archived from active source attribution" : "Review restored source mapping",
      });
      setSourceItems((current) => current.map((item) => (item.backendId === saved.backendId ? saved : item)));
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleSave = async () => {
    const normalizedKey = form.normalizedKey.trim() || normalizeSourceKey(form.source);
    const requiredFields = [form.source, normalizedKey, form.defaultUtmSource, form.defaultUtmMedium, form.owner, form.nextAction];
    if (requiredFields.some((field) => !field.trim())) {
      setValidationError("Source name, normalized key, UTM source, UTM medium, owner and next action are required.");
      return;
    }
    if (form.mql > form.leads || form.sql > form.mql || form.won > form.sql) {
      setValidationError("Lead counts must follow Leads >= MQL >= SQL >= Won.");
      return;
    }

    const payload: LeadSourcePayload = {
      source: form.source,
      source_type: form.type,
      normalized_key: normalizedKey,
      default_utm_source: form.defaultUtmSource,
      default_utm_medium: form.defaultUtmMedium,
      owner: form.owner,
      quality: form.quality,
      leads: form.leads,
      mql: form.mql,
      sql: form.sql,
      won: form.won,
      last_30_change: form.last30Change,
      status: form.status,
      next_action: form.nextAction,
    };

    try {
      const saved = editingId ? await updateMarketingSource(editingId, payload) : await createMarketingSource(payload);
      setSourceItems((current) =>
        editingId ? current.map((item) => (item.backendId === saved.backendId ? saved : item)) : [saved, ...current]
      );
      resetForm();
      setShowForm(false);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : "Something went wrong");
    }
  };

  const handleExport = () => {
    const rows = [
      ["ID", "Source", "Type", "Normalized Key", "UTM Source", "UTM Medium", "Owner", "Quality", "Leads", "MQL", "SQL", "Won", "SQL Conversion", "Last 30", "Status", "Next Action"],
      ...filteredSources.map((source) => [
        source.id,
        source.source,
        source.type,
        source.normalizedKey,
        source.defaultUtmSource,
        source.defaultUtmMedium,
        source.owner,
        source.quality,
        source.leads,
        source.mql,
        source.sql,
        source.won,
        `${sourceConversion(source).toFixed(1)}%`,
        `${source.last30Change}%`,
        source.status,
        source.nextAction,
      ]),
    ];
    const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "lead-sources.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <ActionButton icon={Download} onClick={handleExport}>Export</ActionButton>
        <ActionButton icon={Filter} onClick={() => { setTypeFilter("All"); setStatusFilter("All"); setSearchTerm(""); }}>Clear Filters</ActionButton>
        <ActionButton icon={Plus} variant="accent" onClick={openNewSource}>Add Acquisition Source</ActionButton>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tracked Sources" value={String(activeSources.length)} helper={`${new Set(activeSources.map((source) => source.type)).size} source types`} icon={Share2} tone="blue" />
        <MetricCard label="Top Source" value={topSource?.source || "None"} helper={`${topSource?.sql || 0} SQL leads`} icon={Search} tone="green" />
        <MetricCard label="Warmest Source" value={warmestSource?.source || "None"} helper={`${warmestSource ? sourceConversion(warmestSource).toFixed(1) : "0.0"}% SQL conversion`} icon={Users} tone="purple" />
        <MetricCard label="Needs Review" value={String(activeReviewCount).padStart(2, "0")} helper={`${totalSql} SQL from ${totalLeads} leads`} icon={Filter} tone="amber" />
      </div>

      {showForm ? (
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-black text-primary">{editingId ? "Edit Acquisition Source" : "Add Acquisition Source"}</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Normalize source labels now so lead attribution does not become messy when backend APIs arrive.</p>
            </div>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">
              <X size={14} /> Close
            </button>
          </div>
          {validationError ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700">{validationError}</div> : null}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <input value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value, normalizedKey: current.normalizedKey || normalizeSourceKey(event.target.value) }))} placeholder="Source name" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as SourceType }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
              {sourceTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
            <input value={form.normalizedKey} onChange={(event) => setForm((current) => ({ ...current, normalizedKey: normalizeSourceKey(event.target.value) }))} placeholder="Normalized key" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.defaultUtmSource} onChange={(event) => setForm((current) => ({ ...current, defaultUtmSource: event.target.value }))} placeholder="Default UTM source" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.defaultUtmMedium} onChange={(event) => setForm((current) => ({ ...current, defaultUtmMedium: event.target.value }))} placeholder="Default UTM medium" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.owner} onChange={(event) => setForm((current) => ({ ...current, owner: event.target.value }))} placeholder="Owner" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <select value={form.quality} onChange={(event) => setForm((current) => ({ ...current, quality: event.target.value as SourceQuality }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
              {sourceQualities.map((quality) => <option key={quality}>{quality}</option>)}
            </select>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as SourceStatus }))} className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
              {sourceStatuses.map((status) => <option key={status}>{status}</option>)}
            </select>
            <input type="number" value={form.last30Change} onChange={(event) => handleNumberChange("last30Change", event.target.value)} placeholder="Last 30 change %" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="number" min="0" value={form.leads} onChange={(event) => handleNumberChange("leads", event.target.value)} placeholder="Leads" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="number" min="0" value={form.mql} onChange={(event) => handleNumberChange("mql", event.target.value)} placeholder="MQL" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="number" min="0" value={form.sql} onChange={(event) => handleNumberChange("sql", event.target.value)} placeholder="SQL" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input type="number" min="0" value={form.won} onChange={(event) => handleNumberChange("won", event.target.value)} placeholder="Won" className="h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
            <input value={form.nextAction} onChange={(event) => setForm((current) => ({ ...current, nextAction: event.target.value }))} placeholder="Next action" className="md:col-span-2 h-11 rounded-xl border border-border px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <div className="mt-5 flex justify-end">
            <ActionButton icon={Plus} variant="primary" onClick={handleSave}>{editingId ? "Save Changes" : "Save Source"}</ActionButton>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Acquisition Source Intelligence</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Track volume, quality, conversion, owner and next optimization action.</p>
          </div>
          <Badge tone="purple">Source Quality Score</Badge>
        </div>
        <div className="mb-5 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search source, owner, UTM or key..." className="h-11 w-full rounded-xl border border-border bg-slate-50 pl-10 pr-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10" />
          </div>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "All" | SourceType)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {sourceTypes.map((type) => <option key={type}>{type}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "All" | SourceStatus)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-semibold text-primary outline-none focus:ring-4 focus:ring-primary/10">
            <option>All</option>
            {sourceStatuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredSources.map((source) => (
            <div key={source.id} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="text-primary" size={18} />
                    <h4 className="font-black text-primary">{source.source}</h4>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">{source.id} - {source.normalizedKey} - Owner: {source.owner}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={sourceQualityTone(source.quality)}>{source.quality}</Badge>
                  <Badge tone={sourceStatusTone(source.status)}>{source.status}</Badge>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-black text-primary">{source.leads}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Leads</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-black text-primary">{sourceConversion(source).toFixed(1)}%</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">SQL Conv.</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className={`text-lg font-black ${source.last30Change >= 0 ? "text-green-600" : "text-red-600"}`}>{source.last30Change >= 0 ? "+" : ""}{source.last30Change}%</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">30 Days</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-black text-primary">{source.mql}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">MQL</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-black text-primary">{source.sql}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">SQL</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-black text-primary">{source.won}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Won</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-white p-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Default Attribution</p>
                <p className="mt-1 text-sm font-bold text-primary">{source.defaultUtmSource} / {source.defaultUtmMedium} - {source.type}</p>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-white p-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Next Action</p>
                <p className="mt-1 text-sm font-bold text-primary">{source.nextAction}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => handleEdit(source)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-slate-50">
                  <Edit3 size={14} /> Edit
                </button>
                <button type="button" onClick={() => void handleArchiveToggle(source)} className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                  <Archive size={14} /> {source.status === "Archived" ? "Restore" : "Archive"}
                </button>
              </div>
            </div>
          ))}
        </div>
        {filteredSources.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
            No lead sources match the selected filters
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Sparkles className="text-accent" size={24} />
          <h3 className="text-lg font-black">2026 Acquisition Source Rules</h3>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["UTM required", "Every online lead must store utm_source, utm_medium, utm_campaign, keyword, landing page."],
            ["Quality beats volume", "Score sources by SQL and revenue, not only lead count."],
            ["Multi-touch view", "Show original source, latest source, and assisted campaigns together."],
            ["Offline mapping", "Events, referrals, calls, walk-ins, and partner leads need manual source capture."],
            ["Nurture source", "WhatsApp/email reactivation should be tracked as assisted source."],
            ["Client growth feedback", "Client growth owners should rate source quality after the first conversation."],
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

export default function MarketingHub({ activeView }: { activeView: MarketingView }) {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [sources, setSources] = useState<LeadSourceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");
    Promise.all([listMarketingCampaigns(), listMarketingSources()])
      .then(([campaignRows, sourceRows]) => {
        if (cancelled) return;
        setCampaigns(campaignRows);
        setSources(sourceRows);
      })
      .catch((error) => {
        if (cancelled) return;
        setLoadError(error instanceof Error ? error.message : "Something went wrong");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const title = activeView === "campaigns" ? "Growth Campaigns" : activeView === "roi" ? "Marketing ROI" : "Acquisition Sources";
  const description =
    activeView === "campaigns"
      ? "Plan, run, measure and optimize 2026-ready campaigns across Google, LinkedIn, Meta, WhatsApp, email and webinars."
      : activeView === "roi"
        ? "Understand spend, CPL, MQL, CAC, attributed pipeline, revenue influence and channel ROI."
        : "Track where leads come from, how good they are, and what action should improve conversion.";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            {activeView === "campaigns" ? <Megaphone size={26} /> : activeView === "roi" ? <TrendingUp size={26} /> : <Search size={26} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-[#1E293B]">{title}</h2>
              <Badge tone="green">2026 Growth Model</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
      </div>

      {loadError ? <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{loadError}</div> : null}
      {loading ? <div className="rounded-2xl border border-border bg-white px-4 py-8 text-center text-sm font-bold text-slate-500">Loading marketing data...</div> : null}
      {!loading && activeView === "campaigns" && <CampaignsView campaigns={campaigns} />}
      {!loading && activeView === "roi" && <RoiView campaigns={campaigns} />}
      {!loading && activeView === "sources" && <SourcesView sources={sources} />}
    </div>
  );
}
