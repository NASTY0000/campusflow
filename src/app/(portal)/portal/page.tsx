import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { computeGpa, fullName } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

export default async function PortalHome() {
  const session = await requireSession();
  if (!session.studentId) redirect("/login");
  const student = await prisma.student.findFirst({
    where: { id: session.studentId, tenantId: session.tenantId },
    include: {
      invoices: { orderBy: { issuedAt: "desc" } },
      records: true,
    },
  });
  if (!student) redirect("/login");

  const outstanding = student.invoices
    .filter((i) => i.status === "ISSUED" || i.status === "PARTIAL")
    .reduce((s, i) => s + (i.totalKobo - i.paidKobo), 0);
  const gpa = computeGpa(student.records);

  return (
    <div>
      <PageHeader
        eyebrow={student.matricNumber}
        title={`Welcome, ${student.firstName}`}
        description={`${student.programme} · ${student.level} level · ${session.tenantName}`}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-forest-500">Amount due</div>
          <div className="mt-1 font-display text-2xl">{formatNGN(outstanding)}</div>
          <Link href="/portal/invoices" className="mt-2 inline-block text-sm underline">
            View invoices
          </Link>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-forest-500">GPA</div>
          <div className="mt-1 font-display text-2xl">{gpa ?? "—"}</div>
          <Link href="/portal/records" className="mt-2 inline-block text-sm underline">
            Academic records
          </Link>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-forest-500">Profile</div>
          <div className="mt-1 font-medium">{fullName(student)}</div>
          <Link href="/portal/profile" className="mt-2 inline-block text-sm underline">
            Biodata
          </Link>
        </div>
      </div>

      <section className="card mt-6 p-5">
        <h2 className="font-display text-lg">Your invoices</h2>
        <ul className="mt-3 divide-y divide-forest-100 dark:divide-forest-800">
          {student.invoices.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between py-3">
              <div>
                <Link href={`/portal/invoices/${inv.id}`} className="font-medium hover:underline">
                  {inv.invoiceNumber}
                </Link>
                <div className="text-xs text-forest-500">{inv.session}</div>
              </div>
              <div className="text-right">
                <div className="text-sm">{formatNGN(inv.totalKobo - inv.paidKobo)} due</div>
                <StatusBadge status={inv.status} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
