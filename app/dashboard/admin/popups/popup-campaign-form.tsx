"use client";

import { useState, useTransition } from "react";
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

export function PopupCampaignForm({ campaign }: PopupCampaignFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(campaign);

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
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="title" className="text-sm font-medium">
          Popup title *
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={120}
          defaultValue={campaign?.title ?? ""}
          placeholder="e.g. Welcome to Emirate ErrandHub"
          className="w-full rounded-lg border bg-background px-3 py-2"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={1000}
          rows={4}
          defaultValue={campaign?.description ?? ""}
          placeholder="Write your welcome message or announcement..."
          className="w-full rounded-lg border bg-background px-3 py-2"
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="image" className="text-sm font-medium">
          Popup image
        </label>

        {campaign?.image_url && !removeImage && (
          <div className="space-y-2">
            <img
              src={campaign.image_url}
              alt="Current popup"
              className="max-h-56 w-full rounded-xl border object-cover"
            />

            <label className="flex items-center gap-2 text-sm text-red-600">
              <input
                type="checkbox"
                checked={removeImage}
                onChange={(event) => setRemoveImage(event.target.checked)}
                className="size-4"
              />
              Remove current image
            </label>
          </div>
        )}

        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            setImage(event.target.files?.[0] ?? null);
            if (event.target.files?.[0]) setRemoveImage(false);
          }}
          className="block w-full text-sm"
        />

        <p className="text-xs text-muted-foreground">
          JPEG, PNG or WebP. Maximum size: 5 MB. Selecting a new image replaces
          the current image when you save.
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
            maxLength={50}
            defaultValue={campaign?.button_text ?? ""}
            placeholder="e.g. Explore Services"
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="button_url" className="text-sm font-medium">
            Button link
          </label>
          <input
            id="button_url"
            name="button_url"
            defaultValue={campaign?.button_url ?? ""}
            placeholder="/services or https://..."
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="audience" className="text-sm font-medium">
          Who should see this popup? *
        </label>
        <select
          id="audience"
          name="audience"
          required
          defaultValue={campaign?.audience ?? "everyone"}
          className="w-full rounded-lg border bg-background px-3 py-2"
        >
          <option value="everyone">Everyone</option>
          <option value="visitors">Visitors who are not signed in</option>
          <option value="customers">Signed-in customers</option>
          <option value="workers">Signed-in workers</option>
        </select>
      </div>

      <div className="space-y-2">
        <label htmlFor="frequency" className="text-sm font-medium">
          Display frequency *
        </label>
        <select
          id="frequency"
          name="frequency"
          required
          defaultValue={campaign?.frequency ?? "once_per_visitor"}
          className="w-full rounded-lg border bg-background px-3 py-2"
        >
          <option value="once_per_visitor">Once per visitor</option>
          <option value="once_per_session">Once per browser session</option>
          <option value="every_visit">Every visit</option>
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
            defaultValue={toDateTimeLocal(campaign?.starts_at ?? null)}
            className="w-full rounded-lg border bg-background px-3 py-2"
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
            defaultValue={toDateTimeLocal(campaign?.ends_at ?? null)}
            className="w-full rounded-lg border bg-background px-3 py-2"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="priority" className="text-sm font-medium">
          Display priority
        </label>
        <input
          id="priority"
          name="priority"
          type="number"
          min="0"
          step="1"
          defaultValue={campaign?.priority ?? 0}
          className="w-full rounded-lg border bg-background px-3 py-2"
        />
        <p className="text-xs text-muted-foreground">
          Lower numbers are shown first when multiple popups are eligible.
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="is_active"
          value="true"
          defaultChecked={campaign?.is_active ?? false}
          className="size-4"
        />
        Activate this popup
      </label>

      <div className="flex flex-wrap gap-3 border-t pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
          className="rounded-lg border px-5 py-2.5 text-sm font-medium"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
