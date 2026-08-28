"use client";

import { useActionState } from "react";
import { importStudentsAction } from "@/app/actions/students";
import { Flash } from "@/components/Flash";
import { SubmitButton } from "@/components/SubmitButton";

export function ImportForm() {
  const [state, action] = useActionState(importStudentsAction, null);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Flash error={state.error} />}
      {state?.success && <Flash success={state.success} />}
      <div>
        <label className="label" htmlFor="file">
          CSV file
        </label>
        <input id="file" name="file" type="file" accept=".csv,text/csv" required className="input" />
      </div>
      <SubmitButton>Import students</SubmitButton>
    </form>
  );
}
