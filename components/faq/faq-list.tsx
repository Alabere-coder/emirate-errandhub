"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ChevronDown, Search } from "lucide-react";

import { faqCategories, faqItems, type FAQCategory } from "./faq-content";

type FAQListProps = {
  variant?: "full" | "preview";
};

export function FAQList({ variant = "full" }: FAQListProps) {
  const [activeCategory, setActiveCategory] = useState<FAQCategory | "All">(
    "All",
  );

  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isPreview = variant === "preview";

  const filteredFAQs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return faqItems.filter((item) => {
      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      const matchesSearch =
        !normalizedSearch ||
        item.question.toLowerCase().includes(normalizedSearch) ||
        item.answer.toLowerCase().includes(normalizedSearch) ||
        item.category.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, search]);

  const displayedFAQs = isPreview ? filteredFAQs.slice(0, 6) : filteredFAQs;

  return (
    <div>
      {!isPreview && (
        <div className="mx-auto max-w-2xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search questions or topics..."
              aria-label="Search frequently asked questions"
              className="h-14 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory("All")}
          aria-pressed={activeCategory === "All"}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            activeCategory === "All"
              ? "bg-emerald-700 text-white"
              : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800"
          }`}
        >
          All questions
        </button>

        {faqCategories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            aria-pressed={activeCategory === category}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeCategory === category
                ? "bg-emerald-700 text-white"
                : "border border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:text-emerald-800"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="mt-8 space-y-3">
        {displayedFAQs.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={`overflow-hidden rounded-2xl border transition ${
                isExpanded
                  ? "border-emerald-200 bg-emerald-50/40"
                  : "border-slate-200 bg-white hover:border-emerald-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                aria-expanded={isExpanded}
                aria-controls={`faq-answer-${item.id}`}
                className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left sm:px-6"
              >
                <span className="font-semibold leading-6 text-slate-900">
                  {item.question}
                </span>

                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                    isExpanded
                      ? "rotate-180 bg-emerald-100 text-emerald-800"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <ChevronDown className="h-5 w-5" />
                </span>
              </button>

              {isExpanded && (
                <div
                  id={`faq-answer-${item.id}`}
                  className="border-t border-emerald-100 px-5 pb-5 pt-4 sm:px-6"
                >
                  <p className="text-sm leading-7 text-slate-600">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {displayedFAQs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-slate-400" />

            <h3 className="mt-4 font-bold text-slate-900">
              No matching questions
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Try another search term or choose a different category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveCategory("All");
              }}
              className="mt-4 text-sm font-semibold text-emerald-800 hover:text-emerald-950"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {isPreview && (
        <div className="mt-8 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-semibold text-white transition hover:bg-emerald-800"
          >
            View all FAQs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {!isPreview && (
        <p className="mt-5 text-center text-sm text-slate-500">
          Showing {displayedFAQs.length} of {filteredFAQs.length} matching
          questions.
        </p>
      )}
    </div>
  );
}
