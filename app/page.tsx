import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
} from "lucide-react";

import { PublicNavbar } from "@/components/navigation/public-navbar";
import { createClient } from "@/lib/supabase/server";

const popularServices = [
  "Cleaning services",
  "Plumbing",
  "Electrical repairs",
  "Air-conditioner repairs",
  "Delivery and pickup",
  "Moving services",
];

const steps = [
  {
    number: "01",
    title: "Tell us what you need",
    description:
      "Choose a service, describe the task, and share your preferred location and schedule.",
  },
  {
    number: "02",
    title: "Compare quotations",
    description:
      "Receive offers from service providers and choose the one that works for you.",
  },
  {
    number: "03",
    title: "Get the job done",
    description:
      "Communicate with your provider and keep track of your request through your dashboard.",
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("service_categories")
    .select("id, name, slug, description, icon")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(8);

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900">
      <PublicNavbar />

      <main>
        {/* Hero */}
        <section className="relative isolate">
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-emerald-50 via-white to-slate-50" />
          <div className="absolute -right-32 top-12 -z-10 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-2 lg:gap-16 lg:py-28">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-800 shadow-sm">
                {/* <Sparkles className="h-4 w-4" /> */}
                Everyday tasks, made easier
              </div>

              <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                Your everyday errands.
                <span className="block text-emerald-700">Taken care of.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                From home repairs to cleaning, deliveries, and daily errands,
                connect with service providers who can help you get things done.
              </p>

              <form
                action="/services"
                method="GET"
                className="mt-8 flex max-w-xl flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg shadow-slate-200/50 sm:flex-row"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
                  <Search className="h-5 w-5 shrink-0 text-slate-400" />
                  <input
                    type="search"
                    name="q"
                    placeholder="What service do you need?"
                    aria-label="Search for a service"
                    className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
                >
                  Find a service
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  Simple requests
                </span>
                <span className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  Provider verification
                </span>
              </div>

              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 font-semibold text-slate-700 transition hover:text-emerald-800"
                >
                  Create an account
                  <ArrowUpRight className="h-4 w-4" />
                </Link>

                <span className="text-slate-300">|</span>

                <Link
                  href="/signup/worker"
                  className="font-semibold text-emerald-800 transition hover:text-emerald-950"
                >
                  Become a service provider
                </Link>
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -inset-4 rounded-[2rem] bg-emerald-200/40 blur-2xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-2xl shadow-emerald-950/10 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      Your next task
                    </p>
                    <h2 className="mt-1 text-xl font-bold">
                      Sorted, without the stress.
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-800">
                    <Wrench className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-7 space-y-3">
                  {[
                    {
                      title: "Home cleaning",
                      description: "Find help for your home",
                      icon: "01",
                    },
                    {
                      title: "Plumbing repairs",
                      description: "Get help with a repair",
                      icon: "02",
                    },
                    {
                      title: "Errands and delivery",
                      description: "Get everyday tasks done",
                      icon: "03",
                    },
                  ].map((item) => (
                    <Link
                      key={item.title}
                      href="/services"
                      className="group flex items-center gap-4 rounded-2xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/60"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-emerald-800 transition group-hover:bg-emerald-100">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {item.description}
                        </p>
                      </div>
                      <ArrowUpRight className="h-5 w-5 text-slate-400 transition group-hover:text-emerald-700" />
                    </Link>
                  ))}
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <ShieldCheck className="h-5 w-5 text-emerald-700" />
                    <p className="mt-3 font-semibold">Trusted connections</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Find providers for your needs.
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <Clock3 className="h-5 w-5 text-emerald-700" />
                    <p className="mt-3 font-semibold">Your schedule</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Request a convenient time.
                    </p>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg sm:flex">
                <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
                  <Star className="h-5 w-5 fill-current" />
                </div>
                <div>
                  <p className="text-sm font-bold">Quality service</p>
                  <p className="text-xs text-slate-500">
                    Help for everyday life
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                Explore services
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                What can we help you with?
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-slate-600">
                Browse services for your home, your work, and your everyday
                needs.
              </p>
            </div>

            <Link
              href="/services"
              className="inline-flex shrink-0 items-center gap-2 font-semibold text-emerald-800 hover:text-emerald-950"
            >
              View all services
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {categories && categories.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/services/${category.slug}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 transition group-hover:bg-emerald-100">
                    <Wrench className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 font-bold">{category.name}</h3>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">
                    {category.description ||
                      "Find help from a service provider."}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    Explore service
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {popularServices.map((service) => (
                <Link
                  key={service}
                  href="/services"
                  className="flex items-center justify-between rounded-2xl border border-slate-200 p-5 font-semibold transition hover:border-emerald-300 hover:bg-emerald-50/50"
                >
                  {service}
                  <ArrowUpRight className="h-4 w-4 text-emerald-700" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* How it works */}
        <section className="bg-slate-950 text-white">
          <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
            <div className="max-w-2xl">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-400">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Getting help is straightforward.
              </h2>
              <p className="mt-4 leading-7 text-slate-300">
                From your first request to the finished job, ErrandHub helps
                keep everything organised.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="rounded-2xl border border-white/10 bg-white/4 p-7"
                >
                  <p className="text-sm font-bold tracking-widest text-emerald-400">
                    STEP {step.number}
                  </p>
                  <h3 className="mt-5 text-xl font-bold">{step.title}</h3>
                  <p className="mt-3 leading-7 text-slate-300">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Provider call to action */}
        <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="relative overflow-hidden rounded-[2rem] bg-emerald-700 px-6 py-12 text-white sm:px-12 sm:py-16 lg:px-16">
            <div className="absolute -right-12 -top-20 h-72 w-72 rounded-full border-40 border-white/10" />

            <div className="relative flex flex-col justify-between gap-8 md:flex-row md:items-center">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 text-emerald-100">
                  <Users className="h-5 w-5" />
                  <span className="text-sm font-semibold">
                    For service providers
                  </span>
                </div>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Turn your skills into opportunities.
                </h2>
                <p className="mt-4 leading-7 text-emerald-50">
                  Join ErrandHub, connect with customers who need your
                  expertise, and manage your jobs in one place.
                </p>
              </div>

              <Link
                href="/signup/worker"
                className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-6 py-3.5 font-bold text-emerald-800 transition hover:bg-emerald-50 md:self-center"
              >
                Join as a provider
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight">
            Emirate<span className="text-emerald-700"> ErrandHub</span>
          </Link>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
            <Link href="/services" className="hover:text-emerald-800">
              Services
            </Link>
            <Link href="/login" className="hover:text-emerald-800">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-emerald-800">
              Create account
            </Link>
            <Link href="/signup/worker" className="hover:text-emerald-800">
              Become a provider
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
