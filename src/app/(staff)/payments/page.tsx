import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { formatDateTime, fullName, methodLabel } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

export default async function PaymentsPage() {
  const session = await requirePermission("invoices:read");
  const payments = await prisma.payment.findMany({
    where: { tenantId: session.tenantId },
    include: { student: true, invoice: true, receipt: true },
    orderBy: { paidAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Bursary"
        title="Payments"
        description="Demo collections posted against invoices. Each success writes cash and receivable ledger lines."
      />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Student</th>
              <th>Invoice</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Receipt</th>
              <th>Status</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="font-mono text-xs">{p.reference}</td>
                <td>
                  <Link href={`/students/${p.studentId}`} className="hover:underline">
                    {fullName(p.student)}
                  </Link>
                </td>
                <td>
                  <Link href={`/invoices/${p.invoiceId}`} className="hover:underline">
                    {p.invoice.invoiceNumber}
                  </Link>
                </td>
                <td>{methodLabel(p.method)}</td>
                <td className="font-medium">{formatNGN(p.amountKobo)}</td>
                <td>
                  {p.receipt ? (
                    <Link href={`/receipts/${p.receipt.id}`} className="underline">
                      {p.receipt.receiptNumber}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <StatusBadge status={p.status} />
                </td>
                <td>{formatDateTime(p.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
