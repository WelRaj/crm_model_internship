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
  Users,
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

const exitCases = [
  { name: "Karan Patel", role: "Backend Developer", lastDay: "28 Jun 2026", reason: "Higher studies", notice: "Serving", handover: 65, risk: "Medium" },
  { name: "Divya Rao", role: "HR Executive", lastDay: "15 Jun 2026", reason: "Relocation", notice: "Final Week", handover: 86, risk: "Low" },
  { name: "Nitin Verma", role: "Support Engineer", lastDay: "20 Jun 2026", reason: "Career move", notice: "Serving", handover: 42, risk: "High" },
];

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

function EmployeeProfile({ employee, initialTab = 'overview', onBack }: { employee: any, initialTab?: 'overview' | 'leave', onBack: () => void }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-xl font-black text-primary">Employee Profile</h3>
          <p className="text-xs font-bold text-slate-500">Detailed view of {employee.name}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-2xl font-black text-white shadow-xl">
            {employee.name.split(" ").map((n: string) => n[0]).join("")}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-black text-primary">{employee.name}</h2>
              <Badge tone={statusTone(employee.status)}>{employee.status}</Badge>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-500">{employee.role} â€¢ {employee.id}</p>
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

        <div className="mt-8 flex gap-6 border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'border-b-2 border-primary text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('leave')}
            className={`pb-4 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'leave' ? 'border-b-2 border-primary text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Leave & Attendance
          </button>
        </div>

        <div className="mt-8">
          {activeTab === 'overview' ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <User className="text-primary" size={18} />
                  <h4 className="text-sm font-black uppercase tracking-wider text-primary">Personal Details</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-5">
                  {[
                    ['Full Name', employee.name],
                    ['Email Address', employee.email],
                    ['Mobile Number', employee.mobile],
                    ['Work Location', employee.location],
                    ['Joined Date', employee.joined],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between border-b border-slate-200/50 pb-3 last:border-0 last:pb-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                      <span className="text-sm font-bold text-slate-700">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <Briefcase className="text-primary" size={18} />
                  <h4 className="text-sm font-black uppercase tracking-wider text-primary">Employment Details</h4>
                </div>
                <div className="grid grid-cols-1 gap-4 rounded-2xl bg-slate-50 p-5">
                  {[
                    ['Department / Team', employee.team],
                    ['Reporting Manager', employee.manager],
                    ['Employment Type', employee.type],
                    ['Designation', employee.role],
                    ['Employee ID', employee.id],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between border-b border-slate-200/50 pb-3 last:border-0 last:pb-0">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                      <span className="text-sm font-bold text-slate-700">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
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

function EditEmployee({ employee, onBack }: { employee: any, onBack: () => void }) {
  const [formData, setFormData] = useState({
    role: employee.role,
    team: employee.team,
    mobile: employee.mobile,
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-slate-500 hover:bg-slate-50 shadow-sm transition-all">
          <ArrowLeft size={18} />
        </button>
        <div>
          <h3 className="text-xl font-black text-primary">Edit Employee</h3>
          <p className="text-xs font-bold text-slate-500">Update information for {employee.name}</p>
        </div>
      </div>

      <div className="max-w-2xl rounded-2xl border border-border bg-white p-8 shadow-sm">
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Designation / Role</label>
              <div className="relative">
                <BriefcaseBusiness className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  className="w-full rounded-xl border border-border bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold text-primary focus:border-primary focus:outline-none transition-all"
                  placeholder="e.g. Senior Developer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Department / Team</label>
              <div className="relative">
                <Building2 className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={formData.team}
                  onChange={(e) => setFormData({...formData, team: e.target.value})}
                  className="w-full rounded-xl border border-border bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold text-primary focus:border-primary focus:outline-none transition-all"
                  placeholder="e.g. Product Engineering"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={formData.mobile}
                  onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                  className="w-full rounded-xl border border-border bg-slate-50 py-3 pl-12 pr-4 text-sm font-bold text-primary focus:border-primary focus:outline-none transition-all"
                  placeholder="+91 00000 00000"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button onClick={onBack} className="flex-1 rounded-xl border border-border bg-white py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button onClick={onBack} className="flex-1 rounded-xl bg-primary py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmployeesView() {
  const [employeeList, setEmployeeList] = useState(employees);
  const [view, setView] = useState<'list' | 'profile' | 'edit'>('list');
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'leave'>('overview');
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
                    {employee.name.split(" ").map((part) => part[0]).join("")}
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

function AttendanceView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Present Today" value="221" helper="89% attendance" icon={Fingerprint} tone="green" />
        <MetricCard label="Late Marks" value="11" helper="After grace window" icon={Clock} tone="amber" />
        <MetricCard label="Remote Check-ins" value="64" helper="Geo/IP verified" icon={Laptop} tone="blue" />
        <MetricCard label="Missing Punch" value="07" helper="Needs HR action" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Attendance Control Room</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Daily punch, shift, work mode, billable hours and exception tracking for hybrid IT teams.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-slate-100">
                {["Employee", "Shift", "Check-in", "Mode", "Billable", "Status"].map((head) => (
                  <th key={head} className="pb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendanceRows.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50/60">
                  <td className="py-5 font-black text-primary">{row.name}</td>
                  <td className="py-5 text-sm font-bold text-slate-500">{row.shift}</td>
                  <td className="py-5 text-sm font-bold text-slate-500">{row.checkIn}</td>
                  <td className="py-5">
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                      <MapPin size={15} /> {row.mode}
                    </span>
                  </td>
                  <td className="py-5 text-sm font-black text-primary">{row.billable}</td>
                  <td className="py-5"><Badge tone={statusTone(row.status)}>{row.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LeaveView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pending Requests" value="16" helper="HR + manager queue" icon={Plane} tone="amber" />
        <MetricCard label="Approved Month" value="42" helper="Including WFH" icon={CheckCircle2} tone="green" />
        <MetricCard label="Leave Liability" value="312d" helper="Earned leave balance" icon={Calendar} tone="blue" />
        <MetricCard label="Policy Exceptions" value="03" helper="Needs review" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Leave & WFH Requests</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Practical approval queue with leave type, date range, days, reason and approval stage.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {leaveRequests.map((request) => (
            <div key={`${request.name}-${request.dates}`} className="rounded-2xl border border-border bg-slate-50 p-5">
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
    </div>
  );
}

function PayrollView() {
  const [payroll, setPayroll] = useState( [
  { 
    id: "SAL-2026-061", 
    employee: "Rahul Verma", 
    empId: "EMP-102", 
    mobile: "9876543210", 
    month: "June 2026", 
    basic: 50000, hra: 20000, allowance: 15000, conveyance: 5000, bonus: 2000,
    pf: 6000, pt: 200, tds: 3600, advance: 0,
    gross: "INR 92,000", deductions: "INR 9,800", net: "INR 82,200", 
    status: "Approved" 
  },
  { 
    id: "SAL-2026-062", 
    employee: "Swati Joshi", 
    empId: "EMP-118", 
    mobile: "9876543211", 
    month: "June 2026", 
    basic: 65000, hra: 25000, allowance: 18000, conveyance: 5000, bonus: 5000,
    pf: 9000, pt: 200, tds: 6200, advance: 0,
    gross: "INR 1,18,000", deductions: "INR 15,400", net: "INR 1,02,600", 
    status: "Pending Finance" 
  },
  { 
    id: "SAL-2026-063", 
    employee: "Amir Khan", 
    empId: "EMP-124", 
    mobile: "9876543212", 
    month: "June 2026", 
    basic: 45000, hra: 15000, allowance: 10000, conveyance: 3000, bonus: 3000,
    pf: 4500, pt: 200, tds: 2000, advance: 0,
    gross: "INR 76,000", deductions: "INR 6,700", net: "INR 69,300", 
    status: "HR Review" 
  },
]);

  // --- Sync with LocalStorage ---
  useEffect(() => {
    const savedPayroll = localStorage.getItem("crm_payroll_data");
    if (savedPayroll) {
      setPayroll(JSON.parse(savedPayroll));
    }
    
    // Event listener for cross-tab or same-page sync
    const handleStorage = () => {
      const updated = localStorage.getItem("crm_payroll_data");
      if (updated) setPayroll(JSON.parse(updated));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

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
        <MetricCard label="Monthly Payroll" value={`₹${payroll.reduce((acc, curr) => acc + (typeof curr.net === "string" ? Number(curr.net.replace(/[^0-9.-]+/g,"")) : (curr.net || 0)), 0).toLocaleString()}`} helper={`${payroll.length} records`} icon={BadgeIndianRupee} tone="green" />
        <MetricCard label="Approved" value={payroll.filter(p => p.status === "Approved").length.toString()} helper="Bank ready" icon={CheckCircle2} tone="blue" />
        <MetricCard label="Processing" value={payroll.filter(p => p.status !== "Approved").length.toString()} helper="Pending Finance" icon={Clock} tone="amber" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
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
              {payroll.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4">{row.empId}</td>
                  <td className="py-4 font-black text-primary">{row.name}</td>
                  <td className="py-4">{row.mobile}</td>
                  <td className="py-4">₹{(row.basic || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.hra || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.allowance || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.conveyance || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.bonus || 0).toLocaleString()}</td>
                  <td className="py-4 font-black text-primary">₹{row.gross.toLocaleString()}</td>
                  <td className="py-4">₹{(row.pf || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.pt || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.tds || 0).toLocaleString()}</td>
                  <td className="py-4">₹{(row.advance || 0).toLocaleString()}</td>
                  <td className="py-4 font-black text-red-600">₹{row.deductions.toLocaleString()}</td>
                  <td className="py-4 font-black text-emerald-600">₹{row.net.toLocaleString()}</td>
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

function ExitView() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Open Exits" value="12" helper="Notice period active" icon={LogOut} tone="amber" />
        <MetricCard label="Knowledge Transfer" value="74%" helper="Average completion" icon={FileCheck2} tone="blue" />
        <MetricCard label="Asset Recovery" value="09" helper="Laptop, ID, access" icon={Laptop} tone="purple" />
        <MetricCard label="High Risk" value="03" helper="Client or project impact" icon={AlertTriangle} tone="red" />
      </div>

      <section className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-black text-primary">Exit Management</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">Notice period, handover, asset recovery, payroll lock and access revocation tracking.</p>
        </div>
        <div className="space-y-4">
          {exitCases.map((item) => (
            <div key={item.name} className="rounded-2xl border border-border bg-slate-50 p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-lg font-black text-primary">{item.name}</p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.role} - Last day: {item.lastDay}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={statusTone(item.risk)}>{item.risk} Risk</Badge>
                  <Badge tone="blue">{item.notice}</Badge>
                </div>
              </div>
              <div className="mt-5 rounded-xl bg-white p-4">
                <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-500">
                  <span>Handover Completion</span>
                  <span>{item.handover}%</span>
                </div>
                <div className="mt-3">
                  <ProgressBar value={item.handover} tone={item.risk === "High" ? "red" : item.risk === "Medium" ? "amber" : "green"} />
                </div>
                <p className="mt-3 text-xs font-semibold text-slate-500">Reason: {item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function HRMSHub({ activeView }: { activeView: HRMSView }) {
  
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
          <ActionButton icon={activeView === "payroll" ? undefined : Plus} variant="accent" >
            {activeView === "employees" ? "Add Employee" : activeView === "attendance" ? "Regularize" : activeView === "leave" ? "Apply Leave" : activeView === "payroll" ? "Payroll Register" : "Start Exit"}
          </ActionButton>
        </div>
      </div>

      {activeView === "employees" && <EmployeesView />}
      {activeView === "attendance" && <AttendanceView />}
      {activeView === "leave" && <LeaveView />}
      {activeView === "payroll" && <PayrollView />}
      {activeView === "exit" && <ExitView />}

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



