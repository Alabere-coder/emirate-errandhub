import Link from "next/link";
import {
  UserRound,
  BriefcaseBusiness,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
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
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-110 bg-linear-to-b from-emerald-50 via-slate-50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-16 -z-10 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-64 -z-10 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl"
      />

      {/* Brand */}
      {/* <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/15 transition group-hover:scale-105">
            <Zap className="h-6 w-6 fill-current" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
            Emirate <span className="text-emerald-700">ErrandHub</span>
          </span>
        </Link>

        <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <span>Get started in minutes</span>
        </div>
      </header> */}

      {/* Navigation */}
      <div className="mx-auto w-full max-w-6xl">
        <PublicNavbar variant="auth" />
      </div>

      {/* Main content */}
      <div className="mx-auto my-auto w-full max-w-5xl py-12 sm:py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-semibold tracking-wide text-emerald-800 shadow-sm sm:text-sm">
            YOUR EVERYDAY TASKS, SIMPLIFIED
          </span>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl md:text-5xl">
            How would you like to
            <span className="mt-1 block text-emerald-700">use ErrandHub?</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-slate-600 sm:text-base">
            Whether you need a helping hand or want to offer your expertise,
            there&apos;s a place for you here.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 md:gap-7">
          {accountTypes.map((account) => {
            const Icon = account.icon;
            const isWorker = account.theme === "worker";

            return (
              <section
                key={account.theme}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8 ${
                  isWorker
                    ? "border-emerald-200/80 hover:border-emerald-300"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-1 ${
                    isWorker
                      ? "bg-linear-to-r from-emerald-500 to-teal-300"
                      : "bg-linear-to-r from-slate-700 to-slate-400"
                  }`}
                />

                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl transition duration-300 group-hover:scale-105 ${
                      isWorker
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                        : "bg-slate-100 text-slate-800 ring-1 ring-slate-200"
                    }`}
                  >
                    <Icon className="h-7 w-7" strokeWidth={1.8} />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      isWorker
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {account.subtitle}
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-bold tracking-tight text-slate-950">
                  {account.title}
                </h2>

                <p className="mt-3 min-h-14 text-sm leading-7 text-slate-600">
                  {account.description}
                </p>

                <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
                  {account.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm text-slate-700"
                    >
                      <CheckCircle2
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          isWorker ? "text-emerald-600" : "text-slate-500"
                        }`}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={account.href}
                  className={`mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                    isWorker
                      ? "bg-emerald-700 shadow-emerald-900/10 hover:bg-emerald-800 focus-visible:ring-emerald-600"
                      : "bg-slate-900 shadow-slate-900/10 hover:bg-slate-800 focus-visible:ring-slate-700"
                  }`}
                >
                  {account.buttonText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </section>
            );
          })}
        </div>

        <p className="mt-9 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-800 underline-offset-4 transition hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Footer */}
      <footer className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 border-t border-slate-200/80 pt-6 text-center text-xs text-slate-500 sm:flex-row sm:text-left">
        <p>
          © {new Date().getFullYear()} Emirate ErrandHub. All rights reserved.
        </p>
        <p className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          Your journey starts here.
        </p>
      </footer>
    </main>
  );
}
