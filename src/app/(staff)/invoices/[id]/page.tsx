import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { formatDate, formatDateTime, fullName, methodLabel } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { PaymentForm } from "@/components/PaymentForm";
import { hasPermission } from "@/lib/roles";
import { voidInvoiceAction } from "@/app/actions/finance";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("invoices:read");
  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      student: true,
      items: true,
      payments: { include: { receipt: true }, orderBy: { paidAt: "desc" } },
    },
  });
  if (!invoice) notFound();
  const balance = invoice.totalKobo - invoice.paidKobo;
  const canPay = hasPermission(session.role, "payments:write") && balance > 0 && invoice.status !== "VOID";
  const canVoid = hasPermission(session.role, "invoices:write") && invoice.paidKobo === 0 && invoice.status !== "VOID";

  return (
    <div>
      <PageHeader
        eyebrow="Invoice"
        title={invoice.invoiceNumber}
        description={`${fullName(invoice.student)} · ${invoice.student.matricNumber}`}
        actions={
          canVoid ? (
            <form action={voidInvoiceAction.bind(null, invoice.id)}>
              <button type="submit" className="btn-danger">
                Void invoice
              </button>
            </form>
          ) : undefined
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Stat label="Total" value={formatNGN(invoice.totalKobo)} />
        <Stat label="Paid" value={formatNGN(invoice.paidKobo)} />
        <Stat label="Balance" value={formatNGN(balance)} />
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-forest-500">Status</div>
          <div className="mt-2">
            <StatusBadge status={invoice.status} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-2">
          <h2 className="font-display text-lg">Lines</h2>
          <table className="data mt-3">
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((line) => (
                <tr key={line.id}>
                  <td>{line.description}</td>
                  <td>{line.quantity}</td>
                  <td>{formatNGN(line.amountKobo * line.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              Session {invoice.session} · {invoice.semester} semester
            </div>
            <div>Due {formatDate(invoice.dueDate)}</div>
            {invoice.notes && <div className="sm:col-span-2 text-forest-600">{invoice.notes}</div>}
            <div>
              Student file:{" "}
              <Link href={`/students/${invoice.studentId}`} className="underline">
                {fullName(invoice.student)}
              </Link>
            </div>
          </dl>

          <h2 className="mt-8 font-display text-lg">Payments</h2>
          <table className="data mt-3">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Receipt</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-forest-500">
                    No payments yet.
                  </td>
                </tr>
              )}
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.reference}</td>
                  <td>{methodLabel(p.method)}</td>
                  <td>{formatNGN(p.amountKobo)}</td>
                  <td>
                    {p.receipt ? (
                      <Link href={`/receipts/${p.receipt.id}`} className="underline">
                        {p.receipt.receiptNumber}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>{formatDateTime(p.paidAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <aside className="card p-5">
          <h2 className="font-display text-lg">Record a payment</h2>
          {canPay ? (
            <div className="mt-4">
              <PaymentForm invoiceId={invoice.id} outstandingKobo={balance} />
            </div>
          ) : (
            <p className="mt-3 text-sm text-forest-500">
              {invoice.status === "PAID"
                ? "This invoice is settled."
                : invoice.status === "VOID"
                  ? "Voided invoices cannot be paid."
                  : "You do not have permission to record payments."}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-forest-500">{label}</div>
      <div className="mt-1 font-display text-xl">{value}</div>
    </div>
  );
}
