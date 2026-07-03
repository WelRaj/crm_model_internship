"use client";

import EmployeePerformance from "@/components/dashboard/projects/performance/EmployeePerformance";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { 
  LayoutDashboard, UserPlus, Target, Wallet, Speaker, Bell, Search, LogOut, TrendingUp, Users, Briefcase, Settings, Shield, ShieldCheck, Calendar, HelpCircle, MessageSquare, ChevronDown, User, Clock, SquareCheck, History, CheckCircle2, Menu, ChevronLeft, UserCheck, Headphones
} from "lucide-react";
import AdministrationHub from "@/components/dashboard/administration/AdministrationHub";
import OnboardingWizard from "@/components/dashboard/onboarding/OnboardingWizard";
import LeadHub from "@/components/dashboard/leads/LeadHub";
import LeadAssign from "@/components/dashboard/crm/LeadAssign";
import TelecallerDesk from "@/components/dashboard/crm/TelecallerDesk";
import LeadOutcomes from "@/components/dashboard/crm/LeadOutcomes";
import ClientsContacts from "@/components/dashboard/crm/ClientsContacts";
import FollowUps from "@/components/dashboard/crm/FollowUps";
import ProjectAgreement from "@/components/dashboard/crm/ProjectAgreement";
import HRMSHub from "@/components/dashboard/hrms/HRMSHub";
import MarketingHub from "@/components/dashboard/marketing/MarketingHub";
import ProjectHub from "@/components/dashboard/projects/ProjectHub";
import SupportHub from "@/components/dashboard/support/SupportHub";
import AccountingWizard, { ACCOUNTING_MODULES, type AccountingModuleId } from "@/components/dashboard/accounting/AccountingWizard";

type MarketingView = "campaigns" | "roi" | "sources";
type AdminView = "users" | "roles" | "logs" | "approvals" | "settings";

const marketingTabs: MarketingView[] = ["campaigns", "roi", "sources"];
const adminTabs: AdminView[] = ["users", "roles", "logs", "approvals", "settings"];
const projectTabs = ["projects", "team-tracking", "tasks", "milestones", "deadlines", "performance"];
const accountingModuleIds = ACCOUNTING_MODULES.map((module) => module.id);

const isAccountingModule = (tab: string): tab is AccountingModuleId =>
  accountingModuleIds.includes(tab as AccountingModuleId);

const notifications = [
  { id: "NOT-01", title: "Critical support ticket", detail: "Accounting invoice approval needs action", tab: "support", tone: "bg-rose-500" },
  { id: "NOT-02", title: "Follow-up due today", detail: "12 CRM callbacks are scheduled", tab: "followups", tone: "bg-amber-500" },
  { id: "NOT-03", title: "Payroll review", detail: "June payroll draft is ready", tab: "payroll", tone: "bg-blue-500" },
];

function DashboardOverview({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const INR = "\u20b9";
  const executiveStats = [
    { title: "Monthly Revenue", value: `${INR}45.2L`, detail: "+12.4% vs last month", icon: Wallet, tone: "bg-emerald-50 text-emerald-600" },
    { title: "Open Deals", value: "156", detail: "32 hot, 18 proposal stage", icon: Target, tone: "bg-orange-50 text-orange-600" },
    { title: "Active Projects", value: "28", detail: "5 at risk, 3 due this week", icon: Briefcase, tone: "bg-blue-50 text-blue-600" },
    { title: "Team Attendance", value: "92%", detail: "11 leave requests pending", icon: Users, tone: "bg-violet-50 text-violet-600" },
  ];

  return (
    <div className="min-w-0 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Company Command Center</p>
          <div className="flex flex-wrap gap-3 mt-4">
            {[
                { name: "Leads", id: "leads" },
                { name: "Onboarding", id: "onboarding" },
                { name: "Accounting", id: "accounting" },
                { name: "Marketing", id: "marketing" },
                { name: "Projects", id: "projects" },
                { name: "Administration", id: "administration" },
                { name: "Support", id: "support" },
            ].map((dept) => (
              <button
                key={dept.id}
                onClick={() => setActiveTab(dept.id)}
                className="px-6 py-2.5 rounded-full border border-border bg-surface text-xs font-black uppercase tracking-widest text-text-muted hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                {dept.name}
              </button>
            ))}
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#1E293B]">What is happening today</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {executiveStats.map((stat) => (
          <div key={stat.title} className="min-w-0 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.title}</p>
                <p className="mt-2 text-3xl font-black text-[#1E293B]">{stat.value}</p>
              </div>
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                <stat.icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileAction({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary"
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const menuGroups = [
    { label: "Main", department: "overview", items: [{ id: "overview", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "CRM", department: "leads", items: [{ id: "leads", label: "Leads", icon: Target }, { id: "lead-assign", label: "Lead Assign", icon: UserCheck }, { id: "telecaller", label: "Telecaller Desk", icon: Headphones }, { id: "followups", label: "Follow-ups", icon: Clock }, { id: "lead-outcomes", label: "Lead Outcomes", icon: CheckCircle2 }, { id: "clients", label: "Clients & Contacts", icon: Users }, { id: "agreements", label: "Project Agreements", icon: ShieldCheck }] },
    { label: "Marketing", department: "marketing", items: [{ id: "campaigns", label: "Campaigns", icon: Speaker }, { id: "roi", label: "ROI", icon: TrendingUp }, { id: "sources", label: "Lead Sources", icon: Search }] },
    { label: "Projects", department: "projects", items: [{ id: "projects", label: "Projects", icon: Briefcase }, { id: "team-tracking", label: "Team Tracking", icon: Users }, { id: "tasks", label: "Tasks", icon: SquareCheck }, { id: "milestones", label: "Milestones", icon: Shield }, { id: "deadlines", label: "Deadlines", icon: Calendar }, { id: "performance", label: "Employee Performance", icon: TrendingUp }] },
    { label: "HRMS", department: "onboarding", items: [{ id: "employees", label: "Employees", icon: Users }, { id: "onboarding", label: "Onboarding", icon: UserPlus }, { id: "attendance", label: "Attendance", icon: Calendar }, { id: "leave", label: "Leave", icon: LogOut }, { id: "payroll", label: "Payroll", icon: Wallet }, { id: "exit", label: "Exit Management", icon: LogOut }] },
    { label: "Accounting", department: "accounting", items: [{ id: "accounting", label: "Accounting Overview", icon: LayoutDashboard }, ...ACCOUNTING_MODULES] },
    { label: "Administration", department: "administration", items: [{ id: "users", label: "Users", icon: Users }, { id: "roles", label: "Roles", icon: Shield }, { id: "logs", label: "System Audit Trail", icon: History }, { id: "approvals", label: "Approval Center", icon: CheckCircle2 }, { id: "settings", label: "Settings", icon: Settings }] },
    { label: "Support", department: "support", items: [{ id: "support", label: "Help & Support", icon: HelpCircle }] }
  ];

  const getSidebarGroups = () => {
    if (activeTab === "overview") return menuGroups.filter(g => g.department === "overview");
    const currentGroup = menuGroups.find(group => group.department === activeTab || group.items.some(item => item.id === activeTab));
    return currentGroup ? [currentGroup] : [];
  };

  const sidebarGroups = getSidebarGroups();
  const isMarketingTab = marketingTabs.includes(activeTab as MarketingView);
  const isAdminTab = adminTabs.includes(activeTab as AdminView);
  const isProjectTab = projectTabs.includes(activeTab);
  const openTab = (tab: string) => {
    setActiveTab(tab);
    setShowNotif(false);
    setShowProfile(false);
  };

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <aside className={`bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl transition-all duration-500 ease-in-out ${isSidebarVisible ? "w-[19rem] translate-x-0" : "w-0 -translate-x-full overflow-hidden"}`}>
        <div className="p-10 flex items-center gap-4 whitespace-nowrap min-w-[19rem]">
          <div className="w-12 h-12 bg-accent rounded-[1.25rem] flex items-center justify-center text-[#0F172A] font-black text-2xl shadow-lg shadow-accent/20">C</div>
          <div className="text-2xl font-black tracking-tighter leading-none">CRM<span className="text-accent">PRO</span></div>
        </div>
        <div className="relative flex-1 min-h-0 min-w-[19rem]">
          <nav className="h-full px-6 space-y-10 overflow-y-auto pb-10">
            {activeTab !== "overview" && (
              <button onClick={() => setActiveTab("overview")} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-accent hover:bg-white/5 transition-all">
                <ChevronLeft size={20} />
                <span className="text-sm font-black uppercase tracking-widest">Back to Dashboard</span>
              </button>
            )}
            {sidebarGroups.map((group, idx) => (
              <div key={idx} className="space-y-4">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] ml-4">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${isActive ? "bg-accent text-[#0F172A] font-black" : "text-slate-400 hover:text-white"}`}>
                          <Icon size={20} />
                          <span className="text-sm font-bold tracking-wide">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>
      <div className={`flex min-w-0 flex-col transition-all duration-500 ease-in-out ${isSidebarVisible ? "ml-[19rem] w-[calc(100%-19rem)]" : "ml-0 w-full"}`}>
        <header className="sticky top-0 z-40 flex min-h-24 w-full items-center justify-between gap-4 border-b border-slate-100 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md xl:px-12">
            <button onClick={() => setIsSidebarVisible(!isSidebarVisible)} className="p-3 bg-slate-50 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-2xl transition-all shadow-sm"><Menu size={24} /></button>
            <div className="relative flex items-center gap-4">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotif((current) => !current);
                    setShowProfile(false);
                  }}
                  className="relative p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-primary hover:bg-slate-100 transition-all"
                  aria-expanded={showNotif}
                  aria-label="Notifications"
                >
                  <Bell size={22} />
                  <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                </button>
                {showNotif ? (
                  <div className="absolute right-0 top-14 w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-primary">Notifications</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live frontend queue</p>
                      </div>
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black text-slate-500">{notifications.length} New</span>
                    </div>
                    <div className="space-y-2">
                      {notifications.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => openTab(item.tab)}
                          className="flex w-full items-start gap-3 rounded-xl p-3 text-left hover:bg-slate-50"
                        >
                          <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.tone}`} />
                          <span className="min-w-0">
                            <span className="block text-sm font-black text-primary">{item.title}</span>
                            <span className="mt-1 block text-xs font-semibold leading-5 text-slate-500">{item.detail}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => openTab("support")}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-xs font-black uppercase tracking-widest text-white"
                    >
                      <MessageSquare size={15} /> Open Support Center
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfile((current) => !current);
                    setShowNotif(false);
                  }}
                  className="flex items-center gap-4 rounded-[1.6rem] p-2 pl-4 hover:bg-slate-50 transition-all"
                  aria-expanded={showProfile}
                >
                  <div className="hidden text-right xl:block">
                    <p className="text-sm font-black text-[#1E293B]">Rajkumar Rathore</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Super Admin</p>
                  </div>
                  <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center">RR</div>
                  <ChevronDown size={16} className={`hidden text-slate-400 transition-transform md:block ${showProfile ? "rotate-180" : ""}`} />
                </button>
                {showProfile ? (
                  <div className="absolute right-0 top-16 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">RR</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-primary">Rajkumar Rathore</p>
                        <p className="text-xs font-semibold text-slate-500">rajkumar@crmpro.local</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <ProfileAction icon={User} label="My Profile" onClick={() => openTab("users")} />
                      <ProfileAction icon={ShieldCheck} label="Approval Center" onClick={() => openTab("approvals")} />
                      <ProfileAction icon={Settings} label="Settings" onClick={() => openTab("settings")} />
                      <ProfileAction icon={HelpCircle} label="Help & Support" onClick={() => openTab("support")} />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        setActiveTab("overview");
                      }}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-100 bg-rose-50 text-xs font-black uppercase tracking-widest text-rose-700"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
        </header>
        <main className="w-full min-w-0 flex-1 p-6 xl:p-12">
            <div className="mx-auto w-full max-w-[1600px]">
                {activeTab === "overview" && <DashboardOverview setActiveTab={setActiveTab} />}
                {activeTab === "leads" && <LeadHub />}
                {activeTab === "lead-assign" && <LeadAssign />}
                {activeTab === "telecaller" && <TelecallerDesk />}
                {activeTab === "followups" && <FollowUps />}
                {activeTab === "lead-outcomes" && <LeadOutcomes />}
                {activeTab === "clients" && <ClientsContacts />}
                {activeTab === "agreements" && <ProjectAgreement />}
                {activeTab === "onboarding" && <OnboardingWizard />}
                {activeTab === "employees" && <HRMSHub activeView="employees" />}
                {activeTab === "attendance" && <HRMSHub activeView="attendance" />}
                {activeTab === "leave" && <HRMSHub activeView="leave" />}
                {activeTab === "payroll" && <HRMSHub activeView="payroll" />}
                {activeTab === "exit" && <HRMSHub activeView="exit" />}
                {activeTab === "accounting" && <AccountingWizard onSelectModule={setActiveTab} />}
                {isAccountingModule(activeTab) && <AccountingWizard activeModule={activeTab} onSelectModule={setActiveTab} />}
                {(activeTab === "marketing" || isMarketingTab) && <MarketingHub activeView={isMarketingTab ? activeTab as MarketingView : "campaigns"} />}
                {isProjectTab && (activeTab === "performance" ? <EmployeePerformance /> : <ProjectHub activeView={activeTab} />)}
                {(activeTab === "administration" || isAdminTab) && <AdministrationHub activeView={isAdminTab ? activeTab as AdminView : "users"} />}
                {activeTab === "support" && <SupportHub />}
            </div>
        </main>
      </div>
    </div>
  );
}
