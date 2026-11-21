import Link from "next/link";
import {
  UserRound,
  BriefcaseBusiness,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

import { PublicNavbar } from "@/components/navigation/public-navbar";

const accountTypes = [
  {
    title: "I need a service",
    subtitle: "For customers",
    description:
      "Get help with everyday tasks from trusted professionals in your area.",
    features: [
      "Browse available services",
      "Compare quotes from professionals",
      "Track your requests in one place",
    ],
    href: "/signup/customer",
    buttonText: "Create customer account",
    icon: UserRound,
    theme: "customer",
  },
  {
    title: "I offer services",
    subtitle: "For service providers",
    description:
      "Showcase your skills, connect with customers, and grow your service business.",
    features: [
      "Receive customer requests",
      "Submit quotes for jobs",
      "Build your professional reputation",
    ],
    href: "/signup/worker",
    buttonText: "Join as a provider",
    icon: BriefcaseBusiness,
    theme: "worker",
  },
];

export default function SignupPage() {
  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background px-4 py-2 sm:px-6 sm:py-10">
      {/* Navigation */}
      <PublicNavbar />

      {/* Main content */}
      <div className="mx-auto my-auto w-full max-w-5xl py-8 sm:py-16">
        {/* Page heading */}
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            How would you like to
            <span className="mt-1 block text-emerald-600 dark:text-emerald-400">
              use ErrandHub?
            </span>
          </h1>

          <p className="mx-auto mt-5 hidden max-w-xl text-sm leading-7 text-muted-foreground sm:block sm:text-base">
            Whether you need a helping hand or want to offer your expertise,
            there&apos;s a place for you here.
          </p>
        </div>

        {/* Account type cards */}
        <div className="grid gap-6 md:grid-cols-2 md:gap-7">
          {accountTypes.map((account) => {
            const Icon = account.icon;
            const isWorker = account.theme === "worker";

            return (
              <section
                key={account.theme}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-card p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8 ${
                  isWorker
                    ? "border-emerald-200/80 hover:border-emerald-400 dark:border-emerald-900/70 dark:hover:border-emerald-700"
                    : "border-border hover:border-slate-300 dark:hover:border-slate-600"
                }`}
              >
                {/* Card accent */}
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-1 ${
                    isWorker
                      ? "bg-linear-to-r from-emerald-500 to-teal-300"
                      : "bg-linear-to-r from-slate-500 to-slate-300 dark:from-slate-600 dark:to-slate-400"
                  }`}
                />

                {/* Icon and category */}
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition duration-300 group-hover:scale-105 ${
                      isWorker
                        ? "bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-400 dark:ring-emerald-900/70"
                        : "bg-muted text-foreground ring-border"
                    }`}
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isWorker
                        ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {account.subtitle}
                  </span>
                </div>

                {/* Card content */}
                <h2 className="mt-6 text-2xl font-bold tracking-tight text-card-foreground">
                  {account.title}
                </h2>

                <p className="mt-3 min-h-14 text-sm leading-7 text-muted-foreground">
                  {account.description}
                </p>

                {/* Features */}
                <ul className="mt-6 space-y-3 border-t border-border pt-6">
                  {account.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-foreground"
                    >
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          isWorker
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-muted-foreground"
                        }`}
                      />

                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Action */}
                <Link
                  href={account.href}
                  className={`mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-card ${
                    isWorker
                      ? "bg-emerald-700 shadow-emerald-900/10 hover:bg-emerald-800 focus-visible:ring-emerald-600"
                      : "bg-slate-900 shadow-slate-900/10 hover:bg-slate-800 focus-visible:ring-slate-700 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white dark:focus-visible:ring-slate-400"
                  }`}
                >
                  {account.buttonText}

                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </section>
            );
          })}
        </div>

        {/* Login link */}
        <p className="mt-9 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 underline-offset-4 transition hover:text-emerald-800 hover:underline dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
