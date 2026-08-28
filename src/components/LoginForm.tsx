"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Flash } from "./Flash";
import { SubmitButton } from "./SubmitButton";

async function wrapped(_prev: { error: string } | null, formData: FormData) {
  const result = await loginAction(formData);
  return result ?? null;
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action] = useActionState(wrapped, null);

  return (
    <form action={action} className="space-y-4">
      {state?.error && <Flash error={state.error} />}
      {nextPath && <input type="hidden" name="next" value={nextPath} />}
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className="input"
          placeholder="you@ridgeview.edu.ng"
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
        />
      </div>
      <SubmitButton className="btn-primary w-full">Sign in</SubmitButton>
    </form>
  );
}
