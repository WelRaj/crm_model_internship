"use client";

import type { AuthUser } from "@/services/auth-api";

export type DashboardRoleCode =
  | "super_admin"
  | "admin"
  | "crm_admin"
  | "team_lead"
  | "telecaller"
  | "sales"
  | "project_manager"
  | "hr"
  | "finance"
  | "marketing"
  | "support"
  | "employee"
  | "read_only";

export type DashboardTabId =
  | "overview"
  | "leads"
  | "lead-assign"
  | "telecaller"
  | "followups"
  | "lead-outcomes"
  | "clients"
  | "agreements"
  | "marketing"
  | "projects"
  | "team-tracking"
  | "tasks"
  | "milestones"
  | "deadlines"
  | "performance"
  | "onboarding"
  | "employees"
  | "attendance"
  | "leave"
  | "payroll"
  | "exit"
  | "accounting"
  | "campaigns"
  | "roi"
  | "sources"
  | "users"
  | "roles"
  | "logs"
  | "approvals"
  | "settings"
  | "support";

const ALL_TABS: readonly DashboardTabId[] = [
  "overview",
  "leads",
  "lead-assign",
  "telecaller",
  "followups",
  "lead-outcomes",
  "clients",
  "agreements",
  "marketing",
  "projects",
  "team-tracking",
  "tasks",
  "milestones",
  "deadlines",
  "performance",
  "onboarding",
  "employees",
  "attendance",
  "leave",
  "payroll",
  "exit",
  "accounting",
  "campaigns",
  "roi",
  "sources",
  "users",
  "roles",
  "logs",
  "approvals",
  "settings",
  "support",
];

const DASHBOARD_ACCESS: Record<DashboardRoleCode, readonly DashboardTabId[]> = {
  super_admin: ALL_TABS,
  admin: ALL_TABS,
  crm_admin: ["overview", "leads", "lead-assign", "telecaller", "followups", "lead-outcomes", "clients", "agreements"],
  team_lead: ["overview", "leads", "lead-assign", "telecaller", "followups", "lead-outcomes", "clients", "agreements", "projects", "team-tracking", "tasks", "milestones", "deadlines", "performance"],
  telecaller: ["overview", "leads", "telecaller", "followups"],
  sales: ["overview", "leads", "followups", "lead-outcomes", "clients"],
  project_manager: ["overview", "clients", "agreements", "projects", "team-tracking", "tasks", "milestones", "deadlines", "performance"],
  hr: ["overview", "onboarding", "employees", "attendance", "leave", "payroll", "exit"],
  finance: ["overview", "accounting"],
  marketing: ["overview", "marketing", "campaigns", "roi", "sources"],
  support: ["overview", "support"],
  employee: ["overview"],
  read_only: ["overview"],
};

function normalizeRoleCode(value: string | null | undefined): DashboardRoleCode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  switch (normalized) {
    case "super_admin":
    case "admin":
    case "crm_admin":
    case "team_lead":
    case "telecaller":
    case "sales":
    case "project_manager":
    case "hr":
    case "finance":
    case "marketing":
    case "support":
    case "employee":
    case "read_only":
      return normalized;
    default:
      return null;
  }
}

export function resolveDashboardRoleCodes(roles?: AuthUser["roles"] | null): DashboardRoleCode[] {
  if (!roles || roles.length === 0) return ["read_only"];

  const resolved = roles
    .flatMap((role) => [normalizeRoleCode(role?.code), normalizeRoleCode(role?.name)])
    .filter((code): code is DashboardRoleCode => Boolean(code));

  return Array.from(new Set(resolved));
}

export function getAllowedDashboardTabs(roleCodes: DashboardRoleCode[]): DashboardTabId[] {
  if (roleCodes.some((role) => role === "super_admin" || role === "admin")) {
    return [...ALL_TABS];
  }

  const allowed = new Set<DashboardTabId>();
  roleCodes.forEach((role) => {
    DASHBOARD_ACCESS[role].forEach((tab) => allowed.add(tab));
  });

  return ALL_TABS.filter((tab) => allowed.has(tab));
}

export function canAccessDashboardTab(roleCodes: DashboardRoleCode[], tab: DashboardTabId) {
  return getAllowedDashboardTabs(roleCodes).includes(tab);
}

export function getDefaultDashboardTab(roleCodes: DashboardRoleCode[]) {
  const allowed = getAllowedDashboardTabs(roleCodes);
  return allowed.find((tab) => tab !== "overview") || "overview";
}
