import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "./roles";
import { hasPermission, type Permission } from "./roles";

export const SESSION_COOKIE = "cf_session";

export type SessionUser = {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: Role;
  studentId: string | null;
  tenantName: string;
  tenantSlug: string;
};

function getSecret() {
  const raw = process.env.SESSION_SECRET || "campusflow-dev-session-secret-change-in-production-2026";
  return new TextEncoder().encode(raw);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (!payload.id || !payload.tenantId || !payload.role) return null;
    return {
      id: String(payload.id),
      tenantId: String(payload.tenantId),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
      studentId: payload.studentId ? String(payload.studentId) : null,
      tenantName: String(payload.tenantName ?? ""),
      tenantSlug: String(payload.tenantSlug ?? ""),
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const session = await requireSession();
  if (!hasPermission(session.role, permission)) {
    redirect("/dashboard");
  }
  return session;
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
