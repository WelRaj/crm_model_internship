"use client";

import EmployeePerformance from "@/components/dashboard/projects/performance/EmployeePerformance";

import { useCallback, useState, useRef, useEffect } from "react";
import { 
  LayoutDashboard, 
  UserPlus, 
  Target, 
  Wallet, 
  Speaker,
  Bell,
  Camera,
  Search,
  LogOut,
  ChevronRight,
  TrendingUp,
  Users,
  Briefcase,
  Settings,
  Shield,
  ShieldCheck,
  Calendar,
  Filter,
  HelpCircle,
  MessageSquare,
  Plus,
  ChevronDown,
  User,
  FileText,
  Clock,
  SquareCheck,
  History,
  CheckCircle2,
  X,
  Menu,
  ChevronLeft
} from "lucide-react";

// Existing Wizards
import AdministrationHub from "@/components/dashboard/administration/AdministrationHub";
import OnboardingWizard from "@/components/dashboard/onboarding/OnboardingWizard";
import LeadWizard from "@/components/dashboard/leads/LeadWizard";
import ClientsContacts from "@/components/dashboard/crm/ClientsContacts";
import FollowUps from "@/components/dashboard/crm/FollowUps";
import ProjectAgreement from "@/components/dashboard/crm/ProjectAgreement";
import HRMSHub from "@/components/dashboard/hrms/HRMSHub";
import MarketingHub from "@/components/dashboard/marketing/MarketingHub";
import ProjectHub from "@/components/dashboard/projects/ProjectHub";
import AccountingWizard, {
  ACCOUNTING_MODULES,
  type AccountingModuleId,
} from "@/components/dashboard/accounting/AccountingWizard";

// Overview Component
function DashboardOverview() {
  const INR = "\u20b9";
  const executiveStats = [
    { title: "Monthly Revenue", value: `${INR}45.2L`, detail: "+12.4% vs last month", icon: Wallet, tone: "bg-emerald-50 text-emerald-600" },
    { title: "Open Deals", value: "156", detail: "32 hot, 18 proposal stage", icon: Target, tone: "bg-orange-50 text-orange-600" },
    { title: "Active Projects", value: "28", detail: "5 at risk, 3 due this week", icon: Briefcase, tone: "bg-blue-50 text-blue-600" },
    { title: "Team Attendance", value: "92%", detail: "11 leave requests pending", icon: Users, tone: "bg-violet-50 text-violet-600" },
  ];

  const companyHealth = [
    { label: "Cashflow", value: 82, status: "Healthy", color: "bg-emerald-500" },
    { label: "Sales Pipeline", value: 74, status: "Strong", color: "bg-blue-500" },
    { label: "Delivery", value: 68, status: "Watch", color: "bg-amber-500" },
    { label: "Compliance", value: 91, status: "Clean", color: "bg-cyan-500" },
  ];

  const priorityAlerts = [
    { title: "Invoices overdue", detail: `${INR}3.8L pending beyond 15 days`, icon: FileText, tone: "bg-red-50 text-red-600" },
    { title: "Approvals waiting", detail: "7 requests need manager decision", icon: CheckCircle2, tone: "bg-amber-50 text-amber-600" },
    { title: "Project deadline", detail: "Website revamp due in 2 days", icon: Clock, tone: "bg-blue-50 text-blue-600" },
  ];

  const pipeline = [
    { stage: "New Leads", count: 42, value: `${INR}18.4L`, color: "bg-slate-300" },
    { stage: "Qualified", count: 27, value: `${INR}26.8L`, color: "bg-blue-500" },
    { stage: "Proposal", count: 18, value: `${INR}33.1L`, color: "bg-amber-500" },
    { stage: "Won", count: 9, value: `${INR}12.6L`, color: "bg-emerald-500" },
  ];

  const departmentStatus = [
    { team: "Sales", owner: "Amit", metric: "18 follow-ups due", status: "Needs action", tone: "bg-amber-50 text-amber-600" },
    { team: "Projects", owner: "Priya", metric: "3 milestones delayed", status: "At risk", tone: "bg-red-50 text-red-600" },
    { team: "Accounting", owner: "Neha", metric: `${INR}4.2L receivable`, status: "Review", tone: "bg-blue-50 text-blue-600" },
    { team: "HRMS", owner: "Karan", metric: "6 onboarding active", status: "On track", tone: "bg-emerald-50 text-emerald-600" },
  ];

  const recentActivities = [
    { id: 1, user: "Vikram Rathore", action: "Approved lead proposal", target: "Acme Corp", time: "2 mins ago", status: "Done" },
    { id: 2, user: "Sunita Sharma", action: "Uploaded KYC documents", target: "Employee #102", time: "15 mins ago", status: "Pending" },
    { id: 3, user: "Rajesh Kumar", action: "Generated invoice", target: "INV-9921", time: "1 hour ago", status: "Done" },
    { id: 4, user: "Anjali Singh", action: "Created high-value lead", target: "Global Tech", time: "3 hours ago", status: "Review" },
  ];

  return (
    <div className="min-w-0 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Company Command Center</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#1E293B]">What is happening today</h2>
          <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
            Live business snapshot across sales, projects, accounting, HR, approvals, and operational risk.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-50">
            <Calendar size={14} /> Today
          </button>
          <button className="flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all hover:shadow-primary/20">
            <Filter size={14} /> Filter View
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {executiveStats.map((stat) => (
          <div key={stat.title} className="min-w-0 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.title}</p>
                <p className="mt-2 text-3xl font-black text-[#1E293B]">{stat.value}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{stat.detail}</p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                <stat.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-8">
          <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-lg font-black text-[#1E293B]">Business Health</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">One glance view of operational pressure.</p>
            </div>
            <span className="inline-flex w-fit rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">
              Overall stable
            </span>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {companyHealth.map((item) => (
              <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-black text-[#1E293B]">{item.label}</span>
                  <span className="text-xs font-bold text-slate-500">{item.status}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                </div>
                <p className="mt-2 text-right text-xs font-black text-slate-500">{item.value}%</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-4">
          <div className="mb-5">
            <h3 className="text-lg font-black text-[#1E293B]">Priority Alerts</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Needs attention before EOD.</p>
          </div>
          <div className="space-y-3">
            {priorityAlerts.map((alert) => (
              <div key={alert.title} className="flex gap-3 rounded-xl border border-slate-100 p-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${alert.tone}`}>
                  <alert.icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-black text-[#1E293B]">{alert.title}</p>
                  <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-500">{alert.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-[#1E293B]">Sales Pipeline</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Deal count and expected value by stage.</p>
            </div>
            <Target className="text-slate-300" size={22} />
          </div>
          <div className="space-y-4">
            {pipeline.map((item) => (
              <div key={item.stage}>
                <div className="mb-2 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[#1E293B]">{item.stage}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.count} records</p>
                  </div>
                  <p className="text-sm font-black text-primary">{item.value}</p>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.min(item.count * 2, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm xl:col-span-7">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-black text-[#1E293B]">Department Watchlist</h3>
              <p className="mt-1 text-xs font-semibold text-slate-500">Owners and operational pressure by team.</p>
            </div>
            <Briefcase className="text-slate-300" size={22} />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-slate-100">
                  {["Team", "Owner", "Current Signal", "Status"].map((label) => (
                    <th key={label} className="pb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departmentStatus.map((row) => (
                  <tr key={row.team}>
                    <td className="py-4 text-sm font-black text-[#1E293B]">{row.team}</td>
                    <td className="py-4 text-sm font-semibold text-slate-500">{row.owner}</td>
                    <td className="py-4 text-sm font-semibold text-slate-600">{row.metric}</td>
                    <td className="py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${row.tone}`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-black text-[#1E293B]">Live Activity Feed</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Recent movement across CRM, HRMS, Projects, and Accounting.</p>
          </div>
          <button className="text-xs font-black uppercase tracking-widest text-primary hover:underline">View all logs</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">User</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Action</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Time</th>
                <th className="pb-4 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentActivities.map((act) => (
                <tr key={act.id} className="transition-colors hover:bg-slate-50/50">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-primary">
                        {act.user.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-[#1E293B]">{act.user}</span>
                    </div>
                  </td>
                  <td className="py-4 text-sm font-semibold text-slate-600">{act.action}</td>
                  <td className="py-4 text-sm font-black text-primary">{act.target}</td>
                  <td className="py-4 text-xs font-bold text-slate-400">{act.time}</td>
                  <td className="py-4 text-right">
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                      act.status === "Done"
                        ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                        : act.status === "Pending"
                          ? "border-amber-100 bg-amber-50 text-amber-600"
                          : "border-blue-100 bg-blue-50 text-blue-600"
                    }`}>
                      {act.status}
                    </span>
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
export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showNotif, setShowNotif] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSidebarVisible, setIsSidebarVisible] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('isSidebarVisible');
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [sidebarScroll, setSidebarScroll] = useState({ top: 0, height: 64, visible: false });
  useEffect(() => {
    localStorage.setItem('isSidebarVisible', JSON.stringify(isSidebarVisible));
  }, [isSidebarVisible]);

  const updateSidebarScroll = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const { scrollTop, scrollHeight, clientHeight } = nav;
    const visible = scrollHeight > clientHeight + 1;
    if (!visible) {
      setSidebarScroll((current) => ({ ...current, visible: false }));
      return;
    }
    const thumbHeight = Math.max((clientHeight / scrollHeight) * clientHeight, 52);
    const maxTop = clientHeight - thumbHeight;
    const top = (scrollTop / (scrollHeight - clientHeight)) * maxTop;
    setSidebarScroll({ top, height: thumbHeight, visible: true });
  }, []);

  const handleSidebarWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const nav = navRef.current;
      if (!nav || nav.scrollHeight <= nav.clientHeight) return;
      event.preventDefault();
      nav.scrollTop += event.deltaY;
      updateSidebarScroll();
    },
    [updateSidebarScroll]
  );

  const handleAvatarChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return previewUrl;
    });
    event.target.value = "";
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
        if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
            setShowNotif(false);
            setShowCreate(false);
            setShowCalendar(false);
            setShowProfile(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    updateSidebarScroll();
    window.addEventListener("resize", updateSidebarScroll);
    return () => window.removeEventListener("resize", updateSidebarScroll);
  }, [updateSidebarScroll]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const menuGroups = [
    {
      label: "Main",
      items: [
        { id: "overview", label: "Dashboard", icon: LayoutDashboard },
      ]
    },
    {
      label: "CRM",
      items: [
        { id: "leads", label: "Leads", icon: Target },
        { id: "followups", label: "Follow-ups", icon: Clock },
        { id: "clients", label: "Clients & Contacts", icon: Users },
        { id: "agreements", label: "Project Agreements", icon: ShieldCheck },
      ]
    },
    {
      label: "Marketing",
      items: [
        { id: "campaigns", label: "Campaigns", icon: Speaker },
        { id: "roi", label: "ROI", icon: TrendingUp },
        { id: "sources", label: "Lead Sources", icon: Search },
      ]
    },
    {
      label: "Projects",
      items: [
        { id: "projects", label: "Projects", icon: Briefcase },
        { id: "team-tracking", label: "Team Tracking", icon: Users },
        { id: "tasks", label: "Tasks", icon: SquareCheck },
        { id: "milestones", label: "Milestones", icon: Shield },
        { id: "deadlines", label: "Deadlines", icon: Calendar }, 
        { id: "performance", label: "Employee Performance", icon: TrendingUp },
      ]
    },
    {
      label: "HRMS",
      items: [
        { id: "employees", label: "Employees", icon: Users },
        { id: "onboarding", label: "Onboarding", icon: UserPlus },
        { id: "attendance", label: "Attendance", icon: Calendar },
        { id: "leave", label: "Leave", icon: LogOut },
        { id: "payroll", label: "Payroll", icon: Wallet },
        { id: "exit", label: "Exit Management", icon: LogOut },
      ]
    },
    {
      label: "Accounting",
      items: [
        { id: "accounting", label: "Accounting Overview", icon: LayoutDashboard },
        ...ACCOUNTING_MODULES
      ]
    },
    {
      label: "Administration",
      items: [
        { id: "users", label: "Users", icon: Users },
        { id: "roles", label: "Roles", icon: Shield },
        { id: "logs", label: "System Audit Trail", icon: History },
        { id: "approvals", label: "Approval Center", icon: CheckCircle2 },
        { id: "settings", label: "Settings", icon: Settings },
      ]
    },
    {
      label: "Support",
      items: [
        { id: "support", label: "Help & Support", icon: HelpCircle },
      ]
    }
  ];

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      {/* --- COLLAPSIBLE SIDEBAR --- */}
      <aside
        onWheel={handleSidebarWheel}
        className={`bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl transition-all duration-500 ease-in-out ${isSidebarVisible ? "w-[19rem] translate-x-0" : "w-0 -translate-x-full overflow-hidden"}`}
      >
        <div className="p-10 flex items-center gap-4 whitespace-nowrap min-w-[19rem]">
          <div className="w-12 h-12 bg-accent rounded-[1.25rem] flex items-center justify-center text-[#0F172A] font-black text-2xl shadow-lg shadow-accent/20">C</div>
          <div>
            <div className="text-2xl font-black tracking-tighter leading-none">CRM<span className="text-accent">PRO</span></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Enterprise</p>
          </div>
        </div>

        <div className="relative flex-1 min-h-0 min-w-[19rem]">
          <nav ref={navRef} onScroll={updateSidebarScroll} className="h-full px-6 space-y-10 overflow-y-auto custom-scrollbar pb-10">
            {menuGroups.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] ml-4">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-300 group ${
                          isActive 
                            ? "bg-accent text-[#0F172A] font-black shadow-xl shadow-accent/10" 
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-[#0F172A]" : "group-hover:scale-110 transition-transform duration-300"} />
                          <span className="text-sm font-bold tracking-wide">{item.label}</span>
                        </div>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[#0F172A]"></div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
          {sidebarScroll.visible && (
            <div className="pointer-events-none absolute right-2 top-0 bottom-0 w-[3px] rounded-full bg-white/[0.03]">
              <div
                className="absolute left-0 w-full rounded-full bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-700 shadow-[0_0_18px_rgba(16,185,129,0.55)] transition-[top,height] duration-150"
                style={{ top: sidebarScroll.top, height: sidebarScroll.height }}
              />
            </div>
          )}
        </div>

        <div className="p-8 border-t border-white/5 min-w-[19rem]">
          <button
            onClick={() => setShowSignOut(true)}
            className="group w-full overflow-hidden rounded-2xl border border-red-400/10 bg-gradient-to-br from-red-500/10 via-white/[0.03] to-transparent p-1 text-left transition-all hover:border-red-400/25 hover:shadow-[0_0_28px_rgba(239,68,68,0.12)]"
          >
            <div className="flex items-center justify-between gap-4 rounded-[0.85rem] px-4 py-3.5">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-300 ring-1 ring-red-400/10 transition-all group-hover:bg-red-500 group-hover:text-white">
                  <LogOut size={18} />
                </span>
                <span>
                  <span className="block text-xs font-black uppercase tracking-widest text-red-300">Sign Out</span>
                </span>
              </span>
            </div>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT AREA --- */}
      <div className={`flex min-w-0 flex-col transition-all duration-500 ease-in-out ${isSidebarVisible ? "ml-[19rem] w-[calc(100%-19rem)]" : "ml-0 w-full"}`}>
        <header className="sticky top-0 z-40 flex min-h-24 w-full items-center justify-between gap-4 border-b border-slate-100 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md xl:px-12">
          <div className="flex min-w-0 items-center gap-4 xl:gap-6">
            {/* TOGGLE BUTTON - PERMANENTLY VISIBLE */}
            <button 
              onClick={() => setIsSidebarVisible(!isSidebarVisible)}
              className="p-3 bg-slate-50 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-2xl transition-all shadow-sm flex items-center justify-center"
              title={isSidebarVisible ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarVisible ? <ChevronLeft size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="relative hidden w-[min(32rem,42vw)] lg:block">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                type="text" 
                placeholder="Search leads, projects or accounting..." 
                className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-accent/10 focus:bg-white transition-all" 
              />
            </div>
          </div>

          <div className="flex min-w-0 shrink-0 items-center gap-2 xl:gap-4" ref={headerRef}>
            <div className="relative">
                <button
                  onClick={() => {
                    setShowNotif((current) => !current);
                    setShowCreate(false);
                    setShowCalendar(false);
                    setShowProfile(false);
                  }}
                  className="relative p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-all hover:shadow-md"
                  title="Notifications"
                >
                    <Bell size={22} />
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                {showNotif && (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/80">
                    <div className="border-b border-slate-100 p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Notifications</p>
                      <p className="mt-1 text-sm font-black text-[#1E293B]">3 items need attention</p>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {[
                        { title: "Approval pending", detail: "7 control requests need review", tab: "approvals", tone: "bg-amber-50 text-amber-600" },
                        { title: "Deadline risk", detail: "3 project deadlines are close", tab: "deadlines", tone: "bg-red-50 text-red-600" },
                        { title: "Payment follow-up", detail: "Receivable queue has overdue invoices", tab: "accounting-payments", tone: "bg-blue-50 text-blue-600" },
                      ].map((item) => (
                        <button
                          key={item.title}
                          onClick={() => {
                            setActiveTab(item.tab);
                            setShowNotif(false);
                          }}
                          className="flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-slate-50"
                        >
                          <span className={`mt-0.5 h-9 w-9 shrink-0 rounded-xl ${item.tone} flex items-center justify-center`}>
                            <Bell size={16} />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-black text-[#1E293B]">{item.title}</span>
                            <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.detail}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="relative hidden md:block">
              <button
                onClick={() => {
                  setShowCalendar((current) => !current);
                  setShowNotif(false);
                  setShowCreate(false);
                  setShowProfile(false);
                }}
                className="flex items-center gap-2 rounded-2xl bg-slate-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-100"
                title="Calendar shortcuts"
              >
                 <Calendar size={16} /> June 2024 <ChevronDown size={14}/>
              </button>
              {showCalendar && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl shadow-slate-200/80">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Calendar</p>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-black text-[#1E293B]">June 2024</p>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-600">Active</span>
                    </div>
                    <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400">
                      {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
                      {Array.from({ length: 30 }, (_, index) => index + 1).map((day) => (
                        <button
                          key={day}
                          onClick={() => setShowCalendar(false)}
                          className={`h-7 rounded-lg text-xs font-bold transition-colors ${day === 26 ? "bg-primary text-white" : "text-slate-600 hover:bg-white"}`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { label: "Deadlines", tab: "deadlines" },
                      { label: "Attendance", tab: "attendance" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          setActiveTab(item.tab);
                          setShowCalendar(false);
                        }}
                        className="rounded-xl border border-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
                <button
                  onClick={() => {
                    setShowCreate((current) => !current);
                    setShowNotif(false);
                    setShowCalendar(false);
                    setShowProfile(false);
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-accent px-4 py-3 text-xs font-black uppercase tracking-widest text-primary transition-all hover:shadow-lg xl:px-5"
                  title="Create new record"
                >
                   <Plus size={16} /> Create New <ChevronDown size={14}/>
                </button>
                {showCreate && (
                  <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/80">
                    <div className="border-b border-slate-100 p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Create New</p>
                      <p className="mt-1 text-sm font-black text-[#1E293B]">Start a working module flow</p>
                    </div>
                    <div className="p-2">
                      {[
                        { label: "Lead", detail: "Capture a new sales lead", tab: "leads", icon: Target },
                        { label: "Project", detail: "Open project register", tab: "projects", icon: Briefcase },
                        { label: "Invoice", detail: "Create accounting invoice", tab: "accounting-invoices", icon: FileText },
                        { label: "Expense", detail: "Record business expense", tab: "accounting-expenses", icon: Wallet },
                        { label: "User", detail: "Invite portal user", tab: "users", icon: UserPlus },
                      ].map((item) => (
                        <button
                          key={item.label}
                          onClick={() => {
                            setActiveTab(item.tab);
                            setShowCreate(false);
                          }}
                          className="flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors hover:bg-slate-50"
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-primary">
                              <item.icon size={18} />
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-black text-[#1E293B]">{item.label}</span>
                              <span className="mt-0.5 block truncate text-xs font-semibold text-slate-500">{item.detail}</span>
                            </span>
                          </span>
                          <ChevronRight size={16} className="shrink-0 text-slate-300" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            <div className="relative border-l border-slate-100 pl-3 xl:pl-6">
              <button
                onClick={() => {
                  setShowProfile((current) => !current);
                  setShowNotif(false);
                  setShowCreate(false);
                  setShowCalendar(false);
                }}
                className={`flex items-center gap-4 rounded-[1.6rem] p-2 pl-4 transition-all ${
                  showProfile ? "bg-slate-50 shadow-sm" : "hover:bg-slate-50"
                }`}
                title="Profile menu"
              >
                <div className="hidden text-right xl:block">
                    <p className="text-sm font-black text-[#1E293B] leading-none">Rajkumar Rathore</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Super Admin</p>
                </div>
                <div className="relative">
                    {avatarPreview ? (
                      <div
                        aria-label="Rajkumar Rathore"
                        className="h-14 w-14 rounded-[1.25rem] bg-cover bg-center shadow-xl"
                        style={{ backgroundImage: `url(${avatarPreview})` }}
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-[#1D4ED8] via-primary to-[#0F172A] flex items-center justify-center text-white font-black text-xl shadow-xl">
                        RR
                      </div>
                    )}
                </div>
              </button>
              {showProfile && (
                <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-80 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/80">
                  <div className="border-b border-slate-100 p-5">
                    <div className="flex items-center gap-4">
                      {avatarPreview ? (
                        <div
                          aria-label="Rajkumar Rathore"
                          className="h-14 w-14 rounded-2xl bg-cover bg-center"
                          style={{ backgroundImage: `url(${avatarPreview})` }}
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-black text-white">RR</div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#1E293B]">Rajkumar Rathore</p>
                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Super Admin</p>
                      </div>
                    </div>
                  </div>
                  <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  <div className="p-2">
                    {[
                      { label: "My Profile", detail: "Open user administration", icon: User, action: "users" },
                      { label: "Change Photo", detail: "Upload local avatar preview", icon: Camera, action: "photo" },
                      { label: "Settings", detail: "Company configuration", icon: Settings, action: "settings" },
                      { label: "Support", detail: "Open help module", icon: MessageSquare, action: "support" },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => {
                          if (item.action === "photo") {
                            avatarInputRef.current?.click();
                            return;
                          }
                          setActiveTab(item.action);
                          setShowProfile(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-primary">
                          <item.icon size={18} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-[#1E293B]">{item.label}</span>
                          <span className="mt-0.5 block text-xs font-semibold text-slate-500">{item.detail}</span>
                        </span>
                      </button>
                    ))}
                    <button
                      onClick={() => {
                        setShowProfile(false);
                        setShowSignOut(true);
                      }}
                      className="mt-2 flex w-full items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3 text-left text-red-600 transition-colors hover:bg-red-100"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                        <LogOut size={18} />
                      </span>
                      <span>
                        <span className="block text-sm font-black">Sign Out</span>
                        <span className="mt-0.5 block text-xs font-semibold text-red-500">Confirm before leaving</span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="w-full min-w-0 flex-1 p-6 xl:p-12">
          <div className="mx-auto w-full max-w-[1600px] min-w-0 transition-all duration-500">
            {activeTab === "overview" && <DashboardOverview />}
            {activeTab === "onboarding" && <OnboardingWizard />}
            {activeTab === "employees" && <HRMSHub activeView="employees" onAddEmployee={() => setActiveTab("onboarding")} />}
            {activeTab === "attendance" && <HRMSHub activeView="attendance" onAddEmployee={() => setActiveTab("onboarding")} />}
            {activeTab === "leave" && <HRMSHub activeView="leave" onAddEmployee={() => setActiveTab("onboarding")} />}
            {activeTab === "payroll" && <HRMSHub activeView="payroll" onAddEmployee={() => setActiveTab("onboarding")} />}
            {activeTab === "exit" && <HRMSHub activeView="exit" onAddEmployee={() => setActiveTab("onboarding")} />}
            {activeTab === "leads" && <LeadWizard />}
            {activeTab === "followups" && <FollowUps />}
            {activeTab === "clients" && <ClientsContacts />}
            {activeTab === "agreements" && <ProjectAgreement />}
            {activeTab === "campaigns" && <MarketingHub activeView="campaigns" />}
            {activeTab === "roi" && <MarketingHub activeView="roi" />}
            {activeTab === "sources" && <MarketingHub activeView="sources" />}
            {activeTab === "projects" && <ProjectHub activeView="projects" />}
            {activeTab === "team-tracking" && <ProjectHub activeView="team-tracking" />}
            {activeTab === "tasks" && <ProjectHub activeView="tasks" />}
            {activeTab === "milestones" && <ProjectHub activeView="milestones" />}
            {activeTab === "deadlines" && <ProjectHub activeView="deadlines" />}
            {activeTab === "performance" && <EmployeePerformance />}
            {activeTab === "users" && <AdministrationHub activeView="users" />}
            {activeTab === "roles" && <AdministrationHub activeView="roles" />}
            {activeTab === "logs" && <AdministrationHub activeView="logs" />}
            {activeTab === "approvals" && <AdministrationHub activeView="approvals" />}
            {activeTab === "settings" && <AdministrationHub activeView="settings" />}
            {activeTab === "accounting" && <AccountingWizard onSelectModule={setActiveTab} />}
            {ACCOUNTING_MODULES.some((module) => module.id === activeTab) && (
              <AccountingWizard activeModule={activeTab as AccountingModuleId} />
            )}
            
            {activeTab === "support" && (
               <div className="p-20 text-center font-bold text-slate-300 italic">Support module syncing...</div>
            )}
          </div>
        </main>
      </div>

      {showSignOut && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Session</p>
                <h3 className="mt-2 text-xl font-black text-[#1E293B]">Sign out?</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">You will return to the sign-in screen. Unsaved local form changes should be saved before leaving.</p>
              </div>
              <button onClick={() => setShowSignOut(false)} className="rounded-xl bg-slate-50 p-2 text-slate-400 transition-colors hover:text-primary">
                <X size={18} />
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowSignOut(false)} className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={() => { window.location.href = "/auth/signin"; }} className="rounded-xl bg-red-600 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-red-700">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
