"use client";

import { useActionState, useEffect, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import {
  createService,
  updateService,
  type ServiceActionState,
} from "./service-actions";

import { ServiceIconPicker } from "@/components/services/service-icon-picker";

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
};

type Service = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  requires_verification: boolean;
  requires_certificate: boolean;
};

type ServiceFormProps = {
  categories: Category[];
  service?: Service | null;
  subcategory?: Category | null;
  onClose: () => void;
};

const initialState: ServiceActionState = {};

export function ServiceForm({
  categories,
  service,
  subcategory,
  onClose,
}: ServiceFormProps) {
  const editing = Boolean(service);

  const action: (
    previousState: ServiceActionState,
    formData: FormData,
  ) => Promise<ServiceActionState> = editing ? updateService : createService;

  const [state, formAction, pending] = useActionState(action, initialState);

  const [name, setName] = useState(service?.name ?? "");

  const [icon, setIcon] = useState(service?.icon ?? "Sparkles");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    service?.image_url ?? null,
  );

  const subcategories = categories.filter(
    (category) => category.parent_id !== null,
  );

  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  );

  /*
   * When adding a service from inside a subcategory row,
   * use that subcategory automatically.
   *
   * When editing a service, keep its existing category.
   */
  const selectedSubcategoryId = service?.category_id ?? subcategory?.id ?? "";

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    const objectUrl = URL.createObjectURL(selectedImage);

    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [selectedImage]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    setSelectedImage(file);

    if (!file && service?.image_url) {
      setPreviewUrl(service.image_url);
    }

    if (!file && !service?.image_url) {
      setPreviewUrl(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b   border-border px-6 py-5">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {editing ? "Edit Service" : "Create Service"}
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                {editing
                  ? "Update this service and its settings."
                  : "Create a service under an existing subcategory."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form action={formAction} className="space-y-6 p-6">
            {service && <input type="hidden" name="id" value={service.id} />}

            {state.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            {/* Service name */}
            <div>
              <label
                htmlFor="service-name"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Service Name
              </label>

              <input
                id="service-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. House Cleaning"
                required
                disabled={pending}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-muted"
              />
            </div>

            {/* Subcategory */}
            <div>
              <label
                htmlFor="service-category"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Subcategory
              </label>

              <select
                id="service-category"
                name="categoryId"
                defaultValue={selectedSubcategoryId}
                required
                disabled={pending}
                className="w-full rounded-xl border border-slate-300 bg-card px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-muted"
              >
                <option value="" disabled>
                  Select a subcategory
                </option>

                {subcategories.map((category) => {
                  const parent = category.parent_id
                    ? categoryMap.get(category.parent_id)
                    : null;

                  return (
                    <option key={category.id} value={category.id}>
                      {parent
                        ? `${parent.name} → ${category.name}`
                        : category.name}
                    </option>
                  );
                })}
              </select>

              <p className="mt-1.5 text-xs text-muted-foreground">
                Select the subcategory this service belongs to.
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="service-description"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Description
              </label>

              <textarea
                id="service-description"
                name="description"
                defaultValue={service?.description ?? ""}
                placeholder="Describe what this service includes..."
                rows={4}
                disabled={pending}
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-muted"
              />
            </div>

            {/* Icon */}
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Service Icon
              </label>

              <ServiceIconPicker
                value={icon}
                onChange={setIcon}
                disabled={pending}
              />
            </div>

            {/* Image */}
            <div>
              <label
                htmlFor="service-image"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Service Image
              </label>

              <div className="rounded-xl border border-dashed border-slate-300 bg-muted p-4">
                {previewUrl ? (
                  <div className="mb-4 overflow-hidden rounded-xl border   border-border bg-card">
                    <img
                      src={previewUrl}
                      alt="Service preview"
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-40 flex-col items-center justify-center rounded-xl border   border-border bg-card text-muted-foreground/70">
                    <ImagePlus className="h-8 w-8" />

                    <p className="mt-2 text-sm">No image selected</p>
                  </div>
                )}

                <input
                  id="service-image"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={pending}
                  className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-card text-sm text-muted-foreground file:mr-4 file:border-0 file:border-r file:border-slate-300 file:bg-muted file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  JPG, PNG, WebP, or GIF. Maximum size: 5 MB.
                  {editing && service?.image_url
                    ? " Select a new image to replace the current one."
                    : ""}
                </p>

                {selectedImage && (
                  <p className="mt-2 truncate text-xs font-medium text-foreground">
                    Selected: {selectedImage.name}
                  </p>
                )}
              </div>
            </div>

            {/* Sort order */}
            <div>
              <label
                htmlFor="service-sort-order"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Sort Order
              </label>

              <input
                id="service-sort-order"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={service?.sort_order ?? 0}
                disabled={pending}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-muted"
              />

              <p className="mt-1.5 text-xs text-muted-foreground">
                Lower numbers appear first.
              </p>
            </div>

            {/* Settings */}
            <div className="rounded-xl border   border-border bg-muted p-4">
              <h3 className="text-sm font-semibold text-foreground">
                Service Settings
              </h3>

              <div className="mt-4 space-y-4">
                {/* Active */}
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={service?.is_active ?? true}
                    disabled={pending}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      Active
                    </span>

                    <span className="block text-xs text-muted-foreground">
                      Customers can see and request this service.
                    </span>
                  </span>
                </label>

                {/* Verification */}
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="requiresVerification"
                    defaultChecked={service?.requires_verification ?? false}
                    disabled={pending}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      Requires worker verification
                    </span>

                    <span className="block text-xs text-muted-foreground">
                      Workers must be verified before offering this service.
                    </span>
                  </span>
                </label>

                {/* Certificate */}
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="requiresCertificate"
                    defaultChecked={service?.requires_certificate ?? false}
                    disabled={pending}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  />

                  <span>
                    <span className="block text-sm font-medium text-foreground">
                      Requires certificate
                    </span>

                    <span className="block text-xs text-muted-foreground">
                      Workers may need to provide a relevant certificate.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 border-t   border-border pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}

                {pending
                  ? editing
                    ? "Saving..."
                    : "Creating..."
                  : editing
                    ? "Save Changes"
                    : "Create Service"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
