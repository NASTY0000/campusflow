"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  clearSessionCookie,
  createSessionToken,
  setSessionCookie,
  verifyPassword,
  type SessionUser,
} from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import type { Role } from "@/lib/roles";

export async function loginAction(formData: FormData): Promise<{ error: string } | void> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const user = await prisma.user.findFirst({
    where: { email, isActive: true },
    include: { tenant: true },
  });

  if (!user) {
    return { error: "Invalid email or password." };
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return { error: "Invalid email or password." };
  }

  const session: SessionUser = {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    name: user.name,
    role: user.role as Role,
    studentId: user.studentId,
    tenantName: user.tenant.name,
    tenantSlug: user.tenant.slug,
  };

  const token = await createSessionToken(session);
  await setSessionCookie(token);
  await writeAudit({
    tenantId: user.tenantId,
    userId: user.id,
    action: "LOGIN",
    entity: "User",
    entityId: user.id,
  });

  if (user.role === "STUDENT") {
    redirect("/portal");
  }
  if (next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect("/dashboard");
}

export async function logoutAction() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();
  if (session) {
    await writeAudit({
      tenantId: session.tenantId,
      userId: session.id,
      action: "LOGOUT",
      entity: "User",
      entityId: session.id,
    });
  }
  await clearSessionCookie();
  redirect("/login");
}
