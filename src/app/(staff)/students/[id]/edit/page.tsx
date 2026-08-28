import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/PageHeader";
import { StudentForm } from "@/components/StudentForm";
import { updateStudentAction } from "@/app/actions/students";
import { fullName } from "@/lib/format";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("students:write");
  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id, tenantId: session.tenantId },
  });
  if (!student) notFound();

  const bound = updateStudentAction.bind(null, student.id);

  return (
    <div>
      <PageHeader eyebrow="Registry" title={`Edit ${fullName(student)}`} />
      <div className="card p-6">
        <StudentForm
          action={bound}
          submitLabel="Save changes"
          defaults={{
            ...student,
            dateOfBirth: student.dateOfBirth?.toISOString() ?? "",
          }}
        />
      </div>
    </div>
  );
}
