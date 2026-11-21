"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ImagePlus, Trash2, RotateCcw } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { updateMarketingCampaign } from "../../actions";

type Campaign = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  button_text: string | null;
  button_url: string | null;
  placement: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
};

function toLocalDateTime(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function getStoragePath(url: string | null) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const prefix = "/storage/v1/object/public/marketing-banners/";

    if (!parsed.pathname.startsWith(prefix)) return null;

    return decodeURIComponent(parsed.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

const inputClasses =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500/20";

const labelClasses = "text-sm font-medium text-foreground";

export function MarketingEditForm({ campaign }: { campaign: Campaign }) {
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (image && !allowedTypes.includes(image.type)) {
      setError("Only JPEG, PNG and WebP images are allowed.");
      return;
    }

    if (image && image.size > 2 * 1024 * 1024) {
      setError("The banner image must not exceed 2 MB.");
      return;
    }

    startTransition(async () => {
      const supabase = createClient();
      const oldImagePath = getStoragePath(campaign.image_url);

      let uploadedPath: string | null = null;

      try {
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

          uploadedPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("marketing-banners")
            .upload(uploadedPath, image, {
              cacheControl: "3600",
              contentType: image.type,
              upsert: false,
            });

          if (uploadError) {
            uploadedPath = null;
            setError(uploadError.message);
            return;
          }

          const { data } = supabase.storage
            .from("marketing-banners")
            .getPublicUrl(uploadedPath);

          formData.set("image_url", data.publicUrl);
        } else if (removeImage) {
          formData.set("image_url", "");
        } else {
          formData.set("image_url", campaign.image_url ?? "");
        }

        const result = await updateMarketingCampaign(campaign.id, formData);

        if (result.error) {
          if (uploadedPath) {
            await supabase.storage
              .from("marketing-banners")
              .remove([uploadedPath]);
          }

          setError(result.error);
          return;
        }

        const newImagePath = getStoragePath(
          formData.get("image_url") as string,
        );

        if (oldImagePath && oldImagePath !== newImagePath) {
          const { error: removeError } = await supabase.storage
            .from("marketing-banners")
            .remove([oldImagePath]);

          if (removeError) {
            console.error("Old banner cleanup error:", removeError);
          }
        }

        router.push("/dashboard/admin/marketing");
        router.refresh();
      } catch (err) {
        if (uploadedPath) {
          await supabase.storage
            .from("marketing-banners")
            .remove([uploadedPath]);
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
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className={labelClasses}>
          Campaign title <span className="text-red-500">*</span>
        </label>

        <input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={campaign.title}
          placeholder="Enter campaign title"
          className={inputClasses}
        />
        <p className="text-xs text-muted-foreground">
          Keep the title clear and engaging. Maximum 120 characters.
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="subtitle" className={labelClasses}>
          Subtitle
        </label>

        <textarea
          id="subtitle"
          name="subtitle"
          maxLength={250}
          rows={3}
          defaultValue={campaign.subtitle ?? ""}
          placeholder="Add a short description for your campaign"
          className={`${inputClasses} resize-y`}
        />
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="image" className={labelClasses}>
            Campaign banner image
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a new image to replace the existing banner.
          </p>
        </div>

        {campaign.image_url && !removeImage && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ImagePlus className="size-4" />
              Current banner
            </div>

            <div className="overflow-hidden rounded-lg border border-border bg-background">
              <img
                src={campaign.image_url}
                alt="Current campaign banner"
                className="max-h-56 w-full object-cover"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setRemoveImage(true);
                setImage(null);
              }}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-600 transition-colors hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            >
              <Trash2 className="size-4" />
              Remove current image
            </button>
          </div>
        )}

        {removeImage && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              The current banner will be removed when you save.
            </p>

            <button
              type="button"
              onClick={() => setRemoveImage(false)}
              className="inline-flex items-center gap-2 text-sm font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              <RotateCcw className="size-4" />
              Keep current image
            </button>
          </div>
        )}

        {image && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              New image selected
            </p>
            <p className="mt-1 break-all text-xs text-emerald-700 dark:text-emerald-400">
              {image.name}
            </p>
          </div>
        )}

        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            setImage(event.target.files?.[0] ?? null);
            setRemoveImage(false);
          }}
          className="block w-full cursor-pointer rounded-lg border border-input bg-background text-sm text-foreground file:mr-4 file:border-0 file:border-r file:border-input file:bg-muted file:px-4 file:py-2.5 file:font-medium file:text-foreground hover:file:bg-muted/70"
        />

        <p className="text-xs text-muted-foreground">
          JPEG, PNG or WebP. Maximum file size: 2 MB.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="button_text" className={labelClasses}>
            Button text
          </label>

          <input
            id="button_text"
            name="button_text"
            defaultValue={campaign.button_text ?? ""}
            placeholder="e.g. Explore Services"
            className={inputClasses}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="button_url" className={labelClasses}>
            Button link
          </label>

          <input
            id="button_url"
            name="button_url"
            defaultValue={campaign.button_url ?? ""}
            placeholder="e.g. /services"
            className={inputClasses}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="placement" className={labelClasses}>
          Display placement
        </label>

        <select
          id="placement"
          name="placement"
          defaultValue={campaign.placement}
          className={inputClasses}
        >
          <option value="homepage">Public homepage</option>
          <option value="customer_dashboard">Customer dashboard</option>
          <option value="worker_dashboard">Worker dashboard</option>
        </select>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Campaign schedule
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Choose when this campaign should start and stop displaying.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="starts_at" className={labelClasses}>
              Start date
            </label>

            <input
              id="starts_at"
              name="starts_at"
              type="datetime-local"
              defaultValue={toLocalDateTime(campaign.starts_at)}
              className={inputClasses}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="ends_at" className={labelClasses}>
              End date
            </label>

            <input
              id="ends_at"
              name="ends_at"
              type="datetime-local"
              defaultValue={toLocalDateTime(campaign.ends_at)}
              className={inputClasses}
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="sort_order" className={labelClasses}>
          Display order
        </label>

        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min="0"
          step="1"
          defaultValue={campaign.sort_order}
          className={inputClasses}
        />

        <p className="text-xs text-muted-foreground">
          Lower numbers appear before higher numbers.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            name="is_active"
            value="true"
            defaultChecked={campaign.is_active}
            className="mt-0.5 size-4 shrink-0 accent-emerald-600"
          />

          <span>
            <span className="block text-sm font-medium text-foreground">
              Activate this campaign
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              When enabled, the campaign can be displayed according to its
              placement and schedule.
            </span>
          </span>
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Saving changes..." : "Save changes"}
        </button>

        <Link
          href="/dashboard/admin/marketing"
          className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
