import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { formatDate, fullName } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { hasPermission } from "@/lib/roles";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await requirePermission("invoices:read");
  const sp = await searchParams;
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId: session.tenantId,
      ...(sp.status ? { status: sp.status } : {}),
    },
    include: { student: true },
    orderBy: { issuedAt: "desc" },
    take: 200,
  });
  const canWrite = hasPermission(session.role, "invoices:write");

  return (
    <div>
      <PageHeader
        eyebrow="Bursary"
        title="Invoices"
        description="Session bills issued to students. Balances are live against the ledger."
        actions={
          canWrite ? (
            <Link href="/invoices/new" className="btn-primary">
              Issue invoice
            </Link>
          ) : undefined
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          ["", "All"],
          ["ISSUED", "Issued"],
          ["PARTIAL", "Partial"],
          ["PAID", "Paid"],
          ["VOID", "Void"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={value ? `/invoices?status=${value}` : "/invoices"}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              (sp.status ?? "") === value
                ? "bg-forest-900 text-white dark:bg-gold-400 dark:text-forest-950"
                : "bg-white text-forest-700 ring-1 ring-forest-200 dark:bg-forest-900 dark:text-paper-100 dark:ring-forest-700"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Student</th>
              <th>Session</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>
                  <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td>
                  <Link href={`/students/${inv.studentId}`} className="hover:underline">
                    {fullName(inv.student)}
                  </Link>
                  <div className="text-xs text-forest-500">{inv.student.matricNumber}</div>
                </td>
                <td>
                  {inv.session}
                  <div className="text-xs text-forest-500">{inv.semester}</div>
                </td>
                <td>{formatNGN(inv.totalKobo)}</td>
                <td>{formatNGN(inv.paidKobo)}</td>
                <td>{formatNGN(inv.totalKobo - inv.paidKobo)}</td>
                <td>{formatDate(inv.dueDate)}</td>
                <td>
                  <StatusBadge status={inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
