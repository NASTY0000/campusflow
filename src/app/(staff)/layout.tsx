import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (session.role === "STUDENT") redirect("/portal");
  return <AppShell session={session}>{children}</AppShell>;
}
