import { prisma } from "./db";

export async function getReceiptForTenant(opts: {
  tenantId: string;
  receiptId: string;
  studentId?: string | null;
}) {
  return prisma.receipt.findFirst({
    where: {
      id: opts.receiptId,
      tenantId: opts.tenantId,
      ...(opts.studentId ? { payment: { studentId: opts.studentId } } : {}),
    },
    include: {
      tenant: true,
      payment: {
        include: {
          invoice: true,
          student: true,
        },
      },
    },
  });
}
