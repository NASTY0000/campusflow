"use client";

import { useActionState } from "react";
import { createFeeItemAction } from "@/app/actions/finance";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";

export function FeeForm() {
  const [state, action] = useActionState(createFeeItemAction, null);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {state?.error && (
        <div className="sm:col-span-3 lg:col-span-6">
          <Flash error={state.error} />
        </div>
      )}
      <input name="code" className="input" placeholder="Code" required />
      <input name="name" className="input sm:col-span-2" placeholder="Name" required />
      <select name="type" className="input" required defaultValue="TUITION">
        <option value="TUITION">Tuition</option>
        <option value="ACCEPTANCE">Acceptance</option>
        <option value="HOSTEL">Hostel</option>
        <option value="DEPARTMENTAL">Departmental levy</option>
        <option value="ID_CARD">ID card</option>
      </select>
      <input name="amount" className="input" placeholder="Amount (NGN)" required />
      <input name="session" className="input" placeholder="Session e.g. 2025/2026" />
      <input name="level" className="input" placeholder="Level" />
      <input name="programme" className="input sm:col-span-2" placeholder="Programme (optional)" />
      <input name="description" className="input sm:col-span-2" placeholder="Description" />
      <SubmitButton>Add fee</SubmitButton>
    </form>
  );
}
