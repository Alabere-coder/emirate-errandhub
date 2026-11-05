"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Campaign title *
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={campaign.title}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="subtitle" className="text-sm font-medium">
          Subtitle
        </label>
        <textarea
          id="subtitle"
          name="subtitle"
          maxLength={250}
          rows={3}
          defaultValue={campaign.subtitle ?? ""}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="image" className="text-sm font-medium">
          Replace banner image
        </label>

        {campaign.image_url && !removeImage && (
          <div className="space-y-2">
            <img
              src={campaign.image_url}
              alt="Current campaign banner"
              className="max-h-48 w-full rounded-lg border object-cover"
            />

            <button
              type="button"
              onClick={() => {
                setRemoveImage(true);
                setImage(null);
              }}
              className="text-sm text-red-600 hover:underline"
            >
              Remove current image
            </button>
          </div>
        )}

        {removeImage && (
          <button
            type="button"
            onClick={() => setRemoveImage(false)}
            className="text-sm text-emerald-700 hover:underline"
          >
            Keep current image
          </button>
        )}

        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            setImage(event.target.files?.[0] ?? null);
            setRemoveImage(false);
          }}
          className="block w-full text-sm"
        />

        <p className="text-xs text-muted-foreground">
          JPEG, PNG or WebP. Maximum size: 2 MB.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="button_text" className="text-sm font-medium">
            Button text
          </label>
          <input
            id="button_text"
            name="button_text"
            defaultValue={campaign.button_text ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="button_url" className="text-sm font-medium">
            Button link
          </label>
          <input
            id="button_url"
            name="button_url"
            defaultValue={campaign.button_url ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="placement" className="text-sm font-medium">
          Display placement
        </label>
        <select
          id="placement"
          name="placement"
          defaultValue={campaign.placement}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="homepage">Public homepage</option>
          <option value="customer_dashboard">Customer dashboard</option>
          <option value="worker_dashboard">Worker dashboard</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="starts_at" className="text-sm font-medium">
            Start date
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            defaultValue={toLocalDateTime(campaign.starts_at)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ends_at" className="text-sm font-medium">
            End date
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
            defaultValue={toLocalDateTime(campaign.ends_at)}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="sort_order" className="text-sm font-medium">
          Display order
        </label>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min="0"
          step="1"
          defaultValue={campaign.sort_order}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={campaign.is_active}
          className="size-4"
        />
        Activate this campaign
      </label>

      <div className="flex flex-wrap gap-3 border-t pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Saving changes..." : "Save changes"}
        </button>

        <Link
          href="/dashboard/admin/marketing"
          className="rounded-lg border px-5 py-2.5 text-sm font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
