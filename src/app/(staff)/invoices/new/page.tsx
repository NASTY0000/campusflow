import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { InvoiceForm } from "./InvoiceForm";

export default async function NewInvoicePage({
  searchParams,
}: {
  searchParams: Promise<{ studentId?: string }>;
}) {
  const session = await requirePermission("invoices:write");
  const sp = await searchParams;
  const [students, fees] = await Promise.all([
    prisma.student.findMany({
      where: { tenantId: session.tenantId, status: "ACTIVE" },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.feeItem.findMany({
      where: { tenantId: session.tenantId, isActive: true },
      orderBy: [{ type: "asc" }, { name: "asc" }],
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Bursary"
        title="Issue invoice"
        description="Select a student and the catalogue items that apply. Issuing posts a debit to accounts receivable."
      />
      <div className="card p-6">
        <InvoiceForm students={students} fees={fees} defaultStudentId={sp.studentId} />
      </div>
    </div>
  );
}
