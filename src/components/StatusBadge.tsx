"use client";

import { invoiceStatusLabel } from "@/lib/format";

const styles: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  PARTIAL: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200",
  ISSUED: "bg-sky-100 text-sky-900 dark:bg-sky-900/40 dark:text-sky-200",
  VOID: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  ACTIVE: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  ENROLLED: "bg-forest-100 text-forest-900 dark:bg-forest-800 dark:text-gold-200",
  SUCCESS: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200",
  FAILED: "bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200",
  GRADUATED: "bg-gold-100 text-gold-900 dark:bg-gold-900/40 dark:text-gold-200",
  SUSPENDED: "bg-red-100 text-red-900",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-forest-100 text-forest-800 dark:bg-forest-800 dark:text-paper-100"
      }`}
    >
      {invoiceStatusLabel(status)}
    </span>
  );
}
