"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  CheckCircle2,
  CircleAlert,
  MapPin,
  MapPinned,
  Plus,
  Save,
  ShieldCheck,
  X,
} from "lucide-react";

import {
  updateWorkerServiceAreas,
  type WorkerServiceAreaActionState,
} from "@/lib/actions/worker-service-areas";

type ServiceArea = {
  id: string;
  name: string;
  parent_id: string | null;
  is_active: boolean;
};

type WorkerServiceAreaFormProps = {
  workerId: string;
  serviceAreas: ServiceArea[];
  selectedAreaIds: string[];
};

const initialState: WorkerServiceAreaActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Saving service areas...
        </>
      ) : (
        <>
          <Save className="size-4" />
          Save service areas
        </>
      )}
    </button>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ServiceArea[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">{label}</label>

      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-12 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function WorkerServiceAreaForm({
  workerId,
  serviceAreas,
  selectedAreaIds,
}: WorkerServiceAreaFormProps) {
  const [state, formAction] = useActionState(
    updateWorkerServiceAreas,
    initialState,
  );

  const [selectedIds, setSelectedIds] = useState<string[]>(selectedAreaIds);

  const [selectedStateId, setSelectedStateId] = useState("");
  const [selectedLgaId, setSelectedLgaId] = useState("");
  const [selectedAreaId, setSelectedAreaId] = useState("");

  const areaMap = useMemo(
    () => new Map(serviceAreas.map((area) => [area.id, area])),
    [serviceAreas],
  );

  const states = useMemo(
    () =>
      serviceAreas
        .filter((area) => area.parent_id === null && area.is_active)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [serviceAreas],
  );

  const lgas = useMemo(
    () =>
      serviceAreas
        .filter((area) => area.parent_id === selectedStateId && area.is_active)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [serviceAreas, selectedStateId],
  );

  const areas = useMemo(
    () =>
      serviceAreas
        .filter((area) => area.parent_id === selectedLgaId && area.is_active)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [serviceAreas, selectedLgaId],
  );

  const selectedAreas = selectedIds.map((id) => ({
    id,
    area: areaMap.get(id),
  }));

  function addArea() {
    if (!selectedAreaId) return;

    setSelectedIds((current) =>
      current.includes(selectedAreaId) ? current : [...current, selectedAreaId],
    );

    setSelectedAreaId("");
  }

  function removeArea(areaId: string) {
    setSelectedIds((current) => current.filter((id) => id !== areaId));
  }

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="worker_id" value={workerId} />

      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="service_area_ids" value={id} />
      ))}

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/20 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MapPinned className="size-6" />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                  Areas you serve
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Select your State, Local Government Area, and the specific
                  communities where you accept jobs.
                </p>
              </div>
            </div>

            <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm">
              <MapPin className="size-4 text-primary" />
              <span className="font-semibold tabular-nums">
                {selectedIds.length}
              </span>
              <span className="text-muted-foreground">selected</span>
            </div>
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {states.length === 0 ? (
            <div className="rounded-xl border border-dashed px-5 py-10 text-center">
              <MapPinned className="mx-auto size-8 text-muted-foreground" />
              <h3 className="mt-3 font-semibold">No service areas available</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Active States and their locations have not been configured.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  label="1. State"
                  value={selectedStateId}
                  onChange={(value) => {
                    setSelectedStateId(value);
                    setSelectedLgaId("");
                    setSelectedAreaId("");
                  }}
                  options={states}
                  placeholder="Select a State"
                />

                <SelectField
                  label="2. Local Government Area"
                  value={selectedLgaId}
                  onChange={(value) => {
                    setSelectedLgaId(value);
                    setSelectedAreaId("");
                  }}
                  options={lgas}
                  placeholder="Select an LGA"
                  disabled={!selectedStateId}
                />

                <SelectField
                  label="3. Area / Community"
                  value={selectedAreaId}
                  onChange={setSelectedAreaId}
                  options={areas}
                  placeholder="Select an Area"
                  disabled={!selectedLgaId}
                />
              </div>

              {selectedStateId && lgas.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active LGAs are available under this State.
                </p>
              )}

              {selectedLgaId && areas.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active Areas or Communities are available under this LGA.
                </p>
              )}

              <button
                type="button"
                onClick={addArea}
                disabled={
                  !selectedAreaId || selectedIds.includes(selectedAreaId)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <Plus className="size-4" />
                Add area to coverage
              </button>
            </>
          )}

          <div className="border-t pt-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold">Your selected locations</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can cover multiple communities across different LGAs.
                </p>
              </div>

              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold tabular-nums">
                {selectedIds.length}
              </span>
            </div>

            {selectedAreas.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed px-5 py-8 text-center">
                <MapPin className="mx-auto size-6 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  You haven't selected any areas yet.
                </p>
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {selectedAreas.map(({ id, area }) => {
                  const lga = area?.parent_id
                    ? areaMap.get(area.parent_id)
                    : undefined;

                  const selectedState = lga?.parent_id
                    ? areaMap.get(lga.parent_id)
                    : undefined;

                  return (
                    <div
                      key={id}
                      className="flex min-w-0 items-center gap-3 rounded-xl border bg-background p-3"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <MapPin className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">
                          {area?.name ?? "Previously selected location"}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          {area && lga && selectedState
                            ? `${selectedState.name} · ${lga.name}`
                            : "This location may no longer be active"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeArea(id)}
                        aria-label={`Remove ${area?.name ?? "location"}`}
                        className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-muted/40 px-4 py-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-5 text-muted-foreground">
              Only choose communities where you can realistically accept and
              complete jobs. You can add or remove locations whenever your
              coverage changes.
            </p>
          </div>
        </div>
      </section>

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <p className="leading-6">{state.error}</p>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p className="leading-6">{state.success}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold">Update your coverage</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Save your selections to update the areas you serve.
          </p>
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}
