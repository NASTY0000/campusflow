import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatNGN } from "@/lib/money";
import { computeGpa, formatDate, fullName } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { hasPermission } from "@/lib/roles";
import { addEnrollmentAction, addRecordAction } from "@/app/actions/students";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission("students:read");
  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id, tenantId: session.tenantId },
    include: {
      enrollments: { orderBy: { enrolledAt: "desc" } },
      records: { orderBy: [{ session: "desc" }, { courseCode: "asc" }] },
      invoices: { orderBy: { issuedAt: "desc" } },
      user: true,
    },
  });
  if (!student) notFound();

  const outstanding = student.invoices
    .filter((i) => i.status === "ISSUED" || i.status === "PARTIAL")
    .reduce((s, i) => s + (i.totalKobo - i.paidKobo), 0);
  const gpa = computeGpa(student.records);
  const canWrite = hasPermission(session.role, "students:write");
  const canRecords = hasPermission(session.role, "records:write");
  const canInvoice = hasPermission(session.role, "invoices:write");

  return (
    <div>
      <PageHeader
        eyebrow={student.matricNumber}
        title={fullName(student)}
        description={`${student.programme} · ${student.faculty} · ${student.level} level`}
        actions={
          <>
            {canWrite && (
              <Link href={`/students/${student.id}/edit`} className="btn-secondary">
                Edit profile
              </Link>
            )}
            {canInvoice && (
              <Link href={`/invoices/new?studentId=${student.id}`} className="btn-primary">
                Issue invoice
              </Link>
            )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-forest-500">Status</div>
          <div className="mt-2">
            <StatusBadge status={student.status} />
          </div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-forest-500">Outstanding fees</div>
          <div className="mt-1 font-display text-xl">{formatNGN(outstanding)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-wide text-forest-500">GPA (5.0 scale)</div>
          <div className="mt-1 font-display text-xl">{gpa ?? "—"}</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card p-5 lg:col-span-1">
          <h2 className="font-display text-lg">Biodata</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Row label="Email" value={student.email} />
            <Row label="Phone" value={student.phone} />
            <Row label="Gender" value={student.gender} />
            <Row label="Date of birth" value={formatDate(student.dateOfBirth)} />
            <Row label="Nationality" value={student.nationality} />
            <Row label="State of origin" value={student.stateOfOrigin} />
            <Row label="Department" value={student.department} />
            <Row label="Admitted" value={student.sessionAdmitted} />
            <Row label="Portal" value={student.user ? "Active" : "No account"} />
            <Row label="Address" value={student.address} />
          </dl>
        </section>

        <div className="space-y-6 lg:col-span-2">
          <section className="card p-5">
            <h2 className="font-display text-lg">Enrolment</h2>
            <table className="data mt-3">
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Semester</th>
                  <th>Programme</th>
                  <th>Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {student.enrollments.map((e) => (
                  <tr key={e.id}>
                    <td>{e.session}</td>
                    <td>{e.semester}</td>
                    <td>{e.programme}</td>
                    <td>{e.level}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canWrite && (
              <form action={addEnrollmentAction.bind(null, student.id)} className="mt-4 grid gap-2 sm:grid-cols-5">
                <input name="session" className="input" defaultValue="2025/2026" />
                <select name="semester" className="input">
                  <option>First</option>
                  <option>Second</option>
                </select>
                <input name="programme" className="input" defaultValue={student.programme} />
                <input name="level" className="input" defaultValue={student.level} />
                <button className="btn-secondary" type="submit">
                  Enrol
                </button>
              </form>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg">Academic records</h2>
            <table className="data mt-3">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Title</th>
                  <th>Units</th>
                  <th>Grade</th>
                  <th>GP</th>
                </tr>
              </thead>
              <tbody>
                {student.records.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-forest-500">
                      No records yet.
                    </td>
                  </tr>
                )}
                {student.records.map((r) => (
                  <tr key={r.id}>
                    <td className="font-mono text-xs">{r.courseCode}</td>
                    <td>
                      {r.courseTitle}
                      <div className="text-xs text-forest-500">
                        {r.session} · {r.semester}
                      </div>
                    </td>
                    <td>{r.creditUnit}</td>
                    <td>{r.grade}</td>
                    <td>{r.gradePoint}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canRecords && (
              <form action={addRecordAction.bind(null, student.id)} className="mt-4 grid gap-2 sm:grid-cols-6">
                <input name="courseCode" className="input" placeholder="CSC101" required />
                <input name="courseTitle" className="input sm:col-span-2" placeholder="Course title" required />
                <input name="creditUnit" type="number" min={1} max={6} defaultValue={3} className="input" />
                <select name="grade" className="input">
                  {["A", "B", "C", "D", "E", "F"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
                <button className="btn-secondary" type="submit">
                  Add
                </button>
                <input type="hidden" name="session" value="2025/2026" />
                <input type="hidden" name="semester" value="First" />
              </form>
            )}
          </section>

          <section className="card p-5">
            <h2 className="font-display text-lg">Invoices</h2>
            <table className="data mt-3">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Session</th>
                  <th>Total</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {student.invoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-forest-500">
                      No invoices.
                    </td>
                  </tr>
                )}
                {student.invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td>{inv.session}</td>
                    <td>{formatNGN(inv.totalKobo)}</td>
                    <td>{formatNGN(inv.totalKobo - inv.paidKobo)}</td>
                    <td>
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-forest-500">{label}</dt>
      <dd className="text-forest-900 dark:text-paper-100">{value || "—"}</dd>
    </div>
  );
}
