import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";

export default async function AuditPage() {
  const session = await requirePermission("audit:read");
  const logs = await prisma.auditLog.findMany({
    where: { tenantId: session.tenantId },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  return (
    <div>
      <PageHeader
        eyebrow="Governance"
        title="Audit log"
        description="Mutations in this institution — logins, student files, invoices, and payments."
      />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="whitespace-nowrap text-xs">{formatDateTime(log.createdAt)}</td>
                <td>{log.user?.name ?? "System"}</td>
                <td className="font-mono text-xs">{log.action}</td>
                <td>
                  {log.entity}
                  {log.entityId && (
                    <div className="font-mono text-[10px] text-forest-400">{log.entityId}</div>
                  )}
                </td>
                <td className="max-w-sm truncate font-mono text-[11px] text-forest-500">
                  {log.metadata}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
