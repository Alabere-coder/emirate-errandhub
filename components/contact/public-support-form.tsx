"use client";

import Script from "next/script";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react";

import {
  submitPublicSupportEnquiry,
  type PublicSupportActionState,
} from "@/app/contact/actions";

const initialState: PublicSupportActionState = {};

const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Submitting your enquiry...
        </>
      ) : (
        <>
          <Send className="h-4 w-4" />
          Submit Enquiry
        </>
      )}
    </button>
  );
}

const inputClassName =
  "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100";

const labelClassName = "text-sm font-semibold text-slate-800";

export function PublicSupportForm() {
  const [state, formAction] = useActionState(
    submitPublicSupportEnquiry,
    initialState,
  );

  return (
    <section
      id="send-message"
      className="scroll-mt-24 border-y border-slate-100 bg-slate-50"
    >
      <div className="mx-auto max-w-4xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
            Public support
          </p>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
            Send us a message
          </h2>

          <p className="mt-4 leading-7 text-slate-600">
            Have a question, need assistance, or want to share feedback?
            Complete the form below and our team will respond to you by email.
            You do not need an account to contact us.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          {state.success ? (
            <div
              role="status"
              aria-live="polite"
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" />

                <div>
                  <h3 className="font-bold text-emerald-950">
                    Enquiry received
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-emerald-900">
                    {state.success}
                  </p>

                  {state.emailWarning && (
                    <p className="mt-3 text-sm leading-7 text-amber-800">
                      {state.emailWarning}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 text-sm font-bold text-emerald-800 underline underline-offset-4 transition hover:text-emerald-950"
              >
                Submit another enquiry
              </button>
            </div>
          ) : (
            <form action={formAction} className="space-y-6">
              {turnstileSiteKey && (
                <>
                  <Script
                    src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                    strategy="afterInteractive"
                  />

                  <div className="space-y-2">
                    <p className={labelClassName}>Security verification</p>

                    <div
                      className="cf-turnstile"
                      data-sitekey={turnstileSiteKey}
                      data-theme="light"
                    />
                  </div>
                </>
              )}

              {!turnstileSiteKey && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Security verification is not configured yet. Please try again
                  later.
                </p>
              )}
              {state.error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p>{state.error}</p>
                </div>
              )}

              {/* Honeypot field: hidden from genuine visitors. */}
              <div
                aria-hidden="true"
                className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
              >
                <label htmlFor="public-support-website">
                  Leave this field empty
                </label>
                <input
                  id="public-support-website"
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="public-support-name"
                    className={labelClassName}
                  >
                    Full name
                  </label>
                  <input
                    id="public-support-name"
                    name="fullName"
                    type="text"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="Enter your full name"
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="public-support-email"
                    className={labelClassName}
                  >
                    Email address
                  </label>
                  <input
                    id="public-support-email"
                    name="email"
                    type="email"
                    required
                    maxLength={254}
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={inputClassName}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="public-support-category"
                  className={labelClassName}
                >
                  Enquiry category
                </label>
                <select
                  id="public-support-category"
                  name="category"
                  required
                  defaultValue=""
                  className={inputClassName}
                >
                  <option value="" disabled>
                    Select a category
                  </option>
                  <option value="customer_support">Customer support</option>
                  <option value="service_provider_support">
                    Service provider support
                  </option>
                  <option value="general_enquiry">General enquiries</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="public-support-subject"
                  className={labelClassName}
                >
                  Subject
                </label>
                <input
                  id="public-support-subject"
                  name="subject"
                  type="text"
                  required
                  minLength={3}
                  maxLength={150}
                  placeholder="What is your enquiry about?"
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="public-support-message"
                  className={labelClassName}
                >
                  Your message
                </label>
                <textarea
                  id="public-support-message"
                  name="message"
                  required
                  minLength={10}
                  maxLength={5000}
                  rows={6}
                  placeholder="Write your message here..."
                  className={`${inputClassName} resize-y`}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Please provide enough detail to help our team understand your
                  enquiry.
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <p className="text-sm leading-6 text-emerald-900">
                    We'll send a confirmation to the email address you provide.
                    Our team will use that address to respond to your enquiry.
                  </p>
                </div>
              </div>

              <SubmitButton disabled={!turnstileSiteKey} />

              <p className="text-center text-xs leading-5 text-slate-500">
                By submitting this form, you agree that Emirate ErrandHub may
                use your contact details to respond to your enquiry.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
