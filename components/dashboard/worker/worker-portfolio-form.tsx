"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  addWorkerPortfolioItem,
  editWorkerPortfolioItem,
  type WorkerPortfolioActionState,
} from "@/lib/actions/worker-portfolio";

const initialState: WorkerPortfolioActionState = {};

function SubmitButton({ editing = false }: { editing?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
    >
      {pending
        ? editing
          ? "Saving changes..."
          : "Uploading..."
        : editing
          ? "Save changes"
          : "Add portfolio item"}
    </button>
  );
}

export function WorkerPortfolioForm() {
  const [state, formAction] = useActionState(
    addWorkerPortfolioItem,
    initialState,
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border p-5">
      <div>
        <h2 className="text-lg font-semibold">Add your work</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a photo that demonstrates your skills or a completed project.
        </p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="portfolio-title" className="text-sm font-medium">
          Project title
        </label>
        <input
          id="portfolio-title"
          name="title"
          maxLength={100}
          placeholder="e.g. Kitchen cabinet installation"
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="portfolio-description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="portfolio-description"
          name="description"
          rows={3}
          maxLength={1000}
          placeholder="Briefly describe the work you completed."
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="portfolio-image" className="text-sm font-medium">
          Project image
        </label>
        <input
          id="portfolio-image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="block w-full text-sm"
        />
        <p className="text-xs text-muted-foreground">
          JPG, PNG, or WebP. Maximum size: 5 MB.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-green-700">
          {state.success}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}

type PortfolioEditItem = {
  id: string;
  title: string | null;
  description: string | null;
  imageSrc: string | null;
};

export function WorkerPortfolioEditForm({
  item,
  onCancel,
  onSaved,
}: {
  item: PortfolioEditItem;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [state, formAction] = useActionState(
    editWorkerPortfolioItem,
    initialState,
  );

  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      onSaved();
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="item_id" value={item.id} />

      <div className="space-y-1">
        <label
          htmlFor={`edit-title-${item.id}`}
          className="text-sm font-medium"
        >
          Project title
        </label>
        <input
          id={`edit-title-${item.id}`}
          name="title"
          defaultValue={item.title ?? ""}
          maxLength={100}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`edit-description-${item.id}`}
          className="text-sm font-medium"
        >
          Description
        </label>
        <textarea
          id={`edit-description-${item.id}`}
          name="description"
          defaultValue={item.description ?? ""}
          rows={3}
          maxLength={1000}
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={`edit-image-${item.id}`}
          className="text-sm font-medium"
        >
          Replace image (optional)
        </label>
        <input
          id={`edit-image-${item.id}`}
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="block w-full text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Leave empty to keep the current image. JPG, PNG, or WebP; maximum 5
          MB.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-green-700">
          {state.success}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <SubmitButton editing />
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
