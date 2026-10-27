import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Compass,
  House,
  Search,
  ShieldCheck,
} from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07130f] px-5 py-16 text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-teal-500/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        {/* Brand */}
        <Link
          href="/"
          className="mb-16 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/4 px-5 py-3 backdrop-blur-xl transition hover:border-emerald-400/30 hover:bg-white/[0.07]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <Compass className="h-5 w-5" />
          </span>

          <span className="text-left">
            <span className="block text-sm font-bold tracking-wide">
              Emirate ErrandHub
            </span>
            <span className="block text-[10px] tracking-[0.2em] text-emerald-400">
              SERVICES MADE EASIER
            </span>
          </span>
        </Link>

        {/* 404 illustration */}
        <div className="relative mx-auto mb-8 flex h-64 max-w-lg items-center justify-center sm:h-72">
          <div className="absolute h-48 w-48 rounded-full border border-emerald-400/10 sm:h-56 sm:w-56" />
          <div className="absolute h-64 w-64 rounded-full border border-dashed border-emerald-400/10 sm:h-72 sm:w-72" />

          <div className="relative flex items-center justify-center">
            <span className="select-none text-[clamp(7rem,25vw,13rem)] font-black leading-none tracking-[-0.09em] text-white/6">
              404
            </span>

            <div className="absolute flex h-24 w-24 items-center justify-center rounded-[2rem] border border-emerald-400/20 bg-emerald-400/10 shadow-2xl shadow-emerald-950/50 backdrop-blur-xl sm:h-28 sm:w-28">
              <Search className="h-11 w-11 text-emerald-400 sm:h-12 sm:w-12" />
              <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#07130f] bg-emerald-400 text-[#07130f]">
                <span className="text-sm font-black">?</span>
              </span>
            </div>
          </div>

          <div className="absolute right-[14%] top-[18%] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.8)]" />
          <div className="absolute bottom-[18%] left-[15%] h-1.5 w-1.5 rounded-full bg-teal-300" />
        </div>

        {/* Message */}
        <div className="mx-auto max-w-xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Page not found
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Oops! You've taken a{" "}
            <span className="text-emerald-400">wrong turn.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-slate-400 sm:text-base">
            The page you're looking for doesn't exist, may have been moved, or
            is temporarily unavailable. Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-7 py-3 text-sm font-bold text-[#062017] shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 hover:bg-emerald-400 sm:w-auto"
            >
              <House className="h-4 w-4" />
              Back to homepage
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <button
              type="button"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/4 px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/8 sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4" />
              Go back
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-20 border-t border-white/[0.07] pt-6">
          <p className="text-xs tracking-wide text-slate-500">
            © {new Date().getFullYear()} Emirate ErrandHub.
            <span className="mx-2 text-emerald-500/50">•</span>
            Services made easier.
          </p>
        </div>
      </div>
    </main>
  );
}
