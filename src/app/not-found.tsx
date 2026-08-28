import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper-100 px-6 dark:bg-forest-950">
      <h1 className="font-display text-4xl">Not found</h1>
      <p className="mt-2 text-forest-600">That record is not in this institution, or the link is wrong.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to CampusFlow
      </Link>
    </div>
  );
}
