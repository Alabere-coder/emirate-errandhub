"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

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
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save Categories"}
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

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="worker_id" value={workerId} />

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Services You Provide</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select every category that matches the services you offer.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No active service categories are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => {
              const checked = selectedCategoryIds.includes(category.id);

              return (
                <label
                  key={category.id}
                  className="flex cursor-pointer gap-3 rounded-lg border p-4 transition hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    name="category_ids"
                    value={category.id}
                    defaultChecked={checked}
                    className="mt-1 h-4 w-4"
                  />

                  <span className="min-w-0">
                    <span className="block font-medium">{category.name}</span>

                    {category.description && (
                      <span className="mt-1 block text-sm text-muted-foreground">
                        {category.description}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
