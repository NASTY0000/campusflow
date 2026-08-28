import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const tenants = await prisma.tenant.count();
  return NextResponse.json({ ok: true, service: "campusflow", tenants });
}
