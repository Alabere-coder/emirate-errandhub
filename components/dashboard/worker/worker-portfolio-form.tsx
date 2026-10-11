"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  addWorkerPortfolioItem,
  editWorkerPortfolioItem,
  type WorkerPortfolioActionState,
} from "@/lib/actions/worker-portfolio";
import {
  AlertCircle,
  CheckCircle2,
  FileImage,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Save,
  Upload,
  X,
} from "lucide-react";

const initialState: WorkerPortfolioActionState = {};

function SubmitButton({ editing = false }: { editing?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          {editing ? "Saving changes..." : "Uploading..."}
        </>
      ) : editing ? (
        <>
          <Save className="size-4" />
          Save changes
        </>
      ) : (
        <>
          <Upload className="size-4" />
          Add portfolio item
        </>
      )}
    </button>
  );
}

function FormFeedback({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  if (!error && !success) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
        error
          ? "border-destructive/20 bg-destructive/5 text-destructive"
          : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
      }`}
    >
      {error ? (
        <AlertCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      )}
      <p className="leading-5">{error || success}</p>
    </div>
  );
}

function FieldLabel({
  htmlFor,
  children,
  optional = false,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex items-center justify-between gap-3 text-sm font-semibold"
    >
      <span>{children}</span>
      {optional && (
        <span className="text-xs font-normal text-muted-foreground">
          Optional
        </span>
      )}
    </label>
  );
}

const inputClasses =
  "w-full rounded-xl border border-input bg-background px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

const fileInputClasses =
  "block w-full cursor-pointer rounded-xl border border-dashed border-input bg-muted/20 text-sm text-muted-foreground transition-colors file:mr-4 file:border-0 file:border-r file:border-input file:bg-muted file:px-4 file:py-3 file:text-sm file:font-semibold file:text-foreground hover:bg-muted/40";

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
    <form
      action={formAction}
      className="overflow-hidden rounded-2xl border bg-card shadow-sm"
    >
      <div className="border-b bg-muted/20 px-5 py-5 sm:px-6">
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border bg-background text-primary shadow-sm">
            <ImagePlus className="size-6" />
          </div>

          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight sm:text-xl">
              Showcase your work
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Add a completed project to help customers understand your skills
              and the quality of your work.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <div className="space-y-2">
          <FieldLabel htmlFor="portfolio-title">Project title</FieldLabel>
          <input
            id="portfolio-title"
            name="title"
            maxLength={100}
            placeholder="e.g. Kitchen cabinet installation"
            className={inputClasses}
          />
          <p className="text-xs text-muted-foreground">
            Give your project a clear, descriptive name.
          </p>
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="portfolio-description" optional>
            Project description
          </FieldLabel>
          <textarea
            id="portfolio-description"
            name="description"
            rows={4}
            maxLength={1000}
            placeholder="Describe the work you completed, the services provided, and the result."
            className={`${inputClasses} min-h-28 resize-y`}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="portfolio-image">Project image</FieldLabel>

          <div className="rounded-2xl border border-dashed bg-muted/20 p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background">
                <FileImage className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">Upload a project photo</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Use a clear image of your completed work.
                </p>
              </div>
            </div>

            <input
              id="portfolio-image"
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required
              className={fileInputClasses}
            />

            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              Accepted formats: JPG, PNG, or WebP. Maximum file size: 5 MB.
            </p>
          </div>
        </div>

        <FormFeedback error={state.error} success={state.success} />

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted-foreground">
            Your portfolio helps customers see what you can do.
          </p>
          <SubmitButton />
        </div>
      </div>
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
  }, [state.success, router, onSaved]);

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-2xl border bg-card"
    >
      <input type="hidden" name="item_id" value={item.id} />

      <div className="flex items-start gap-3 border-b bg-muted/20 p-4 sm:p-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background text-primary">
          <Pencil className="size-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">Edit portfolio item</h3>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Update your project details or replace its image.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Close editor"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        <div className="space-y-2">
          <FieldLabel htmlFor={`edit-title-${item.id}`}>
            Project title
          </FieldLabel>
          <input
            id={`edit-title-${item.id}`}
            name="title"
            defaultValue={item.title ?? ""}
            maxLength={100}
            placeholder="Enter a project title"
            className={inputClasses}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor={`edit-description-${item.id}`} optional>
            Project description
          </FieldLabel>
          <textarea
            id={`edit-description-${item.id}`}
            name="description"
            defaultValue={item.description ?? ""}
            rows={4}
            maxLength={1000}
            placeholder="Describe the work you completed."
            className={`${inputClasses} min-h-28 resize-y`}
          />
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor={`edit-image-${item.id}`} optional>
            Replace project image
          </FieldLabel>

          <div className="rounded-2xl border border-dashed bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background">
                <FileImage className="size-5 text-primary" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold">Choose a new image</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Leave this empty to keep the current image.
                </p>
              </div>
            </div>

            <input
              id={`edit-image-${item.id}`}
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className={fileInputClasses}
            />

            <p className="mt-2 text-xs text-muted-foreground">
              JPG, PNG, or WebP. Maximum file size: 5 MB.
            </p>
          </div>
        </div>

        <FormFeedback error={state.error} success={state.success} />

        <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border bg-background px-5 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <X className="size-4" />
            Cancel
          </button>

          <SubmitButton editing />
        </div>
      </div>
    </form>
  );
}
