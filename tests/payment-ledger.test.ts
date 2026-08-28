import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import {
  issueInvoice,
  ledgerBalanceFromEntries,
  recordPayment,
  studentOutstandingKobo,
  voidInvoice,
} from "@/lib/ledger";
import { resetDb, twoTenants } from "./helpers";

describe("payment ledger", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("debits AR on issue and credits AR + debits cash on payment", async () => {
    const { ridge, ridgeAdmin, ridgeStudent } = await twoTenants();
    const invoice = await issueInvoice({
      tenantId: ridge.id,
      studentId: ridgeStudent.id,
      session: "2025/2026",
      userId: ridgeAdmin.id,
      items: [
        { description: "Tuition", amountKobo: 45000000 },
        { description: "ID card", amountKobo: 500000 },
      ],
    });
    expect(invoice.totalKobo).toBe(45500000);
    expect(invoice.status).toBe("ISSUED");

    let entries = await prisma.ledgerEntry.findMany({
      where: { tenantId: ridge.id, studentId: ridgeStudent.id },
    });
    expect(ledgerBalanceFromEntries(entries, "ACCOUNTS_RECEIVABLE")).toBe(45500000);

    const first = await recordPayment({
      tenantId: ridge.id,
      invoiceId: invoice.id,
      amountKobo: 20000000,
      method: "CARD_DEMO",
      userId: ridgeAdmin.id,
    });
    expect(first.invoiceStatus).toBe("PARTIAL");
    expect(first.receipt.receiptNumber).toMatch(/^RCT-/);

    const rest = await recordPayment({
      tenantId: ridge.id,
      invoiceId: invoice.id,
      amountKobo: 25500000,
      method: "BANK_TRANSFER_DEMO",
      userId: ridgeAdmin.id,
    });
    expect(rest.invoiceStatus).toBe("PAID");

    entries = await prisma.ledgerEntry.findMany({
      where: { tenantId: ridge.id },
    });
    expect(ledgerBalanceFromEntries(entries, "ACCOUNTS_RECEIVABLE")).toBe(0);
    expect(ledgerBalanceFromEntries(entries, "CASH")).toBe(45500000);
    expect(await studentOutstandingKobo(ridge.id, ridgeStudent.id)).toBe(0);
  });

  it("rejects overpayment and void of a paid invoice", async () => {
    const { ridge, ridgeAdmin, ridgeStudent } = await twoTenants();
    const invoice = await issueInvoice({
      tenantId: ridge.id,
      studentId: ridgeStudent.id,
      session: "2025/2026",
      userId: ridgeAdmin.id,
      items: [{ description: "Hostel", amountKobo: 18000000 }],
    });
    await expect(
      recordPayment({
        tenantId: ridge.id,
        invoiceId: invoice.id,
        amountKobo: 18000001,
        method: "CASH",
        userId: ridgeAdmin.id,
      })
    ).rejects.toThrow(/exceeds outstanding/i);

    await recordPayment({
      tenantId: ridge.id,
      invoiceId: invoice.id,
      amountKobo: 18000000,
      method: "POS",
      userId: ridgeAdmin.id,
    });

    await expect(
      voidInvoice({ tenantId: ridge.id, invoiceId: invoice.id, userId: ridgeAdmin.id })
    ).rejects.toThrow(/payments/);
  });

  it("voiding an unpaid invoice zeros AR", async () => {
    const { ridge, ridgeAdmin, ridgeStudent } = await twoTenants();
    const invoice = await issueInvoice({
      tenantId: ridge.id,
      studentId: ridgeStudent.id,
      session: "2025/2026",
      userId: ridgeAdmin.id,
      items: [{ description: "Acceptance", amountKobo: 7500000 }],
    });
    await voidInvoice({ tenantId: ridge.id, invoiceId: invoice.id, userId: ridgeAdmin.id });
    const entries = await prisma.ledgerEntry.findMany({ where: { tenantId: ridge.id } });
    expect(ledgerBalanceFromEntries(entries, "ACCOUNTS_RECEIVABLE")).toBe(0);
    const fresh = await prisma.invoice.findUniqueOrThrow({ where: { id: invoice.id } });
    expect(fresh.status).toBe("VOID");
  });

  it("computes a mixed paid/unpaid book", async () => {
    const { ridge, ridgeAdmin, ridgeStudent } = await twoTenants();
    const a = await issueInvoice({
      tenantId: ridge.id,
      studentId: ridgeStudent.id,
      session: "2025/2026",
      userId: ridgeAdmin.id,
      items: [{ description: "A", amountKobo: 100000 }],
    });
    await issueInvoice({
      tenantId: ridge.id,
      studentId: ridgeStudent.id,
      session: "2025/2026",
      userId: ridgeAdmin.id,
      items: [{ description: "B", amountKobo: 40000 }],
    });
    await recordPayment({
      tenantId: ridge.id,
      invoiceId: a.id,
      amountKobo: 25000,
      method: "CASH",
      userId: ridgeAdmin.id,
    });
    expect(await studentOutstandingKobo(ridge.id, ridgeStudent.id)).toBe(115000);
  });
});
