import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  if (session.role !== "STUDENT") redirect("/dashboard");
  return <AppShell session={session}>{children}</AppShell>;
}
