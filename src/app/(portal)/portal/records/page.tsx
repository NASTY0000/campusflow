import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { computeGpa } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";

export default async function PortalRecordsPage() {
  const session = await requireSession();
  if (!session.studentId) redirect("/login");
  const records = await prisma.academicRecord.findMany({
    where: { tenantId: session.tenantId, studentId: session.studentId },
    orderBy: [{ session: "desc" }, { courseCode: "asc" }],
  });
  const gpa = computeGpa(records);

  return (
    <div>
      <PageHeader
        eyebrow="My studies"
        title="Academic records"
        description={`Cumulative GPA on a 5.0 scale: ${gpa ?? "—"}. These are official registry entries, not an LMS.`}
      />
      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Session</th>
              <th>Semester</th>
              <th>Code</th>
              <th>Title</th>
              <th>Units</th>
              <th>Grade</th>
              <th>GP</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>{r.session}</td>
                <td>{r.semester}</td>
                <td className="font-mono text-xs">{r.courseCode}</td>
                <td>{r.courseTitle}</td>
                <td>{r.creditUnit}</td>
                <td>{r.grade}</td>
                <td>{r.gradePoint}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
