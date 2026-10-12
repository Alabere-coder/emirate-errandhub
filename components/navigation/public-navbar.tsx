"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BriefcaseBusiness,
  Home,
  Menu,
  Search,
  X,
  Zap,
} from "lucide-react";

type PublicNavbarProps = {
  variant?: "default" | "auth";
};

const navLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore Services", href: "/services", icon: Search },
  {
    label: "Become a Provider",
    href: "/signup/worker",
    icon: BriefcaseBusiness,
  },
];

export function PublicNavbar({ variant = "default" }: PublicNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAuthPage = variant === "auth";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8"
      >
        {/* Brand */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Emirate ErrandHub home"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm shadow-emerald-600/20">
            <Zap size={22} fill="currentColor" />
          </span>

          <span className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-slate-900 sm:text-lg">
              Emirate <span className="text-emerald-600">ErrandHub</span>
            </span>
            <span className="hidden text-[10px] font-medium tracking-[0.16em] text-slate-500 sm:block">
              EVERYDAY HELP, MADE EASY
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        {!isAuthPage && (
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-700"
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/login"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-emerald-700"
          >
            Log in
          </Link>

          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
          >
            Get started
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="public-mobile-menu"
          className="flex size-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div
          id="public-mobile-menu"
          className="border-t border-slate-200 bg-white px-4 py-4 shadow-lg md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {!isAuthPage &&
              navLinks.map((link) => {
                const Icon = link.icon;

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <Icon size={18} />
                    {link.label}
                  </Link>
                );
              })}

            <div className="my-2 border-t border-slate-100" />

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Log in
            </Link>

            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              Get started
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
