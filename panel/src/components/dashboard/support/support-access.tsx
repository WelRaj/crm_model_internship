"use client";

export type SupportRoleCode = "super_admin" | "admin" | "support";
export type SupportAction = "view" | "create" | "edit" | "comment";

export function resolveSupportRoleCodes(roleCodes?: string[] | null): SupportRoleCode[] {
  if (!roleCodes || roleCodes.length === 0) return [];
  const resolved = roleCodes
    .map((role) => role.trim().toLowerCase().replace(/\s+/g, "_"))
    .filter((role): role is SupportRoleCode => role === "super_admin" || role === "admin" || role === "support");
  return Array.from(new Set(resolved));
}

export function canAccessSupport(roleCodes: SupportRoleCode[]) {
  return roleCodes.length > 0;
}

export function canSupportAction(roleCodes: SupportRoleCode[], action: SupportAction) {
  if (roleCodes.some((role) => role === "super_admin" || role === "admin")) return true;
  return roleCodes.includes("support") && ["view", "create", "edit", "comment"].includes(action);
}
