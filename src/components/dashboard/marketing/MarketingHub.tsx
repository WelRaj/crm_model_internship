"use client";

import {
  BadgeIndianRupee,
  Bot,
  CalendarClock,
  Download,
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
} from "lucide-react";

type MarketingView = "campaigns" | "roi" | "sources";
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

const campaigns = [
  {
    id: "CMP-2026-041",
    name: "AI CRM Automation Launch",
    channel: "LinkedIn + Google Search",
    objective: "B2B demo bookings",
    budget: "INR 2.4L",
    spent: "INR 1.62L",
    leads: 184,
    mql: 71,
    pipeline: "INR 18.6L",
    roas: "4.8x",
    status: "Active",
  },
  {
    id: "CMP-2026-042",
    name: "WhatsApp Lead Nurture",
    channel: "WhatsApp + Meta Retargeting",
    objective: "Revive warm leads",
    budget: "INR 90K",
    spent: "INR 54K",
    leads: 128,
    mql: 43,
    pipeline: "INR 7.2L",
    roas: "3.9x",
    status: "Active",
  },
  {
    id: "CMP-2026-043",
    name: "ERP for IT Services Webinar",
    channel: "Email + LinkedIn Event",
    objective: "Webinar registrations",
    budget: "INR 65K",
    spent: "INR 61K",
    leads: 312,
    mql: 56,
    pipeline: "INR 5.4L",
    roas: "2.1x",
    status: "Review",
  },
  {
    id: "CMP-2026-044",
    name: "Founder Search Intent",
    channel: "Google Search",
    objective: "High-intent enquiries",
    budget: "INR 1.8L",
    spent: "INR 1.78L",
    leads: 96,
    mql: 52,
    pipeline: "INR 14.2L",
    roas: "5.7x",
    status: "Scale",
  },
];

const roiRows = [
  { channel: "Google Search", spend: "INR 4.2L", leads: 226, cpl: "INR 1,858", mql: 114, cac: "INR 18,400", pipeline: "INR 32.6L", roi: "6.1x", tone: "green" },
  { channel: "LinkedIn Ads", spend: "INR 3.1L", leads: 148, cpl: "INR 2,095", mql: 82, cac: "INR 22,700", pipeline: "INR 24.8L", roi: "4.4x", tone: "blue" },
  { channel: "Meta Retargeting", spend: "INR 1.4L", leads: 205, cpl: "INR 683", mql: 49, cac: "INR 16,900", pipeline: "INR 8.9L", roi: "2.8x", tone: "amber" },
  { channel: "Email Nurture", spend: "INR 38K", leads: 91, cpl: "INR 418", mql: 33, cac: "INR 6,200", pipeline: "INR 5.2L", roi: "8.4x", tone: "green" },
  { channel: "Marketplace / Upwork", spend: "INR 72K", leads: 39, cpl: "INR 1,846", mql: 21, cac: "INR 14,100", pipeline: "INR 6.1L", roi: "3.6x", tone: "blue" },
];

const sources = [
  { source: "Website Organic", leads: 214, quality: "High", conversion: "18.2%", owner: "SEO Team", last30: "+22%", action: "Add service pages", tone: "green" },
  { source: "Google Ads", leads: 226, quality: "High Intent", conversion: "22.7%", owner: "Performance", last30: "+14%", action: "Scale exact-match keywords", tone: "green" },
  { source: "LinkedIn", leads: 148, quality: "Enterprise", conversion: "16.5%", owner: "B2B Growth", last30: "+31%", action: "Increase founder audience", tone: "blue" },
  { source: "WhatsApp Referral", leads: 86, quality: "Warm", conversion: "28.4%", owner: "Sales", last30: "+9%", action: "Launch referral incentive", tone: "purple" },
  { source: "Meta Ads", leads: 205, quality: "Mixed", conversion: "7.4%", owner: "Performance", last30: "-6%", action: "Tighten retargeting", tone: "amber" },
  { source: "Events / Webinar", leads: 312, quality: "Nurture", conversion: "9.8%", owner: "Marketing", last30: "+48%", action: "Segment by intent score", tone: "cyan" },
];

const funnel = [
  { label: "Impressions", value: "9.8L", percent: 100 },
  { label: "Clicks", value: "42.6K", percent: 72 },
  { label: "Leads", value: "1,191", percent: 48 },
  { label: "MQL", value: "428", percent: 31 },
  { label: "SQL", value: "186", percent: 18 },
  { label: "Won", value: "38", percent: 8 },
];

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
}: {
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
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

function CampaignsView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Active Campaigns" value="12" helper="Across 6 channels" icon={Megaphone} tone="blue" />
        <MetricCard label="Monthly Spend" value="INR 9.4L" helper="72% budget consumed" icon={Wallet} tone="amber" />
        <MetricCard label="Generated Leads" value="1,191" helper="+24% vs last month" icon={Users} tone="green" />
        <MetricCard label="AI Qualified" value="428" helper="MQL score above 70" icon={Bot} tone="purple" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Campaign Command Center</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Track channel, objective, spend, MQLs, pipeline, and scale decisions.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="green">UTM Tracked</Badge>
            <Badge tone="purple">AI Lead Scoring</Badge>
            <Badge tone="blue">Attribution Ready</Badge>
          </div>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {["Campaign", "Channel", "Objective", "Budget", "Spent", "Leads", "MQL", "Pipeline", "ROAS", "Status"].map((heading) => (
                  <th key={heading} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {campaigns.map((campaign) => (
                <tr key={campaign.id} className="text-sm">
                  <td className="px-4 py-4">
                    <p className="font-black text-primary">{campaign.name}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{campaign.id}</p>
                  </td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{campaign.channel}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{campaign.objective}</td>
                  <td className="px-4 py-4 font-black text-primary">{campaign.budget}</td>
                  <td className="px-4 py-4 font-semibold text-slate-600">{campaign.spent}</td>
                  <td className="px-4 py-4 font-black text-primary">{campaign.leads}</td>
                  <td className="px-4 py-4 font-black text-primary">{campaign.mql}</td>
                  <td className="px-4 py-4 font-black text-primary">{campaign.pipeline}</td>
                  <td className="px-4 py-4 font-black text-green-600">{campaign.roas}</td>
                  <td className="px-4 py-4">
                    <Badge tone={campaign.status === "Scale" ? "green" : campaign.status === "Review" ? "amber" : "blue"}>{campaign.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-primary">2026 Campaign Stack</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Modern campaign setup expected in a practical CRM.</p>
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
            <h3 className="text-lg font-black">Campaign Builder Fields</h3>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {["Campaign Name", "Objective", "Channel", "Audience Segment", "Budget", "Start / End Date", "UTM Source", "Landing Page", "Lead Form", "Owner", "AI Score Rule", "Nurture Sequence"].map((field) => (
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

function RoiView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Marketing Spend" value="INR 9.4L" helper="Current month" icon={IndianRupee} tone="amber" />
        <MetricCard label="Pipeline Created" value="INR 77.6L" helper="Attributed pipeline" icon={TrendingUp} tone="green" />
        <MetricCard label="Blended ROI" value="4.9x" helper="Pipeline / spend" icon={Gauge} tone="blue" />
        <MetricCard label="Avg CAC" value="INR 18.2K" helper="Qualified acquisition cost" icon={BadgeIndianRupee} tone="purple" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <div className="mb-5">
            <h3 className="text-lg font-black text-primary">ROI by Channel</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Compare spend, CPL, MQL, CAC, pipeline and ROI in one view.</p>
          </div>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[920px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  {["Channel", "Spend", "Leads", "CPL", "MQL", "CAC", "Pipeline", "ROI"].map((heading) => (
                    <th key={heading} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roiRows.map((row) => (
                  <tr key={row.channel} className="text-sm">
                    <td className="px-4 py-4 font-black text-primary">{row.channel}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{row.spend}</td>
                    <td className="px-4 py-4 font-black text-primary">{row.leads}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{row.cpl}</td>
                    <td className="px-4 py-4 font-black text-primary">{row.mql}</td>
                    <td className="px-4 py-4 font-semibold text-slate-600">{row.cac}</td>
                    <td className="px-4 py-4 font-black text-primary">{row.pipeline}</td>
                    <td className="px-4 py-4">
                      <Badge tone={row.tone as Tone}>{row.roi}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-black text-primary">Funnel Conversion</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Marketing-to-sales funnel snapshot.</p>
          <div className="mt-6 space-y-5">
            {funnel.map((step, index) => (
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
            <p className="mt-1 text-xs font-semibold text-slate-500">2026-ready CRM should not judge ROI only by first lead source.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ["First Touch", "Original discovery source: organic, ads, referral, marketplace."],
            ["Last Touch", "Final campaign before enquiry or demo booking."],
            ["Assisted Touch", "Retargeting, WhatsApp, email nurture, webinar influence."],
            ["Revenue Touch", "Won value, collection value, and retention/expansion value."],
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

function SourcesView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Tracked Sources" value="18" helper="Online + offline" icon={Share2} tone="blue" />
        <MetricCard label="Top Source" value="Google Ads" helper="22.7% conversion" icon={Search} tone="green" />
        <MetricCard label="Warmest Source" value="Referral" helper="28.4% conversion" icon={Users} tone="purple" />
        <MetricCard label="Needs Review" value="Meta Ads" helper="Quality below target" icon={Filter} tone="amber" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Lead Source Intelligence</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Track volume, quality, conversion, owner and next optimization action.</p>
          </div>
          <Badge tone="purple">Source Quality Score</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {sources.map((source) => (
            <div key={source.source} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="text-primary" size={18} />
                    <h4 className="font-black text-primary">{source.source}</h4>
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">Owner: {source.owner}</p>
                </div>
                <Badge tone={source.tone as Tone}>{source.quality}</Badge>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-black text-primary">{source.leads}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Leads</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className="text-lg font-black text-primary">{source.conversion}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Conv.</p>
                </div>
                <div className="rounded-xl bg-white p-3">
                  <p className={`text-lg font-black ${source.last30.startsWith("+") ? "text-green-600" : "text-red-600"}`}>{source.last30}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">30 Days</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-border bg-white p-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Next Action</p>
                <p className="mt-1 text-sm font-bold text-primary">{source.action}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Sparkles className="text-accent" size={24} />
          <h3 className="text-lg font-black">2026 Lead Source Rules</h3>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[
            ["UTM required", "Every online lead must store utm_source, utm_medium, utm_campaign, keyword, landing page."],
            ["Quality beats volume", "Score sources by SQL and revenue, not only lead count."],
            ["Multi-touch view", "Show original source, latest source, and assisted campaigns together."],
            ["Offline mapping", "Events, referrals, calls, walk-ins, and partner leads need manual source capture."],
            ["Nurture source", "WhatsApp/email reactivation should be tracked as assisted source."],
            ["Sales feedback", "Sales owners should rate source quality after first conversation."],
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
  const title = activeView === "campaigns" ? "Campaigns" : activeView === "roi" ? "Marketing ROI" : "Lead Sources";
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
              <Badge tone="green">2026 CRM Model</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton icon={Download}>Export</ActionButton>
          <ActionButton icon={Filter}>Filter</ActionButton>
          <ActionButton icon={activeView === "campaigns" ? Plus : Send} variant="accent">
            {activeView === "campaigns" ? "New Campaign" : activeView === "roi" ? "Send Report" : "Add Source"}
          </ActionButton>
        </div>
      </div>

      {activeView === "campaigns" && <CampaignsView />}
      {activeView === "roi" && <RoiView />}
      {activeView === "sources" && <SourcesView />}
    </div>
  );
}
