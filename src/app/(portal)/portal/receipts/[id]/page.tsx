import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getReceiptForTenant } from "@/lib/receipts";
import { ReceiptView } from "@/components/ReceiptView";
import { PageHeader } from "@/components/PageHeader";

export default async function PortalReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireSession();
  const { id } = await params;
  const receipt = await getReceiptForTenant({
    tenantId: session.tenantId,
    receiptId: id,
    studentId: session.studentId,
  });
  if (!receipt) notFound();

  return (
    <div>
      <PageHeader eyebrow="My fees" title="Receipt" />
      <ReceiptView data={receipt} />
    </div>
  );
}
