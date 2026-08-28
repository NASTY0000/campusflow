"use client";

import { useActionState } from "react";
import { createInvoiceAction } from "@/app/actions/finance";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";
import { formatNGN } from "@/lib/money";
import { feeTypeLabel } from "@/lib/format";

type Student = { id: string; firstName: string; lastName: string; matricNumber: string };
type Fee = {
  id: string;
  name: string;
  type: string;
  amountKobo: number;
  code: string;
};

export function InvoiceForm({
  students,
  fees,
  defaultStudentId,
}: {
  students: Student[];
  fees: Fee[];
  defaultStudentId?: string;
}) {
  const [state, action] = useActionState(createInvoiceAction, null);

  return (
    <form action={action} className="space-y-6">
      {state?.error && <Flash error={state.error} />}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="label" htmlFor="studentId">Student</label>
          <select id="studentId" name="studentId" className="input" required defaultValue={defaultStudentId ?? ""}>
            <option value="">Select student</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.lastName}, {s.firstName} · {s.matricNumber}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="session">Session</label>
          <input id="session" name="session" className="input" defaultValue="2025/2026" required />
        </div>
        <div>
          <label className="label" htmlFor="semester">Semester</label>
          <select id="semester" name="semester" className="input" defaultValue="First">
            <option>First</option>
            <option>Second</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="dueDate">Due date</label>
          <input id="dueDate" name="dueDate" type="date" className="input" defaultValue="2026-10-31" />
        </div>
        <div>
          <label className="label" htmlFor="notes">Notes</label>
          <input id="notes" name="notes" className="input" placeholder="Optional" />
        </div>
      </div>

      <fieldset>
        <legend className="label">Fee items</legend>
        <div className="divide-y divide-forest-100 rounded-xl border border-forest-100 dark:divide-forest-800 dark:border-forest-800">
          {fees.map((f) => (
            <label key={f.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-forest-50 dark:hover:bg-forest-800/40">
              <input type="checkbox" name="feeItemId" value={f.id} className="h-4 w-4 accent-forest-900" />
              <span className="flex-1 text-sm">
                <span className="font-medium">{f.name}</span>
                <span className="ml-2 text-xs text-forest-500">
                  {f.code} · {feeTypeLabel(f.type)}
                </span>
              </span>
              <span className="text-sm font-medium">{formatNGN(f.amountKobo)}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <SubmitButton>Issue invoice</SubmitButton>
    </form>
  );
}
