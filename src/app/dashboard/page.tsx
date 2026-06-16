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
  MoreVertical,
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
  X
} from "lucide-react";

import { Button } from "@/components/ui/Button";

// Existing Wizards
import AdministrationHub from "@/components/dashboard/administration/AdministrationHub";
import OnboardingWizard from "@/components/dashboard/onboarding/OnboardingWizard";
import LeadWizard from "@/components/dashboard/leads/LeadWizard";
import ClientsContacts from "@/components/dashboard/crm/ClientsContacts";
import FollowUps from "@/components/dashboard/crm/FollowUps";
import HRMSHub from "@/components/dashboard/hrms/HRMSHub";
import MarketingHub from "@/components/dashboard/marketing/MarketingHub";
import ProjectHub from "@/components/dashboard/projects/ProjectHub";
import AccountingWizard, {
  ACCOUNTING_MODULES,
  type AccountingModuleId,
} from "@/components/dashboard/accounting/AccountingWizard";

// Overview Component
function DashboardOverview() {
  const stats = [
    { title: "Total Onboarding", value: "24", icon: UserPlus, color: "bg-[#3B82F6]", shadow: "shadow-blue-200" },
    { title: "Active Leads", value: "156", icon: Target, color: "bg-[#F97316]", shadow: "shadow-orange-200" },
    { title: "Total Revenue", value: "₹45.2L", icon: Wallet, color: "bg-[#10B981]", shadow: "shadow-green-200" },
    { title: "Marketing ROI", value: "3.2x", icon: Speaker, color: "bg-[#8B5CF6]", shadow: "shadow-purple-200" },
  ];

  const recentActivities = [
    { id: 1, user: "Vikram Rathore", action: "Approved Lead", target: "Acme Corp", time: "2 mins ago", status: "Completed" },
    { id: 2, user: "Sunita Sharma", action: "Uploaded KYC", target: "Employee #102", time: "15 mins ago", status: "Pending" },
    { id: 3, user: "Rajesh Kumar", action: "Generated Invoice", target: "INV-9921", time: "1 hour ago", status: "Completed" },
    { id: 4, user: "Anjali Singh", action: "New Lead Created", target: "Global Tech", time: "3 hours ago", status: "In Review" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-[#1E293B] tracking-tight">Dashboard Overview</h2>
          <p className="text-slate-500 font-medium mt-1">Real-time performance and system status.</p>
        </div>
        <div className="flex gap-3">
           <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Calendar size={14} /> June 2024
           </button>
           <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-primary/20 transition-all">
              <Filter size={14} /> Filter
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`w-16 h-16 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-2xl ${stat.shadow}`}>
              <stat.icon size={32} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{stat.title}</p>
              <p className="text-3xl font-black text-[#1E293B] mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="font-black text-[#1E293B] text-xl">Revenue Analytics</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Income vs Projections</p>
              </div>
              <div className="flex gap-2">
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                    <span className="text-[10px] font-bold text-slate-500">Actual</span>
                 </div>
                 <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-accent"></div>
                    <span className="text-[10px] font-bold text-slate-500">Target</span>
                 </div>
              </div>
           </div>
           <div className="w-full h-72 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group">
              <div className="text-center z-10">
                 <TrendingUp className="mx-auto text-primary/20 mb-4" size={64} />
                 <p className="text-slate-400 font-bold uppercase tracking-tighter">Performance Graph</p>
              </div>
              <div className="absolute inset-0 opacity-5 flex items-end">
                 {[40, 60, 45, 80, 50, 90, 70, 55, 65, 40, 50, 75, 85, 30, 40, 60, 70, 80, 50, 40].map((h, i) => (
                    <div key={i} className="flex-1 bg-primary rounded-t-lg mx-1" style={{ height: `${h}%` }}></div>
                 ))}
              </div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col">
           <div className="flex justify-between items-center mb-10">
              <h3 className="font-black text-[#1E293B] text-xl">System Health</h3>
              <button className="text-slate-300 hover:text-primary"><MoreVertical size={20} /></button>
           </div>
           <div className="space-y-8 flex-1">
              {[
                { label: "Data Accuracy", value: 98, color: "bg-[#10B981]" },
                { label: "Server Uptime", value: 99.9, color: "bg-[#3B82F6]" },
                { label: "Pending Tasks", value: 12, color: "bg-[#F97316]" }
              ].map((item, i) => (
                <div key={i} className="space-y-3">
                   <div className="flex justify-between items-end">
                      <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                      <span className="text-lg font-black text-[#1E293B]">{item.value}%</span>
                   </div>
                   <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-50">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-1000 shadow-sm`} style={{ width: `${item.value}%` }}></div>
                   </div>
                </div>
              ))}
           </div>
           <div className="mt-10 p-6 bg-[#F8FAFC] rounded-[2rem] border border-slate-100 text-center">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Total Efficiency</p>
              <p className="text-4xl font-black text-primary mt-2">92.4<span className="text-xl">%</span></p>
           </div>
        </div>

        <div className="lg:col-span-3 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           <div className="flex justify-between items-center mb-8">
              <h3 className="font-black text-[#1E293B] text-xl">Recent Activity</h3>
              <button className="text-xs font-black text-primary uppercase hover:underline tracking-widest">View All Logs</button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                    <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Time</th>
                    <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentActivities.map((act) => (
                    <tr key={act.id} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="py-5">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-primary">
                               {act.user.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-[#1E293B]">{act.user}</span>
                         </div>
                      </td>
                      <td className="py-5 text-sm font-medium text-slate-600">{act.action}</td>
                      <td className="py-5 text-sm font-black text-primary">{act.target}</td>
                      <td className="py-5 text-xs font-bold text-slate-400">{act.time}</td>
                      <td className="py-5 text-right">
                         <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                           act.status === "Completed" ? "bg-green-50 text-green-600 border-green-100" : "bg-orange-50 text-orange-600 border-orange-100"
                         }`}>
                           {act.status}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showNotif, setShowNotif] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSignOut, setShowSignOut] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [sidebarScroll, setSidebarScroll] = useState({ top: 0, height: 64, visible: false });

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
        { id: "tasks", label: "Tasks", icon: SquareCheck },
        { id: "milestones", label: "Milestones", icon: Shield },
        { id: "deadlines", label: "Deadlines", icon: Calendar }, { id: "performance", label: "Employee Performance", icon: TrendingUp },
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
        { id: "logs", label: "Audit Logs", icon: History },
        { id: "approvals", label: "Approvals", icon: CheckCircle2 },
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
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <aside
        onWheel={handleSidebarWheel}
        className="w-[19rem] bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl"
      >
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-[1.25rem] flex items-center justify-center text-[#0F172A] font-black text-2xl shadow-lg shadow-accent/20">C</div>
          <div>
            <div className="text-2xl font-black tracking-tighter leading-none">CRM<span className="text-accent">PRO</span></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Enterprise</p>
          </div>
        </div>

        <div className="relative flex-1 min-h-0">
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

        <div className="p-8 border-t border-white/5">
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
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Secure logout</span>
                </span>
              </span>
              <ChevronRight size={16} className="text-red-300/50 transition-all group-hover:translate-x-0.5 group-hover:text-red-300" />
            </div>
          </button>
        </div>
      </aside>

      <div className="flex-1 ml-[19rem] flex flex-col">
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-12 sticky top-0 z-40 shadow-sm">
          <div className="relative w-[32rem]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <input 
              type="text" 
              placeholder="Search leads, employees or invoices..." 
              className="w-full pl-14 pr-6 py-4 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] text-sm font-medium outline-none focus:ring-4 focus:ring-accent/10 focus:bg-white transition-all" 
            />
          </div>

          <div className="flex items-center gap-4" ref={headerRef}>
            <div className="relative">
                <button onClick={() => setShowNotif(!showNotif)} className="relative p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-all hover:shadow-md">
                    <Bell size={22} />
                    <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                {showNotif && (
                    <div className="absolute top-16 right-0 w-80 bg-white rounded-2xl shadow-xl border border-border p-4 z-50">
                        <h4 className="font-bold text-primary mb-3">Notifications</h4>
                        <div className="text-xs text-secondary">No new notifications</div>
                    </div>
                )}
            </div>

            <button className="flex items-center gap-2 px-5 py-3 bg-slate-50 rounded-2xl text-xs font-black text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest">
               <Calendar size={16} /> June 2024 <ChevronDown size={14}/>
            </button>

            <div className="relative">
                <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-5 py-3 bg-accent text-primary rounded-2xl text-xs font-black hover:shadow-lg transition-all uppercase tracking-widest">
                   <Plus size={16} /> Create New <ChevronDown size={14}/>
                </button>
                {showCreate && (
                    <div className="absolute top-16 right-0 w-56 bg-white rounded-2xl shadow-xl border border-border p-2 z-50">
                        {[
                            { label: "New Lead", icon: Target, onClick: () => { setActiveTab('leads'); setShowCreate(false); } },
                            { label: "New Invoice", icon: FileText, onClick: () => { setActiveTab('accounting'); setShowCreate(false); } },
                            { label: "Onboard Emp", icon: UserPlus, onClick: () => { setActiveTab('onboarding'); setShowCreate(false); } }
                        ].map(item => (
                            <button 
                                key={item.label} 
                                onClick={item.onClick}
                                className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-primary"
                            >
                                <item.icon size={16} /> {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative pl-6 border-l border-slate-100">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                aria-label="Upload profile photo"
              />
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`flex items-center gap-4 rounded-[1.6rem] p-2 pl-4 transition-all ${
                  showProfile ? "bg-slate-50 shadow-sm" : "hover:bg-slate-50"
                }`}
                aria-label="Open profile menu"
              >
                <div className="text-right">
                    <p className="text-sm font-black text-[#1E293B] leading-none">Rajkumar Rathore</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Super Admin</p>
                </div>
                <div className="relative">
                    <div className="group/avatar relative w-14 h-14 overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-[#1D4ED8] via-primary to-[#0F172A] flex items-center justify-center text-white font-black text-xl shadow-xl shadow-blue-900/20 ring-1 ring-white/70">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview} alt="Rajkumar Rathore" className="h-full w-full object-cover" />
                      ) : (
                        "RR"
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-950/45 opacity-0 transition-all group-hover/avatar:opacity-100">
                        <Camera size={18} className="text-white" />
                      </span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md ring-1 ring-emerald-100">
                        <Shield size={12} className="text-emerald-500" />
                    </div>
                </div>
              </button>
              {showProfile && (
                  <div className="absolute top-[4.75rem] right-0 w-80 overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 ring-1 ring-white z-50 animate-in fade-in zoom-in-95 duration-150">
                     <div className="bg-gradient-to-br from-slate-50 to-white p-5 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                           <div className="relative">
                              <div className="w-14 h-14 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1D4ED8] via-primary to-[#0F172A] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/20">
                                {avatarPreview ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={avatarPreview} alt="Rajkumar Rathore" className="h-full w-full object-cover" />
                                ) : (
                                  "RR"
                                )}
                              </div>
                              <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-[3px] border-white bg-emerald-500 shadow-sm" />
                           </div>
                           <div className="min-w-0">
                              <p className="truncate text-sm font-black text-[#1E293B]">Rajkumar Rathore</p>
                              <p className="mt-1 truncate text-xs font-bold text-slate-500">rajkumar@crmpro.in</p>
                              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                 Super Admin
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="p-3">
                        <button
                          onClick={() => avatarInputRef.current?.click()}
                          className="group mb-1 w-full flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50/50 p-3 text-left transition-all hover:border-blue-200 hover:bg-blue-50"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-white text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <Camera size={17} />
                            </span>
                            <span>
                              <span className="block text-sm font-black text-primary">Change Photo</span>
                              <span className="block text-[11px] font-bold text-slate-400">Upload your profile image</span>
                            </span>
                          </span>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-primary" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("users");
                            setShowProfile(false);
                          }}
                          className="group w-full flex items-center justify-between rounded-2xl p-3 text-left transition-all hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary shadow-sm group-hover:border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                              <User size={17} />
                            </span>
                            <span>
                              <span className="block text-sm font-black text-primary">Profile</span>
                              <span className="block text-[11px] font-bold text-slate-400">Account and access details</span>
                            </span>
                          </span>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-primary" />
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("settings");
                            setShowProfile(false);
                          }}
                          className="group mt-1 w-full flex items-center justify-between rounded-2xl p-3 text-left transition-all hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary shadow-sm group-hover:border-primary/20 group-hover:bg-primary group-hover:text-white transition-all">
                              <Settings size={17} />
                            </span>
                            <span>
                              <span className="block text-sm font-black text-primary">Settings</span>
                              <span className="block text-[11px] font-bold text-slate-400">Security and company controls</span>
                            </span>
                          </span>
                          <ChevronRight size={16} className="text-slate-300 group-hover:text-primary" />
                        </button>

                        <div className="my-3 h-px bg-slate-100" />

                        <button
                          onClick={() => {
                            setShowProfile(false);
                            setShowSignOut(true);
                          }}
                          className="group w-full flex items-center justify-between rounded-2xl border border-red-100/70 bg-gradient-to-r from-red-50 to-white p-3 text-left transition-all hover:border-red-200 hover:shadow-lg hover:shadow-red-100/70"
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-500 shadow-sm group-hover:bg-red-500 group-hover:text-white transition-all">
                              <LogOut size={17} />
                            </span>
                            <span>
                              <span className="block text-sm font-black text-red-500">Sign Out</span>
                              <span className="block text-[11px] font-bold text-red-300">End current session</span>
                            </span>
                          </span>
                          <ChevronRight size={16} className="text-red-200 group-hover:text-red-500" />
                        </button>
                     </div>

                     <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-5 py-3">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Session secure</span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          <CheckCircle2 size={13} /> Verified
                        </span>
                     </div>
                  </div>
              )}
            </div>
          </div>
        </header>

        {showSignOut && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/35 px-6 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-2xl shadow-slate-950/20 animate-in zoom-in-95 duration-150">
              <div className="relative bg-gradient-to-br from-slate-50 via-white to-red-50 p-6">
                <button
                  onClick={() => setShowSignOut(false)}
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm transition-all hover:text-primary"
                  aria-label="Close sign out dialog"
                >
                  <X size={16} />
                </button>

                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="flex h-16 w-16 overflow-hidden items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D4ED8] via-primary to-[#0F172A] text-xl font-black text-white shadow-xl shadow-blue-950/20">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={avatarPreview} alt="Rajkumar Rathore" className="h-full w-full object-cover" />
                      ) : (
                        "RR"
                      )}
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-[3px] border-white bg-emerald-500">
                      <Shield size={12} className="text-white" />
                    </span>
                  </div>
                  <div className="min-w-0 pr-8">
                    <p className="text-xl font-black tracking-tight text-[#1E293B]">Sign out securely?</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                      Your current CRM session will close on this device.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">User</p>
                    <p className="mt-1 truncate text-sm font-black text-primary">Rajkumar Rathore</p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</p>
                    <p className="mt-1 text-sm font-black text-primary">Super Admin</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-y border-slate-100 p-5">
                {[
                  ["Unsaved forms", "Draft data on this screen may be lost."],
                  ["Active session", "Other browser sessions stay active unless revoked."],
                  ["Security log", "This sign out action will be recorded in audit logs."],
                ].map(([title, detail]) => (
                  <div key={title} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-500" />
                    <div>
                      <p className="text-sm font-black text-primary">{title}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">{detail}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 bg-white p-5 sm:flex-row">
                <button
                  onClick={() => setShowSignOut(false)}
                  className="h-12 flex-1 rounded-2xl border border-slate-200 bg-white px-5 text-xs font-black uppercase tracking-widest text-primary transition-all hover:bg-slate-50"
                >
                  Stay Logged In
                </button>
                <button className="h-12 flex-1 rounded-2xl border border-red-500 bg-red-500 px-5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-red-500/20 transition-all hover:bg-red-600">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        <main className="p-12 flex-1">
          <div className="max-w-[1400px] mx-auto">
            {activeTab === "overview" && <DashboardOverview />}
            {activeTab === "onboarding" && <OnboardingWizard />}
            {activeTab === "employees" && <HRMSHub activeView="employees" />}
            {activeTab === "attendance" && <HRMSHub activeView="attendance" />}
            {activeTab === "leave" && <HRMSHub activeView="leave" />}
            {activeTab === "payroll" && <HRMSHub activeView="payroll" />}
            {activeTab === "exit" && <HRMSHub activeView="exit" />}
            {activeTab === "leads" && <LeadWizard />}
            {activeTab === "followups" && <FollowUps />}
            {activeTab === "clients" && <ClientsContacts />}
            {activeTab === "campaigns" && <MarketingHub activeView="campaigns" />}
            {activeTab === "roi" && <MarketingHub activeView="roi" />}
            {activeTab === "sources" && <MarketingHub activeView="sources" />}
            {activeTab === "projects" && <ProjectHub activeView="projects" />}
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
               <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-primary p-12 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-8 overflow-hidden relative">
                     <div className="relative z-10 max-w-lg text-center md:text-left">
                        <h3 className="text-4xl font-black tracking-tight">How can we help?</h3>
                        <p className="text-white/60 mt-4 text-lg">Search our knowledge base or raise a high-priority support ticket.</p>
                        <div className="mt-8 relative">
                           <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                           <input type="text" placeholder="Search for guides, articles..." className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl text-slate-900 font-bold outline-none shadow-2xl shadow-primary/20" />
                        </div>
                     </div>
                     <HelpCircle className="text-white/5 absolute -right-10 -bottom-10" size={300} />
                     <div className="relative z-10 grid grid-cols-2 gap-4">
                        <div className="p-6 bg-white/10 rounded-3xl border border-white/10 text-center group hover:bg-accent transition-all cursor-pointer">
                           <div className="w-12 h-12 bg-accent rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all"><MessageSquare size={24} /></div>
                           <p className="font-bold group-hover:text-primary">Live Chat</p>
                        </div>
                        <div className="p-6 bg-white/10 rounded-3xl border border-white/10 text-center group hover:bg-accent transition-all cursor-pointer">
                           <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all"><HelpCircle size={24} /></div>
                           <p className="font-bold group-hover:text-primary">Raising Ticket</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                     <div className="lg:col-span-2 space-y-6">
                        <h4 className="text-xl font-black text-primary uppercase tracking-widest px-4">Popular Articles</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {[
                             "How to generate your first invoice?",
                             "Managing multi-level approvals",
                             "GST filing guide for IT companies",
                             "Adding team members & permissions"
                           ].map((item, i) => (
                              <div key={i} className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl transition-all cursor-pointer group">
                                 <div className="flex justify-between items-start">
                                    <p className="font-bold text-primary max-w-[80%]">{item}</p>
                                    <ChevronRight size={18} className="text-slate-300 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                     <div className="bg-[#1E293B] p-8 rounded-[2.5rem] text-white">
                        <h4 className="font-black text-xl mb-6">Support Status</h4>
                        <div className="space-y-6">
                           <div className="flex items-center gap-4">
                              <div className="w-3 h-3 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></div>
                              <div>
                                 <p className="text-sm font-bold">System Status</p>
                                 <p className="text-[10px] text-slate-400 font-bold uppercase">All systems operational</p>
                              </div>
                           </div>
                           <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-xs font-bold text-slate-400">Response Time</p>
                              <p className="text-2xl font-black text-accent mt-1">~15 Mins</p>
                           </div>
                           <Button className="w-full bg-accent text-primary h-12 font-black">Contact Support</Button>
                        </div>
                     </div>
                  </div>
               </div>
            )}
            
            {activeTab === "team" && (
               <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100 shadow-sm animate-in zoom-in-95">
                  <Shield size={64} className="mx-auto text-primary mb-6 opacity-20" />
                  <h3 className="text-2xl font-black text-primary uppercase tracking-widest">Admin Control Restricted</h3>
                  <p className="text-slate-400 mt-2">You are viewing this in prototype mode.</p>
               </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}


