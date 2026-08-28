import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function resetDb() {
  await prisma.auditLog.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.receipt.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.academicRecord.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.user.deleteMany();
  await prisma.student.deleteMany();
  await prisma.feeItem.deleteMany();
  await prisma.tenant.deleteMany();
}

export async function twoTenants() {
  const hash = await bcrypt.hash("CampusFlow!2026", 4);
  const ridge = await prisma.tenant.create({
    data: {
      slug: "ridgeview-test",
      name: "Ridgeview University",
      city: "Lagos",
      country: "Nigeria",
    },
  });
  const cedar = await prisma.tenant.create({
    data: {
      slug: "cedar-test",
      name: "Cedar Hall College",
      city: "Accra",
      country: "Ghana",
    },
  });
  const ridgeAdmin = await prisma.user.create({
    data: {
      tenantId: ridge.id,
      email: "admin@ridgeview-test.edu.ng",
      passwordHash: hash,
      name: "Ridge Admin",
      role: "ADMIN",
    },
  });
  const cedarAdmin = await prisma.user.create({
    data: {
      tenantId: cedar.id,
      email: "admin@cedar-test.edu.gh",
      passwordHash: hash,
      name: "Cedar Admin",
      role: "ADMIN",
    },
  });
  const ridgeStudent = await prisma.student.create({
    data: {
      tenantId: ridge.id,
      matricNumber: "RUV/T/001",
      firstName: "Ada",
      lastName: "Okeke",
      email: "ada.okeke@ridgeview-test.edu.ng",
      gender: "Female",
      programme: "B.Sc. Computer Science",
      faculty: "Science",
      department: "Computer Science",
      level: "100",
      sessionAdmitted: "2025/2026",
    },
  });
  const cedarStudent = await prisma.student.create({
    data: {
      tenantId: cedar.id,
      matricNumber: "CHC/T/001",
      firstName: "Ama",
      lastName: "Boateng",
      email: "ama@cedar-test.edu.gh",
      gender: "Female",
      programme: "B.Sc. Business Administration",
      faculty: "Business",
      department: "Business",
      level: "100",
      sessionAdmitted: "2025/2026",
    },
  });
  return { ridge, cedar, ridgeAdmin, cedarAdmin, ridgeStudent, cedarStudent };
}
