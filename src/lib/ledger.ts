import { prisma } from "./db";
import { writeAudit } from "./audit";

export type InvoiceItemInput = {
  feeItemId?: string | null;
  description: string;
  amountKobo: number;
  quantity?: number;
};

function pad(n: number, width = 5) {
  return String(n).padStart(width, "0");
}

async function nextNumber(tenantId: string, prefix: string, count: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${pad(count + 1)}`;
}

export async function studentOutstandingKobo(tenantId: string, studentId: string) {
  const invoices = await prisma.invoice.findMany({
    where: {
      tenantId,
      studentId,
      status: { in: ["ISSUED", "PARTIAL"] },
    },
    select: { totalKobo: true, paidKobo: true },
  });
  return invoices.reduce((sum, inv) => sum + (inv.totalKobo - inv.paidKobo), 0);
}

export function ledgerBalanceFromEntries(
  entries: { type: string; account: string; amountKobo: number }[],
  account = "ACCOUNTS_RECEIVABLE"
) {
  let balance = 0;
  for (const e of entries) {
    if (e.account !== account) continue;
    if (e.type === "DEBIT") balance += e.amountKobo;
    else if (e.type === "CREDIT") balance -= e.amountKobo;
  }
  return balance;
}

export async function issueInvoice(opts: {
  tenantId: string;
  studentId: string;
  session: string;
  semester?: string | null;
  dueDate?: Date | null;
  items: InvoiceItemInput[];
  userId: string;
  notes?: string | null;
}) {
  if (!opts.items.length) {
    throw new Error("Invoice must have at least one line");
  }
  for (const item of opts.items) {
    if (item.amountKobo <= 0) throw new Error("Line amounts must be greater than zero");
  }

  const totalKobo = opts.items.reduce(
    (s, i) => s + i.amountKobo * (i.quantity ?? 1),
    0
  );

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.findFirst({
      where: { id: opts.studentId, tenantId: opts.tenantId },
    });
    if (!student) throw new Error("Student not found in this institution");

    const count = await tx.invoice.count({ where: { tenantId: opts.tenantId } });
    const invoiceNumber = await nextNumber(opts.tenantId, "INV", count);

    const invoice = await tx.invoice.create({
      data: {
        tenantId: opts.tenantId,
        studentId: opts.studentId,
        invoiceNumber,
        session: opts.session,
        semester: opts.semester ?? "First",
        status: "ISSUED",
        totalKobo,
        paidKobo: 0,
        dueDate: opts.dueDate ?? null,
        notes: opts.notes ?? null,
        items: {
          create: opts.items.map((item) => ({
            tenantId: opts.tenantId,
            feeItemId: item.feeItemId ?? null,
            description: item.description,
            quantity: item.quantity ?? 1,
            amountKobo: item.amountKobo,
          })),
        },
      },
      include: { items: true, student: true },
    });

    await tx.ledgerEntry.create({
      data: {
        tenantId: opts.tenantId,
        studentId: opts.studentId,
        invoiceId: invoice.id,
        type: "DEBIT",
        account: "ACCOUNTS_RECEIVABLE",
        amountKobo: totalKobo,
        description: `Invoice ${invoiceNumber} issued`,
        createdById: opts.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId: opts.tenantId,
        userId: opts.userId,
        action: "INVOICE_ISSUED",
        entity: "Invoice",
        entityId: invoice.id,
        metadata: JSON.stringify({ invoiceNumber, totalKobo, studentId: opts.studentId }),
      },
    });

    return invoice;
  });
}

export async function recordPayment(opts: {
  tenantId: string;
  invoiceId: string;
  amountKobo: number;
  method: string;
  userId: string;
  notes?: string | null;
  reference?: string | null;
}) {
  if (opts.amountKobo <= 0) throw new Error("Payment amount must be greater than zero");

  const allowed = ["CARD_DEMO", "BANK_TRANSFER_DEMO", "CASH", "POS"];
  if (!allowed.includes(opts.method)) {
    throw new Error("Unsupported payment method");
  }

  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: opts.invoiceId, tenantId: opts.tenantId },
      include: { student: true },
    });
    if (!invoice) throw new Error("Invoice not found in this institution");
    if (invoice.status === "VOID") throw new Error("Cannot pay a voided invoice");
    if (invoice.status === "PAID") throw new Error("Invoice is already paid in full");

    const remaining = invoice.totalKobo - invoice.paidKobo;
    if (opts.amountKobo > remaining) {
      throw new Error("Payment exceeds outstanding balance");
    }

    const payCount = await tx.payment.count({ where: { tenantId: opts.tenantId } });
    const reference =
      opts.reference ?? `PAY-DEMO-${new Date().getFullYear()}-${pad(payCount + 1)}`;

    const existing = await tx.payment.findFirst({
      where: { tenantId: opts.tenantId, reference },
    });
    if (existing) throw new Error("Payment reference already exists");

    const payment = await tx.payment.create({
      data: {
        tenantId: opts.tenantId,
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        amountKobo: opts.amountKobo,
        method: opts.method,
        reference,
        status: "SUCCESS",
        paidAt: new Date(),
        receivedById: opts.userId,
        notes: opts.notes ?? "Demo payment — no live processor",
      },
    });

    const newPaid = invoice.paidKobo + opts.amountKobo;
    const newStatus = newPaid >= invoice.totalKobo ? "PAID" : "PARTIAL";

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { paidKobo: newPaid, status: newStatus },
    });

    const receiptCount = await tx.receipt.count({ where: { tenantId: opts.tenantId } });
    const receiptNumber = await nextNumber(opts.tenantId, "RCT", receiptCount);

    const receipt = await tx.receipt.create({
      data: {
        tenantId: opts.tenantId,
        paymentId: payment.id,
        receiptNumber,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        tenantId: opts.tenantId,
        studentId: invoice.studentId,
        invoiceId: invoice.id,
        paymentId: payment.id,
        type: "CREDIT",
        account: "ACCOUNTS_RECEIVABLE",
        amountKobo: opts.amountKobo,
        description: `Payment ${reference} on ${invoice.invoiceNumber}`,
        createdById: opts.userId,
      },
    });

    await tx.ledgerEntry.create({
      data: {
        tenantId: opts.tenantId,
        studentId: invoice.studentId,
        invoiceId: invoice.id,
        paymentId: payment.id,
        type: "DEBIT",
        account: "CASH",
        amountKobo: opts.amountKobo,
        description: `Cash received ${reference}`,
        createdById: opts.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId: opts.tenantId,
        userId: opts.userId,
        action: "PAYMENT_RECORDED",
        entity: "Payment",
        entityId: payment.id,
        metadata: JSON.stringify({
          reference,
          amountKobo: opts.amountKobo,
          method: opts.method,
          invoiceNumber: invoice.invoiceNumber,
          receiptNumber,
        }),
      },
    });

    return { payment, receipt, invoiceStatus: newStatus, paidKobo: newPaid };
  });
}

export async function voidInvoice(opts: {
  tenantId: string;
  invoiceId: string;
  userId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.findFirst({
      where: { id: opts.invoiceId, tenantId: opts.tenantId },
    });
    if (!invoice) throw new Error("Invoice not found in this institution");
    if (invoice.paidKobo > 0) {
      throw new Error("Cannot void an invoice that has payments");
    }
    if (invoice.status === "VOID") return invoice;

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: "VOID" },
    });

    await tx.ledgerEntry.create({
      data: {
        tenantId: opts.tenantId,
        studentId: invoice.studentId,
        invoiceId: invoice.id,
        type: "CREDIT",
        account: "ACCOUNTS_RECEIVABLE",
        amountKobo: invoice.totalKobo,
        description: `Void ${invoice.invoiceNumber}`,
        createdById: opts.userId,
      },
    });

    await tx.auditLog.create({
      data: {
        tenantId: opts.tenantId,
        userId: opts.userId,
        action: "INVOICE_VOIDED",
        entity: "Invoice",
        entityId: invoice.id,
        metadata: JSON.stringify({ invoiceNumber: invoice.invoiceNumber }),
      },
    });

    return invoice;
  });
}

export { writeAudit };
