"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { logIn, type LoginState } from "./actions";
import { PublicNavbar } from "@/components/navigation/public-navbar";

const initialState: LoginState = {};

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(logIn, initialState);
  const [showPassword, setShowPassword] = useState(false);

  const error = searchParams.get("error");

  return (
    <main className="relative isolate flex min-h-screen flex-col overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-115 bg-linear-to-b from-emerald-100/70 via-emerald-50/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-24 -z-10 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-80 -z-10 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl"
      />

      {/* Brand header */}
      {/* <header className="mx-auto flex w-full max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md shadow-emerald-900/15 transition group-hover:scale-105">
            <Zap className="h-5 w-5 fill-current" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900">
            Emirate <span className="text-emerald-700">ErrandHub</span>
          </span>
        </Link>

        <Link
          href="/signup"
          className="text-sm font-semibold text-slate-600 transition hover:text-emerald-800"
        >
          Create account
        </Link>
      </header> */}
      <PublicNavbar />

      {/* Login content */}
      <div className="mx-auto my-auto w-full max-w-md py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-700 shadow-sm shadow-emerald-900/5">
            <ShieldCheck className="h-8 w-8" strokeWidth={1.7} />
          </div>

          <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            <Sparkles className="h-3.5 w-3.5" />
            YOUR ERRANDHUB ACCOUNT
          </span>

          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Welcome back
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-600">
            Sign in to manage your service requests, connect with professionals,
            and keep everything moving.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="h-1.5 bg-linear-to-r from-emerald-600 via-teal-500 to-emerald-300" />

          <div className="p-6 sm:p-8">
            <div className="mb-7">
              <h2 className="text-lg font-bold text-slate-900">
                Sign in to your account
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Enter your email and password to continue.
              </p>
            </div>

            {/* Authentication callback errors */}
            {error === "missing_code" && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-700"
              >
                The confirmation link is missing or invalid. Please request a
                new confirmation email if necessary.
              </div>
            )}

            {error === "auth_callback_failed" && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-700"
              >
                We could not complete your email confirmation. Please try again.
              </div>
            )}

            {error === "account_deactivated" && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm leading-6 text-amber-800"
              >
                Your account has been deactivated. Please contact support for
                assistance.
              </div>
            )}

            {state.error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-700"
              >
                {state.error}
              </div>
            )}

            <form action={formAction} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={inputClassName}
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Password
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-xs font-semibold text-emerald-800 underline-offset-4 transition hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`${inputClassName} pr-12`}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing you in...
                  </>
                ) : (
                  <>
                    Sign in to ErrandHub
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-600">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-emerald-800 underline-offset-4 hover:underline"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Email confirmation reminder */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm shadow-slate-900/2">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <MailCheck className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                New to ErrandHub?
              </h3>
              <p className="mt-1 text-xs leading-6 text-slate-500">
                If you just registered, check your inbox and confirm your email
                address before signing in.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-7 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Emirate ErrandHub. All rights reserved.
        </p>
      </div>
    </main>
  );
}
