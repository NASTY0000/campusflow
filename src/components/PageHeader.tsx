"use client";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-600 dark:text-gold-400">
            {eyebrow}
          </div>
        )}
        <h1 className="font-display text-3xl text-forest-950 dark:text-paper-50">{title}</h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-forest-600 dark:text-forest-300">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
