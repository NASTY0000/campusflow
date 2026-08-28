import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { feeTypeLabel } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { hasPermission } from "@/lib/roles";
import { FeeForm } from "./FeeForm";
import { toggleFeeItemAction } from "@/app/actions/finance";

export default async function FeesPage() {
  const session = await requirePermission("fees:read");
  const items = await prisma.feeItem.findMany({
    where: { tenantId: session.tenantId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
  const canWrite = hasPermission(session.role, "fees:write");

  return (
    <div>
      <PageHeader
        eyebrow="Bursary"
        title="Fee catalogue"
        description="Tuition, acceptance, hostel, departmental levies, and ID cards. Amounts in NGN."
      />
      {canWrite && (
        <div className="card mb-6 p-5">
          <h2 className="mb-4 font-display text-lg">Add a fee item</h2>
          <FeeForm />
        </div>
      )}
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Applies to</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className={item.isActive ? "" : "opacity-50"}>
                <td className="font-mono text-xs">{item.code}</td>
                <td>
                  {item.name}
                  {item.description && (
                    <div className="text-xs text-forest-500">{item.description}</div>
                  )}
                </td>
                <td>{feeTypeLabel(item.type)}</td>
                <td className="font-medium">{formatNGN(item.amountKobo)}</td>
                <td className="text-xs text-forest-600">
                  {[item.session, item.level && `${item.level}L`, item.programme]
                    .filter(Boolean)
                    .join(" · ") || "All"}
                </td>
                <td>
                  {canWrite && (
                    <form action={toggleFeeItemAction.bind(null, item.id)}>
                      <button className="btn-ghost text-xs" type="submit">
                        {item.isActive ? "Retire" : "Restore"}
                      </button>
                    </form>
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
