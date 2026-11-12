"use client";

import Link from "next/link";
import { Headphones } from "lucide-react";

type SupportButtonProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function SupportButton({
  href = "/dashboard/support",
  label = "Support",
  className = "",
}: SupportButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`fixed bottom-5 right-5 z-30 inline-flex items-center gap-2.5 rounded-full bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:-translate-y-1 hover:bg-emerald-800 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/30 sm:bottom-7 sm:right-7 ${className}`}
    >
      <Headphones className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
