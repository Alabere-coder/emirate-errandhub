"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  ArrowLeft,
  Building2,
  ChevronRight,
  MapPin,
  MoreHorizontal,
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

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const selectedState = serviceAreas.find(
    (area) => area.id === selectedStateId,
  );

  const selectedLga = serviceAreas.find((area) => area.id === selectedLgaId);

  const level: 1 | 2 | 3 = selectedLgaId ? 3 : selectedStateId ? 2 : 1;

  const currentParentId = selectedLgaId ?? selectedStateId;

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target;

      if (
        target instanceof Element &&
        !target.closest("[data-service-area-menu]")
      ) {
        setOpenMenuId(null);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);

      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Service Areas
              </h1>

              <p className="text-sm text-muted-foreground">
                Manage states, LGAs and communities.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setFormMode({ type: "create" })}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />

          {addButtonLabel}
        </button>
      </div>

      {/* HIERARCHY GUIDE */}

      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
          <span className="rounded-lg bg-card px-3 py-2 text-primary shadow-sm">
            State
          </span>

          <ChevronRight className="h-4 w-4 text-muted-foreground/70" />

          <span className="rounded-lg bg-card px-3 py-2 text-primary shadow-sm">
            Local Government
          </span>

          <ChevronRight className="h-4 w-4 text-muted-foreground/70" />

          <span className="rounded-lg bg-card px-3 py-2 text-primary shadow-sm">
            Area / Community
          </span>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
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
            level === 1 ? "text-foreground" : "text-primary hover:underline"
          }`}
        >
          States
        </button>

        {selectedState && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground/70" />

            {selectedLga ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedLgaId(null);

                  setNotice(null);
                }}
                className="font-medium text-primary hover:underline"
              >
                {selectedState.name}
              </button>
            ) : (
              <span className="font-semibold text-foreground">
                {selectedState.name}
              </span>
            )}
          </>
        )}

        {selectedLga && (
          <>
            <ChevronRight className="h-4 w-4 text-muted-foreground/70" />

            <span className="font-semibold text-foreground">
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
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700  "
              : "border-destructive/30 bg-destructive/10 text-destructive "
          }`}
        >
          {notice.message}
        </div>
      )}

      {/* LOCATION LIST */}

      <div className="relative overflow-visible rounded-2xl border border-border bg-card ">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 ">
          <div>
            <h2 className="font-semibold text-foreground">{levelTitle}</h2>

            <p className="mt-1 text-xs text-muted-foreground">
              {levelDescription}
            </p>
          </div>

          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {currentAreas.length} {currentAreas.length === 1 ? "item" : "items"}
          </span>
        </div>

        {currentAreas.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground/70 ">
              {level === 1 ? (
                <MapPin className="h-6 w-6" />
              ) : (
                <Building2 className="h-6 w-6" />
              )}
            </div>

            <h3 className="font-semibold text-foreground">
              No {levelTitle.toLowerCase()} found
            </h3>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
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
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
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
                    <div className="flex items-center gap-3 border-y border-border bg-muted/50 px-5 py-3 ">
                      <div className="h-px flex-1 bg-border" />

                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Deactivated locations
                      </span>

                      <div className="h-px flex-1 bg-border" />
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-b border-border px-5 py-4 transition hover:bg-muted/70 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
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
                              className="truncate text-left text-sm font-semibold text-foregroundhover:text-primary"
                            >
                              {area.name}
                            </button>
                          ) : (
                            <span className="truncate text-sm font-semibold text-foreground">
                              {area.name}
                            </span>
                          )}

                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              area.is_active
                                ? "bg-emerald-500/10 text-emerald-700"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {area.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
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
                          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-muted-foregroundhover:bg-muted "
                        >
                          Manage
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <div
                        className="relative flex shrink-0"
                        data-service-area-menu
                      >
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            setOpenMenuId((current) =>
                              current === area.id ? null : area.id,
                            )
                          }
                          aria-label={`Actions for ${area.name}`}
                          aria-expanded={openMenuId === area.id}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foregroundtransition hover:bg-muted hover:text-foregrounddisabled:opacity-50"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {openMenuId === area.id && (
                          <div
                            className={`absolute right-0 z-50 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl ${
                              index === currentAreas.length - 1
                                ? "bottom-full mb-2"
                                : "top-full mt-2"
                            }`}
                          >
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setOpenMenuId(null);

                                setFormMode({ type: "edit", area });
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-foregroundtransition hover:bg-muted disabled:opacity-50"
                            >
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                              Edit location
                            </button>

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setOpenMenuId(null);

                                handleToggle(area);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-foregroundtransition hover:bg-muted disabled:opacity-50"
                            >
                              <Power className="h-4 w-4 text-muted-foreground" />

                              {area.is_active ? "Deactivate" : "Activate"}
                            </button>

                            <div className="my-1 border-t border-border " />

                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => {
                                setOpenMenuId(null);

                                handleDelete(area);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete location
                            </button>
                          </div>
                        )}
                      </div>
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
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foregroundhover:text-primary"
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
            className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl "
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                confirmation.type === "delete"
                  ? "bg-destructive/10 text-destructive"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
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
              className="text-lg font-bold text-foreground"
            >
              {confirmation.type === "delete"
                ? "Delete location?"
                : "Deactivate location?"}
            </h2>

            <p
              id="confirmation-description"
              className="mt-2 text-sm leading-6 text-muted-foreground"
            >
              {confirmation.type === "delete" ? (
                <>
                  Are you sure you want to permanently delete{" "}
                  <strong className="text-foreground">
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
                  <strong className="text-foreground">
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
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foregroundhover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={busyId !== null}
                onClick={confirmAction}
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50${
                  confirmation.type === "delete"
                    ? "bg-destructive hover:bg-destructive/90"
                    : "bg-amber-600 text-white hover:bg-amber-700"
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
