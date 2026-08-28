import { describe, expect, it } from "vitest";
import { canAccessStaffApp, hasPermission, type Role } from "@/lib/roles";

describe("role access", () => {
  it("lets admin do everything", () => {
    const perms = [
      "students:read",
      "students:write",
      "students:import",
      "records:write",
      "fees:write",
      "invoices:write",
      "payments:write",
      "ledger:read",
      "audit:read",
    ] as const;
    for (const p of perms) {
      expect(hasPermission("ADMIN", p)).toBe(true);
    }
    expect(canAccessStaffApp("ADMIN")).toBe(true);
  });

  it("lets registrar manage students but not money", () => {
    expect(hasPermission("REGISTRAR", "students:import")).toBe(true);
    expect(hasPermission("REGISTRAR", "records:write")).toBe(true);
    expect(hasPermission("REGISTRAR", "invoices:read")).toBe(true);
    expect(hasPermission("REGISTRAR", "payments:write")).toBe(false);
    expect(hasPermission("REGISTRAR", "fees:write")).toBe(false);
    expect(hasPermission("REGISTRAR", "audit:read")).toBe(false);
    expect(canAccessStaffApp("REGISTRAR")).toBe(true);
  });

  it("lets finance handle fees and payments but not registry writes", () => {
    expect(hasPermission("FINANCE", "students:read")).toBe(true);
    expect(hasPermission("FINANCE", "students:write")).toBe(false);
    expect(hasPermission("FINANCE", "students:import")).toBe(false);
    expect(hasPermission("FINANCE", "payments:write")).toBe(true);
    expect(hasPermission("FINANCE", "ledger:read")).toBe(true);
    expect(hasPermission("FINANCE", "audit:read")).toBe(false);
    expect(canAccessStaffApp("FINANCE")).toBe(true);
  });

  it("keeps students out of staff tools", () => {
    expect(canAccessStaffApp("STUDENT")).toBe(false);
    expect(hasPermission("STUDENT", "students:write")).toBe(false);
    expect(hasPermission("STUDENT", "payments:write")).toBe(false);
    expect(hasPermission("STUDENT", "invoices:read")).toBe(true);
  });

  it("denies unknown roles", () => {
    expect(hasPermission("GUEST" as Role, "students:read")).toBe(false);
  });
});
