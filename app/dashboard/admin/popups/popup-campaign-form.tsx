"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { createPopupCampaign, updatePopupCampaign } from "./actions";

type PopupCampaign = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_path: string | null;
  button_text: string | null;
  button_url: string | null;
  audience: string;
  frequency: string;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  is_active: boolean;
};

type PopupCampaignFormProps = {
  campaign?: PopupCampaign;
};

function toDateTimeLocal(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 16);
}

const fieldClassName =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-60";

const labelClassName = "text-sm font-medium text-foreground";

export function PopupCampaignForm({ campaign }: PopupCampaignFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(campaign);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    if (image) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

      if (!allowedTypes.includes(image.type)) {
        setError("Only JPEG, PNG and WebP images are allowed.");
        return;
      }

      if (image.size > 5 * 1024 * 1024) {
        setError("The popup image must not exceed 5 MB.");
        return;
      }
    }

    startTransition(async () => {
      const supabase = createClient();
      let uploadedPath: string | null = null;

      try {
        let imageUrl = removeImage ? "" : (campaign?.image_url ?? "");
        let imagePath = removeImage ? "" : (campaign?.image_path ?? "");

        if (image) {
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();

          if (authError || !user) {
            setError("Please sign in again before uploading.");
            return;
          }

          const extension =
            image.type === "image/jpeg" ? "jpg" : image.type.split("/")[1];

          const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("popup-media")
            .upload(path, image, {
              cacheControl: "3600",
              contentType: image.type,
              upsert: false,
            });

          if (uploadError) {
            setError(uploadError.message);
            return;
          }

          uploadedPath = path;
          imagePath = path;

          const { data } = supabase.storage
            .from("popup-media")
            .getPublicUrl(path);

          imageUrl = data.publicUrl;
        }

        formData.set("image_url", imageUrl);
        formData.set("image_path", imagePath);

        const result =
          isEditing && campaign
            ? await updatePopupCampaign(campaign.id, formData)
            : await createPopupCampaign(formData);

        if (result.error) {
          if (uploadedPath) {
            await supabase.storage.from("popup-media").remove([uploadedPath]);
          }

          setError(result.error);
          return;
        }

        uploadedPath = null;

        router.push("/dashboard/admin/popups");
        router.refresh();
      } catch (err) {
        if (uploadedPath) {
          await supabase.storage.from("popup-media").remove([uploadedPath]);
        }

        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong. Please try again.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-700 dark:text-red-400"
        >
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-red-500" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className={labelClassName}>
          Popup title <span className="text-red-500">*</span>
        </label>

        <input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={campaign?.title ?? ""}
          placeholder="e.g. Welcome to Emirate ErrandHub"
          className={fieldClassName}
        />
        <p className="text-xs text-muted-foreground">
          Use a short, engaging title that immediately communicates your
          message.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className={labelClassName}>
          Description
        </label>

        <textarea
          id="description"
          name="description"
          maxLength={1000}
          rows={4}
          defaultValue={campaign?.description ?? ""}
          placeholder="Write your welcome message or announcement..."
          className={`${fieldClassName} min-h-28 resize-y`}
        />

        <p className="text-xs text-muted-foreground">
          Provide the details visitors need to understand your announcement.
        </p>
      </div>

      <div className="space-y-3">
        <label htmlFor="image" className={labelClassName}>
          Popup image
        </label>

        {campaign?.image_url && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
            {!removeImage ? (
              <div className="overflow-hidden rounded-lg border border-border bg-background">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={campaign.image_url}
                  alt="Current popup"
                  className="max-h-64 w-full object-cover"
                />
              </div>
            ) : (
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-700 dark:text-amber-400">
                The current image will be removed when you save.
              </div>
            )}

            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(event) => setRemoveImage(event.target.checked)}
                className="size-4 accent-emerald-600"
              />
              Remove current image
            </label>
          </div>
        )}

        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 transition-colors hover:border-emerald-500/50">
          <input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => {
              setImage(event.target.files?.[0] ?? null);

              if (event.target.files?.[0]) {
                setRemoveImage(false);
              }
            }}
            className="block w-full cursor-pointer text-sm text-muted-foreground file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-500/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-500/20 dark:file:text-emerald-400"
          />

          <p className="mt-2 text-xs text-muted-foreground">
            JPEG, PNG or WebP. Maximum size: 5 MB. Selecting a new image
            replaces the current image when you save.
          </p>
        </div>

        {image && (
          <p className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            Selected: {image.name}
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="button_text" className={labelClassName}>
            Button text
          </label>

          <input
            id="button_text"
            name="button_text"
            maxLength={50}
            defaultValue={campaign?.button_text ?? ""}
            placeholder="e.g. Explore Services"
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="button_url" className={labelClassName}>
            Button link
          </label>

          <input
            id="button_url"
            name="button_url"
            defaultValue={campaign?.button_url ?? ""}
            placeholder="/services or https://..."
            className={fieldClassName}
          />
          <p className="text-xs text-muted-foreground">
            Use an internal path or a full HTTPS URL.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="audience" className={labelClassName}>
          Who should see this popup? <span className="text-red-500">*</span>
        </label>

        <select
          id="audience"
          name="audience"
          required
          defaultValue={campaign?.audience ?? "everyone"}
          className={fieldClassName}
        >
          <option value="everyone">Everyone</option>
          <option value="visitors">Visitors who are not signed in</option>
          <option value="customers">Signed-in customers</option>
          <option value="workers">Signed-in workers</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="frequency" className={labelClassName}>
          Display frequency <span className="text-red-500">*</span>
        </label>

        <select
          id="frequency"
          name="frequency"
          required
          defaultValue={campaign?.frequency ?? "once_per_visitor"}
          className={fieldClassName}
        >
          <option value="once_per_visitor">Once per visitor</option>
          <option value="once_per_session">Once per browser session</option>
          <option value="every_visit">Every visit</option>
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="starts_at" className={labelClassName}>
            Start date (optional)
          </label>

          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={toDateTimeLocal(campaign?.starts_at ?? null)}
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ends_at" className={labelClassName}>
            End date (optional)
          </label>

          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={toDateTimeLocal(campaign?.ends_at ?? null)}
            className={fieldClassName}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="priority" className={labelClassName}>
          Display priority
        </label>

        <input
          id="priority"
          name="priority"
          type="number"
          min="0"
          step="1"
          defaultValue={campaign?.priority ?? 0}
          className={fieldClassName}
        />

        <p className="text-xs text-muted-foreground">
          Lower numbers are shown first when multiple popups are eligible.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={campaign?.is_active ?? false}
            className="mt-0.5 size-4 shrink-0 accent-emerald-600"
          />

          <span className="space-y-1">
            <span className="block text-sm font-medium text-foreground">
              Activate this popup
            </span>
            <span className="block text-xs leading-5 text-muted-foreground">
              When enabled, this campaign can be displayed to its selected
              audience during its scheduled period.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? isEditing
              ? "Saving changes..."
              : "Creating popup..."
            : isEditing
              ? "Save changes"
              : "Create popup"}
        </button>

        <Link
          href="/dashboard/admin/popups"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
