export const ROLES = ["ADMIN", "REGISTRAR", "FINANCE", "STUDENT"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: Role[] = ["ADMIN", "REGISTRAR", "FINANCE"];

export type Permission =
  | "students:read"
  | "students:write"
  | "students:import"
  | "records:write"
  | "fees:read"
  | "fees:write"
  | "invoices:read"
  | "invoices:write"
  | "payments:write"
  | "ledger:read"
  | "audit:read";

const MATRIX: Record<Role, Permission[]> = {
  ADMIN: [
    "students:read",
    "students:write",
    "students:import",
    "records:write",
    "fees:read",
    "fees:write",
    "invoices:read",
    "invoices:write",
    "payments:write",
    "ledger:read",
    "audit:read",
  ],
  REGISTRAR: [
    "students:read",
    "students:write",
    "students:import",
    "records:write",
    "fees:read",
    "invoices:read",
  ],
  FINANCE: [
    "students:read",
    "fees:read",
    "fees:write",
    "invoices:read",
    "invoices:write",
    "payments:write",
    "ledger:read",
  ],
  STUDENT: ["fees:read", "invoices:read"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return MATRIX[role]?.includes(permission) ?? false;
}

export function canAccessStaffApp(role: Role): boolean {
  return STAFF_ROLES.includes(role);
}
