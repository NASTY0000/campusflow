import { prisma } from "./db";
import { parseStudentCsv, type StudentCsvRow } from "./csv";
import { writeAudit } from "./audit";
import { hashPassword } from "./auth";

export type CreateStudentInput = {
  matricNumber: string;
  firstName: string;
  lastName: string;
  otherNames?: string;
  email: string;
  phone?: string;
  gender: string;
  dateOfBirth?: string;
  nationality?: string;
  stateOfOrigin?: string;
  address?: string;
  programme: string;
  faculty: string;
  department: string;
  level: string;
  sessionAdmitted: string;
  status?: string;
};

function normalizeGender(g: string) {
  if (g === "M") return "Male";
  if (g === "F") return "Female";
  return g;
}

export async function createStudent(opts: {
  tenantId: string;
  userId: string;
  data: CreateStudentInput;
  createPortalAccount?: boolean;
  portalPassword?: string;
}) {
  const data = opts.data;
  const matricNumber = data.matricNumber.trim().toUpperCase();
  const email = data.email.trim().toLowerCase();

  const existing = await prisma.student.findFirst({
    where: {
      tenantId: opts.tenantId,
      OR: [{ matricNumber }, { email }],
    },
  });
  if (existing) {
    if (existing.matricNumber === matricNumber) {
      throw new Error("A student with this matric number already exists");
    }
    throw new Error("A student with this email already exists");
  }

  const student = await prisma.student.create({
    data: {
      tenantId: opts.tenantId,
      matricNumber,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      otherNames: data.otherNames?.trim() || null,
      email,
      phone: data.phone?.trim() || null,
      gender: normalizeGender(data.gender),
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      nationality: data.nationality || "Nigerian",
      stateOfOrigin: data.stateOfOrigin?.trim() || null,
      address: data.address?.trim() || null,
      programme: data.programme.trim(),
      faculty: data.faculty.trim(),
      department: data.department.trim(),
      level: data.level.trim(),
      sessionAdmitted: data.sessionAdmitted.trim(),
      status: data.status || "ACTIVE",
    },
  });

  if (opts.createPortalAccount) {
    const passwordHash = await hashPassword(opts.portalPassword || "CampusFlow!2026");
    await prisma.user.create({
      data: {
        tenantId: opts.tenantId,
        email,
        passwordHash,
        name: `${student.firstName} ${student.lastName}`,
        role: "STUDENT",
        studentId: student.id,
      },
    });
  }

  await writeAudit({
    tenantId: opts.tenantId,
    userId: opts.userId,
    action: "STUDENT_CREATED",
    entity: "Student",
    entityId: student.id,
    metadata: { matricNumber, email },
  });

  return student;
}

export async function importStudentsFromCsv(opts: {
  tenantId: string;
  userId: string;
  csvText: string;
  createPortalAccounts?: boolean;
}) {
  const parsed = parseStudentCsv(opts.csvText);
  if (parsed.issues.length) {
    return {
      ok: false as const,
      created: 0,
      skipped: 0,
      issues: parsed.issues,
    };
  }

  let created = 0;
  let skipped = 0;
  const issues: { row: number; message: string }[] = [];

  for (let i = 0; i < parsed.rows.length; i++) {
    const row: StudentCsvRow = parsed.rows[i];
    const rowNum = i + 2;
    try {
      const exists = await prisma.student.findFirst({
        where: {
          tenantId: opts.tenantId,
          OR: [
            { matricNumber: row.matricNumber.trim().toUpperCase() },
            { email: row.email.trim().toLowerCase() },
          ],
        },
      });
      if (exists) {
        skipped += 1;
        issues.push({
          row: rowNum,
          message: `Skipped ${row.matricNumber}: already exists in this institution`,
        });
        continue;
      }
      await createStudent({
        tenantId: opts.tenantId,
        userId: opts.userId,
        data: row,
        createPortalAccount: opts.createPortalAccounts ?? true,
      });
      created += 1;
    } catch (err) {
      issues.push({
        row: rowNum,
        message: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  await writeAudit({
    tenantId: opts.tenantId,
    userId: opts.userId,
    action: "STUDENTS_IMPORTED",
    entity: "Student",
    metadata: { created, skipped, issueCount: issues.length },
  });

  return { ok: true as const, created, skipped, issues };
}

export async function searchStudents(opts: {
  tenantId: string;
  query?: string;
  programme?: string;
  level?: string;
  status?: string;
  take?: number;
  skip?: number;
}) {
  const q = opts.query?.trim();
  return prisma.student.findMany({
    where: {
      tenantId: opts.tenantId,
      ...(opts.programme ? { programme: opts.programme } : {}),
      ...(opts.level ? { level: opts.level } : {}),
      ...(opts.status ? { status: opts.status } : {}),
      ...(q
        ? {
            OR: [
              { firstName: { contains: q } },
              { lastName: { contains: q } },
              { matricNumber: { contains: q.toUpperCase() } },
              { email: { contains: q.toLowerCase() } },
              { programme: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: opts.take ?? 50,
    skip: opts.skip ?? 0,
    include: {
      invoices: { select: { totalKobo: true, paidKobo: true, status: true } },
    },
  });
}
