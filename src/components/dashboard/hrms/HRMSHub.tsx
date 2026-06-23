"use client";

import {
  AlertTriangle,
  ArrowLeft,
  BadgeIndianRupee,
  Briefcase,
  BriefcaseBusiness,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  Eye,
  FileCheck2,
  Filter,
  Fingerprint,
  Laptop,
  LogOut,
  Mail,
  MapPin,
  Phone,
  Plane,
  Plus,
  ShieldCheck,
  TrendingUp,
  User,
  UserCheck,
  UserMinus,
  Users, X, Zap,
} from "lucide-react";
import React, { useState, useEffect, type ComponentType, type ReactNode } from "react";  import { Field, Panel } from "../accounting/AccountingComponents";

type HRMSView = "employees" | "attendance" | "leave" | "payroll" | "exit";
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

const employees = [
  { id: "EMP-1024", name: "Aarav Mehta", role: "Senior React Developer", team: "Product Engineering", manager: "Vikram", location: "Jaipur", type: "Full-time", status: "Active", score: 92, email: "aarav@it-crm.com", mobile: "+91 98765 43210", joined: "12 Jan 2022" },
  { id: "EMP-1041", name: "Priya Nair", role: "QA Automation Engineer", team: "Delivery QA", manager: "Sunita", location: "Remote", type: "Full-time", status: "Active", score: 88, email: "priya@it-crm.com", mobile: "+91 98765 43211", joined: "05 Mar 2022" },     
  { id: "EMP-1088", name: "Rohan Saini", role: "DevOps Engineer", team: "CloudOps", manager: "Rajesh", location: "Bengaluru", type: "Consultant", status: "Probation", score: 76, email: "rohan@it-crm.com", mobile: "+91 98765 43212", joined: "20 Nov 2023" },       
  { id: "EMP-1112", name: "Meera Singh", role: "UI/UX Designer", team: "Design Studio", manager: "Anjali", location: "Indore", type: "Intern", status: "Training", score: 69, email: "meera@it-crm.com", mobile: "+91 98765 43213", joined: "15 May 2024" },
];

const attendanceRows = [
  { name: "Aarav Mehta", shift: "10:00 - 19:00", checkIn: "09:54", mode: "Office", status: "Present", billable: "7.6h" },
  { name: "Priya Nair", shift: "10:00 - 19:00", checkIn: "10:08", mode: "Remote", status: "Present", billable: "7.2h" },
  { name: "Rohan Saini", shift: "14:00 - 23:00", checkIn: "13:58", mode: "Hybrid", status: "Present", billable: "8.1h" },
  { name: "Meera Singh", shift: "10:00 - 17:00", checkIn: "-", mode: "Office", status: "Leave", billable: "0h" },
];

const leaveRequests = [
  { name: "Aarav Mehta", type: "Earned Leave", dates: "18 Jun - 21 Jun", days: 4, reason: "Family travel", status: "Manager Review" },
  { name: "Priya Nair", type: "Sick Leave", dates: "12 Jun", days: 1, reason: "Medical appointment", status: "Approved" },
  { name: "Rohan Saini", type: "Work From Home", dates: "13 Jun - 14 Jun", days: 2, reason: "Night deployment support", status: "HR Review" },
  { name: "Meera Singh", type: "Comp Off", dates: "16 Jun", days: 1, reason: "Weekend release work", status: "Pending" },
];

const payrollRows = [
  { name: "Aarav Mehta", ctc: "INR 18.5L", gross: "INR 1,42,000", deductions: "INR 18,420", net: "INR 1,23,580", status: "Ready" },
  { name: "Priya Nair", ctc: "INR 12.8L", gross: "INR 98,500", deductions: "INR 11,930", net: "INR 86,570", status: "Ready" },
  { name: "Rohan Saini", ctc: "INR 16.2L", gross: "INR 1,26,000", deductions: "INR 15,400", net: "INR 1,10,600", status: "Hold" },
  { name: "Meera Singh", ctc: "INR 3.6L", gross: "INR 30,000", deductions: "INR 1,800", net: "INR 28,200", status: "Ready" },
];

const initialExitCases = [
  { id: "EX-001", name: "Karan Patel", role: "Backend Developer", lastDay: "28 Jun 2026", reason: "Higher studies", notice: "Serving", handover: 65, risk: "Medium", assets: { laptop: true, idCard: false, email: false }, ffStatus: "In Progress" },
  { id: "EX-002", name: "Divya Rao", role: "HR Executive", lastDay: "15 Jun 2026", reason: "Relocation", notice: "Final Week", handover: 86, risk: "Low", assets: { laptop: true, idCard: true, email: true }, ffStatus: "Cleared" },
  { id: "EX-003", name: "Nitin Verma", role: "Support Engineer", lastDay: "20 Jun 2026", reason: "Career move", notice: "Serving", handover: 42, risk: "High", assets: { laptop: false, idCard: false, email: false }, ffStatus: "Pending" },
];
// Old static array removed
/*
const exitCases = [
  { name: "Karan Patel", role: "Backend Developer", lastDay: "28 Jun 2026", reason: "Higher studies", notice: "Serving", handover: 65, risk: "Medium" },
  { name: "Divya Rao", role: "HR Executive", lastDay: "15 Jun 2026", reason: "Relocation", notice: "Final Week", handover: 86, risk: "Low" },
  { name: "Nitin Verma", role: "Support Engineer", lastDay: "20 Jun 2026", reason: "Career move", notice: "Serving", handover: 42, risk: "High" },
];
*/

function Badge({ children, tone = "slate" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

function statusTone(status: string): Tone {
  if (["Active", "Present", "Approved", "Ready", "Low"].includes(status)) return "green";
  if (["Probation", "Manager Review", "HR Review", "Medium", "Pending"].includes(status)) return "amber";
  if (["Leave", "Hold", "High", "Exited"].includes(status)) return "red";
  return "blue";
}

function ProgressBar({ value, tone = "green" }: { value: number; tone?: "green" | "blue" | "amber" | "red" | "purple" }) {
  const colors = {
    green: "bg-green-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
  };

  return (
    <div className="h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${colors[tone]}`} style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
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
  icon: ComponentType<{ size?: number }>;
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

function ActionButton({
  icon: Icon,
  children,
  label,
  variant = "outline",
  onClick,
}: {
  icon?: ComponentType<{ size?: number }>;
  children?: ReactNode;
  label?: string;
  variant?: "primary" | "outline" | "accent";
  onClick?: () => void;
}) {
  const styles = {
    primary: "bg-primary text-white border-primary",
    outline: "bg-white text-primary border-border hover:bg-slate-50",
    accent: "bg-accent text-primary border-accent hover:bg-accent/90",
  };

  return (
    <button onClick={onClick} className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all ${styles[variant]}`}>
      {Icon && <Icon size={16} />}
      {children || label}
    </button>
  );
}



function EmployeeProfile({ employee, initialTab = 'overview', onBack }: { employee: any, initialTab?: string, onBack: () => void }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'registration', label: 'Registration' },
    { id: 'employment', label: 'Employment' },
    { id: 'documents', label: 'Documents' },
    { id: 'verification', label: 'Verification' },
    { id: 'training', label: 'Training' },
    { id: 'leave', label: 'Leave & Attendance' },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-xl font-black text-primary">Employee Profile</h3>
          <p className="text-xs font-bold text-slate-500">Master Record - {employee.name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        {/* Header Profile Info */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-2xl font-black text-white shadow-xl">
            {employee.name.split(" ").map((n: string) => n[0]).join("")}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-primary">{employee.name}</h2>
              <Badge tone={statusTone(employee.status)}>{employee.status}</Badge>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-500">{employee.role} • {employee.id}</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Mail size={14} className="text-slate-400" /> {employee.email}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Phone size={14} className="text-slate-400" /> {employee.mobile}
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <MapPin size={14} className="text-slate-400" /> {employee.location}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
             <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">HR Health</p>
                <p className="text-lg font-black text-primary">{employee.score}%</p>
             </div>
             <div className="w-32">
                <ProgressBar value={employee.score} tone={employee.score > 85 ? "green" : employee.score > 75 ? "blue" : "amber"} />
             </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-8 flex gap-6 border-b border-slate-100 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'border-b-2 border-primary text-primary' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <Panel title="Quick Summary" icon={Zap}>
                 <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                       <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Current Status</p>
                       <p className="text-sm font-bold text-emerald-900">Employee has completed onboarding and is currently active in the {employee.team} team.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Efficiency</p>
                          <p className="text-lg font-black text-primary">94%</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-xl">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance</p>
                          <p className="text-lg font-black text-primary">98.2%</p>
                       </div>
                    </div>
                 </div>
              </Panel>
              <Panel title="Professional Map" icon={Briefcase}>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <Users size={20} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-primary">Manager: {employee.manager}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reporting Line</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                          <Building2 size={20} />
                       </div>
                       <div>
                          <p className="text-xs font-black text-primary">{employee.team} Department</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Team Allocation</p>
                       </div>
                    </div>
                 </div>
              </Panel>
            </div>
          )}

          {activeTab === 'registration' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Panel title="Identity Information" description="Basic details from Step 1 Registration">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      ['Full Name', employee.name],
                      ['Date of Birth', '15 May 1995'],
                      ['Gender', 'Male'],
                      ['Blood Group', 'O+'],
                      ['Nationality', 'Indian'],
                      ['Marital Status', 'Single'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between border-b border-slate-100 pb-3 last:border-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                        <span className="text-sm font-bold text-slate-700">{val}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Contact Channels" description="Personal and emergency reachable points">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      ['Personal Email', employee.email],
                      ['Mobile Number', employee.mobile],
                      ['Alternate Mobile', '+91 98765 00000'],
                      ['Emergency Contact', 'Vikram (Father)'],
                      ['Emergency Phone', '+91 90000 11111'],
                      ['Permanent Address', '123, Tech Park, Jaipur, Rajasthan'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between border-b border-slate-100 pb-3 last:border-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                        <span className="text-sm font-bold text-slate-700 text-right">{val}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {activeTab === 'employment' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Panel title="Contractual Terms" description="Employment specifics from Step 2">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      ['Employee ID', employee.id],
                      ['Designation', employee.role],
                      ['Department', employee.team],
                      ['Employment Type', employee.type],
                      ['Probation Period', '6 Months'],
                      ['Notice Period', '90 Days'],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between border-b border-slate-100 pb-3 last:border-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                        <span className="text-sm font-bold text-slate-700">{val}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
                <Panel title="Operational Setup" description="Workplace and schedule details">
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      ['Work Location', employee.location],
                      ['Work Shift', 'General (10:00 - 19:00)'],
                      ['System Assets', 'MacBook Pro - Serial: IT-882'],
                      ['Official Email', `corp.${employee.email.split('@')[0]}@company.com`],
                      ['Reporting Manager', employee.manager],
                      ['Joined Date', employee.joined],
                    ].map(([label, val]) => (
                      <div key={label} className="flex justify-between border-b border-slate-100 pb-3 last:border-0">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                        <span className="text-sm font-bold text-slate-700">{val}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <Panel title="Document Vault" description="Digital copies uploaded during Step 3 Onboarding">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    'Aadhaar Card', 'PAN Card', '10th Marksheet', '12th Marksheet',
                    'Degree Certificate', 'Offer Letter (Prev)', 'Relieving Letter', 'Bank Passbook'
                  ].map((doc) => (
                    <div key={doc} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all cursor-pointer group">
                       <div className="flex items-center gap-3">
                          <FileCheck2 className="text-slate-400 group-hover:text-primary" size={20} />
                          <span className="text-xs font-bold text-slate-600">{doc}</span>
                       </div>
                       <Download size={14} className="text-slate-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          )}

          {activeTab === 'verification' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <Panel title="KYC & Compliance Status" description="Verification summary from Step 4">
                  <div className="space-y-4">
                    {[
                      { name: 'Identity (Aadhaar/PAN)', status: 'Verified', by: 'Admin HR', date: '14 Jan 2026' },
                      { name: 'Educational Background', status: 'Verified', by: 'Background Check Agency', date: '18 Jan 2026' },
                      { name: 'Previous Employment', status: 'Verified', by: 'Admin HR', date: '15 Jan 2026' },
                      { name: 'Address Verification', status: 'Under Review', by: 'System Auto-Check', date: 'Ongoing' },
                      { name: 'Criminal Records', status: 'Verified', by: 'Third Party Agency', date: '20 Jan 2026' },
                    ].map((v) => (
                      <div key={v.name} className="flex items-center justify-between p-4 rounded-2xl bg-white border border-slate-100 shadow-sm">
                         <div className="flex items-center gap-4">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${v.status === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                               <ShieldCheck size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-black text-primary">{v.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">By: {v.by} • {v.date}</p>
                            </div>
                         </div>
                         <Badge tone={v.status === 'Verified' ? 'green' : 'amber'}>{v.status}</Badge>
                      </div>
                    ))}
                  </div>
               </Panel>
            </div>
          )}

          {activeTab === 'training' && (
            <div className="space-y-6 animate-in fade-in duration-300">
               <div className="rounded-[2.5rem] bg-slate-900 p-8 text-white relative overflow-hidden shadow-2xl">
                  <Zap className="absolute -right-12 -bottom-12 text-white/5" size={240} />
                  <div className="relative z-10">
                     <div className="flex justify-between items-end mb-8">
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Onboarding Step 5</p>
                           <h3 className="text-2xl font-black mt-1">Training & Induction Progress</h3>
                        </div>
                        <div className="text-right">
                           <p className="text-3xl font-black text-accent">85%</p>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course Completion</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                          { label: 'Company History & Vision', done: true },
                          { label: 'Security & Data Privacy', done: true },
                          { label: 'Product Architecture', done: true },
                          { label: 'Client Communication', done: true },
                          { label: 'System Access & VPN', done: true },
                          { label: 'Project Specific Induction', done: false },
                        ].map((t) => (
                          <div key={t.label} className={`flex items-center gap-3 p-4 rounded-2xl border ${t.done ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5 opacity-40'}`}>
                             <CheckCircle2 size={18} className={t.done ? 'text-accent' : 'text-white/20'} />
                             <span className="text-xs font-bold">{t.label}</span>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'leave' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                <MetricCard label="Earned Leave" value="18" helper="8 days used" icon={Calendar} tone="blue" />
                <MetricCard label="Sick Leave" value="12" helper="2 days used" icon={AlertTriangle} tone="amber" />
                <MetricCard label="Comp Off" value="04" helper="Earned recently" icon={Clock} tone="purple" />
              </div>
              <div className="rounded-2xl border border-border bg-slate-50 p-6">
                <h4 className="text-sm font-black uppercase tracking-wider text-primary">Leave History</h4>
                <div className="mt-4 space-y-3">
                  {[
                    { type: 'Earned Leave', date: '12 May - 15 May', days: 4, status: 'Approved' },
                    { type: 'Sick Leave', date: '02 Apr', days: 1, status: 'Approved' },
                    { type: 'Casual Leave', date: '10 Feb - 11 Feb', days: 2, status: 'Approved' },
                  ].map((leave, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-primary">{leave.type}</p>
                        <p className="text-[10px] font-bold text-slate-500">{leave.date}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-black text-slate-500">{leave.days} Day(s)</span>
                        <Badge tone="green">{leave.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmployeesView({ setExits }: { setExits: any }) {
  const [employeeList, setEmployeeList] = useState(employees);
  const [view, setView] = useState<'list' | 'profile' | 'edit'>('list');
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [profileTab, setProfileTab] = useState<string>('overview');
  const [quitDialogOpen, setQuitDialogOpen] = useState(false);
  const [empToQuit, setEmpToQuit] = useState<any>(null);

  if (view === 'profile' && selectedEmp) {
    return <EmployeeProfile employee={selectedEmp} initialTab={profileTab} onBack={() => setView('list')} />;
  }

  if (view === 'edit' && selectedEmp) {
    return <EditEmployee employee={selectedEmp} onBack={() => setView('list')} />;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total Employees" value="248" helper="187 billable resources" icon={Users} tone="blue" />
        <MetricCard label="Active Projects" value="36" helper="Resource mapped" icon={BriefcaseBusiness} tone="purple" />
        <MetricCard label="Probation" value="18" helper="6 due for review" icon={UserCheck} tone="amber" />
        <MetricCard label="Compliance" value="96%" helper="KYC, NDA, asset forms" icon={ShieldCheck} tone="green" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-black text-primary">Employee Directory</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Role, department, manager, location, employment type and HR health in one practical view.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="blue">Org Chart Ready</Badge>
            <Badge tone="green">KYC Linked</Badge>
            <Badge tone="purple">Asset Mapped</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {employeeList.map((employee) => (
            <div key={employee.id} className="rounded-2xl border border-border bg-slate-50 p-5 group transition-all hover:border-primary/20 hover:bg-white hover:shadow-xl hover:shadow-primary/5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-black text-white group-hover:scale-110 transition-transform">
                    {employee.name.split(" ").map((part: string) => part[0]).join("")}
                  </div>
                  <div>
                    <p className="text-lg font-black text-primary">{employee.name}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">{employee.id} - {employee.role}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                   <Badge tone={statusTone(employee.status)}>{employee.status}</Badge>
                   <div className="flex gap-1">
                      <button
                        onClick={() => { setSelectedEmp(employee); setProfileTab('overview'); setView('profile'); }}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all" title="View Profile">
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => { setSelectedEmp(employee); setView('edit'); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Employee">
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => { setSelectedEmp(employee); setProfileTab('leave'); setView('profile'); }}
                        className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Leave & Attendance">
                        <CalendarDays size={16} />
                      </button>
                      <button
                        onClick={() => { setEmpToQuit(employee); setQuitDialogOpen(true); }}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Offboard Employee">
                        <UserMinus size={16} />
                      </button>
                   </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl bg-white p-3 border border-slate-100 group-hover:border-slate-200">
                  <p className="text-sm font-black text-primary">{employee.team}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Team</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-slate-100 group-hover:border-slate-200">
                  <p className="text-sm font-black text-primary">{employee.manager}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Manager</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-slate-100 group-hover:border-slate-200">
                  <p className="text-sm font-black text-primary">{employee.location}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Location</p>
                </div>
                <div className="rounded-xl bg-white p-3 border border-slate-100 group-hover:border-slate-200">
                  <p className="text-sm font-black text-primary">{employee.type}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>HR Health</span>
                  <span>{employee.score}%</span>
                </div>
                <ProgressBar value={employee.score} tone={employee.score > 85 ? "green" : employee.score > 75 ? "blue" : "amber"} />
              </div>
            </div>
          ))}
        </div>
      {quitDialogOpen && empToQuit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md rounded-3xl border border-border bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-600 mb-6">
              <UserMinus size={32} />
            </div>
            <h3 className="text-2xl font-black text-primary">Offboard Employee?</h3>
            <p className="mt-2 text-slate-500 font-medium">Are you sure you want to offboard <span className="font-bold text-primary">{empToQuit.name}</span>? This will update their status to Exited.</p>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => { setQuitDialogOpen(false); setEmpToQuit(null); }}
                className="flex-1 h-12 rounded-xl border border-border bg-white text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setEmployeeList(prev => prev.map(emp => emp.id === empToQuit.id ? { ...emp, status: 'Exited' } : emp));
                  // Automatically add to ExitView
                  const exitEntry = {
                    id: `EX-AUTO-${Date.now()}`,
                    name: empToQuit.name,
                    role: empToQuit.role,
                    lastDay: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(), // Default 30 days notice
                    reason: "Offboarded from directory",
                    notice: "Final Month",
                    handover: 0,
                    risk: "Medium",
                    assets: { laptop: false, idCard: false, email: false },
                    ffStatus: "Pending"
                  };
                  setExits((prevExits: any) => [exitEntry, ...prevExits]);
                  setQuitDialogOpen(false);
                  setEmpToQuit(null);
                }}
                className="flex-[2] h-12 rounded-xl bg-red-600 text-xs font-black uppercase tracking-widest text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all"
              >
                Confirm Offboard
              </button>
            </div>
          </div>
        </div>
      )}
      </section>
    </div>
  );
}

function LeaveView({ isApplying, setIsApplying }: { isApplying: boolean, setIsApplying: (v: boolean) => void }) {
  const [requests, setRequests] = useState(leaveRequests);
  const [newLeave, setNewLeave] = useState({
    name: "Rahul Verma", // Mock logged in user
    type: "Earned Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleApply = () => {
    const days = calculateDays(newLeave.startDate, newLeave.endDate);
    const request = {
      name: newLeave.name,
      type: newLeave.type,
      dates: `${newLeave.startDate} - ${newLeave.endDate}`,
      days,
      reason: newLeave.reason,
      status: "Pending",
    };
    setRequests([request, ...requests]);
    setIsApplying(false);
    setNewLeave({ name: "Rahul Verma", type: "Earned Leave", startDate: "", endDate: "", reason: "" });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Requests" value={String(requests.filter(r => r.status === "Pending" || r.status.includes("Review")).length)} helper="HR + manager queue" icon={Plane} tone="amber" />
        <MetricCard label="Approved Month" value="42" helper="Including WFH" icon={CheckCircle2} tone="green" />
        <MetricCard label="Leave Liability" value="312d" helper="Earned leave balance" icon={Calendar} tone="blue" />
        <MetricCard label="Policy Exceptions" value="03" helper="Needs review" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-primary">Leave & WFH Requests</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Practical approval queue with leave type, date range, days, reason and approval stage.</p>
          </div>
          <ActionButton icon={Plus} variant="accent" onClick={() => setIsApplying(true)}>Apply Leave</ActionButton>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {requests.map((request, i) => (
            <div key={i} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-lg font-black text-primary">{request.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{request.type} - {request.dates}</p>
                </div>
                <Badge tone={statusTone(request.status)}>{request.status}</Badge>
              </div>
              <div className="mt-5 rounded-xl bg-white p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Reason</p>
                <p className="mt-2 text-sm font-bold text-slate-600">{request.reason}</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-widest text-slate-500">{request.days} day(s)</span>
                <button className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary">
                  Review <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isApplying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
             <button onClick={() => setIsApplying(false)} className="absolute right-8 top-8 p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={20}/></button>
             <h3 className="text-2xl font-black text-primary tracking-tight">Apply for Leave</h3>
             <p className="text-slate-500 text-sm font-medium mt-1">Please provide your leave details for manager review.</p>

             <div className="mt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leave Type</label>
                      <select
                        value={newLeave.type}
                        onChange={(e) => setNewLeave({...newLeave, type: e.target.value})}
                        className="w-full rounded-xl border border-border bg-slate-50 py-3 px-4 text-sm font-bold text-primary focus:border-primary outline-none"
                      >
                         <option>Earned Leave</option>
                         <option>Sick Leave</option>
                         <option>Casual Leave</option>
                         <option>Work From Home</option>
                         <option>Comp Off</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee Name</label>
                      <input type="text" value={newLeave.name} disabled className="w-full rounded-xl border border-border bg-slate-100 py-3 px-4 text-sm font-bold text-primary" />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Start Date</label>
                      <input type="date" value={newLeave.startDate} onChange={(e) => setNewLeave({...newLeave, startDate: e.target.value})} className="w-full rounded-xl border border-border bg-slate-50 py-3 px-4 text-sm font-bold text-primary focus:border-primary outline-none" />
                    </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">End Date</label>
                      <input type="date" value={newLeave.endDate} onChange={(e) => setNewLeave({...newLeave, endDate: e.target.value})} className="w-full rounded-xl border border-border bg-slate-50 py-3 px-4 text-sm font-bold text-primary focus:border-primary outline-none" />
                   </div>
                </div>

                <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reason for Leave</label>
                   <textarea
                     rows={3}
                     placeholder="State your reason clearly..."
                     value={newLeave.reason}
                     onChange={(e) => setNewLeave({...newLeave, reason: e.target.value})}
                     className="w-full rounded-xl border border-border bg-slate-50 py-3 px-4 text-sm font-bold text-primary focus:border-primary outline-none resize-none"
                   ></textarea>
                </div>

                <div className="flex gap-3 pt-4">
                   <button onClick={() => setIsApplying(false)} className="flex-1 h-12 rounded-xl border border-border bg-white text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">Cancel</button>
                   <button onClick={handleApply} className="flex-[2] h-12 rounded-xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90">Submit Request</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceView() {
  return (
    <div className="p-8 text-center text-slate-500">
      <h3 className="text-lg font-black text-primary">Attendance Module</h3>
      <p>Attendance tracking is currently under development.</p>
    </div>
  );
}


const initialPayroll = [
  { 
    id: "SAL-2026-001", 
    empId: "EMP-102", 
    name: "Rahul Verma", 
    mobile: "+91 98765 43210", 
    basic: 50000, hra: 20000, allowance: 15000, conveyance: 5000, bonus: 7000,
    pf: 6000, pt: 200, tds: 3000, advance: 600, gross: "INR 92,000", deductions: "INR 9,800", net: "INR 82,200",
    status: "Approved" 
  },
];

function PayrollView({ isAdding, setIsAdding }: { isAdding: boolean, setIsAdding: (v: boolean) => void }) {
  const [payroll, setPayroll] = useState(initialPayroll);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [newRow, setNewRow] = useState<any>({
    empId: "", name: "", mobile: "", basic: 0, hra: 0, allowance: 0, conveyance: 0, bonus: 0, pf: 0, pt: 0, tds: 0, advance: 0, status: "Pending",
  });

  // --- Sync with LocalStorage ---
  useEffect(() => {
    const savedPayroll = localStorage.getItem("crm_payroll_data");
    if (savedPayroll) {
      setPayroll(JSON.parse(savedPayroll));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("crm_payroll_data", JSON.stringify(payroll));
  }, [payroll]);

  const calculateFinancials = (row: any) => {
    const gross = (Number(row.basic) || 0) + (Number(row.hra) || 0) + (Number(row.allowance) || 0) + (Number(row.conveyance) || 0) + (Number(row.bonus) || 0);
    const deductions = (Number(row.pf) || 0) + (Number(row.pt) || 0) + (Number(row.tds) || 0) + (Number(row.advance) || 0);
    const net = gross - deductions;
    return { ...row, gross, deductions, net };
  };

  const saveEdit = (updatedRow: any) => {
    const fullRow = calculateFinancials(updatedRow);
    setPayroll(payroll.map((p:any) => p.id === updatedRow.id ? fullRow : p));
    setEditingRow(null);
  };

  const addPayroll = () => {
    const id = `SAL-2026-${String(payroll.length + 61).padStart(3, '0')}`;
    const fullRow = calculateFinancials({ ...newRow, id });
    setPayroll([...payroll, fullRow]);
    setIsAdding(false);
    setNewRow({
      empId: "", name: "", mobile: "", basic: 0, hra: 0, allowance: 0, conveyance: 0, bonus: 0, pf: 0, pt: 0, tds: 0, advance: 0, status: "Pending",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 p-6 bg-amber-50 rounded-2xl border border-amber-100 mb-4">
        <div className="flex items-center gap-3 text-amber-800">
           <ShieldCheck size={20} />
           <p className="text-sm font-black uppercase tracking-widest">Management Restricted</p>
        </div>
        <p className="text-xs font-bold text-amber-700 leading-5">Payroll calculations, edits and deletions are managed exclusively within the <span className="font-black underline cursor-pointer">Accounting Module</span>. This view provides a read-only register for HR records.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4 w-full">
        <MetricCard label="Monthly Payroll" value={`₹${payroll.reduce((acc:any, curr:any) => acc + (typeof curr.net === "string" ? Number(curr.net.replace(/[^0-9.-]+/g,"")) : (curr.net || 0)), 0).toLocaleString()}`} helper={`${payroll.length} records`} icon={BadgeIndianRupee} tone="green" />
        <MetricCard label="Approved" value={payroll.filter((p:any) => p.status === "Approved").length.toString()} helper="Bank ready" icon={CheckCircle2} tone="blue" />
        <MetricCard label="Processing" value={payroll.filter((p:any) => p.status !== "Approved").length.toString()} helper="Pending Finance" icon={Clock} tone="amber" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-primary">Payroll Register</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Official salary breakdown as synced from the Finance and Accounting module.</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[2000px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="pb-4">Emp ID</th>
                <th className="pb-4">Name</th>
                <th className="pb-4">Mobile</th>
                <th className="pb-4">Basic</th>
                <th className="pb-4">HRA</th>
                <th className="pb-4">Spl. All.</th>
                <th className="pb-4">Conv.</th>
                <th className="pb-4">Bonus</th>
                <th className="pb-4">Gross</th>
                <th className="pb-4">EPF</th>
                <th className="pb-4">PT</th>
                <th className="pb-4">TDS</th>
                <th className="pb-4">Adv.</th>
                <th className="pb-4">Total Ded.</th>
                <th className="pb-4">Net</th>
                <th className="pb-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
              {payroll.map((row:any) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4">{row.empId}</td>
                  <td className="py-4 font-black text-primary">{row.name}</td>
                  <td className="py-4">{row.mobile}</td>
                  <td className="py-4">₹{(row.basic || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.hra || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.allowance || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.conveyance || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.bonus || 0).toLocaleString()}</td>
                  <td className="py-4 font-black text-primary">₹{(typeof row.gross === "string" ? row.gross : (row.gross || 0).toLocaleString())}</td>
                  <td className="py-4">₹{(row.pf || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.pt || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.tds || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.advance || 0).toLocaleString()}</td>
                  <td className="py-4 font-black text-red-600">₹{(typeof row.deductions === "string" ? row.deductions : (row.deductions || 0).toLocaleString())}</td>
                  <td className="py-4 font-black text-emerald-600">₹{(typeof row.net === "string" ? row.net : (row.net || 0).toLocaleString())}</td>
                  <td className="py-4"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ExitView({ exits, setExits, isStarting, setIsStarting }: { exits: any[], setExits: any, isStarting: boolean, setIsStarting: (v: boolean) => void }) {
  const [newExit, setNewExit] = useState({
    name: "",
    lastDay: "",
    reason: "",
    risk: "Low",
  });

  const handleStartExit = () => {
    const entry = {
      id: `EX-00${exits.length + 1}`,
      name: newExit.name,
      role: "Team Member", // Mock role
      lastDay: newExit.lastDay,
      reason: newExit.reason,
      notice: "Serving",
      handover: 0,
      risk: newExit.risk,
      assets: { laptop: false, idCard: false, email: false },
      ffStatus: "Pending"
    };
    setExits([entry, ...exits]);
    setIsStarting(false);
  };

  const toggleAsset = (id: string, assetKey: string) => {
    setExits(exits.map((e: any) => e.id === id ? { ...e, assets: { ...e.assets, [assetKey]: !e.assets[assetKey] } } : e));
  };

  const updateFF = (id: string, status: string) => {
    setExits(exits.map((e: any) => e.id === id ? { ...e, ffStatus: status } : e));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Exits" value={String(exits.length)} helper="Notice period active" icon={LogOut} tone="amber" />
        <MetricCard label="F&F Cleared" value={String(exits.filter(e => e.ffStatus === "Cleared").length)} helper="Settlements done" icon={CheckCircle2} tone="green" />
        <MetricCard label="Asset Recovery" value={String(exits.filter(e => Object.values(e.assets).every(v => v)).length)} helper="Fully recovered" icon={Laptop} tone="purple" />
        <MetricCard label="Pending F&F" value={String(exits.filter(e => e.ffStatus === "Pending").length)} helper="Financial queue" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-black text-primary">Exit Management Dashboard</h3>
            <p className="mt-1 text-xs font-semibold text-slate-500">Full lifecycle tracking from resignation to final settlement.</p>
          </div>
          <ActionButton icon={LogOut} variant="accent" onClick={() => setIsStarting(true)}>Start New Exit</ActionButton>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {exits.map((item) => (
            <div key={item.id} className="rounded-[2rem] border border-slate-100 bg-slate-50/50 p-7 group hover:bg-white hover:shadow-xl transition-all">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-5">
                   <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center text-white text-xl font-black shadow-lg shadow-primary/20">
                      {item.name.charAt(0)}
                   </div>
                   <div>
                      <h4 className="text-xl font-black text-primary">{item.name}</h4>
                      <p className="text-xs font-bold text-slate-500 mt-1">{item.role} • ID: {item.id}</p>
                      <div className="mt-3 flex gap-2">
                        <Badge tone={statusTone(item.risk)}>{item.risk} Risk</Badge>
                        <Badge tone="blue">LWD: {item.lastDay}</Badge>
                      </div>
                   </div>
                </div>

                <div className="flex flex-col md:items-end gap-3">
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Settlement Status</p>
                   <select
                     value={item.ffStatus}
                     onChange={(e) => updateFF(item.id, e.target.value)}
                     className={`text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl border-2 transition-all outline-none ${item.ffStatus === "Cleared" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}
                   >
                      <option>Pending</option>
                      <option>In Progress</option>
                      <option>Cleared</option>
                   </select>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <h5 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                       <Laptop size={14} /> Asset Recovery Checklist
                    </h5>
                    <div className="space-y-3">
                       {[
                         { key: 'laptop', label: 'Laptop & Charger' },
                         { key: 'idCard', label: 'ID Card & Access Keys' },
                         { key: 'email', label: 'Official Email Revoked' }
                       ].map((asset: any) => (
                         <div key={asset.key} onClick={() => toggleAsset(item.id, asset.key)} className="flex items-center justify-between cursor-pointer group">
                            <span className="text-xs font-bold text-slate-600 group-hover:text-primary">{asset.label}</span>
                            <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all ${item.assets[asset.key] ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200"}`}>
                               {item.assets[asset.key] && <CheckCircle2 size={12} />}
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-xs font-black uppercase tracking-widest text-primary">Handover & Knowledge Transfer</h5>
                        <span className="text-sm font-black text-primary">{item.handover}%</span>
                      </div>
                      <ProgressBar value={item.handover} tone={item.handover > 80 ? "green" : "amber"} />
                    </div>
                    <p className="mt-4 text-[10px] font-bold text-slate-500 italic leading-relaxed">
                       Reason: {item.reason}
                    </p>
                 </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isStarting && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
           <div className="w-full max-w-xl bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
              <button onClick={() => setIsStarting(false)} className="absolute right-8 top-8 p-2 text-slate-400 hover:bg-slate-50 rounded-full"><X size={20}/></button>
              <h3 className="text-2xl font-black text-primary tracking-tight">Initiate Exit Process</h3>
              <p className="text-slate-500 text-sm font-medium mt-1">Select employee and enter offboarding timelines.</p>

              <div className="mt-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Employee to Offboard</label>
                    <select
                      value={newExit.name}
                      onChange={(e) => setNewExit({...newExit, name: e.target.value})}
                      className="w-full rounded-xl border border-border bg-slate-50 py-3 px-4 text-sm font-bold text-primary focus:border-primary outline-none"
                    >
                       <option value="">Select Employee...</option>
                       {employees.map(emp => <option key={emp.id} value={emp.name}>{emp.name} ({emp.id})</option>)}
                    </select>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Last Working Day</label>
                       <input type="date" value={newExit.lastDay} onChange={(e) => setNewExit({...newExit, lastDay: e.target.value})} className="w-full rounded-xl border border-border bg-slate-50 py-3 px-4 text-sm font-bold text-primary focus:border-primary outline-none" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Risk Assessment</label>
                       <select value={newExit.risk} onChange={(e) => setNewExit({...newExit, risk: e.target.value})} className="w-full rounded-xl border border-border bg-slate-50 py-3 px-4 text-sm font-bold text-primary focus:border-primary outline-none">
                          <option>Low</option>
                          <option>Medium</option>
                          <option>High</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Reason for Departure</label>
                    <textarea value={newExit.reason} onChange={(e) => setNewExit({...newExit, reason: e.target.value})} rows={3} placeholder="Describe the reason..." className="w-full rounded-xl border border-border bg-slate-50 py-3 px-4 text-sm font-bold text-primary focus:border-primary outline-none resize-none"></textarea>
                 </div>

                 <div className="flex gap-3 pt-4">
                    <button onClick={() => setIsStarting(false)} className="flex-1 h-12 rounded-xl border border-border bg-white text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50">Cancel</button>
                    <button onClick={handleStartExit} className="flex-[2] h-12 rounded-xl bg-red-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all">Start Offboarding</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function HRMSHub({ activeView, onAddEmployee }: { activeView: HRMSView, onAddEmployee?: () => void }) {
  const [exits, setExits] = useState(initialExitCases);
  const [isStartingExit, setIsApplyingExit] = useState(false);
  const [isApplyingLeave, setIsApplyingLeave] = useState(false);
  const [isAddingPayroll, setIsAddingPayroll] = useState(false);

  const title =
    activeView === "employees"
      ? "Employees"
      : activeView === "attendance"
        ? "Attendance"
        : activeView === "leave"
          ? "Leave Management"
          : activeView === "payroll"
            ? "Payroll"
            : "Exit Management";

  const description =
    activeView === "employees"
      ? "Employee master, org mapping, manager ownership, assets, compliance and HR health for IT teams."
      : activeView === "attendance"
        ? "Hybrid attendance tracking with shifts, geo/IP mode, late marks, missing punch and billable hours."
        : activeView === "leave"
          ? "Leave, WFH, comp-off and approval queue designed for manager plus HR review workflows."
          : activeView === "payroll"
            ? "Monthly payroll run with CTC, gross, deductions, net pay, holds and payslip readiness."
            : "Notice period, handover, asset recovery, access revoke and final settlement control.";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg">
            {activeView === "employees" ? <Users size={26} /> : activeView === "attendance" ? <Fingerprint size={26} /> : activeView === "leave" ? <Plane size={26} /> : activeView === "payroll" ? <BadgeIndianRupee size={26} /> : <LogOut size={26} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-[#1E293B]">{title}</h2>
              <Badge tone="green">HRMS</Badge>
            </div>
            <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <ActionButton icon={Download}>Export</ActionButton>
          <ActionButton icon={Filter}>Filter</ActionButton>
          <ActionButton
            icon={activeView === "payroll" ? undefined : Plus}
            variant="accent"
            onClick={() => {
              if (activeView === "employees" && onAddEmployee) {
                onAddEmployee();
              }
              if (activeView === "leave") {
                setIsApplyingLeave(true);
              }
              if (activeView === "exit") {
                setIsApplyingExit(true);
              }
              if (activeView === "payroll") {
                setIsAddingPayroll(true);
              }
            }}
          >
            {activeView === "employees" ? "Add Employee" : activeView === "attendance" ? "Regularize" : activeView === "leave" ? "Apply Leave" : activeView === "payroll" ? "New Payroll" : "Start Exit"}
          </ActionButton>
        </div>
      </div>

      {activeView === "employees" && <EmployeesView setExits={setExits} />}
      {activeView === "attendance" && <AttendanceView />}
      {activeView === "leave" && <LeaveView isApplying={isApplyingLeave} setIsApplying={setIsApplyingLeave} />}
      {activeView === "payroll" && <PayrollView isAdding={isAddingPayroll} setIsAdding={setIsAddingPayroll} />}
      {activeView === "exit" && <ExitView exits={exits} setExits={setExits} isStarting={isStartingExit} setIsStarting={setIsApplyingExit} />}

      <section className="rounded-2xl border border-border bg-primary p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-accent" size={24} />
          <h3 className="text-lg font-black">Practical HRMS Controls</h3>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          {[
            ["Single employee master", "Employee data should connect attendance, payroll, assets, project allocation and access."],
            ["Payroll lock before payout", "Attendance, leave, exits and reimbursements must be reconciled before salary release."],
            ["Access tied to lifecycle", "Joining, role change and exit should trigger system access and asset controls."],
            ["Manager plus HR ownership", "Approvals need clear SLA, escalation and audit history for practical operations."],
          ].map(([control, detail]) => (
            <div key={control} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-black">{control}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-slate-300">{detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}