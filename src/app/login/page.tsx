import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Crest } from "@/components/Crest";
import { LoginForm } from "@/components/LoginForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session) {
    redirect(session.role === "STUDENT" ? "/portal" : "/dashboard");
  }
  const sp = await searchParams;

  return (
    <div className="min-h-screen bg-paper-100 dark:bg-forest-950">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-forest-900 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div className="absolute inset-0 bg-grid opacity-30" />
          <div className="relative">
            <div className="flex items-center gap-3 text-gold-300">
              <Crest className="h-12 w-12" />
              <span className="font-display text-2xl text-paper-50">CampusFlow</span>
            </div>
          </div>
          <div className="relative max-w-md">
            <p className="font-display text-4xl leading-tight text-paper-50">
              Records, fees, and a clean ledger — built for West African campuses.
            </p>
            <p className="mt-4 text-forest-100">
              Ridgeview University, Lagos uses CampusFlow to keep the registry and bursary on the same
              page. Demo data only. Not affiliated with any real institution.
            </p>
          </div>
          <p className="relative text-xs text-forest-300">
            Multi-tenant · NGN · Demo payments (no live Paystack or Stripe)
          </p>
        </div>

        <div className="flex flex-col justify-center px-6 py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-start justify-between">
              <div>
                <div className="mb-3 flex items-center gap-2 lg:hidden">
                  <Crest className="h-9 w-9" />
                  <span className="font-display text-xl">CampusFlow</span>
                </div>
                <h1 className="font-display text-3xl text-forest-950 dark:text-paper-50">
                  Sign in
                </h1>
                <p className="mt-1 text-sm text-forest-600 dark:text-forest-300">
                  Staff and student portal for your institution.
                </p>
              </div>
              <ThemeToggle />
            </div>
            <div className="card p-6">
              <LoginForm nextPath={sp.next} />
            </div>
            <div className="mt-6 rounded-2xl border border-dashed border-forest-200 p-4 text-sm dark:border-forest-700">
              <div className="mb-2 text-xs font-semibold tracking-wide text-forest-500">
                <span className="uppercase">Demo accounts · password</span>{" "}
                <code className="normal-case text-forest-900 dark:text-gold-300">CampusFlow!2026</code>
              </div>
              <ul className="space-y-1 text-forest-700 dark:text-forest-200">
                <li>admin@ridgeview.edu.ng — Administrator</li>
                <li>registrar@ridgeview.edu.ng — Registrar</li>
                <li>finance@ridgeview.edu.ng — Bursary</li>
                <li>adebayo.chukwuemeka@student.ridgeview.edu.ng — Student (paid)</li>
                <li>fatima.abdullahi@student.ridgeview.edu.ng — Student (unpaid)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
