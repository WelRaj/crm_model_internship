"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { AuthUser } from "@/services/auth-api";

export const CRM_TAB_IDS = [
  "leads",
  "lead-assign",
  "telecaller",
  "followups",
  "lead-outcomes",
  "clients",
  "agreements",
] as const;

export type CrmTabId = (typeof CRM_TAB_IDS)[number];
export type CrmRoleCode =
  | "super_admin"
  | "admin"
  | "crm_admin"
  | "team_lead"
  | "telecaller"
  | "sales"
  | "project_manager"
  | "read_only";
export type CrmAction = "create" | "edit" | "assign" | "delete" | "export" | "approve" | "view";

const CRM_TAB_SET = new Set<string>(CRM_TAB_IDS);

const CRM_PAGE_ACCESS: Record<CrmRoleCode, readonly CrmTabId[]> = {
  super_admin: CRM_TAB_IDS,
  admin: CRM_TAB_IDS,
  crm_admin: CRM_TAB_IDS,
  team_lead: ["leads", "lead-assign", "telecaller", "followups", "lead-outcomes", "clients", "agreements"],
  telecaller: ["leads", "telecaller", "followups"],
  sales: ["leads", "followups", "lead-outcomes", "clients"],
  project_manager: ["clients", "agreements"],
  read_only: CRM_TAB_IDS,
};

const CRM_ACTION_ACCESS: Record<CrmRoleCode, Partial<Record<CrmTabId, readonly CrmAction[] | "*">>> = {
  super_admin: grantAllActions(),
  admin: grantAllActions(),
  crm_admin: grantAllActions(),
  team_lead: {
    leads: ["view", "create", "edit", "assign", "export"],
    "lead-assign": ["view", "assign", "export"],
    telecaller: ["view", "create", "edit", "export"],
    followups: ["view", "create", "edit", "export"],
    "lead-outcomes": ["view", "approve", "export"],
    clients: ["view", "create", "edit", "export", "approve"],
    agreements: ["view", "create", "edit", "export", "approve"],
  },
  telecaller: {
    leads: ["view"],
    telecaller: ["view", "create", "edit", "export"],
    followups: ["view", "create", "edit", "export"],
  },
  sales: {
    leads: ["view", "create", "edit", "export"],
    followups: ["view", "create", "edit", "export"],
    "lead-outcomes": ["view", "approve", "export"],
    clients: ["view", "create", "edit", "export", "approve"],
  },
  project_manager: {
    clients: ["view", "create", "edit", "export", "approve"],
    agreements: ["view", "create", "edit", "export", "approve"],
  },
  read_only: {
    leads: ["view"],
    "lead-assign": ["view"],
    telecaller: ["view"],
    followups: ["view"],
    "lead-outcomes": ["view"],
    clients: ["view"],
    agreements: ["view"],
  },
};

type CrmAccessState = {
  roleCodes: CrmRoleCode[];
  allowedTabs: readonly CrmTabId[];
  canCrmPage: (page: CrmTabId) => boolean;
  canCrmAction: (action: CrmAction, page: CrmTabId) => boolean;
};

const CrmAccessContext = createContext<CrmAccessState>({
  roleCodes: ["read_only"],
  allowedTabs: CRM_PAGE_ACCESS.read_only,
  canCrmPage: () => false,
  canCrmAction: () => false,
});

function grantAllActions(): Record<CrmTabId, "*"> {
  return CRM_TAB_IDS.reduce((acc, tab) => {
    acc[tab] = "*";
    return acc;
  }, {} as Record<CrmTabId, "*">);
}

function normalizeRoleCode(value: string | null | undefined): CrmRoleCode | null {
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
    case "read_only":
      return normalized;
    default:
      return null;
  }
}

export function resolveCrmRoleCodes(roles?: AuthUser["roles"] | null): CrmRoleCode[] {
  if (!roles || roles.length === 0) {
    return ["read_only"];
  }

  const resolved = (roles || [])
    .flatMap((role) => [normalizeRoleCode(role?.code), normalizeRoleCode(role?.name)])
    .filter((code): code is CrmRoleCode => Boolean(code));

  const unique = Array.from(new Set(resolved));
  return unique.length > 0 ? unique : [];
}

export function isCrmTabId(tab: string): tab is CrmTabId {
  return CRM_TAB_SET.has(tab);
}

export function getAllowedCrmTabs(roleCodes: CrmRoleCode[]): CrmTabId[] {
  if (roleCodes.some((role) => role === "super_admin" || role === "admin" || role === "crm_admin")) {
    return [...CRM_TAB_IDS];
  }

  const allowed = new Set<CrmTabId>();
  roleCodes.forEach((role) => {
    CRM_PAGE_ACCESS[role].forEach((tab) => allowed.add(tab));
  });

  return CRM_TAB_IDS.filter((tab) => allowed.has(tab));
}

export function getDefaultCrmTab(roleCodes: CrmRoleCode[]): CrmTabId | "overview" {
  return getAllowedCrmTabs(roleCodes)[0] || "overview";
}

export function canCrmPage(roleCodes: CrmRoleCode[], page: CrmTabId): boolean {
  if (roleCodes.some((role) => role === "super_admin" || role === "admin" || role === "crm_admin")) {
    return true;
  }

  return roleCodes.some((role) => CRM_PAGE_ACCESS[role].includes(page));
}

export function canCrmAction(roleCodes: CrmRoleCode[], action: CrmAction, page: CrmTabId): boolean {
  if (roleCodes.some((role) => role === "super_admin" || role === "admin" || role === "crm_admin")) {
    return true;
  }

  return roleCodes.some((role) => {
    const actions = CRM_ACTION_ACCESS[role][page];
    if (!actions) return false;
    return actions === "*" ? true : actions.includes(action);
  });
}

export function CrmAccessProvider({
  roleCodes,
  children,
}: {
  roleCodes: CrmRoleCode[];
  children: ReactNode;
}) {
  const value = useMemo<CrmAccessState>(() => {
    const allowedTabs = getAllowedCrmTabs(roleCodes);
    return {
      roleCodes,
      allowedTabs,
      canCrmPage: (page) => canCrmPage(roleCodes, page),
      canCrmAction: (action, page) => canCrmAction(roleCodes, action, page),
    };
  }, [roleCodes]);

  return <CrmAccessContext.Provider value={value}>{children}</CrmAccessContext.Provider>;
}

export function useCrmAccess() {
  return useContext(CrmAccessContext);
}
