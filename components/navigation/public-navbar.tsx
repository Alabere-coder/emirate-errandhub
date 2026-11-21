"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  ArrowRight,
  BriefcaseBusiness,
  Home,
  Menu,
  Search,
  X,
  Zap,
} from "lucide-react";

import { usePublicBranding } from "@/components/providers/public-branding-provider";
import { ThemeSelector } from "@/components/theme/theme-selector";
import { createClient } from "@/lib/supabase/client";

type PublicNavbarProps = {
  variant?: "default" | "auth";
};

const navLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Explore Services", href: "/services", icon: Search },
  { label: "Contact", href: "/contact", icon: Search },
  {
    label: "FAQ",
    href: "/faq",
    icon: BriefcaseBusiness,
  },
];

export function PublicNavbar({ variant = "default" }: PublicNavbarProps) {
  const { platformName, platformDescription, platformLogoUrl } =
    usePublicBranding();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const pathname = usePathname();

  const isLinkActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isAuthPage = variant === "auth";

  useEffect(() => {
    const supabase = createClient();

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(Boolean(user));
      setAuthLoading(false);
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8"
      >
        {/* Brand */}
        <Link
          href="/"
          onClick={closeMobileMenu}
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${platformName} home`}
        >
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-500/10 dark:bg-emerald-400/10">
            {platformLogoUrl ? (
              <Image
                src={platformLogoUrl}
                alt={`${platformName} logo`}
                width={40}
                height={40}
                unoptimized
                className="h-full w-full object-contain"
              />
            ) : (
              <Zap
                size={22}
                fill="currentColor"
                className="text-emerald-600 dark:text-emerald-400"
              />
            )}
          </span>

          <span className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-foreground sm:text-lg">
              {platformName}
            </span>

            <span className="hidden text-[10px] font-medium tracking-[0.16em] text-muted-foreground sm:block">
              {platformDescription}
            </span>
          </span>
        </Link>

        {/* Desktop navigation */}
        {/* Desktop navigation */}
        {!isAuthPage && (
          <div className="hidden items-center gap-2 md:flex">
            {navLinks.map((link) => {
              const active = isLinkActive(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`
            relative rounded-xl px-4 py-2.5 text-sm font-semibold
            transition-all duration-200
            ${
              active
                ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }
          `}
                >
                  {link.label}

                  {active && (
                    <span className="absolute inset-x-4 -bottom-3.25 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                  )}
                </Link>
              );
            })}
          </div>
        )}

        {/* Desktop actions */}
        <div className="hidden items-center gap-3 md:flex">
          <ThemeSelector />

          {!authLoading &&
            (isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted hover:text-emerald-700 dark:hover:text-emerald-400"
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
              </>
            ))}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((open) => !open)}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileMenuOpen}
          aria-controls="public-mobile-menu"
          className="flex size-10 items-center justify-center rounded-xl border border-border text-foreground transition-colors hover:bg-muted md:hidden"
        >
          {mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </nav>

      {/* Mobile navigation */}
      {mobileMenuOpen && (
        <div
          id="public-mobile-menu"
          className="border-t border-border bg-background px-4 py-4 shadow-lg md:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {!isAuthPage &&
              navLinks.map((link) => {
                const Icon = link.icon;
                const active = isLinkActive(link.href);

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMobileMenu}
                    aria-current={active ? "page" : undefined}
                    className={`
          flex items-center gap-3 rounded-xl px-3 py-3
          text-sm font-semibold transition-all duration-200
          ${
            active
              ? "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"
              : "text-foreground hover:bg-muted"
          }
        `}
                  >
                    <Icon
                      size={18}
                      className={
                        active
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-muted-foreground"
                      }
                    />

                    {link.label}

                    {active && (
                      <span className="ml-auto size-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                    )}
                  </Link>
                );
              })}

            <div className="my-2 border-t border-border" />

            {/* Mobile appearance selector */}
            <div className="rounded-xl border border-border bg-card p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Appearance
              </p>
              <ThemeSelector showLabel />
            </div>

            {!authLoading && (
              <>
                <div className="my-2 border-t border-border" />

                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    onClick={closeMobileMenu}
                    className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    Go to Dashboard
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={closeMobileMenu}
                      className="rounded-xl px-3 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                      Log in
                    </Link>

                    <Link
                      href="/signup"
                      onClick={closeMobileMenu}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                    >
                      Get started
                      <ArrowRight size={16} />
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
