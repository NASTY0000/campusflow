import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { searchStudents } from "@/lib/students";
import { formatNGN } from "@/lib/money";
import { fullName } from "@/lib/format";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { hasPermission } from "@/lib/roles";
import { prisma } from "@/lib/db";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; programme?: string; level?: string; status?: string }>;
}) {
  const session = await requirePermission("students:read");
  const sp = await searchParams;
  const students = await searchStudents({
    tenantId: session.tenantId,
    query: sp.q,
    programme: sp.programme,
    level: sp.level,
    status: sp.status,
    take: 100,
  });
  const programmes = await prisma.student.findMany({
    where: { tenantId: session.tenantId },
    distinct: ["programme"],
    select: { programme: true },
    orderBy: { programme: "asc" },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Registry"
        title="Students"
        description="Search the roll, open a file, or import a CSV from admissions."
        actions={
          hasPermission(session.role, "students:write") ? (
            <>
              <Link href="/students/import" className="btn-secondary">
                Import CSV
              </Link>
              <Link href="/students/new" className="btn-primary">
                New student
              </Link>
            </>
          ) : undefined
        }
      />

      <form className="card mb-6 grid gap-3 p-4 sm:grid-cols-4">
        <input
          name="q"
          defaultValue={sp.q}
          placeholder="Name, matric, email…"
          className="input sm:col-span-2"
        />
        <select name="programme" defaultValue={sp.programme ?? ""} className="input">
          <option value="">All programmes</option>
          {programmes.map((p) => (
            <option key={p.programme}>{p.programme}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <select name="level" defaultValue={sp.level ?? ""} className="input">
            <option value="">Level</option>
            {["100", "200", "300", "400", "500"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <button className="btn-primary" type="submit">
            Search
          </button>
        </div>
      </form>

      <div className="table-wrap">
        <table className="data">
          <thead>
            <tr>
              <th>Matric</th>
              <th>Name</th>
              <th>Programme</th>
              <th>Level</th>
              <th>Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-forest-500">
                  No students match those filters.
                </td>
              </tr>
            )}
            {students.map((s) => {
              const bal = s.invoices
                .filter((i) => i.status === "ISSUED" || i.status === "PARTIAL")
                .reduce((sum, i) => sum + (i.totalKobo - i.paidKobo), 0);
              return (
                <tr key={s.id}>
                  <td className="font-mono text-xs">{s.matricNumber}</td>
                  <td>
                    <Link href={`/students/${s.id}`} className="font-medium hover:underline">
                      {fullName(s)}
                    </Link>
                    <div className="text-xs text-forest-500">{s.email}</div>
                  </td>
                  <td>
                    {s.programme}
                    <div className="text-xs text-forest-500">{s.faculty}</div>
                  </td>
                  <td>{s.level}</td>
                  <td className={bal > 0 ? "font-medium text-amber-800 dark:text-amber-300" : ""}>
                    {formatNGN(bal)}
                  </td>
                  <td>
                    <StatusBadge status={s.status} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
