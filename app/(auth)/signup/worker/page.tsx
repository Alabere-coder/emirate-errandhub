"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import { signUp, type SignUpState } from "../actions";
import { PublicNavbar } from "@/components/navigation/public-navbar";

const initialState: SignUpState = {};

const inputClassName =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10";

export default function WorkerSignupPage() {
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (state.success) {
    return (
      <main className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-linear-to-b from-emerald-100/70 to-transparent"
        />

        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-3"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/15">
              <Zap className="h-6 w-6 fill-current" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Emirate <span className="text-emerald-700">ErrandHub</span>
            </span>
          </Link>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-900/5 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-700" />
            </div>

            <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              One step closer
            </span>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
              Check your email
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-600">
              Your registration was submitted successfully. We sent a
              confirmation link to your email address.
            </p>

            <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                <p className="text-sm leading-6 text-slate-600">
                  Open the email and follow the confirmation link before signing
                  in. If you can&apos;t find it, check your spam folder.
                </p>
              </div>
            </div>

            <Link
              href="/login"
              className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/20"
            >
              Continue to sign in
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/"
              className="mt-5 inline-block text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              Back to home
            </Link>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Emirate ErrandHub
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-slate-50 px-4 py-8 sm:px-6 sm:py-10">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-105 bg-linear-to-b from-emerald-100/70 via-emerald-50/40 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-20 -z-10 h-72 w-72 rounded-full bg-emerald-200/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-80 -z-10 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl"
      />

      {/* Brand header */}

      <PublicNavbar />

      {/* Signup form */}
      <div className="mx-auto w-full max-w-2xl py-10 sm:py-14">
        <div className="mb-8 text-center">
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Grow your business with{" "}
            <span className="text-emerald-700">ErrandHub</span>
          </h1>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-600 sm:text-base">
            Create your provider account to connect with customers, showcase
            your skills, and discover new opportunities.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5">
          <div className="h-1.5 bg-linear-to-r from-emerald-600 via-teal-500 to-emerald-300" />

          <div className="p-6 sm:p-9">
            <div className="mb-7 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Create your provider account
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Enter your details to get started.
                </p>
              </div>
            </div>

            {state.error && (
              <div
                role="alert"
                className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-700"
              >
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold">
                  !
                </span>
                <p>{state.error}</p>
              </div>
            )}

            <form action={formAction} className="space-y-5">
              <input type="hidden" name="role" value="worker" />

              <div>
                <h3 className="mb-4 text-sm font-semibold text-slate-800">
                  Personal information
                </h3>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      First name <span className="text-emerald-700">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      autoComplete="given-name"
                      placeholder="e.g. John"
                      className={inputClassName}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Last name <span className="text-emerald-700">*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      autoComplete="family-name"
                      placeholder="e.g. Doe"
                      className={inputClassName}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Phone number{" "}
                  <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+234 800 000 0000"
                  className={inputClassName}
                />
              </div>

              <div className="border-t border-slate-100 pt-5">
                <h3 className="mb-4 text-sm font-semibold text-slate-800">
                  Login details
                </h3>

                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Email address <span className="text-emerald-700">*</span>
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
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      Use an email address you can access to confirm your
                      account.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Password <span className="text-emerald-700">*</span>
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
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
                    <p className="mt-2 text-xs text-slate-500">
                      Use at least 8 characters.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-medium text-slate-700"
                    >
                      Confirm password{" "}
                      <span className="text-emerald-700">*</span>
                    </label>

                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Enter your password again"
                        className={`${inputClassName} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword((value) => !value)
                        }
                        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600"
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirm password"
                            : "Show confirm password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <p className="text-xs leading-6 text-slate-600">
                    Your account details are used to set up your ErrandHub
                    profile. You&apos;ll need to confirm your email before
                    signing in.
                  </p>
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
                    Creating your account...
                  </>
                ) : (
                  <>
                    Create provider account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-5 text-slate-500">
                By creating an account, you agree to use ErrandHub responsibly
                and provide accurate information.
              </p>
            </form>

            <div className="mt-7 border-t border-slate-100 pt-6 text-center">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-800 underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
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
