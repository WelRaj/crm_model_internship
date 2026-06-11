"use client";

import { useState, useRef, useEffect } from "react";
import { 
  LayoutDashboard, 
  UserPlus, 
  Target, 
  Wallet, 
  Speaker, 
  Bell, 
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
  CheckCircle2
} from "lucide-react";

import { Button } from "@/components/ui/Button";

// Existing Wizards
import OnboardingWizard from "@/components/dashboard/onboarding/OnboardingWizard";
import LeadWizard from "@/components/dashboard/leads/LeadWizard";
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
  const headerRef = useRef<HTMLDivElement>(null);

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
        { id: "quotations", label: "Quotations", icon: FileText },
        { id: "clients", label: "Clients", icon: Users },
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
        { id: "deadlines", label: "Deadlines", icon: Calendar },
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
      items: ACCOUNTING_MODULES
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
    <div className="min-h-screen bg-[#F8FAFC] flex" ref={headerRef}>
      <aside className="w-[19rem] bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl">
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-accent rounded-[1.25rem] flex items-center justify-center text-[#0F172A] font-black text-2xl shadow-lg shadow-accent/20">C</div>
          <div>
            <div className="text-2xl font-black tracking-tighter leading-none">CRM<span className="text-accent">PRO</span></div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Enterprise</p>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-10 overflow-y-auto custom-scrollbar pb-10">
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

        <div className="p-8 border-t border-white/5">
          <button className="w-full flex items-center gap-4 px-5 py-4 bg-red-500/5 text-red-400 hover:bg-red-500/10 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-red-500/10">
            <LogOut size={18} />
            <span>Exit Session</span>
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

          <div className="flex items-center gap-4">
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
                            { label: "New Lead", icon: Target },
                            { label: "New Invoice", icon: FileText },
                            { label: "Onboard Emp", icon: UserPlus }
                        ].map(item => (
                            <button key={item.label} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-primary">
                                <item.icon size={16} /> {item.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="relative pl-6 border-l border-slate-100">
              <div onClick={() => setShowProfile(!showProfile)} className="flex items-center gap-4 cursor-pointer">
                <div className="text-right">
                    <p className="text-sm font-black text-[#1E293B] leading-none">Rajkumar Rathore</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Super Admin</p>
                </div>
                <div className="relative">
                    <div className="w-14 h-14 rounded-[1.25rem] bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-xl">RR</div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
                        <Shield size={12} className="text-accent" />
                    </div>
                </div>
              </div>
              {showProfile && (
                  <div className="absolute top-20 right-0 w-48 bg-white rounded-2xl shadow-xl border border-border p-2 z-50">
                     <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-primary"><User size={16} /> Profile</button>
                     <button className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-sm font-bold text-primary"><Settings size={16} /> Settings</button>
                     <button className="w-full flex items-center gap-3 p-3 hover:bg-red-50 rounded-xl text-sm font-bold text-red-500"><LogOut size={16} /> Logout</button>
                  </div>
              )}
            </div>
          </div>
        </header>

        <main className="p-12 flex-1">
          <div className="max-w-[1400px] mx-auto">
            {activeTab === "overview" && <DashboardOverview />}
            {activeTab === "onboarding" && <OnboardingWizard />}
            {activeTab === "leads" && <LeadWizard />}
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
            
            {activeTab === "marketing" && (
               <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100 shadow-sm animate-in zoom-in-95">
                  <Speaker size={64} className="mx-auto text-primary mb-6 opacity-20" />
                  <h3 className="text-2xl font-black text-primary">Marketing Hub</h3>
                  <p className="text-slate-400 mt-2">Integrating campaign data...</p>
               </div>
            )}
            {(activeTab === "team" || activeTab === "settings") && (
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
