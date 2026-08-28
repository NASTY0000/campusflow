import { requirePermission } from "@/lib/auth";
import { PageHeader } from "@/components/PageHeader";
import { ImportForm } from "./ImportForm";

export default async function ImportStudentsPage() {
  await requirePermission("students:import");
  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="CSV import"
        description="Bulk-create students for this institution only. Duplicate matric numbers or emails are skipped."
      />
      <div className="card max-w-2xl p-6">
        <ImportForm />
        <div className="mt-6 text-sm text-forest-600 dark:text-forest-300">
          <p className="font-medium text-forest-900 dark:text-paper-50">Required columns</p>
          <p className="mt-1 font-mono text-xs leading-relaxed">
            matricNumber, firstName, lastName, otherNames, email, phone, gender, dateOfBirth,
            stateOfOrigin, programme, faculty, department, level, sessionAdmitted
          </p>
          <a href="/sample-students.csv" className="mt-3 inline-block text-forest-800 underline dark:text-gold-300">
            Download sample CSV
          </a>
        </div>
      </div>
    </div>
  );
}
