"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  ChevronRight,
  LogOut,
  Monitor,
  Moon,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "../ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import { ThemeSelector } from "@/components/theme/theme-selector";

type UserRole = "customer" | "worker" | "admin" | "super_admin";

type AccountDropdownProps = {
  role: UserRole;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
};

function getRoleLabel(role: UserRole) {
  switch (role) {
    case "customer":
      return "Customer";
    case "worker":
      return "Service Provider";
    case "admin":
      return "Administrator";
    case "super_admin":
      return "Super Administrator";
  }
}

export function AccountDropdown({
  role,
  firstName,
  lastName,
  avatarUrl,
}: AccountDropdownProps) {
  const router = useRouter();

  const { theme } = useTheme();

  const [loggingOut, setLoggingOut] = useState(false);

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "User";

  const profileHref =
    role === "customer"
      ? "/dashboard/customer/profile"
      : role === "worker"
        ? "/dashboard/worker/profile"
        : "/dashboard/admin/profile";

  const settingsHref =
    role === "admin" || role === "super_admin"
      ? "/dashboard/admin/settings"
      : role === "worker"
        ? "/dashboard/worker/settings"
        : role === "customer"
          ? "/dashboard/customer/settings"
          : profileHref;

  // function closeMenu() {
  //   setThemeOpen(false);
  // }

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) {
        console.error("Logout request failed:", response.status);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger
          className="flex h-10 items-center gap-2 rounded-xl px-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Open account menu"
        >
          <span className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-800 text-xs font-bold text-white">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={fullName}
                fill
                sizes="32px"
                unoptimized
                className="object-cover"
              />
            ) : (
              initials
            )}
          </span>
        </PopoverTrigger>

        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={8}
          className="w-72 rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl"
        >
          <PopoverHeader className="rounded-xl bg-muted p-3">
            <PopoverTitle className="flex items-center gap-3 text-sm">
              <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-800 text-sm font-bold text-white">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={fullName}
                    fill
                    sizes="44px"
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  initials
                )}
              </span>

              <span className="min-w-0">
                <span className="block truncate text-foreground">
                  {fullName}
                </span>

                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  {getRoleLabel(role)}
                </span>
              </span>
            </PopoverTitle>

            <PopoverDescription className="sr-only">
              Account options and appearance settings
            </PopoverDescription>
          </PopoverHeader>

          <div className="my-2 h-px bg-border" />

          <Link
            href={profileHref}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <UserRound className="size-4 text-muted-foreground" />
            <span className="flex-1">My profile</span>
            <ChevronRight className="size-4 text-muted-foreground/70" />
          </Link>

          <Link
            href={settingsHref}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <Settings className="size-4 text-muted-foreground" />
            <span className="flex-1">Settings</span>
            <ChevronRight className="size-4 text-muted-foreground/70" />
          </Link>

          {/* <div>
            <button
              type="button"
              aria-expanded={themeOpen}
              onClick={() => setThemeOpen((current) => !current)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <ThemeIcon className="size-4 text-muted-foreground" />

              <span className="flex-1 text-left">Appearance</span>

              <span className="text-xs capitalize text-muted-foreground">
                {theme}
              </span>

              <ChevronRight
                className={`size-4 text-muted-foreground/70 transition-transform ${
                  themeOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {themeOpen && (
              <div className="mx-2 mb-2 rounded-xl border border-border bg-card p-1">
                <ThemeSelector showLabel />
              </div>
            )}
          </div> */}

          <div className="px-2 py-2">
            <ThemeSelector showLabel />
          </div>

          <div className="my-2 h-px bg-border" />

          <Dialog>
            <DialogTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="flex w-full items-center gap-3 rounded-xl py-5 text-sm font-medium text-rose-600 hover:bg-rose-500/10 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-300"
                >
                  <LogOut className="size-4" />
                  <span className="flex-1 text-left">Log out</span>
                  <ChevronRight className="size-4 text-muted-foreground/70" />
                </Button>
              }
            />

            <DialogContent className="border-border bg-card text-card-foreground sm:max-w-sm">
              <DialogHeader className="items-center text-center">
                <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-rose-500/10">
                  <LogOut className="size-6 text-rose-600 dark:text-rose-400" />
                </div>

                <DialogTitle className="text-lg font-semibold">
                  Confirm logout
                </DialogTitle>

                <DialogDescription className="text-muted-foreground">
                  Are you sure you want to log out of your account? You will
                  need to sign in again to access your dashboard.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 flex gap-3">
                <DialogClose
                  render={
                    <button
                      type="button"
                      disabled={loggingOut}
                      className="flex-1 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  }
                />

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => void handleLogout()}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loggingOut ? "Logging out..." : "Yes, log out"}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </PopoverContent>
      </Popover>
    </div>
  );
}
