import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Clock3,
  Mail,
  MessageCircle,
  ShieldCheck,
  Users,
} from "lucide-react";

import { PublicNavbar } from "@/components/navigation/public-navbar";
import { PublicSupportForm } from "@/components/contact/public-support-form";

export const metadata: Metadata = {
  title: "Contact Us | Emirate ErrandHub",
  description:
    "Get in touch with Emirate ErrandHub for customer support, provider assistance, partnerships, and general enquiries.",
};

const supportEmail = "integritymedias@gmail.com";
const whatsappNumber = "2348130324506";

const enquiryTypes = [
  {
    title: "Customer support",
    description:
      "Need help with service requests, quotations, bookings, payments, your account, or a dispute?",
    icon: Users,
  },
  {
    title: "Service provider support",
    description:
      "Have questions about becoming a provider, verification, submitted applications, jobs, or earnings?",
    icon: BriefcaseBusiness,
  },
  {
    title: "General enquiries",
    description:
      "Interested in partnerships, business opportunities, sharing feedback, or learning more about us?",
    icon: MessageCircle,
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-white">
      <PublicNavbar />

      <section className="bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-emerald-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="mx-auto mt-10 max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
              Contact Emirate ErrandHub
            </p>

            <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
              We'd love to hear from you.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600">
              Whether you're looking for assistance, have a question about our
              services, or want to explore a partnership, our contact channels
              are open to you.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 p-7 shadow-sm sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Mail className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-950">
              Send us an email
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              For detailed enquiries, complaints, feedback, and partnership
              proposals, send us an email.
            </p>

            <a
              href={`mailto:${supportEmail}`}
              className="mt-6 inline-flex max-w-full items-center gap-2 break-all font-semibold text-emerald-800 transition hover:text-emerald-950"
            >
              {supportEmail}
              <ArrowRight className="h-4 w-4 shrink-0" />
            </a>

            <a
              href={`mailto:${supportEmail}?subject=${encodeURIComponent("Enquiry - Emirate ErrandHub")}`}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-900"
            >
              <Mail className="h-4 w-4" />
              Email Our Team
            </a>
          </div>

          <div className="rounded-3xl border border-slate-200 p-7 shadow-sm sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <MessageCircle className="h-6 w-6" />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-950">
              Chat with us on WhatsApp
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Prefer a conversation? Reach us on WhatsApp for questions about
              bookings, payments, accounts, and provider assistance.
            </p>

            <p className="mt-6 font-semibold text-slate-900">
              +234 813 032 4506
            </p>

            <a
              href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Hello Emirate ErrandHub, I would like to make an enquiry.")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-900"
            >
              <MessageCircle className="h-4 w-4" />
              Start a WhatsApp Chat
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Keep your existing Email and WhatsApp cards here. */}
        </div>
      </section>

      <PublicSupportForm />

      <section className="border-y border-slate-100 bg-slate-50">
        {/* Keep your existing How can we help section here. */}
      </section>

      <section className="border-y border-slate-100 bg-slate-50">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
              How can we help?
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950">
              We're ready to listen.
            </h2>

            <p className="mt-4 leading-7 text-slate-600">
              Choose the topic that best describes your enquiry. Our contact
              channels are available for all these needs.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {enquiryTypes.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Icon className="h-5 w-5" />
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-950">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16 sm:px-8 lg:py-20">
        <div className="rounded-3xl bg-emerald-950 px-6 py-10 text-center text-white sm:px-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-emerald-200">
            <ShieldCheck className="h-6 w-6" />
          </div>

          <h2 className="mt-5 text-2xl font-bold sm:text-3xl">
            Already have an account?
          </h2>

          <p className="mx-auto mt-3 max-w-xl leading-7 text-emerald-100/80">
            You can also use the in-platform Support Center to manage your
            support requests and communicate with our team.
          </p>

          <Link
            href="/login?next=%2Fdashboard%2Fsupport"
            className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
          >
            Visit Support Center
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-100">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm text-slate-500 sm:px-8 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Emirate ErrandHub. All rights reserved.
          </p>

          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            <Link href="/" className="transition hover:text-emerald-800">
              Home
            </Link>
            <Link
              href="/services"
              className="transition hover:text-emerald-800"
            >
              Services
            </Link>
            <Link href="/faq" className="transition hover:text-emerald-800">
              FAQs
            </Link>
            <Link href="/login" className="transition hover:text-emerald-800">
              Log in
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
