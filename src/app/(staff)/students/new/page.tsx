import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { StudentForm } from "@/components/StudentForm";
import { createStudentAction } from "@/app/actions/students";

export default async function NewStudentPage() {
  await requirePermission("students:write");
  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="Admit a student"
        description="A portal account is created automatically. Default password is CampusFlow!2026 until they change it."
      />
      <div className="card p-6">
        <StudentForm action={createStudentAction} submitLabel="Create student" />
      </div>
    </div>
  );
}
