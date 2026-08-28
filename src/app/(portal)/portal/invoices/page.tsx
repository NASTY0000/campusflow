import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";

export default async function PortalInvoicesPage() {
  const session = await requireSession();
  if (!session.studentId) redirect("/login");
  const invoices = await prisma.invoice.findMany({
    where: { tenantId: session.tenantId, studentId: session.studentId },
    orderBy: { issuedAt: "desc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="My fees"
        title="Invoices"
        description="Pay online with the demo gateway. Nothing is charged to a real card or bank."
      />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Session</th>
              <th>Total</th>
              <th>Balance</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>
                  <Link href={`/portal/invoices/${inv.id}`} className="font-medium hover:underline">
                    {inv.invoiceNumber}
                  </Link>
                </td>
                <td>{inv.session}</td>
                <td>{formatNGN(inv.totalKobo)}</td>
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
