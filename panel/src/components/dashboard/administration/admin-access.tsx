"use client";

import type { AuthUser } from "@/services/auth-api";

export type AdminRoleCode = "super_admin" | "admin";
export type AdminView = "users" | "roles" | "logs" | "approvals" | "settings";

const ADMIN_ACCESS: Record<AdminRoleCode, readonly AdminView[]> = {
  super_admin: ["users", "roles", "logs", "approvals", "settings"],
  admin: ["users", "logs", "approvals", "settings"],
};

function normalizeRoleCode(value: string | null | undefined): AdminRoleCode | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");
  return normalized === "super_admin" || normalized === "admin" ? normalized : null;
}

export function resolveAdminRoleCodes(roles?: AuthUser["roles"] | null): AdminRoleCode[] {
  if (!roles || roles.length === 0) return [];

  const resolved = roles
    .flatMap((role) => [normalizeRoleCode(role?.code), normalizeRoleCode(role?.name)])
    .filter((code): code is AdminRoleCode => Boolean(code));

  return Array.from(new Set(resolved));
}

export function resolveAdminRoleCodesFromCodes(roleCodes?: string[] | null): AdminRoleCode[] {
  if (!roleCodes || roleCodes.length === 0) return [];
  return Array.from(
    new Set(
      roleCodes
        .map((code) => normalizeRoleCode(code))
        .filter((code): code is AdminRoleCode => Boolean(code)),
    ),
  );
}

export function getAllowedAdminViews(roleCodes: AdminRoleCode[]) {
  if (roleCodes.includes("super_admin")) {
    return ["users", "roles", "logs", "approvals", "settings"] as const;
  }

  const allowed = new Set<AdminView>();
  roleCodes.forEach((role) => {
    ADMIN_ACCESS[role].forEach((view) => allowed.add(view));
  });
  const views: AdminView[] = ["users", "roles", "logs", "approvals", "settings"];
  return views.filter((view) => allowed.has(view));
}

export function canAccessAdminView(roleCodes: AdminRoleCode[], view: AdminView) {
  return getAllowedAdminViews(roleCodes).includes(view);
}

export function getDefaultAdminView(roleCodes: AdminRoleCode[]) {
  const allowed = getAllowedAdminViews(roleCodes);
  return allowed[0] || "users";
}
