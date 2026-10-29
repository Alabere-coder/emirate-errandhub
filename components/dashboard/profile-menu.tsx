"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
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

type UserRole = "customer" | "worker" | "admin" | "super_admin";
type Theme = "light" | "dark" | "system";

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

  const [themeOpen, setThemeOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [theme, setTheme] = useState<Theme>("system");
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

  const profileHref =
    role === "customer"
      ? "/dashboard/customer/profile"
      : role === "worker"
        ? "/dashboard/worker/profile"
        : "/dashboard/admin/profile";

  const settingsHref =
    role === "admin" ? "/dashboard/admin/settings" : profileHref;

  useEffect(() => {
    const savedTheme = localStorage.getItem("errandhub-theme");

    if (
      savedTheme === "light" ||
      savedTheme === "dark" ||
      savedTheme === "system"
    ) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);

      root.classList.toggle("dark", dark);
    };

    applyTheme();

    if (theme !== "system") return;

    media.addEventListener("change", applyTheme);
    return () => media.removeEventListener("change", applyTheme);
  }, [theme]);

  function changeTheme(nextTheme: Theme) {
    setTheme(nextTheme);
    localStorage.setItem("errandhub-theme", nextTheme);
  }

  function closeMenu() {
    setThemeOpen(false);
  }

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

      closeMenu();
      setLogoutDialogOpen(false);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger
          className="flex h-10 items-center gap-2 rounded-xl px-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100"
          aria-label="Open account menu"
        >
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-800 text-xs font-bold text-white">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={`${firstName} ${lastName}`}
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
          className="w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          <PopoverHeader className="rounded-xl bg-slate-50 p-3">
            <PopoverTitle className="flex items-center gap-3 text-sm">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-800 text-sm font-bold text-white">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={`${firstName} ${lastName}`}
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
                <span className="block truncate">
                  {[firstName, lastName].filter(Boolean).join(" ") || "User"}
                </span>
                <span className="mt-1 block text-xs font-normal text-slate-500">
                  {getRoleLabel(role)}
                </span>
              </span>
            </PopoverTitle>
            <PopoverDescription className="sr-only">
              Account options and appearance settings
            </PopoverDescription>
          </PopoverHeader>

          <div className="my-2 h-px bg-slate-100" />

          <Link
            href={profileHref}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <UserRound className="h-4 w-4 text-slate-500" />
            <span className="flex-1">My profile</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>

          <Link
            href={settingsHref}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <Settings className="h-4 w-4 text-slate-500" />
            <span className="flex-1">Settings</span>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>

          <div>
            <button
              type="button"
              aria-expanded={themeOpen}
              onClick={() => setThemeOpen((current) => !current)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              {theme === "dark" ? (
                <Moon className="h-4 w-4 text-slate-500" />
              ) : theme === "light" ? (
                <Sun className="h-4 w-4 text-slate-500" />
              ) : (
                <Monitor className="h-4 w-4 text-slate-500" />
              )}

              <span className="flex-1 text-left">Appearance</span>
              <span className="text-xs capitalize text-slate-400">{theme}</span>
              <ChevronRight
                className={`h-4 w-4 text-slate-400 transition-transform ${
                  themeOpen ? "rotate-90" : ""
                }`}
              />
            </button>

            {themeOpen && (
              <div className="mx-2 mb-2 rounded-xl border border-slate-200 p-1">
                {(
                  [
                    { value: "light", label: "Light", icon: Sun },
                    { value: "dark", label: "Dark", icon: Moon },
                    { value: "system", label: "System default", icon: Monitor },
                  ] as const
                ).map((option) => {
                  const Icon = option.icon;
                  const selected = theme === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => changeTheme(option.value)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        selected
                          ? "bg-emerald-50 font-medium text-emerald-800"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1 text-left">{option.label}</span>
                      {selected && <Check className="h-4 w-4" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="my-2 h-px bg-slate-200" />

          <Dialog>
            <DialogTrigger
              className=""
              render={
                <Button
                  type="button"
                  className="flex w-full items-center gap-3 bg-transparent rounded-xl py-5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="flex-1 text-start">Log out</span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </Button>
              }
            ></DialogTrigger>
            <DialogContent className="sm:max-w-sm bg-white">
              <DialogHeader className="items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
                  <LogOut className="h-6 w-6 text-rose-600" />
                </div>

                <DialogTitle className="text-lg font-semibold text-slate-600">
                  Confirm logout
                </DialogTitle>

                <DialogDescription>
                  Are you sure you want to log out of your account? You will
                  need to sign in again to access your dashboard.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 flex gap-3">
                <DialogClose
                  render={
                    <button
                      type="button"
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  }
                />

                <button
                  type="button"
                  disabled={loggingOut}
                  onClick={() => void handleLogout()}
                  className="flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
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
