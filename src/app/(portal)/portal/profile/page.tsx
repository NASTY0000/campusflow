import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, fullName } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";

export default async function PortalProfilePage() {
  const session = await requireSession();
  if (!session.studentId) redirect("/login");
  const student = await prisma.student.findFirst({
    where: { id: session.studentId, tenantId: session.tenantId },
    include: { enrollments: { orderBy: { enrolledAt: "desc" } } },
  });
  if (!student) redirect("/login");

  const rows = [
    ["Matric number", student.matricNumber],
    ["Full name", fullName(student)],
    ["Email", student.email],
    ["Phone", student.phone ?? "—"],
    ["Gender", student.gender],
    ["Date of birth", formatDate(student.dateOfBirth)],
    ["Nationality", student.nationality],
    ["State of origin", student.stateOfOrigin ?? "—"],
    ["Faculty", student.faculty],
    ["Department", student.department],
    ["Programme", student.programme],
    ["Level", student.level],
    ["Session admitted", student.sessionAdmitted],
    ["Status", student.status],
    ["Address", student.address ?? "—"],
  ];

  return (
    <div>
      <PageHeader eyebrow="My file" title="Profile" />
      <div className="card p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs uppercase tracking-wide text-forest-500">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <h2 className="mt-8 font-display text-lg">Enrolment history</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {student.enrollments.map((e) => (
            <li key={e.id}>
              {e.session} · {e.semester} semester · {e.level}L · {e.status}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
