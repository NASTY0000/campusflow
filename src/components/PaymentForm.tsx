"use client";

import { useActionState } from "react";
import { recordPaymentAction } from "@/app/actions/finance";
import { Flash } from "./Flash";
import { SubmitButton } from "./SubmitButton";
import { koboToNaira } from "@/lib/money";

export function PaymentForm({
  invoiceId,
  outstandingKobo,
  studentFacing,
}: {
  invoiceId: string;
  outstandingKobo: number;
  studentFacing?: boolean;
}) {
  const bound = recordPaymentAction.bind(null, invoiceId);
  const [state, action] = useActionState(bound, null);
  const defaultAmount = koboToNaira(outstandingKobo).toFixed(2);

  return (
    <form action={action} className="space-y-3">
      {state?.error && <Flash error={state.error} />}
      <div>
        <label className="label" htmlFor="amount">Amount (NGN)</label>
        <input id="amount" name="amount" className="input" defaultValue={defaultAmount} required />
      </div>
      <div>
        <label className="label" htmlFor="method">Method</label>
        <select id="method" name="method" className="input" defaultValue={studentFacing ? "CARD_DEMO" : "BANK_TRANSFER_DEMO"}>
          <option value="CARD_DEMO">Card (demo gateway)</option>
          <option value="BANK_TRANSFER_DEMO">Bank transfer (demo)</option>
          {!studentFacing && <option value="CASH">Cash at bursary</option>}
          {!studentFacing && <option value="POS">POS</option>}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="notes">Note</label>
        <input id="notes" name="notes" className="input" placeholder="Optional" />
      </div>
      <p className="text-xs text-forest-500">
        Demo only — no live Paystack, Stripe, or bank connection. A receipt and ledger entries are posted immediately.
      </p>
      <SubmitButton>{studentFacing ? "Pay now (demo)" : "Record payment"}</SubmitButton>
    </form>
  );
}
