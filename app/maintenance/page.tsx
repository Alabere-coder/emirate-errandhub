"use client";

import Link from "next/link";
import { Construction, RefreshCw } from "lucide-react";

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700">
          <Construction className="size-8" />
        </div>

        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Emirate ErrandHub
        </p>

        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          We’ll be back shortly
        </h1>

        <p className="mt-4 leading-7 text-muted-foreground">
          We’re carrying out some improvements to make your experience better.
          Our platform is temporarily unavailable. Please check back shortly.
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-700 px-5 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
        >
          <RefreshCw className="size-4" />
          Try again
        </button>

        <p className="mt-8 text-xs text-muted-foreground">
          Thank you for your patience.
        </p>
      </div>
    </main>
  );
}
