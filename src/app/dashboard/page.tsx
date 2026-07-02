"use client";

import EmployeePerformance from "@/components/dashboard/projects/performance/EmployeePerformance";
import { useCallback, useState, useRef, useEffect } from "react";
import { 
  LayoutDashboard, UserPlus, Target, Wallet, Speaker, Bell, Camera, Search, LogOut, ChevronRight, TrendingUp, Users, Briefcase, Settings, Shield, ShieldCheck, Calendar, Filter, HelpCircle, MessageSquare, Plus, ChevronDown, User, FileText, Clock, SquareCheck, History, CheckCircle2, X, Menu, ChevronLeft, UserCheck, Headphones
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
import AccountingWizard, { ACCOUNTING_MODULES, type AccountingModuleId } from "@/components/dashboard/accounting/AccountingWizard";

type MarketingView = "campaigns" | "roi" | "sources";
type AdminView = "users" | "roles" | "logs" | "approvals" | "settings";

const marketingTabs: MarketingView[] = ["campaigns", "roi", "sources"];
const adminTabs: AdminView[] = ["users", "roles", "logs", "approvals", "settings"];
const projectTabs = ["projects", "team-tracking", "tasks", "milestones", "deadlines", "performance"];
const accountingModuleIds = ACCOUNTING_MODULES.map((module) => module.id);

const isAccountingModule = (tab: string): tab is AccountingModuleId =>
  accountingModuleIds.includes(tab as AccountingModuleId);

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

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

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
            <div className="flex items-center gap-4">
              <button onClick={() => setShowNotif(!showNotif)} className="relative p-3 bg-slate-50 text-slate-400 rounded-xl"><Bell size={22} /></button>
              <button onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-4 rounded-[1.6rem] p-2 pl-4 hover:bg-slate-50">
                <div className="hidden text-right xl:block"><p className="text-sm font-black text-[#1E293B]">Rajkumar Rathore</p></div>
                <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center">RR</div>
              </button>
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
            </div>
        </main>
      </div>
    </div>
  );
}
