"use client";

import EmployeePerformance from "@/components/dashboard/projects/performance/EmployeePerformance";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { 
  LayoutDashboard, UserPlus, Target, Wallet, Speaker, Bell, Search, LogOut, TrendingUp, Users, Briefcase, Settings, Shield, ShieldCheck, Calendar, HelpCircle, MessageSquare, ChevronDown, User, Clock, SquareCheck, History, CheckCircle2, Menu, ChevronLeft, UserCheck, Headphones, X, Mail, Phone, MapPin, IdCard, KeyRound, Pencil
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
import { changePassword, clearAuthSession, getCurrentUser, logout, type AuthUser } from "@/services/auth-api";
import { getStoredAuthTokens } from "@/lib/api-client";
import { getCurrentProfile, updateCurrentProfile, type BackendUserProfile } from "@/services/profile-api";
import { useRouter } from "next/navigation";

type MarketingView = "campaigns" | "roi" | "sources";
type AdminView = "users" | "roles" | "logs" | "approvals" | "settings";

const marketingTabs: MarketingView[] = ["campaigns", "roi", "sources"];
const adminTabs: AdminView[] = ["users", "roles", "logs", "approvals", "settings"];
const projectTabs = ["projects", "team-tracking", "tasks", "milestones", "deadlines", "performance"];
const accountingModuleIds = ACCOUNTING_MODULES.map((module) => module.id);

const isAccountingModule = (tab: string): tab is AccountingModuleId =>
  accountingModuleIds.includes(tab as AccountingModuleId);

const notifications = [
  { id: "NOT-01", title: "Critical support ticket", detail: "Finance invoice approval needs action", tab: "support", tone: "bg-rose-500" },
  { id: "NOT-02", title: "Follow-up due today", detail: "12 client callbacks are scheduled", tab: "followups", tone: "bg-amber-500" },
  { id: "NOT-03", title: "Payroll review", detail: "June payroll draft is ready", tab: "payroll", tone: "bg-blue-500" },
];

const defaultUserProfile = {
  photoDataUrl: "",
  photoInitials: "RR",
  fullName: "Rajkumar Rathore",
  employeeId: "EMP-2024-001",
  designation: "Super Admin",
  department: "Admin Control",
  officialEmail: "rajkumar@dematadealgo.local",
  mobile: "+91 98765 43210",
  role: "Admin",
  employeeStatus: "Active",
  reportingManager: "Managing Director",
  dateOfJoining: "01 Apr 2024",
  officeLocation: "Jaipur Head Office",
  employmentType: "Full-Time",
  username: "rajkumar.rathore",
  lastLogin: "06 Jul 2026, 10:42 AM",
};

type UserProfile = typeof defaultUserProfile;
type ProfileDrawerMode = "view" | "edit" | "password" | "forgot-password";

const profileActivityTimeline = [
  { id: "ACT-01", title: "Profile reviewed", detail: "Employee profile opened from dashboard header", time: "Today, 10:42 AM", status: "Completed" },
  { id: "ACT-02", title: "Password security checked", detail: "Backend password change flow is available for this account", time: "Today, 10:40 AM", status: "Secure" },
  { id: "ACT-03", title: "Role access synced", detail: "Admin role permissions are active for Client Operations, People Operations, Finance Control, Delivery Projects, and Admin Control", time: "05 Jul 2026, 06:20 PM", status: "Active" },
  { id: "ACT-04", title: "Profile details updated", detail: "Employment and account details are ready for backend profile API mapping", time: "04 Jul 2026, 03:15 PM", status: "Updated" },
];

const recentLoginHistory = [
  { id: "LOG-01", device: "Chrome on Windows", location: "Jaipur, India", ip: "103.87.XX.24", time: "06 Jul 2026, 10:42 AM", result: "Successful" },
  { id: "LOG-02", device: "Chrome on Windows", location: "Jaipur, India", ip: "103.87.XX.24", time: "05 Jul 2026, 06:18 PM", result: "Successful" },
  { id: "LOG-03", device: "Edge on Windows", location: "Jaipur, India", ip: "103.87.XX.18", time: "04 Jul 2026, 11:02 AM", result: "Successful" },
];

function DashboardOverview({ activeModule, setActiveTab }: { activeModule: string; setActiveTab: (tab: string) => void }) {
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
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Operations Command Center</p>
          <div className="flex flex-wrap gap-3 mt-4">
            {[
                { name: "Lead Desk", id: "leads" },
                { name: "Employee Onboarding", id: "onboarding" },
                { name: "Finance Control", id: "accounting" },
                { name: "Growth Marketing", id: "marketing" },
                { name: "Delivery Projects", id: "projects" },
                { name: "Admin Control", id: "administration" },
                { name: "Support Desk", id: "support" },
            ].map((dept) => (
              <button
                key={dept.id}
                onClick={() => setActiveTab(dept.id)}
                className={`px-6 py-2.5 rounded-full border text-xs font-black uppercase tracking-widest transition-all shadow-sm ${
                  activeModule === dept.id
                    ? "border-emerald-200 bg-emerald-500 text-white shadow-emerald-100"
                    : "border-border bg-surface text-text-muted hover:border-primary hover:text-primary"
                }`}
              >
                {dept.name}
              </button>
            ))}
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#1E293B]">Today&apos;s Business Snapshot</h2>
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

function ProfileDetail({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-slate-400">
        <Icon size={15} />
        <p className="text-[10px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="break-words text-sm font-black text-primary">{value}</p>
    </div>
  );
}

function ProfileAvatar({ photoDataUrl, initials, label, size = "large" }: { photoDataUrl: string; initials: string; label: string; size?: "large" | "medium" }) {
  const sizeClass = size === "large" ? "h-20 w-20 rounded-3xl text-2xl" : "h-20 w-20 rounded-2xl text-2xl";

  if (photoDataUrl) {
    return (
      <div
        role="img"
        aria-label={label}
        className={`${sizeClass} shrink-0 bg-cover bg-center shadow-lg`}
        style={{ backgroundImage: `url("${photoDataUrl}")` }}
      />
    );
  }

  return (
    <div className={`${sizeClass} flex shrink-0 items-center justify-center bg-slate-900 font-black text-white shadow-lg`}>
      {initials}
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  options?: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</span>
      {options ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        >
          {options.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-primary outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
      )}
    </label>
  );
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] || "U"}${parts[1]?.[0] || ""}`.toUpperCase();
}

function userToProfile(user: AuthUser, backendProfile?: BackendUserProfile): UserProfile {
  const fullName = user.full_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || user.mobile || "CRM User";
  const roleName = user.roles[0]?.name || "Employee";

  return {
    ...defaultUserProfile,
    photoInitials: initialsFromName(fullName),
    fullName,
    employeeId: user.employee_id || "Pending",
    designation: user.designation || "Employee",
    department: user.department || "Operations",
    officialEmail: user.email || "",
    mobile: user.mobile ? `+91 ${user.mobile}` : "",
    role: roleName,
    employeeStatus: backendProfile?.employee_status || (user.is_active ? "Active" : "Inactive"),
    dateOfJoining: backendProfile?.date_of_joining || "",
    officeLocation: backendProfile?.office_location || "",
    employmentType: backendProfile?.employment_type || "Full-Time",
    username: user.email || user.mobile || "",
    lastLogin: "Current session",
  };
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return { first_name: parts.shift() || "", last_name: parts.join(" ") };
}

function isStrongPassword(password: string) {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(password);
}

function ProfileDrawer({
  open,
  profile,
  onClose,
  onSave,
}: {
  open: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: (profile: UserProfile) => Promise<UserProfile>;
}) {
  const [mode, setMode] = useState<ProfileDrawerMode>("view");
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "", otp: "" });
  const [formMessage, setFormMessage] = useState("");

  if (!open) return null;

  const openEdit = () => {
    setDraft(profile);
    setFormMessage("");
    setMode("edit");
  };

  const handlePhotoUpload = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormMessage("Upload a valid image file.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormMessage("Profile photo must be 2 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraft((current) => ({ ...current, photoDataUrl: String(reader.result || "") }));
      setFormMessage("Profile photo selected. Save profile to apply it.");
    };
    reader.readAsDataURL(file);
  };

  const openPassword = () => {
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "", otp: "" });
    setFormMessage("");
    setMode("password");
  };

  const saveProfile = async () => {
    if (!draft.fullName.trim() || !draft.employeeId.trim() || !draft.officialEmail.trim() || !draft.mobile.trim()) {
      setFormMessage("Full name, employee ID, official email, and mobile number are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.officialEmail.trim())) {
      setFormMessage("Enter a valid official email address.");
      return;
    }
    const nextProfile = {
      ...draft,
      photoInitials: initialsFromName(draft.fullName),
    };
    try {
      const savedProfile = await onSave(nextProfile);
      setDraft(savedProfile);
      setFormMessage("Profile updated.");
      setMode("view");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Unable to update profile.");
    }
  };

  const validatePasswordForm = () => {
    const isForgotFlow = mode === "forgot-password";
    if (!isForgotFlow && !passwordForm.currentPassword) {
      setFormMessage("Current password is required. Use forgot password if you do not remember it.");
      return false;
    }
    if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
      setFormMessage("New password and confirm password are required.");
      return false;
    }
    if (!isStrongPassword(passwordForm.newPassword)) {
      setFormMessage("Password must include uppercase, lowercase, number, special character, and at least 8 characters.");
      return false;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFormMessage("New password and confirm password do not match.");
      return false;
    }
    return true;
  };

  const savePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "", otp: "" });
      setFormMessage("Password changed successfully. Sign in again with the new password if your session expires.");
      setMode("view");
    } catch (error) {
      setFormMessage(error instanceof Error ? error.message : "Unable to change password.");
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex justify-end bg-slate-950/30 backdrop-blur-sm">
      <button type="button" aria-label="Close profile overlay" className="absolute inset-0 cursor-default" onClick={onClose} />
      <aside className="relative flex h-full w-full max-w-[32rem] flex-col overflow-hidden bg-slate-50 shadow-2xl">
        <div className="border-b border-slate-200 bg-white px-6 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">My Profile</p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-primary">Employee Details</h2>
            </div>
            <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-primary">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-4">
              <ProfileAvatar photoDataUrl={profile.photoDataUrl} initials={profile.photoInitials} label={`${profile.fullName} profile photo`} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-black text-primary">{profile.fullName}</h3>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                    {profile.employeeStatus}
                  </span>
                </div>
                <p className="mt-1 text-sm font-bold text-slate-500">{profile.designation} . {profile.department}</p>
                <div className="mt-4 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2">
                  <span className="inline-flex items-center gap-2"><IdCard size={14} /> {profile.employeeId}</span>
                  <span className="inline-flex items-center gap-2"><ShieldCheck size={14} /> {profile.role}</span>
                </div>
              </div>
            </div>
          </section>

          {formMessage ? (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs font-black text-blue-700">
              {formMessage}
            </div>
          ) : null}

          {mode === "edit" ? (
            <section className="mt-6 space-y-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Edit Profile</p>
                <h3 className="mt-1 text-lg font-black text-primary">Update Employee Details</h3>
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center">
                <ProfileAvatar photoDataUrl={draft.photoDataUrl} initials={draft.photoInitials} label="Selected profile photo preview" size="medium" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-black text-primary">Profile Photo Upload</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">Upload JPG, PNG, or WebP up to 2 MB. The photo is previewed locally until backend storage is connected.</p>
                  <label className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-primary hover:border-primary">
                    Choose Photo
                    <input type="file" accept="image/*" className="sr-only" onChange={(event) => handlePhotoUpload(event.target.files?.[0])} />
                  </label>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ProfileInput label="Full Name" value={draft.fullName} onChange={(value) => setDraft((current) => ({ ...current, fullName: value }))} />
                <ProfileInput label="Employee ID" value={draft.employeeId} onChange={(value) => setDraft((current) => ({ ...current, employeeId: value }))} />
                <ProfileInput label="Designation" value={draft.designation} onChange={(value) => setDraft((current) => ({ ...current, designation: value }))} />
                <ProfileInput label="Department" value={draft.department} onChange={(value) => setDraft((current) => ({ ...current, department: value }))} />
                <ProfileInput label="Official Email" type="email" value={draft.officialEmail} onChange={(value) => setDraft((current) => ({ ...current, officialEmail: value }))} />
                <ProfileInput label="Mobile Number" value={draft.mobile} onChange={(value) => setDraft((current) => ({ ...current, mobile: value }))} />
                <ProfileInput label="Role" value={draft.role} onChange={(value) => setDraft((current) => ({ ...current, role: value }))} options={["Admin", "HR", "Sales", "Frontend Developer", "Backend Developer", "Accounts", "Manager"]} />
                <ProfileInput label="Employee Status" value={draft.employeeStatus} onChange={(value) => setDraft((current) => ({ ...current, employeeStatus: value }))} options={["Active", "Inactive"]} />
                <ProfileInput label="Reporting Manager" value={draft.reportingManager} onChange={(value) => setDraft((current) => ({ ...current, reportingManager: value }))} />
                <ProfileInput label="Date of Joining" type="date" value={draft.dateOfJoining} onChange={(value) => setDraft((current) => ({ ...current, dateOfJoining: value }))} />
                <ProfileInput label="Office Location" value={draft.officeLocation} onChange={(value) => setDraft((current) => ({ ...current, officeLocation: value }))} />
                <ProfileInput label="Employment Type" value={draft.employmentType} onChange={(value) => setDraft((current) => ({ ...current, employmentType: value }))} options={["Intern", "Full-Time", "Part-Time", "Contract"]} />
                <ProfileInput label="Username" value={draft.username} onChange={(value) => setDraft((current) => ({ ...current, username: value }))} />
              </div>
            </section>
          ) : mode === "password" || mode === "forgot-password" ? (
            <section className="mt-6 space-y-5 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Account Security</p>
                <h3 className="mt-1 text-lg font-black text-primary">{mode === "forgot-password" ? "Reset Password" : "Change Password"}</h3>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  {mode === "forgot-password" ? "Use the sign-in screen forgot-password flow if you do not remember your current password." : "Current password is required before setting a new password."}
                </p>
              </div>
              <div className="space-y-4">
                {mode === "password" ? (
                  <ProfileInput label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, currentPassword: value }))} />
                ) : null}
                <ProfileInput label="New Password" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, newPassword: value }))} />
                <ProfileInput label="Confirm Password" type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm((current) => ({ ...current, confirmPassword: value }))} />
                {mode === "password" ? (
                  <button type="button" onClick={() => { clearAuthSession(); window.location.href = "/auth/signin"; }} className="text-left text-xs font-black uppercase tracking-widest text-primary hover:underline">
                    Forgot current password? Use sign-in reset
                  </button>
                ) : (
                  <button type="button" onClick={openPassword} className="text-left text-xs font-black uppercase tracking-widest text-primary hover:underline">
                    I remember current password
                  </button>
                )}
              </div>
            </section>
          ) : (
            <>
          <section className="mt-6 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Minimum Details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileDetail icon={User} label="Full Name" value={profile.fullName} />
              <ProfileDetail icon={IdCard} label="Employee ID" value={profile.employeeId} />
              <ProfileDetail icon={Briefcase} label="Designation" value={profile.designation} />
              <ProfileDetail icon={Users} label="Department" value={profile.department} />
              <ProfileDetail icon={Mail} label="Official Email" value={profile.officialEmail} />
              <ProfileDetail icon={Phone} label="Mobile Number" value={profile.mobile} />
              <ProfileDetail icon={Shield} label="Role" value={profile.role} />
              <ProfileDetail icon={CheckCircle2} label="Employee Status" value={profile.employeeStatus} />
            </div>
          </section>

          <section className="mt-6 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Work Details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileDetail icon={UserCheck} label="Reporting Manager" value={profile.reportingManager} />
              <ProfileDetail icon={Calendar} label="Date of Joining" value={profile.dateOfJoining} />
              <ProfileDetail icon={MapPin} label="Office Location" value={profile.officeLocation} />
              <ProfileDetail icon={Briefcase} label="Employment Type" value={profile.employmentType} />
            </div>
          </section>

          <section className="mt-6 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Account Details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ProfileDetail icon={User} label="Username" value={profile.username} />
              <ProfileDetail icon={Clock} label="Last Login" value={profile.lastLogin} />
            </div>
          </section>

          <section className="mt-6 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Activity Timeline</p>
            <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              {profileActivityTimeline.map((activity) => (
                <div key={activity.id} className="relative border-l-2 border-slate-100 pb-4 pl-5 last:pb-0">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-white bg-primary" />
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-primary">{activity.title}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{activity.detail}</p>
                    </div>
                    <span className="w-fit rounded-full bg-slate-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">{activity.status}</span>
                  </div>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{activity.time}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Recent Login History</p>
            <div className="space-y-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              {recentLoginHistory.map((login) => (
                <div key={login.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-primary">{login.device}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{login.location} . {login.ip}</p>
                    </div>
                    <span className="w-fit rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700">{login.result}</span>
                  </div>
                  <p className="mt-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{login.time}</p>
                </div>
              ))}
            </div>
          </section>
            </>
          )}
        </div>

        <div className="border-t border-slate-200 bg-white p-5">
          {mode === "edit" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setMode("view")} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-primary hover:border-primary">
                Cancel
              </button>
              <button type="button" onClick={saveProfile} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90">
                <Pencil size={16} /> Save Profile
              </button>
            </div>
          ) : mode === "password" || mode === "forgot-password" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={() => setMode("view")} className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-primary hover:border-primary">
                Cancel
              </button>
              <button type="button" onClick={savePassword} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90">
                <KeyRound size={16} /> Update Password
              </button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <button type="button" onClick={openPassword} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-widest text-primary hover:border-primary">
                <KeyRound size={16} /> Change Password
              </button>
              <button type="button" onClick={openEdit} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black uppercase tracking-widest text-white hover:bg-primary/90">
                <Pencil size={16} /> Edit Profile
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [lastVisitedModule, setLastVisitedModule] = useState("");
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadCurrentUser() {
      if (!getStoredAuthTokens()) {
        router.replace("/auth/signin");
        return;
      }

      try {
        const [user, profile] = await Promise.all([getCurrentUser(), getCurrentProfile()]);
        if (!isMounted) return;
        setUserProfile(userToProfile(user, profile));
        setIsAuthChecking(false);
      } catch {
        clearAuthSession();
        router.replace("/auth/signin");
      }
    }

    void loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    setShowProfile(false);
    await logout();
    router.replace("/auth/signin");
  };

  const handleSaveProfile = async (profile: UserProfile) => {
    const nameParts = splitFullName(profile.fullName);
    const updatedProfile = await updateCurrentProfile({
      ...nameParts,
      mobile: profile.mobile,
      designation: profile.designation,
      department: profile.department,
      date_of_joining: profile.dateOfJoining || null,
      office_location: profile.officeLocation,
      employment_type: profile.employmentType,
      employee_status: profile.employeeStatus,
    });
    const nextProfile = userToProfile(updatedProfile.user, updatedProfile);
    setUserProfile(nextProfile);
    return nextProfile;
  };

  const menuGroups = [
    { label: "Main", department: "overview", items: [{ id: "overview", label: "Dashboard", icon: LayoutDashboard }] },
    { label: "Client Operations", department: "leads", items: [{ id: "leads", label: "Lead Desk", icon: Target }, { id: "lead-assign", label: "Lead Assignment", icon: UserCheck }, { id: "telecaller", label: "Calling Desk", icon: Headphones }, { id: "followups", label: "Follow-ups", icon: Clock }, { id: "lead-outcomes", label: "Lead Outcomes", icon: CheckCircle2 }, { id: "clients", label: "Project Clients", icon: Users }, { id: "agreements", label: "Legal Agreements", icon: ShieldCheck }] },
    { label: "Growth Marketing", department: "marketing", items: [{ id: "campaigns", label: "Growth Campaigns", icon: Speaker }, { id: "roi", label: "ROI Analysis", icon: TrendingUp }, { id: "sources", label: "Acquisition Sources", icon: Search }] },
    { label: "Delivery Projects", department: "projects", items: [{ id: "projects", label: "Project Portfolio", icon: Briefcase }, { id: "team-tracking", label: "Team Assignment", icon: Users }, { id: "tasks", label: "Tasks", icon: SquareCheck }, { id: "milestones", label: "Milestones", icon: Shield }, { id: "deadlines", label: "Deadlines", icon: Calendar }, { id: "performance", label: "Team Performance", icon: TrendingUp }] },
    { label: "People Operations", department: "onboarding", items: [{ id: "employees", label: "Employee Directory", icon: Users }, { id: "onboarding", label: "Employee Onboarding", icon: UserPlus }, { id: "attendance", label: "Attendance", icon: Calendar }, { id: "leave", label: "Leave Management", icon: LogOut }, { id: "payroll", label: "Payroll", icon: Wallet }, { id: "exit", label: "Exit Process", icon: LogOut }] },
    { label: "Finance Control", department: "accounting", items: [{ id: "accounting", label: "Finance Overview", icon: LayoutDashboard }, ...ACCOUNTING_MODULES] },
    { label: "Admin Control", department: "administration", items: [{ id: "users", label: "User Management", icon: Users }, { id: "roles", label: "Role Permissions", icon: Shield }, { id: "logs", label: "System Audit Trail", icon: History }, { id: "approvals", label: "Approval Center", icon: CheckCircle2 }, { id: "settings", label: "System Settings", icon: Settings }] },
    { label: "Support Desk", department: "support", items: [{ id: "support", label: "Support Desk", icon: HelpCircle }] }
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
    if (tab !== "overview") {
      const matchingGroup = menuGroups.find((group) => group.department === tab || group.items.some((item) => item.id === tab));
      setLastVisitedModule(matchingGroup?.department || tab);
    }
    setActiveTab(tab);
    setShowNotif(false);
    setShowProfile(false);
    setShowProfileDrawer(false);
  };

  if (isAuthChecking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-6">
        <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          <p className="text-sm font-black uppercase tracking-widest text-slate-500">Loading CRM session</p>
        </div>
      </main>
    );
  }

  return (
    <div className="relative flex min-h-screen overflow-x-hidden bg-[#F8FAFC]">
      <aside className={`bg-[#0F172A] text-white flex flex-col fixed inset-y-0 left-0 z-50 shadow-2xl transition-all duration-500 ease-in-out ${isSidebarVisible ? "w-[19rem] translate-x-0" : "w-0 -translate-x-full overflow-hidden"}`}>
        <div className="p-10 flex items-center gap-4 whitespace-nowrap min-w-[19rem]">
          <div className="w-12 h-12 bg-accent rounded-[1.25rem] flex items-center justify-center text-[#0F172A] font-black text-2xl shadow-lg shadow-accent/20">D</div>
          <div className="text-2xl font-black tracking-tighter leading-none">DeMatade<span className="text-accent">Algo</span></div>
        </div>
        <div className="relative flex-1 min-h-0 min-w-[19rem]">
          <nav className="h-full px-6 space-y-10 overflow-y-auto pb-10">
            {activeTab !== "overview" && (
              <button onClick={() => openTab("overview")} className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-accent text-white shadow-lg shadow-accent/20 transition-all hover:bg-accent/90">
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
                      <button key={item.id} onClick={() => openTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${isActive ? "bg-accent text-[#0F172A] font-black" : "text-slate-400 hover:text-white"}`}>
                          <Icon size={20} className="shrink-0" />
                          <span className="min-w-0 flex-1 text-left text-[13px] font-bold leading-snug tracking-wide">{item.label}</span>
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
                      <MessageSquare size={15} /> Open Support Desk
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
                    <p className="text-sm font-black text-[#1E293B]">{userProfile.fullName}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{userProfile.role}</p>
                  </div>
                  <div className="w-14 h-14 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center">{userProfile.photoInitials}</div>
                  <ChevronDown size={16} className={`hidden text-slate-400 transition-transform md:block ${showProfile ? "rotate-180" : ""}`} />
                </button>
                {showProfile ? (
                  <div className="absolute right-0 top-16 w-72 rounded-2xl border border-slate-100 bg-white p-4 shadow-2xl">
                    <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">{userProfile.photoInitials}</div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-primary">{userProfile.fullName}</p>
                        <p className="truncate text-xs font-semibold text-slate-500">{userProfile.officialEmail || userProfile.mobile}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <ProfileAction
                        icon={User}
                        label="My Profile"
                        onClick={() => {
                          setShowProfile(false);
                          setShowProfileDrawer(true);
                        }}
                      />
                      <ProfileAction icon={ShieldCheck} label="Approval Center" onClick={() => openTab("approvals")} />
                      <ProfileAction icon={Settings} label="System Settings" onClick={() => openTab("settings")} />
                      <ProfileAction icon={HelpCircle} label="Support Desk" onClick={() => openTab("support")} />
                    </div>
                    <button
                      type="button"
                      onClick={handleSignOut}
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
                {activeTab === "overview" && <DashboardOverview activeModule={lastVisitedModule} setActiveTab={openTab} />}
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
                {activeTab === "accounting" && <AccountingWizard onSelectModule={openTab} />}
                {isAccountingModule(activeTab) && <AccountingWizard activeModule={activeTab} onSelectModule={openTab} />}
                {(activeTab === "marketing" || isMarketingTab) && <MarketingHub activeView={isMarketingTab ? activeTab as MarketingView : "campaigns"} />}
                {isProjectTab && (activeTab === "performance" ? <EmployeePerformance /> : <ProjectHub activeView={activeTab} />)}
                {(activeTab === "administration" || isAdminTab) && <AdministrationHub activeView={isAdminTab ? activeTab as AdminView : "users"} />}
                {activeTab === "support" && <SupportHub />}
            </div>
        </main>
      </div>
      <ProfileDrawer open={showProfileDrawer} profile={userProfile} onSave={handleSaveProfile} onClose={() => setShowProfileDrawer(false)} />
    </div>
  );
}
