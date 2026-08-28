import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { formatDateTime, fullName } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { ledgerBalanceFromEntries } from "@/lib/ledger";

export default async function LedgerPage() {
  const session = await requirePermission("ledger:read");
  const entries = await prisma.ledgerEntry.findMany({
    where: { tenantId: session.tenantId },
    include: { student: true, invoice: true, payment: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const ar = ledgerBalanceFromEntries(entries, "ACCOUNTS_RECEIVABLE");
  const cashBalance = ledgerBalanceFromEntries(entries, "CASH");

  return (
    <div>
      <PageHeader
        eyebrow="Bursary"
        title="General ledger"
        description="Double-entry posts for this institution only. Receivables debit on invoice, credit on payment; cash debit on collection."
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-forest-500">Accounts receivable</div>
          <div className="mt-1 font-display text-2xl">{formatNGN(ar)}</div>
          <p className="mt-1 text-xs text-forest-500">Should match open invoice balances.</p>
        </div>
        <div className="card p-5">
          <div className="text-xs uppercase tracking-wide text-forest-500">Cash (demo)</div>
          <div className="mt-1 font-display text-2xl">{formatNGN(cashBalance)}</div>
        </div>
      </div>
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>When</th>
              <th>Account</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Student</th>
              <th>Memo</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap text-xs">{formatDateTime(e.createdAt)}</td>
                <td className="font-mono text-xs">{e.account}</td>
                <td>
                  <span
                    className={
                      e.type === "DEBIT"
                        ? "text-amber-800 dark:text-amber-300"
                        : "text-emerald-800 dark:text-emerald-300"
                    }
                  >
                    {e.type}
                  </span>
                </td>
                <td>{formatNGN(e.amountKobo)}</td>
                <td>
                  {e.student ? (
                    <Link href={`/students/${e.student.id}`} className="hover:underline">
                      {fullName(e.student)}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="text-xs">
                  {e.description}
                  {e.invoice && (
                    <>
                      {" "}
                      ·{" "}
                      <Link href={`/invoices/${e.invoice.id}`} className="underline">
                        {e.invoice.invoiceNumber}
                      </Link>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
