import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { formatDateTime, fullName } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { hasPermission } from "@/lib/roles";

export default async function DashboardPage() {
  const session = await requireSession();
  const tenantId = session.tenantId;

  const [
    studentCount,
    invoiceAgg,
    paidToday,
    outstandingInvoices,
    recentPayments,
    recentAudit,
    tenant,
  ] = await Promise.all([
    prisma.student.count({ where: { tenantId, status: "ACTIVE" } }),
    prisma.invoice.aggregate({
      where: { tenantId, status: { in: ["ISSUED", "PARTIAL"] } },
      _sum: { totalKobo: true, paidKobo: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: {
        tenantId,
        status: "SUCCESS",
        paidAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
      _sum: { amountKobo: true },
    }),
    prisma.invoice.findMany({
      where: { tenantId, status: { in: ["ISSUED", "PARTIAL"] } },
      include: { student: true },
      orderBy: { issuedAt: "desc" },
      take: 6,
    }),
    prisma.payment.findMany({
      where: { tenantId, status: "SUCCESS" },
      include: { student: true, invoice: true },
      orderBy: { paidAt: "desc" },
      take: 6,
    }),
    prisma.auditLog.findMany({
      where: { tenantId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.tenant.findUnique({ where: { id: tenantId } }),
  ]);

  const outstanding =
    (invoiceAgg._sum.totalKobo ?? 0) - (invoiceAgg._sum.paidKobo ?? 0);

  const stats = [
    { label: "Active students", value: studentCount.toLocaleString("en-NG") },
    { label: "Open invoices", value: String(invoiceAgg._count) },
    { label: "Outstanding", value: formatNGN(outstanding) },
    { label: "Collected today", value: formatNGN(paidToday._sum.amountKobo ?? 0) },
  ];

  return (
    <div>
      <PageHeader
        eyebrow={tenant?.city ? `${tenant.city}, ${tenant.country}` : "Campus"}
        title={tenant?.name ?? "Dashboard"}
        description={
          tenant?.motto
            ? `“${tenant.motto}” · 2025/2026 session · figures in Nigerian naira.`
            : "Institutional records and fees."
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-forest-500 dark:text-gold-400">
              {s.label}
            </div>
            <div className="mt-2 font-display text-2xl text-forest-950 dark:text-paper-50">
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Outstanding invoices</h2>
            {hasPermission(session.role, "invoices:read") && (
              <Link href="/invoices" className="text-sm text-forest-700 underline-offset-2 hover:underline dark:text-gold-300">
                View all
              </Link>
            )}
          </div>
          <ul className="divide-y divide-forest-100 dark:divide-forest-800">
            {outstandingInvoices.length === 0 && (
              <li className="py-6 text-sm text-forest-500">No outstanding invoices.</li>
            )}
            {outstandingInvoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                    {fullName(inv.student)}
                  </Link>
                  <div className="text-xs text-forest-500">
                    {inv.invoiceNumber} · {inv.student.matricNumber}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {formatNGN(inv.totalKobo - inv.paidKobo)}
                  </div>
                  <StatusBadge status={inv.status} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Recent payments</h2>
            <Link href="/payments" className="text-sm text-forest-700 underline-offset-2 hover:underline dark:text-gold-300">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-forest-100 dark:divide-forest-800">
            {recentPayments.length === 0 && (
              <li className="py-6 text-sm text-forest-500">No payments yet.</li>
            )}
            {recentPayments.map((pmt) => (
              <li key={pmt.id} className="flex items-center justify-between gap-3 py-3">
                <div>
                  <div className="font-medium">{fullName(pmt.student)}</div>
                  <div className="text-xs text-forest-500">
                    {pmt.reference} · {formatDateTime(pmt.paidAt)}
                  </div>
                </div>
                <div className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {formatNGN(pmt.amountKobo)}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {hasPermission(session.role, "audit:read") && (
        <section className="card mt-6 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg">Audit trail</h2>
            <Link href="/audit" className="text-sm text-forest-700 underline-offset-2 hover:underline dark:text-gold-300">
              Full log
            </Link>
          </div>
          <ul className="space-y-2 text-sm">
            {recentAudit.map((a) => (
              <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2">
                <span>
                  <span className="font-medium">{a.user?.name ?? "System"}</span>{" "}
                  <span className="text-forest-600 dark:text-forest-300">{a.action.replaceAll("_", " ").toLowerCase()}</span>{" "}
                  <span className="text-forest-400">{a.entity}</span>
                </span>
                <span className="text-xs text-forest-500">{formatDateTime(a.createdAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
