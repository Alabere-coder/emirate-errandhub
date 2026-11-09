"use client";

import { useActionState, useEffect } from "react";

import {
  createServiceArea,
  updateServiceArea,
  type ServiceAreaActionState,
} from "@/app/dashboard/admin/service-areas/actions";

export type ServiceArea = {
  id: string;
  name: string;
  parent_id: string | null;
  is_active: boolean;
  created_at: string;
};

type ServiceAreaFormProps = {
  serviceArea?: ServiceArea | null;
  parentId: string | null;
  level: 1 | 2 | 3;
  onClose: () => void;
};

const initialState: ServiceAreaActionState = {};

export default function ServiceAreaForm({
  serviceArea,
  parentId,
  level,
  onClose,
}: ServiceAreaFormProps) {
  const editing = Boolean(serviceArea);

  const action = editing ? updateServiceArea : createServiceArea;

  const [state, formAction, pending] = useActionState(action, initialState);

  useEffect(() => {
    if (state.success) {
      onClose();
    }
  }, [state.success, onClose]);

  const levelName =
    level === 1
      ? "State"
      : level === 2
        ? "Local Government Area"
        : "Area / Community";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              {editing ? `Edit ${levelName}` : `Add ${levelName}`}
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {level === 1
                ? "Add a state to your service coverage locations."
                : level === 2
                  ? "Add a local government area under the selected state."
                  : "Add an area or community under the selected local government."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form action={formAction} className="space-y-5">
          {editing && serviceArea && (
            <>
              <input type="hidden" name="id" value={serviceArea.id} />
              <input
                type="hidden"
                name="parentId"
                value={serviceArea.parent_id ?? ""}
              />
            </>
          )}

          {!editing && (
            <input type="hidden" name="parentId" value={parentId ?? ""} />
          )}

          <div>
            <label
              htmlFor="service-area-name"
              className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              {levelName} name
            </label>

            <input
              id="service-area-name"
              name="name"
              type="text"
              required
              maxLength={100}
              defaultValue={serviceArea?.name ?? ""}
              placeholder={
                level === 1
                  ? "e.g. Kwara"
                  : level === 2
                    ? "e.g. Ilorin West"
                    : "e.g. Adewole"
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={serviceArea?.is_active ?? true}
              className="h-4 w-4 accent-emerald-600"
            />

            <span>
              <span className="block text-sm font-medium text-slate-800 dark:text-white">
                Active
              </span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                Allow this location to be selected by workers.
              </span>
            </span>
          </label>

          {state.error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {state.error}
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={pending}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending
                ? "Saving..."
                : editing
                  ? "Save changes"
                  : `Add ${levelName}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
