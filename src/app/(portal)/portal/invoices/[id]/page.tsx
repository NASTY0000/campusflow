import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { formatDateTime, methodLabel } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentForm } from "@/components/PaymentForm";

export default async function PortalInvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  if (!session.studentId) redirect("/login");
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId: session.tenantId, studentId: session.studentId },
    include: {
      items: true,
      payments: { include: { receipt: true }, orderBy: { paidAt: "desc" } },
    },
  });
  if (!invoice) notFound();
  const balance = invoice.totalKobo - invoice.paidKobo;

  return (
    <div>
      <PageHeader eyebrow="My fees" title={invoice.invoiceNumber} />
      <div className="mb-4">
        <StatusBadge status={invoice.status} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <table className="data">
            <thead>
              <tr>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((l) => (
                <tr key={l.id}>
                  <td>{l.description}</td>
                  <td>{formatNGN(l.amountKobo * l.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-between text-sm">
            <span>Balance due</span>
            <span className="font-display text-xl">{formatNGN(balance)}</span>
          </div>
          {invoice.payments.length > 0 && (
            <ul className="mt-6 space-y-2 text-sm">
              {invoice.payments.map((p) => (
                <li key={p.id} className="flex justify-between gap-3">
                  <span>
                    {methodLabel(p.method)} · {formatDateTime(p.paidAt)}
                    {p.receipt && (
                      <>
                        {" "}
                        ·{" "}
                        <Link href={`/portal/receipts/${p.receipt.id}`} className="underline">
                          {p.receipt.receiptNumber}
                        </Link>
                      </>
                    )}
                  </span>
                  <span>{formatNGN(p.amountKobo)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <aside className="card p-5">
          <h2 className="font-display text-lg">Pay (demo)</h2>
          {balance > 0 && invoice.status !== "VOID" ? (
            <div className="mt-4">
              <PaymentForm invoiceId={invoice.id} outstandingKobo={balance} studentFacing />
            </div>
          ) : (
            <p className="mt-3 text-sm text-forest-500">Nothing due on this invoice.</p>
          )}
        </aside>
      </div>
    </div>
  );
}
