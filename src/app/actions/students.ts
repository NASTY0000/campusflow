"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requirePermission, requireSession } from "@/lib/auth";
import { createStudent, importStudentsFromCsv } from "@/lib/students";
import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import { gradePointFromLetter } from "@/lib/format";

const studentSchema = z.object({
  matricNumber: z.string().min(3),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  otherNames: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  gender: z.enum(["Male", "Female"]),
  dateOfBirth: z.string().optional(),
  stateOfOrigin: z.string().optional(),
  address: z.string().optional(),
  programme: z.string().min(1),
  faculty: z.string().min(1),
  department: z.string().min(1),
  level: z.string().regex(/^\d{3}$/),
  sessionAdmitted: z.string().min(4),
  status: z.string().optional(),
});

function fd(form: FormData) {
  return Object.fromEntries(
    Array.from(form.entries()).map(([k, v]) => [k, typeof v === "string" ? v : ""])
  );
}

export async function createStudentAction(
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requirePermission("students:write");
  const parsed = studentSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the form and try again." };
  }
  try {
    const student = await createStudent({
      tenantId: session.tenantId,
      userId: session.id,
      data: parsed.data,
      createPortalAccount: true,
    });
    revalidatePath("/students");
    redirect(`/students/${student.id}`);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not create student." };
  }
}

export async function updateStudentAction(
  studentId: string,
  _prev: { error?: string } | null,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requirePermission("students:write");
  const parsed = studentSchema.safeParse(fd(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Check the form and try again." };
  }
  const existing = await prisma.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
  });
  if (!existing) return { error: "Student not found." };

  const matricNumber = parsed.data.matricNumber.trim().toUpperCase();
  const email = parsed.data.email.trim().toLowerCase();

  const clash = await prisma.student.findFirst({
    where: {
      tenantId: session.tenantId,
      id: { not: studentId },
      OR: [{ matricNumber }, { email }],
    },
  });
  if (clash) return { error: "Matric number or email already in use." };

  await prisma.student.update({
    where: { id: studentId },
    data: {
      matricNumber,
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      otherNames: parsed.data.otherNames?.trim() || null,
      email,
      phone: parsed.data.phone?.trim() || null,
      gender: parsed.data.gender,
      dateOfBirth: parsed.data.dateOfBirth ? new Date(parsed.data.dateOfBirth) : null,
      stateOfOrigin: parsed.data.stateOfOrigin?.trim() || null,
      address: parsed.data.address?.trim() || null,
      programme: parsed.data.programme.trim(),
      faculty: parsed.data.faculty.trim(),
      department: parsed.data.department.trim(),
      level: parsed.data.level,
      sessionAdmitted: parsed.data.sessionAdmitted.trim(),
      status: parsed.data.status || existing.status,
    },
  });

  await writeAudit({
    tenantId: session.tenantId,
    userId: session.id,
    action: "STUDENT_UPDATED",
    entity: "Student",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/students");
  return {};
}

export async function importStudentsAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  const session = await requirePermission("students:import");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a CSV file to import." };
  }
  const text = await file.text();
  const result = await importStudentsFromCsv({
    tenantId: session.tenantId,
    userId: session.id,
    csvText: text,
    createPortalAccounts: true,
  });
  revalidatePath("/students");
  if (!result.ok) {
    const first = result.issues[0];
    return {
      error: first
        ? `Row ${first.row}: ${first.message}`
        : "CSV could not be parsed.",
    };
  }
  const extra = result.issues.length
    ? ` ${result.issues.length} row(s) skipped or flagged.`
    : "";
  return {
    success: `Imported ${result.created} student(s). ${result.skipped} skipped.${extra}`,
  };
}

export async function addEnrollmentAction(studentId: string, formData: FormData) {
  const session = await requirePermission("students:write");
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
  });
  if (!student) throw new Error("Student not found");
  await prisma.enrollment.create({
    data: {
      tenantId: session.tenantId,
      studentId,
      session: String(formData.get("session") || "2025/2026"),
      semester: String(formData.get("semester") || "First"),
      programme: String(formData.get("programme") || student.programme),
      level: String(formData.get("level") || student.level),
      status: "ENROLLED",
    },
  });
  await writeAudit({
    tenantId: session.tenantId,
    userId: session.id,
    action: "ENROLLMENT_CREATED",
    entity: "Enrollment",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
}

export async function addRecordAction(studentId: string, formData: FormData) {
  const session = await requirePermission("records:write");
  const student = await prisma.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
  });
  if (!student) throw new Error("Student not found");
  const grade = String(formData.get("grade") || "F").toUpperCase();
  await prisma.academicRecord.create({
    data: {
      tenantId: session.tenantId,
      studentId,
      session: String(formData.get("session") || "2025/2026"),
      semester: String(formData.get("semester") || "First"),
      courseCode: String(formData.get("courseCode") || "").toUpperCase(),
      courseTitle: String(formData.get("courseTitle") || ""),
      creditUnit: Number(formData.get("creditUnit") || 3),
      grade,
      gradePoint: gradePointFromLetter(grade),
    },
  });
  await writeAudit({
    tenantId: session.tenantId,
    userId: session.id,
    action: "RECORD_ADDED",
    entity: "AcademicRecord",
    entityId: studentId,
  });
  revalidatePath(`/students/${studentId}`);
}

export async function requireActiveSession() {
  return requireSession();
}
