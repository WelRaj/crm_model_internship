"use client";

import React, { useState } from "react";
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  AlertCircle, 
  UserPlus, 
  Search, 
  Filter, 
  ChevronRight, 
  ArrowLeft,
  LayoutDashboard,
  Target,
  MessageSquare,
  Compass,
  CheckCircle2,
  Circle,
  Star,
  Zap,
  ShieldCheck,
  MoreVertical,
  Download
} from "lucide-react";

// --- Types ---
type PerformanceStatus = "Top Performer" | "Exceeds Expectations" | "Meets Expectations" | "Needs Improvement" | "Promotion Eligible";

interface Employee {
  id: string;
  name: string;
  dept: string;
  manager: string;
  goals: { assigned: number; completed: number };
  kpiScore: number;
  taskCompletion: number;
  qualityScore: number;
  rating: number;
  status: PerformanceStatus;
  avatar?: string;
}

interface KPIWeights {
  sprintDelivery: { score: number; weight: number };
  codeQuality: { score: number; weight: number };
  bugResolution: { score: number; weight: number };
}

interface OKR {
  objective: string;
  progress: number;
  keyResults: { title: string; progress: number }[];
}

interface Feedback {
  manager: string;
  peer: string;
  self: string;
}

interface CareerStats {
  promotionReadiness: number;
  attritionRisk: "Low" | "Medium" | "High";
  recommendedTraining: string[];
}

// --- Dummy Data ---
const employees: Employee[] = [
  {
    id: "DAT001",
    name: "Aarav Sharma",
    dept: "Engineering",
    manager: "Vikram Singh",
    goals: { assigned: 12, completed: 11 },
    kpiScore: 96,
    taskCompletion: 98,
    qualityScore: 4.8,
    rating: 4.8,
    status: "Top Performer",
  },
  {
    id: "DAT002",
    name: "Priya Patel",
    dept: "IT",
    manager: "Neha Gupta",
    goals: { assigned: 10, completed: 9 },
    kpiScore: 92,
    taskCompletion: 94,
    qualityScore: 4.5,
    rating: 4.4,
    status: "Exceeds Expectations",
  },
  {
    id: "DAT003",
    name: "Rohan Verma",
    dept: "Marketing",
    manager: "Ananya Iyer",
    goals: { assigned: 8, completed: 6 },
    kpiScore: 82,
    taskCompletion: 85,
    qualityScore: 3.9,
    rating: 3.8,
    status: "Meets Expectations",
  },
  {
    id: "DAT004",
    name: "Neha Gupta",
    dept: "Engineering",
    manager: "Director Tech",
    goals: { assigned: 15, completed: 15 },
    kpiScore: 98,
    taskCompletion: 100,
    qualityScore: 4.9,
    rating: 4.9,
    status: "Top Performer",
  },
  {
    id: "DAT005",
    name: "Kabir Khan",
    dept: "Support",
    manager: "Meera Reddy",
    goals: { assigned: 10, completed: 5 },
    kpiScore: 68,
    taskCompletion: 70,
    qualityScore: 3.2,
    rating: 2.8,
    status: "Needs Improvement",
  },
  {
    id: "DAT006",
    name: "Ishita Sharma",
    dept: "Design",
    manager: "Priya Nair",
    goals: { assigned: 9, completed: 8 },
    kpiScore: 90,
    taskCompletion: 92,
    qualityScore: 4.6,
    rating: 4.5,
    status: "Promotion Eligible",
  }
];

const kpiDetails: Record<string, KPIWeights> = {
  "DAT001": {
    sprintDelivery: { score: 98, weight: 25 },
    codeQuality: { score: 95, weight: 20 },
    bugResolution: { score: 94, weight: 15 },
  },
  "DAT004": {
    sprintDelivery: { score: 100, weight: 25 },
    codeQuality: { score: 98, weight: 20 },
    bugResolution: { score: 97, weight: 15 },
  }
};

const okrDetails: Record<string, OKR[]> = {
  "DAT001": [
    {
      objective: "Scale CRM Infrastructure",
      progress: 85,
      keyResults: [
        { title: "Reduce latency by 20%", progress: 90 },
        { title: "Implement 99.9% uptime monitoring", progress: 80 }
      ]
    }
  ]
};

const feedbackDetails: Record<string, Feedback> = {
  "DAT001": {
    manager: "Aarav consistently delivers high-quality code and is a proactive problem solver.",
    peer: "Great team player, always willing to help with complex debugging.",
    self: "I've focused on optimizing the backend performance this quarter and met all major milestones."
  }
};

const careerDetails: Record<string, CareerStats> = {
  "DAT001": {
    promotionReadiness: 92,
    attritionRisk: "Low",
    recommendedTraining: ["Advanced System Design", "Leadership Foundations"]
  }
};

// --- Components ---

const SummaryBar = () => {
  const stats = [
    { label: "Total Employees", value: "248", icon: Users, color: "text-slate-400" },
    { label: "Top Performers", value: "32", icon: Trophy, color: "text-emerald-500" },
    { label: "Exceeding Expectations", value: "76", icon: TrendingUp, color: "text-blue-500" },
    { label: "Needs Improvement (PIP)", value: "18", icon: AlertCircle, color: "text-rose-500" },
    { label: "Promotion Eligible", value: "21", icon: UserPlus, color: "text-amber-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat, i) => (
        <div key={i} className="bg-primary border border-slate-800 p-5 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 rounded-lg bg-slate-800 ${stat.color}`}>
              <stat.icon size={20} />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
          </div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }: { status: PerformanceStatus }) => {
  const styles: Record<PerformanceStatus, string> = {
    "Top Performer": "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    "Exceeds Expectations": "bg-blue-500/10 text-blue-500 border-blue-500/20",
    "Meets Expectations": "bg-slate-500/10 text-slate-500 border-slate-500/20",
    "Needs Improvement": "bg-rose-500/10 text-rose-500 border-rose-500/20",
    "Promotion Eligible": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${styles[status]}`}>
      {status}
    </span>
  );
};

const ProfileDrawer = ({ employee, onClose }: { employee: Employee; onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<"kpi" | "okr" | "feedback" | "career">("kpi");

  const kpis = kpiDetails[employee.id] || {
    sprintDelivery: { score: 85, weight: 25 },
    codeQuality: { score: 80, weight: 20 },
    bugResolution: { score: 75, weight: 15 },
  };

  const okrs = okrDetails[employee.id] || [
    { objective: "Quarterly Department Goals", progress: 70, keyResults: [{ title: "Achieve Target KPIs", progress: 75 }] }
  ];

  const feedback = feedbackDetails[employee.id] || {
    manager: "Solid performance overall, maintains good standards.",
    peer: "Reliable and easy to work with.",
    self: "Met most of my goals, looking to improve technical depth next quarter."
  };

  const career = careerDetails[employee.id] || {
    promotionReadiness: 65,
    attritionRisk: "Low" as const,
    recommendedTraining: ["Project Management Basics"]
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-primary border-l border-slate-800 h-full overflow-y-auto animate-in slide-in-from-right duration-500 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-primary/80 backdrop-blur-md p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">{employee.name}</h2>
              <p className="text-xs font-medium text-slate-400">{employee.id} â€¢ {employee.dept} â€¢ {employee.manager}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <StatusBadge status={employee.status} />
             <button className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
               <Download size={18} />
             </button>
          </div>
        </div>

        <div className="p-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: "KPI Score", value: `${employee.kpiScore}%`, icon: Zap, color: "text-emerald-500" },
              { label: "Rating", value: `${employee.rating}/5.0`, icon: Star, color: "text-amber-500" },
              { label: "Goals", value: `${employee.goals.completed}/${employee.goals.assigned}`, icon: Target, color: "text-blue-500" },
              { label: "Quality", value: employee.qualityScore, icon: ShieldCheck, color: "text-indigo-500" },
            ].map((stat, i) => (
              <div key={i} className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                <stat.icon size={16} className={`mx-auto mb-2 ${stat.color}`} />
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] font-semibold text-slate-500 uppercase mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-800 mb-8 overflow-x-auto">
            {[
              { id: "kpi", label: "KPI Scorecard", icon: LayoutDashboard },
              { id: "okr", label: "Goal Tracking", icon: Target },
              { id: "feedback", label: "360 Feedback", icon: MessageSquare },
              { id: "career", label: "Career Path", icon: Compass },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-all text-sm font-semibold whitespace-nowrap ${
                  activeTab === tab.id 
                    ? "border-emerald-500 text-emerald-500" 
                    : "border-transparent text-slate-500 hover:text-slate-300"
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeTab === "kpi" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                   <h3 className="text-white font-bold">Metrics Performance</h3>
                   <span className="text-xs text-slate-500">Weightage distribution active</span>
                </div>
                {[
                  { label: "Sprint Delivery", ...kpis.sprintDelivery },
                  { label: "Code Quality", ...kpis.codeQuality },
                  { label: "Bug Resolution", ...kpis.bugResolution },
                ].map((kpi, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-300 font-medium">{kpi.label}</span>
                      <span className="text-white font-bold">{kpi.score}% <span className="text-slate-500 text-xs font-normal">({kpi.weight}%)</span></span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                        style={{ width: `${kpi.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "okr" && (
              <div className="space-y-8">
                {okrs.map((okr, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-bold">{okr.objective}</h4>
                      <span className="text-emerald-500 font-bold">{okr.progress}%</span>
                    </div>
                    <div className="h-3 bg-slate-800 rounded-full overflow-hidden mb-6">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${okr.progress}%` }} />
                    </div>
                    <div className="space-y-4">
                      {okr.keyResults.map((kr, j) => (
                        <div key={j} className="flex items-center gap-4">
                           <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs text-slate-400 font-bold">{j+1}</div>
                           <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400">{kr.title}</span>
                                <span className="text-white">{kr.progress}%</span>
                              </div>
                              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${kr.progress}%` }} />
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "feedback" && (
              <div className="space-y-4">
                {[
                  { label: "Manager Feedback", text: feedback.manager, icon: ShieldCheck, color: "text-emerald-500" },
                  { label: "Peer Review Snippet", text: feedback.peer, icon: Users, color: "text-blue-500" },
                  { label: "Self Assessment", text: feedback.self, icon: Star, color: "text-amber-500" },
                ].map((item, i) => (
                  <div key={i} className="bg-slate-900/50 border border-slate-800 p-5 rounded-xl border-l-4 border-l-emerald-500">
                    <div className="flex items-center gap-2 mb-3">
                       <item.icon size={16} className={item.color} />
                       <span className="text-xs font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                    </div>
                    <p className="text-slate-200 text-sm italic leading-relaxed">"{item.text}"</p>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "career" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Promotion Readiness</p>
                     <div className="relative w-24 h-24 mx-auto">
                        <svg className="w-full h-full" viewBox="0 0 100 100">
                           <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" strokeWidth="10" />
                           <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="10" 
                                   strokeDasharray={283} strokeDashoffset={283 - (283 * career.promotionReadiness) / 100} 
                                   strokeLinecap="round" className="transition-all duration-1000" />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <span className="text-xl font-bold text-white">{career.promotionReadiness}%</span>
                        </div>
                     </div>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl flex flex-col justify-center">
                     <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Attrition Risk</p>
                     <p className={`text-2xl font-bold ${career.attritionRisk === "Low" ? "text-emerald-500" : "text-rose-500"}`}>
                       {career.attritionRisk} Risk
                     </p>
                     <p className="text-xs text-slate-500 mt-2 italic">Based on engagement data</p>
                  </div>
                </div>

                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                     <Zap size={16} className="text-amber-500" /> Recommended Training
                   </h4>
                   <div className="flex flex-wrap gap-2">
                      {career.recommendedTraining.map((t, i) => (
                        <span key={i} className="px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-lg border border-slate-700">
                          {t}
                        </span>
                      ))}
                   </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function EmployeePerformance() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.dept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#020617] p-6 space-y-8 text-slate-200 selection:bg-emerald-500/30">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter">
            EPM <span className="text-emerald-500">DASHBOARD</span>
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Enterprise Performance Management & Talent Intelligence</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search performance directory..."
              className="bg-primary border border-slate-800 text-sm rounded-xl py-2.5 pl-10 pr-4 w-full md:w-80 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-primary border border-slate-800 rounded-xl hover:bg-slate-800 transition-colors text-slate-400">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Summary Bar */}
      <SummaryBar />

      {/* Performance Directory Table */}
      <div className="bg-primary border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
           <h2 className="text-lg font-bold text-white">Performance Directory</h2>
           <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">{filteredEmployees.length} Results</span>
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Emp ID</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Employee Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Dept</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Manager</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Goals (A/C)</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">KPI Score</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Task Comp.</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Quality</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Rating</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredEmployees.map((emp) => (
                <tr 
                  key={emp.id} 
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  onClick={() => setSelectedEmployee(emp)}
                >
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{emp.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center text-[10px] font-black border border-emerald-500/20">
                        {emp.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span className="text-sm font-bold text-white group-hover:text-emerald-500 transition-colors">{emp.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-400">{emp.dept}</td>
                  <td className="px-6 py-4 text-xs text-slate-400 italic">{emp.manager}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-xs font-bold text-slate-300">{emp.goals.assigned}</span>
                    <span className="text-slate-600 mx-1">/</span>
                    <span className="text-xs font-bold text-emerald-500">{emp.goals.completed}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="inline-flex items-center justify-center px-2 py-1 bg-emerald-500/10 rounded-md">
                       <span className="text-xs font-black text-emerald-500">{emp.kpiScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="w-full max-w-[60px] mx-auto h-1.5 bg-slate-800 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{ width: `${emp.taskCompletion}%` }} />
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 mt-1.5">{emp.taskCompletion}%</p>
                  </td>
                  <td className="px-6 py-4 text-center text-xs font-bold text-indigo-400">{emp.qualityScore}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                       <Star size={12} className="text-amber-500 fill-amber-500" />
                       <span className="text-sm font-black text-white">{emp.rating}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={emp.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ChevronRight size={18} className="text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 pt-8 border-t border-slate-900">
         <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Data Sync: Real-time</span>
            <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> Analytics Engine: Active</span>
         </div>
         <div>Â© 2026 Enterprise Performance Management System</div>
      </div>

      {/* Profile Detail Drawer */}
      {selectedEmployee && (
        <ProfileDrawer 
          employee={selectedEmployee} 
          onClose={() => setSelectedEmployee(null)} 
        />
      )}
    </div>
  );
}
