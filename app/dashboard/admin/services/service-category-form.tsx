"use client";

import { useActionState, useEffect, useState } from "react";

import { ImagePlus, Loader2, X } from "lucide-react";

import {
  createServiceCategory,
  updateServiceCategory,
  type ServiceCategoryActionState,
} from "./actions";

import { ServiceIconPicker } from "@/components/services/service-icon-picker";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  requires_verification: boolean;
  requires_certificate: boolean;
};

type ServiceCategoryFormProps = {
  categories: Category[];
  category?: Category | null;
  parentCategory?: Category | null;
  onClose: () => void;
};

const initialState: ServiceCategoryActionState = {};

export function ServiceCategoryForm({
  category,
  parentCategory,
  onClose,
}: ServiceCategoryFormProps) {
  const editing = Boolean(category);

  const action = editing ? updateServiceCategory : createServiceCategory;

  const [state, formAction, pending] = useActionState(action, initialState);

  const [name, setName] = useState(category?.name ?? "");

  const [icon, setIcon] = useState(category?.icon ?? "Sparkles");

  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(
    category?.image_url ?? null,
  );

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  /*
   * A parent category is only supplied when:
   *
   * 1. Creating a subcategory, or
   * 2. Editing an existing subcategory.
   *
   * Top-level categories have no parent.
   */
  const resolvedParent = parentCategory ?? null;
  const isSubcategory = Boolean(resolvedParent);

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

    if (!file && category?.image_url) {
      setPreviewUrl(category.image_url);
    }

    if (!file && !category?.image_url) {
      setPreviewUrl(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {editing
                  ? isSubcategory
                    ? "Edit subcategory"
                    : "Edit category"
                  : isSubcategory
                    ? "Add subcategory"
                    : "Add category"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {editing
                  ? isSubcategory
                    ? "Update this subcategory."
                    : "Update this top-level category."
                  : isSubcategory
                    ? `Create a new subcategory under ${resolvedParent?.name}.`
                    : "Create a new top-level service category."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form
            action={formAction}
            // encType="multipart/form-data"
            className="space-y-6 p-6"
          >
            {category && <input type="hidden" name="id" value={category.id} />}

            {/* Parent is controlled by context, not selected manually. */}
            <input
              type="hidden"
              name="parentId"
              value={resolvedParent?.id ?? ""}
            />

            {state.error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {state.error}
              </div>
            )}

            {/* Parent */}
            {resolvedParent && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Parent category
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {resolvedParent.name}
                </p>
              </div>
            )}

            {/* Name + Slug */}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Name
                </label>

                <input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={
                    isSubcategory ? "e.g. Plumbing" : "e.g. Home Services"
                  }
                  required
                  disabled={pending}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Slug
                </label>

                <input
                  id="slug"
                  name="slug"
                  defaultValue={category?.slug ?? ""}
                  placeholder={isSubcategory ? "plumbing" : "home-services"}
                  disabled={pending}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Leave empty to generate from the name.
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Description
              </label>

              <textarea
                id="description"
                name="description"
                defaultValue={category?.description ?? ""}
                rows={4}
                placeholder={
                  isSubcategory
                    ? "Describe the services in this subcategory..."
                    : "Describe the services in this category..."
                }
                disabled={pending}
                className="w-full resize-none rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />
            </div>

            {/* Sort order */}
            <div>
              <label
                htmlFor="sortOrder"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Sort order
              </label>

              <input
                id="sortOrder"
                name="sortOrder"
                type="number"
                min="0"
                defaultValue={category?.sort_order ?? 0}
                disabled={pending}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100"
              />

              <p className="mt-1 text-xs text-slate-400">
                Lower numbers appear first.
              </p>
            </div>

            {/* Icon */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                {isSubcategory ? "Subcategory Icon" : "Category Icon"}
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
                htmlFor="category-image"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                {isSubcategory ? "Subcategory Image" : "Category Image"}
              </label>

              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                {previewUrl ? (
                  <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <img
                      src={previewUrl}
                      alt={
                        isSubcategory
                          ? "Subcategory preview"
                          : "Category preview"
                      }
                      className="h-48 w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex h-40 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400">
                    <ImagePlus className="h-8 w-8" />

                    <p className="mt-2 text-sm">No image selected</p>
                  </div>
                )}

                <input
                  id="category-image"
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                  disabled={pending}
                  className="block w-full cursor-pointer rounded-lg border border-slate-300 bg-white text-sm text-slate-600 file:mr-4 file:border-0 file:border-r file:border-slate-300 file:border-slate-300 file:bg-slate-100 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
                />

                <p className="mt-2 text-xs text-slate-500">
                  JPG, PNG, WebP, or GIF. Maximum size: 5 MB.
                  {editing && category?.image_url
                    ? " Select a new image to replace the current one."
                    : ""}
                </p>

                {selectedImage && (
                  <p className="mt-2 truncate text-xs font-medium text-slate-700">
                    Selected: {selectedImage.name}
                  </p>
                )}
              </div>
            </div>

            {/* Settings */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={category?.is_active ?? true}
                  disabled={pending}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    Active
                  </span>

                  <span className="block text-xs text-slate-500">
                    Active categories are available to customers.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="requiresVerification"
                  defaultChecked={category?.requires_verification ?? false}
                  disabled={pending}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    Require worker verification
                  </span>

                  <span className="block text-xs text-slate-500">
                    Workers offering this service must be verified.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="requiresCertificate"
                  defaultChecked={category?.requires_certificate ?? false}
                  disabled={pending}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />

                <span>
                  <span className="block text-sm font-medium text-slate-900">
                    Require certificate
                  </span>

                  <span className="block text-xs text-slate-500">
                    Workers may need to provide supporting certification.
                  </span>
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}

                {pending
                  ? "Saving..."
                  : editing
                    ? "Save changes"
                    : isSubcategory
                      ? "Create subcategory"
                      : "Create category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
