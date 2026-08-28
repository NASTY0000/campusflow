import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login", "/api/health"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (pathname.startsWith("/sample")) return true;
  return false;
}

function secret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET || "campusflow-dev-session-secret-change-in-production-2026"
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get("cf_session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, secret());
    const role = String(payload.role);
    const isStudent = role === "STUDENT";
    const isPortal = pathname.startsWith("/portal");
    const isStaff = pathname.startsWith("/dashboard") ||
      pathname.startsWith("/students") ||
      pathname.startsWith("/fees") ||
      pathname.startsWith("/invoices") ||
      pathname.startsWith("/payments") ||
      pathname.startsWith("/ledger") ||
      pathname.startsWith("/audit") ||
      pathname.startsWith("/receipts");

    if (isStudent && isStaff) {
      const url = req.nextUrl.clone();
      url.pathname = "/portal";
      return NextResponse.redirect(url);
    }
    if (!isStudent && isPortal) {
      const url = req.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
