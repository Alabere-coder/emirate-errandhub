import Link from "next/link";
import { ArrowRight, Mail, MessageCircle } from "lucide-react";

const supportEmail = "integritymedias@gmail.com";
const whatsappNumber = "2348130324506";

export function ContactSection() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
        <div className="overflow-hidden rounded-3xl bg-emerald-950 px-6 py-12 text-white shadow-xl sm:px-10 lg:px-14 lg:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">
              We're here to help
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Have a question? Let's talk.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-emerald-100/80">
              Whether you need help with a service request, payment, provider
              application, or simply want to learn more about Emirate ErrandHub,
              we'd love to hear from you.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href={`mailto:${supportEmail}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-emerald-950 transition hover:bg-emerald-50"
              >
                <Mail className="h-4 w-4" />
                Email Us
              </a>

              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-900 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-800"
              >
                <MessageCircle className="h-4 w-4" />
                Chat on WhatsApp
              </a>
            </div>

            <Link
              href="/contact"
              className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-white"
            >
              More ways to contact us
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
