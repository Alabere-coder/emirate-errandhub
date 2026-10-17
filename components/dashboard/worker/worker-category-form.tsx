"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Layers3,
  Save,
  Wrench,
} from "lucide-react";

import {
  updateWorkerCategories,
  type WorkerCategoryActionState,
} from "@/lib/actions/worker-categories";

type Category = {
  id: string;
  name: string;
  description: string | null;
  parent_id: string | null;
};

type WorkerCategoryFormProps = {
  workerId: string;
  categories: Category[];
  selectedCategoryIds: string[];
};

const initialState: WorkerCategoryActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Saving categories...
        </>
      ) : (
        <>
          <Save className="size-4" />
          Save categories
          <ChevronRight className="size-4" />
        </>
      )}
    </button>
  );
}

export function WorkerCategoryForm({
  workerId,
  categories,
  selectedCategoryIds,
}: WorkerCategoryFormProps) {
  const [state, formAction] = useActionState(
    updateWorkerCategories,
    initialState,
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(selectedCategoryIds);

  function toggleCategory(categoryId: string, checked: boolean) {
    setSelectedIds((current) =>
      checked
        ? current.includes(categoryId)
          ? current
          : [...current, categoryId]
        : current.filter((id) => id !== categoryId),
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="worker_id" value={workerId} />

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/20 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <BriefcaseBusiness className="size-6" />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                  Services you provide
                </h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Choose the service categories that match your skills and the
                  work you offer to customers.
                </p>
              </div>
            </div>

            <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm">
              <Layers3 className="size-4 text-primary" />
              <span className="font-semibold tabular-nums">
                {selectedIds.length}
              </span>
              <span className="text-muted-foreground">selected</span>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Wrench className="size-6" />
              </div>

              <h3 className="mt-4 font-semibold">No categories available</h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                No active service categories are currently available. Please
                check again later.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => {
                const checked = selectedIds.includes(category.id);

                return (
                  <label
                    key={category.id}
                    className={`group relative flex min-h-28 cursor-pointer items-start gap-3 rounded-xl border p-4 transition duration-200 hover:border-primary/50 hover:bg-muted/30 ${
                      checked
                        ? "border-primary/60 bg-primary/4 ring-1 ring-primary/10"
                        : "border-border bg-background"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="category_ids"
                      value={category.id}
                      defaultChecked={checked}
                      onChange={(event) =>
                        toggleCategory(category.id, event.target.checked)
                      }
                      className="peer sr-only"
                    />

                    <span
                      aria-hidden="true"
                      className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition ${
                        checked
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background text-transparent group-hover:border-primary/60"
                      }`}
                    >
                      <CheckCircle2 className="size-4" />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-5 text-foreground">
                        {category.name}
                      </span>

                      {category.description && (
                        <span className="mt-1.5 block text-sm leading-5 text-muted-foreground">
                          {category.description}
                        </span>
                      )}
                    </span>

                    {checked && (
                      <CheckCircle2
                        aria-hidden="true"
                        className="size-4 shrink-0 text-primary"
                      />
                    )}

                    <span className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-primary opacity-0 transition peer-focus-visible:opacity-100" />
                  </label>
                );
              })}
            </div>
          )}

          {categories.length > 0 && (
            <div className="mt-5 flex items-start gap-2 rounded-lg bg-muted/40 px-4 py-3">
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-5 text-muted-foreground">
                Select all categories that apply. Your selections help represent
                the services you offer on Emirate ErrandHub.
              </p>
            </div>
          )}
        </div>
      </section>

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <p className="leading-6">{state.error}</p>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p className="leading-6">{state.success}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold">Ready to save your services?</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Save your selections to update your service categories.
          </p>
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}
