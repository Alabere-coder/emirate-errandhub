"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { deleteWorkerPortfolioItem } from "@/lib/actions/worker-portfolio";
import { WorkerPortfolioEditForm } from "./worker-portfolio-form";

type PortfolioItem = {
  id: string;
  title: string | null;
  description: string | null;
  imageSrc: string | null;
};

export function WorkerPortfolioItem({ item }: { item: PortfolioItem }) {
  const [editing, setEditing] = useState(false);

  return (
    <>
      <article className="overflow-hidden rounded-xl border bg-white">
        {item.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageSrc}
            alt={item.title || "Example of completed work"}
            className="h-52 w-full object-cover"
          />
        ) : (
          <div className="flex h-52 items-center justify-center bg-gray-100 text-sm text-gray-500">
            Image unavailable
          </div>
        )}

        <div className="space-y-3 p-4">
          <h3 className="font-semibold">{item.title || "Untitled project"}</h3>

          {item.description && (
            <p className="text-sm text-gray-600">{item.description}</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50"
            >
              Edit item
            </button>

            <form action={deleteWorkerPortfolioItem}>
              <input type="hidden" name="item_id" value={item.id} />
              <button
                type="submit"
                className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Delete item
              </button>
            </form>
          </div>
        </div>
      </article>

      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setEditing(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`edit-portfolio-title-${item.id}`}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2
                id={`edit-portfolio-title-${item.id}`}
                className="text-lg font-semibold"
              >
                Edit portfolio item
              </h2>

              <button
                type="button"
                onClick={() => setEditing(false)}
                aria-label="Close edit popup"
                className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <WorkerPortfolioEditForm
              item={item}
              onCancel={() => setEditing(false)}
              onSaved={() => setEditing(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
