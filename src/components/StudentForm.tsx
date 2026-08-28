"use client";

import { useActionState } from "react";
import { Flash } from "./Flash";
import { SubmitButton } from "./SubmitButton";

type Values = {
  matricNumber?: string;
  firstName?: string;
  lastName?: string;
  otherNames?: string | null;
  email?: string;
  phone?: string | null;
  gender?: string;
  dateOfBirth?: string;
  stateOfOrigin?: string | null;
  address?: string | null;
  programme?: string;
  faculty?: string;
  department?: string;
  level?: string;
  sessionAdmitted?: string;
  status?: string;
};

export function StudentForm({
  action,
  defaults,
  submitLabel,
}: {
  action: (
    prev: { error?: string } | null,
    formData: FormData
  ) => Promise<{ error?: string }>;
  defaults?: Values;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, null);
  const dob = defaults?.dateOfBirth?.slice(0, 10) ?? "";

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && <Flash error={state.error} />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Matric number" name="matricNumber" defaultValue={defaults?.matricNumber} required />
        <Field label="First name" name="firstName" defaultValue={defaults?.firstName} required />
        <Field label="Last name" name="lastName" defaultValue={defaults?.lastName} required />
        <Field label="Other names" name="otherNames" defaultValue={defaults?.otherNames ?? ""} />
        <Field label="Email" name="email" type="email" defaultValue={defaults?.email} required />
        <Field label="Phone" name="phone" defaultValue={defaults?.phone ?? ""} />
        <div>
          <label className="label" htmlFor="gender">Gender</label>
          <select id="gender" name="gender" className="input" defaultValue={defaults?.gender ?? "Male"} required>
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>
        <Field label="Date of birth" name="dateOfBirth" type="date" defaultValue={dob} />
        <Field label="State of origin" name="stateOfOrigin" defaultValue={defaults?.stateOfOrigin ?? ""} />
        <Field label="Programme" name="programme" defaultValue={defaults?.programme} required />
        <Field label="Faculty" name="faculty" defaultValue={defaults?.faculty} required />
        <Field label="Department" name="department" defaultValue={defaults?.department} required />
        <div>
          <label className="label" htmlFor="level">Level</label>
          <select id="level" name="level" className="input" defaultValue={defaults?.level ?? "100"} required>
            {["100", "200", "300", "400", "500"].map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <Field label="Session admitted" name="sessionAdmitted" defaultValue={defaults?.sessionAdmitted ?? "2025/2026"} required />
        <div>
          <label className="label" htmlFor="status">Status</label>
          <select id="status" name="status" className="input" defaultValue={defaults?.status ?? "ACTIVE"}>
            <option value="ACTIVE">Active</option>
            <option value="GRADUATED">Graduated</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="WITHDRAWN">Withdrawn</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="address">Address</label>
          <input id="address" name="address" className="input" defaultValue={defaults?.address ?? ""} />
        </div>
      </div>
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="input"
      />
    </div>
  );
}
