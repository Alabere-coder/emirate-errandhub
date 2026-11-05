"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { createMarketingCampaign } from "../actions";

export function MarketingCampaignForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      if (image.size > 2 * 1024 * 1024) {
        setError("The banner image must not exceed 2 MB.");
        return;
      }
    }

    startTransition(async () => {
      const supabase = createClient();
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

          const path = `${user.id}/${crypto.randomUUID()}.${extension}`;

          const { error: uploadError } = await supabase.storage
            .from("marketing-banners")
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

          const { data } = supabase.storage
            .from("marketing-banners")
            .getPublicUrl(path);

          formData.set("image_url", data.publicUrl);
        }

        const result = await createMarketingCampaign(formData);

        if (result.error) {
          if (uploadedPath) {
            await supabase.storage
              .from("marketing-banners")
              .remove([uploadedPath]);
          }

          setError(result.error);
          return;
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
          placeholder="e.g. Welcome to Emirate ErrandHub"
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
          placeholder="Add a short promotional message..."
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="image" className="text-sm font-medium">
          Banner image
        </label>
        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => setImage(event.target.files?.[0] ?? null)}
          className="block w-full text-sm"
        />
        <p className="text-xs text-muted-foreground">
          JPEG, PNG or WebP. Maximum size: 2 MB.
        </p>
        {image && (
          <p className="text-xs text-emerald-700">Selected: {image.name}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="button_text" className="text-sm font-medium">
            Button text
          </label>
          <input
            id="button_text"
            name="button_text"
            placeholder="e.g. Get Started"
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
            placeholder="/services or https://..."
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="placement" className="text-sm font-medium">
          Display placement *
        </label>
        <select
          id="placement"
          name="placement"
          required
          defaultValue="homepage"
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
            Start date (optional)
          </label>
          <input
            id="starts_at"
            name="starts_at"
            type="datetime-local"
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="ends_at" className="text-sm font-medium">
            End date (optional)
          </label>
          <input
            id="ends_at"
            name="ends_at"
            type="datetime-local"
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
          defaultValue="0"
          className="w-full rounded-lg border px-3 py-2"
        />
        <p className="text-xs text-muted-foreground">
          Lower numbers appear first.
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          className="size-4"
        />
        Activate this campaign
      </label>

      <div className="flex flex-wrap gap-3 border-t pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Creating campaign..." : "Create campaign"}
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
