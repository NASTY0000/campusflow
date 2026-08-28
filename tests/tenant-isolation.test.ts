import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createStudent, importStudentsFromCsv, searchStudents } from "@/lib/students";
import { issueInvoice, recordPayment } from "@/lib/ledger";
import { resetDb, twoTenants } from "./helpers";

describe("tenant isolation", () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("does not list another institution's students", async () => {
    const { ridge, cedar, ridgeStudent, cedarStudent } = await twoTenants();
    const ridgeList = await searchStudents({ tenantId: ridge.id });
    const cedarList = await searchStudents({ tenantId: cedar.id });
    expect(ridgeList.map((s) => s.id)).toEqual([ridgeStudent.id]);
    expect(cedarList.map((s) => s.id)).toEqual([cedarStudent.id]);
    expect(ridgeList[0].email).not.toBe(cedarStudent.email);
  });

  it("allows the same matric number in two tenants but not twice in one", async () => {
    const { ridge, cedar, ridgeAdmin, cedarAdmin } = await twoTenants();
    const payload = {
      matricNumber: "SHARED/001",
      firstName: "Tunde",
      lastName: "Balogun",
      email: "tunde.shared@example.com",
      gender: "Male",
      programme: "LL.B. Law",
      faculty: "Law",
      department: "Law",
      level: "100",
      sessionAdmitted: "2025/2026",
    };
    await createStudent({ tenantId: ridge.id, userId: ridgeAdmin.id, data: payload });
    await createStudent({
      tenantId: cedar.id,
      userId: cedarAdmin.id,
      data: { ...payload, email: "tunde.shared.cedar@example.com" },
    });
    await expect(
      createStudent({
        tenantId: ridge.id,
        userId: ridgeAdmin.id,
        data: { ...payload, email: "other@example.com" },
      })
    ).rejects.toThrow(/matric number already exists/i);
  });

  it("CSV import only writes into the acting tenant", async () => {
    const { ridge, cedar, ridgeAdmin } = await twoTenants();
    const csv = `matricNumber,firstName,lastName,otherNames,email,phone,gender,dateOfBirth,stateOfOrigin,programme,faculty,department,level,sessionAdmitted
RUV/CSV/001,Femi,Ade,,femi.csv@ridgeview.edu.ng,,Male,,Lagos,B.Sc. Accounting,Management Sciences,Accounting,100,2025/2026
`;
    const result = await importStudentsFromCsv({
      tenantId: ridge.id,
      userId: ridgeAdmin.id,
      csvText: csv,
      createPortalAccounts: false,
    });
    expect(result.ok).toBe(true);
    expect(result.created).toBe(1);
    const leaked = await prisma.student.findFirst({
      where: { tenantId: cedar.id, email: "femi.csv@ridgeview.edu.ng" },
    });
    expect(leaked).toBeNull();
    const owned = await prisma.student.findFirst({
      where: { tenantId: ridge.id, email: "femi.csv@ridgeview.edu.ng" },
    });
    expect(owned).not.toBeNull();
  });

  it("cannot issue an invoice for a student in another tenant", async () => {
    const { ridge, cedarAdmin, cedarStudent } = await twoTenants();
    await expect(
      issueInvoice({
        tenantId: ridge.id,
        studentId: cedarStudent.id,
        session: "2025/2026",
        userId: cedarAdmin.id,
        items: [{ description: "Tuition", amountKobo: 100000 }],
      })
    ).rejects.toThrow(/not found/i);
  });

  it("payment lookup is tenant-scoped", async () => {
    const { ridge, ridgeAdmin, ridgeStudent, cedar } = await twoTenants();
    const invoice = await issueInvoice({
      tenantId: ridge.id,
      studentId: ridgeStudent.id,
      session: "2025/2026",
      userId: ridgeAdmin.id,
      items: [{ description: "ID card", amountKobo: 500000 }],
    });
    await expect(
      recordPayment({
        tenantId: cedar.id,
        invoiceId: invoice.id,
        amountKobo: 500000,
        method: "CASH",
        userId: ridgeAdmin.id,
      })
    ).rejects.toThrow(/not found/i);
  });
});
