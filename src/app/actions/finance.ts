"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { issueInvoice, recordPayment, voidInvoice } from "@/lib/ledger";
import { parseNairaInput } from "@/lib/money";
import { hasPermission } from "@/lib/roles";

export async function createFeeItemAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requirePermission("fees:write");
  try {
    const code = String(formData.get("code") || "").trim().toUpperCase();
    const name = String(formData.get("name") || "").trim();
    const type = String(formData.get("type") || "").trim();
    const amountKobo = parseNairaInput(String(formData.get("amount") || "0"));
    if (!code || !name || !type) return { error: "Code, name and type are required." };
    if (amountKobo <= 0) return { error: "Amount must be greater than zero." };

    await prisma.feeItem.create({
      data: {
        tenantId: session.tenantId,
        code,
        name,
        type,
        amountKobo,
        session: String(formData.get("session") || "") || null,
        level: String(formData.get("level") || "") || null,
        programme: String(formData.get("programme") || "") || null,
        description: String(formData.get("description") || "") || null,
      },
    });
    await writeAudit({
      tenantId: session.tenantId,
      userId: session.id,
      action: "FEE_ITEM_CREATED",
      entity: "FeeItem",
      metadata: { code, amountKobo },
    });
    revalidatePath("/fees");
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save fee item." };
  }
}

export async function toggleFeeItemAction(id: string) {
  const session = await requirePermission("fees:write");
  const item = await prisma.feeItem.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!item) throw new Error("Fee item not found");
  await prisma.feeItem.update({
    where: { id },
    data: { isActive: !item.isActive },
  });
  revalidatePath("/fees");
}

export async function createInvoiceAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requirePermission("invoices:write");
  try {
    const studentId = String(formData.get("studentId") || "");
    const sessionYear = String(formData.get("session") || "2025/2026");
    const semester = String(formData.get("semester") || "First");
    const due = String(formData.get("dueDate") || "");
    const notes = String(formData.get("notes") || "") || null;
    const selected = formData.getAll("feeItemId").map(String).filter(Boolean);
    if (!studentId) return { error: "Select a student." };
    if (!selected.length) return { error: "Select at least one fee item." };

    const items = await prisma.feeItem.findMany({
      where: { tenantId: session.tenantId, id: { in: selected }, isActive: true },
    });
    if (!items.length) return { error: "No valid fee items selected." };

    const invoice = await issueInvoice({
      tenantId: session.tenantId,
      studentId,
      session: sessionYear,
      semester,
      dueDate: due ? new Date(due) : null,
      notes,
      userId: session.id,
      items: items.map((i) => ({
        feeItemId: i.id,
        description: i.name,
        amountKobo: i.amountKobo,
      })),
    });
    revalidatePath("/invoices");
    revalidatePath(`/students/${studentId}`);
    redirect(`/invoices/${invoice.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not issue invoice." };
  }
}

export async function recordPaymentAction(
  invoiceId: string,
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireSession();
  const isStudent = session.role === "STUDENT";
  if (!isStudent && !hasPermission(session.role, "payments:write")) {
    return { error: "You do not have permission to record payments." };
  }

  try {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId: session.tenantId },
    });
    if (!invoice) return { error: "Invoice not found." };
    if (isStudent && invoice.studentId !== session.studentId) {
      return { error: "You can only pay your own invoices." };
    }

    const amountKobo = parseNairaInput(String(formData.get("amount") || "0"));
    const method = String(formData.get("method") || "CARD_DEMO");
    const notes = String(formData.get("notes") || "") || null;

    const result = await recordPayment({
      tenantId: session.tenantId,
      invoiceId,
      amountKobo,
      method,
      userId: session.id,
      notes,
    });
    revalidatePath("/invoices");
    revalidatePath(`/invoices/${invoiceId}`);
    revalidatePath("/payments");
    revalidatePath("/ledger");
    revalidatePath("/portal");
    if (isStudent) {
      redirect(`/portal/receipts/${result.receipt.id}`);
    }
    redirect(`/receipts/${result.receipt.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Payment failed." };
  }
}

export async function voidInvoiceAction(invoiceId: string) {
  const session = await requirePermission("invoices:write");
  await voidInvoice({
    tenantId: session.tenantId,
    invoiceId,
    userId: session.id,
  });
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/invoices");
  revalidatePath("/ledger");
}
