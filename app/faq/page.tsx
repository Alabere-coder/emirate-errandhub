import Link from "next/link";
import {
  ArrowRight,
  Headphones,
  MessageCircleQuestion,
  ShieldCheck,
} from "lucide-react";

import { PublicNavbar } from "@/components/navigation/public-navbar";
import { FAQList } from "@/components/faq/faq-list";

export const metadata = {
  title: "Frequently Asked Questions | Emirate ErrandHub",
  description:
    "Find answers about customer accounts, service requests, provider registration, quotations, payments, verification, and support on Emirate ErrandHub.",
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <PublicNavbar />

      <main>
        <section className="relative isolate overflow-hidden bg-linear-to-br from-emerald-950 via-emerald-900 to-slate-950 px-5 py-20 text-white sm:px-8 sm:py-24">
          <div className="absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />

          <div className="mx-auto max-w-4xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-emerald-200">
              <MessageCircleQuestion className="h-8 w-8" />
            </div>

            <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-emerald-300">
              Help and information
            </p>

            <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              Frequently asked questions
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-emerald-50/80 sm:text-lg">
              Everything you need to know about finding services, working with
              providers, managing jobs, making payments, and using Emirate
              ErrandHub.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="mb-10 grid gap-4 sm:grid-cols-2">
            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <ShieldCheck className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-bold">For customers and providers</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Find guidance for every stage of using the platform.
                </p>
              </div>
            </div>

            <div className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <MessageCircleQuestion className="h-6 w-6" />
              </div>

              <div>
                <h2 className="font-bold">Searchable answers</h2>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Search by topic or browse questions by category.
                </p>
              </div>
            </div>
          </div>

          <FAQList variant="full" />
        </section>

        <section className="bg-slate-950 px-5 py-16 text-white sm:px-8">
          <div className="mx-auto flex max-w-5xl flex-col justify-between gap-8 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-emerald-400">
                <Headphones className="h-5 w-5" />
                <span className="text-sm font-semibold">
                  Need more assistance?
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">
                We're here to help.
              </h2>

              <p className="mt-3 leading-7 text-slate-300">
                If you couldn't find the answer you need, sign in to your
                account and contact our support team.
              </p>
            </div>

            <Link
              href="/login"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-500 md:self-center"
            >
              Visit Support Center
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-lg font-extrabold">
            Emirate<span className="text-emerald-700"> ErrandHub</span>
          </Link>

          <div className="flex flex-wrap gap-5 text-sm text-slate-600">
            <Link href="/" className="hover:text-emerald-800">
              Home
            </Link>
            <Link href="/services" className="hover:text-emerald-800">
              Services
            </Link>
            <Link href="/login" className="hover:text-emerald-800">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-emerald-800">
              Create account
            </Link>
          </div>

          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Emirate ErrandHub
          </p>
        </div>
      </footer>
    </div>
  );
}
