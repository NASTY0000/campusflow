"use client";

export function Flash({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;
  return (
    <div
      className={`rounded-lg px-3 py-2 text-sm ${
        error
          ? "border border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          : "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
      }`}
    >
      {error || success}
    </div>
  );
}
