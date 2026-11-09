"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";

import {
  deleteServiceArea,
  toggleServiceArea,
} from "@/app/dashboard/admin/service-areas/actions";

import ServiceAreaForm, { type ServiceArea } from "./service-area-form";

type Props = {
  serviceAreas: ServiceArea[];
};

type FormMode = { type: "create" } | { type: "edit"; area: ServiceArea };

export default function ServiceAreaManager({ serviceAreas }: Props) {
  const router = useRouter();

  const [selectedStateId, setSelectedStateId] = useState<string | null>(null);
  const [selectedLgaId, setSelectedLgaId] = useState<string | null>(null);

  const [formMode, setFormMode] = useState<FormMode | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<{
    type: "deactivate" | "delete";
    area: ServiceArea;
  } | null>(null);

  const selectedState = serviceAreas.find(
    (area) => area.id === selectedStateId,
  );

  const selectedLga = serviceAreas.find((area) => area.id === selectedLgaId);

  const level: 1 | 2 | 3 = selectedLgaId ? 3 : selectedStateId ? 2 : 1;

  const currentParentId = selectedLgaId ?? selectedStateId;

  //   const currentAreas = useMemo(() => {
  //     return serviceAreas
  //       .filter((area) => area.parent_id === currentParentId)
  //       .sort((a, b) => a.name.localeCompare(b.name));
  //   }, [serviceAreas, currentParentId]);
  const currentAreas = useMemo(() => {
    return serviceAreas
      .filter((area) => area.parent_id === currentParentId)
      .sort((a, b) => {
        // Active locations always come first.
        if (a.is_active !== b.is_active) {
          return a.is_active ? -1 : 1;
        }

        // Sort alphabetically within each group.
        return a.name.localeCompare(b.name);
      });
  }, [serviceAreas, currentParentId]);

  const states = useMemo(() => {
    return serviceAreas
      .filter((area) => area.parent_id === null)
      .sort((a, b) => {
        if (a.is_active !== b.is_active) {
          return a.is_active ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
      });
  }, [serviceAreas]);

  const getChildCount = useCallback(
    (id: string) => {
      return serviceAreas.filter((area) => area.parent_id === id).length;
    },
    [serviceAreas],
  );

  const closeForm = useCallback(() => {
    setFormMode(null);
    router.refresh();
  }, [router]);

  function goBack() {
    setNotice(null);

    if (selectedLgaId) {
      setSelectedLgaId(null);
      return;
    }

    if (selectedStateId) {
      setSelectedStateId(null);
    }
  }

  async function executeToggle(area: ServiceArea) {
    setBusyId(area.id);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.set("id", area.id);

      const result = await toggleServiceArea(formData);

      if (result.error) {
        setNotice({ type: "error", message: result.error });
        return;
      }

      setNotice({
        type: "success",
        message: result.success ?? "Location status updated.",
      });

      setConfirmation(null);
      router.refresh();
    } catch (error) {
      console.error("Toggle service area error:", error);

      setNotice({
        type: "error",
        message: "Unable to change the location status.",
      });
    } finally {
      setBusyId(null);
    }
  }

  async function executeDelete(area: ServiceArea) {
    setBusyId(area.id);
    setNotice(null);

    try {
      const formData = new FormData();
      formData.set("id", area.id);

      const result = await deleteServiceArea(formData);

      if (result.error) {
        setNotice({ type: "error", message: result.error });
        return;
      }

      setNotice({
        type: "success",
        message: result.success ?? "Location deleted successfully.",
      });

      setConfirmation(null);
      router.refresh();
    } catch (error) {
      console.error("Delete service area error:", error);

      setNotice({
        type: "error",
        message: "Unable to delete this location.",
      });
    } finally {
      setBusyId(null);
    }
  }

  function handleToggle(area: ServiceArea) {
    if (area.is_active) {
      setConfirmation({
        type: "deactivate",
        area,
      });
      return;
    }

    // Activating a location does not require confirmation.
    void executeToggle(area);
  }

  function handleDelete(area: ServiceArea) {
    setConfirmation({
      type: "delete",
      area,
    });
  }

  function confirmAction() {
    if (!confirmation) return;

    if (confirmation.type === "deactivate") {
      void executeToggle(confirmation.area);
    } else {
      void executeDelete(confirmation.area);
    }
  }

  const levelTitle =
    level === 1
      ? "States"
      : level === 2
        ? "Local Government Areas"
        : "Areas and Communities";

  const levelDescription =
    level === 1
      ? "Manage the states where Emirate ErrandHub operates."
      : level === 2
        ? `Manage LGAs within ${selectedState?.name ?? "this state"}.`
        : `Manage communities within ${selectedLga?.name ?? "this LGA"}.`;

  const addButtonLabel =
    level === 1 ? "Add State" : level === 2 ? "Add LGA" : "Add Area";

  function openLocation(area: ServiceArea) {
    setNotice(null);

    if (level === 1) {
      setSelectedStateId(area.id);
      return;
    }

    if (level === 2) {
      setSelectedLgaId(area.id);
    }
  }

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <MapPin className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Service Areas
              </h1>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                Manage states, LGAs and communities.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFormMode({ type: "create" })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          {addButtonLabel}
        </button>
      </div>

      {/* HIERARCHY GUIDE */}
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span className="rounded-lg bg-white px-3 py-2 text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
            State
          </span>

          <ChevronRight className="h-4 w-4 text-slate-400" />

          <span className="rounded-lg bg-white px-3 py-2 text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
            Local Government
          </span>

          <ChevronRight className="h-4 w-4 text-slate-400" />

          <span className="rounded-lg bg-white px-3 py-2 text-emerald-800 shadow-sm dark:bg-slate-900 dark:text-emerald-300">
            Area / Community
          </span>
        </div>

        <p className="mt-3 text-xs text-emerald-800/80 dark:text-emerald-300/80">
          Locations must follow this three-level structure.
        </p>
      </div>

      {/* BREADCRUMB */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => {
            setSelectedStateId(null);
            setSelectedLgaId(null);
            setNotice(null);
          }}
          className={`font-medium ${
            level === 1
              ? "text-slate-900 dark:text-white"
              : "text-emerald-700 hover:underline dark:text-emerald-400"
          }`}
        >
          States
        </button>

        {selectedState && (
          <>
            <ChevronRight className="h-4 w-4 text-slate-400" />

            {selectedLga ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedLgaId(null);
                  setNotice(null);
                }}
                className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
              >
                {selectedState.name}
              </button>
            ) : (
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedState.name}
              </span>
            )}
          </>
        )}

        {selectedLga && (
          <>
            <ChevronRight className="h-4 w-4 text-slate-400" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {selectedLga.name}
            </span>
          </>
        )}
      </div>

      {/* NOTIFICATIONS */}
      {notice && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            notice.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* LOCATION LIST */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              {levelTitle}
            </h2>

            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {levelDescription}
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {currentAreas.length} {currentAreas.length === 1 ? "item" : "items"}
          </span>
        </div>

        {currentAreas.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
              {level === 1 ? (
                <MapPin className="h-6 w-6" />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-white">
              No {levelTitle.toLowerCase()} found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">
              Add your first{" "}
              {level === 1
                ? "state"
                : level === 2
                  ? "local government area"
                  : "area or community"}{" "}
              to get started.
            </p>

            <button
              type="button"
              onClick={() => setFormMode({ type: "create" })}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              {addButtonLabel}
            </button>
          </div>
        ) : (
          <div>
            {currentAreas.map((area, index) => {
              const childCount = getChildCount(area.id);
              const canOpen = level < 3;
              const busy = busyId === area.id;

              const showInactiveDivider =
                index > 0 &&
                !area.is_active &&
                currentAreas[index - 1].is_active;

              return (
                <div key={area.id}>
                  {showInactiveDivider && (
                    <div className="flex items-center gap-3 border-y border-slate-200 bg-slate-50 px-5 py-3 dark:border-slate-800 dark:bg-slate-950/50">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />

                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Deactivated locations
                      </span>

                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 transition hover:bg-slate-50/70 last:border-b-0 dark:border-slate-800 dark:hover:bg-slate-800/30 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {level === 1 ? (
                          <MapPin className="h-5 w-5" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {canOpen ? (
                            <button
                              type="button"
                              onClick={() => openLocation(area)}
                              className="truncate text-left text-sm font-semibold text-slate-900 hover:text-emerald-700 dark:text-white dark:hover:text-emerald-400"
                            >
                              {area.name}
                            </button>
                          ) : (
                            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {area.name}
                            </span>
                          )}

                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              area.is_active
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }`}
                          >
                            {area.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {level === 1
                            ? `${childCount} ${childCount === 1 ? "LGA" : "LGAs"}`
                            : level === 2
                              ? `${childCount} ${childCount === 1 ? "area" : "areas"}`
                              : "Area / Community"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {canOpen && (
                        <button
                          type="button"
                          onClick={() => openLocation(area)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          Manage
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setFormMode({ type: "edit", area })}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleToggle(area)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      >
                        <Power className="h-3.5 w-3.5" />
                        {busy
                          ? "Please wait..."
                          : area.is_active
                            ? "Deactivate"
                            : "Activate"}
                      </button>

                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleDelete(area)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BACK BUTTON */}
      {level > 1 && (
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700 dark:text-slate-400 dark:hover:text-emerald-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {level === 3 ? "LGAs" : "states"}
        </button>
      )}

      {/* ADD / EDIT MODAL */}
      {formMode && (
        <ServiceAreaForm
          serviceArea={formMode.type === "edit" ? formMode.area : null}
          parentId={
            formMode.type === "edit" ? formMode.area.parent_id : currentParentId
          }
          level={
            formMode.type === "edit"
              ? formMode.area.parent_id === null
                ? 1
                : serviceAreas.some(
                      (item) =>
                        item.id === formMode.area.parent_id &&
                        item.parent_id === null,
                    )
                  ? 2
                  : 3
              : level
          }
          onClose={closeForm}
        />
      )}

      {/* DEACTIVATE / DELETE CONFIRMATION DIALOG */}
      {confirmation && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !busyId) {
              setConfirmation(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-description"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                confirmation.type === "delete"
                  ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                  : "bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
              }`}
            >
              {confirmation.type === "delete" ? (
                <Trash2 className="h-6 w-6" />
              ) : (
                <Power className="h-6 w-6" />
              )}
            </div>

            <h2
              id="confirmation-title"
              className="text-lg font-bold text-slate-900 dark:text-white"
            >
              {confirmation.type === "delete"
                ? "Delete location?"
                : "Deactivate location?"}
            </h2>

            <p
              id="confirmation-description"
              className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400"
            >
              {confirmation.type === "delete" ? (
                <>
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {confirmation.area.name}
                  </strong>
                  ? This action cannot be undone.
                  <span className="mt-2 block">
                    Locations with child entries or worker assignments cannot be
                    deleted.
                  </span>
                </>
              ) : (
                <>
                  Are you sure you want to deactivate{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {confirmation.area.name}
                  </strong>
                  ?
                  <span className="mt-2 block">
                    This location will be marked inactive. Existing worker
                    assignments will be preserved.
                  </span>
                </>
              )}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                disabled={busyId !== null}
                onClick={() => setConfirmation(null)}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={busyId !== null}
                onClick={confirmAction}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  confirmation.type === "delete"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {busyId
                  ? "Please wait..."
                  : confirmation.type === "delete"
                    ? "Yes, delete"
                    : "Yes, deactivate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
