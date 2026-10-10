"use client";

import {
  useActionState,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ImagePlus,
  MapPin,
  ShieldCheck,
  Wallet,
  X,
  Zap,
} from "lucide-react";

import { createServiceRequest } from "@/lib/actions/service-requests";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { MediaPreview } from "./media-preview";

type Category = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
};

type Service = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  icon: string | null;
};

type NewRequestFormProps = {
  categories: Category[];
  services: Service[];
  initialCategoryId: string | null;
  initialServiceId: string | null;
  selectedWorkerId?: string | null;
  selectedWorkerName?: string | null;
};

const initialState = {
  error: "",
};

const MAX_MEDIA_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

function SectionHeading({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: string;
  icon: typeof FileText;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-teal-700">
          Step {number}
        </p>
        <h2 className="text-lg font-bold tracking-tight text-slate-950 sm:text-xl">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs leading-5 text-slate-500">{children}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-12 w-full gap-2 rounded-xl bg-teal-600 px-6 font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60 sm:w-auto"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          Submitting request...
        </>
      ) : (
        <>
          Submit request
          <ArrowRight className="size-4" />
        </>
      )}
    </Button>
  );
}

export default function NewRequestForm({
  categories,
  services,
  initialCategoryId,
  initialServiceId,
  selectedWorkerId = null,
  selectedWorkerName = null,
}: NewRequestFormProps) {
  const [state, formAction] = useActionState(
    createServiceRequest,
    initialState,
  );

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    initialCategoryId ?? "",
  );

  const [selectedServiceId, setSelectedServiceId] = useState(
    initialServiceId ?? "",
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState("");

  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) return [];

    return services.filter(
      (service) => service.category_id === selectedCategoryId,
    );
  }, [services, selectedCategoryId]);

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    const categoryId = event.target.value;

    setSelectedCategoryId(categoryId);

    const currentService = services.find(
      (service) =>
        service.id === selectedServiceId && service.category_id === categoryId,
    );

    setSelectedServiceId(currentService?.id ?? "");
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const newFiles = Array.from(input.files ?? []);

    if (newFiles.length === 0) return;

    setMediaError("");

    const invalidFile = newFiles.find(
      (file) =>
        !file.type.startsWith("image/") && !file.type.startsWith("video/"),
    );

    if (invalidFile) {
      setMediaError(`"${invalidFile.name}" is not a supported image or video.`);
      input.value = "";
      return;
    }

    const oversizedFile = newFiles.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      setMediaError(
        `"${oversizedFile.name}" exceeds the 50 MB per-file limit.`,
      );
      input.value = "";
      return;
    }

    const combinedFiles = [...selectedFiles, ...newFiles];

    if (combinedFiles.length > MAX_MEDIA_FILES) {
      setMediaError(`You can upload a maximum of ${MAX_MEDIA_FILES} files.`);
      input.value = "";
      return;
    }

    setSelectedFiles(combinedFiles);

    const dataTransfer = new DataTransfer();
    combinedFiles.forEach((file) => dataTransfer.items.add(file));
    input.files = dataTransfer.files;
  }

  function removeSelectedFile(index: number) {
    const updatedFiles = selectedFiles.filter(
      (_, fileIndex) => fileIndex !== index,
    );

    setSelectedFiles(updatedFiles);
    setMediaError("");

    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();
      updatedFiles.forEach((file) => dataTransfer.items.add(file));
      fileInputRef.current.files = dataTransfer.files;
    }
  }

  function clearSelectedFiles() {
    setSelectedFiles([]);
    setMediaError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {selectedWorkerId && (
        <input type="hidden" name="worker_id" value={selectedWorkerId} />
      )}

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">Your request could not be submitted</p>
            <p className="mt-1 leading-6">{state.error}</p>
          </div>
        </div>
      )}

      {selectedWorkerId && selectedWorkerName && (
        <div className="overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-sm">
          <div className="flex items-start gap-4 bg-teal-50/80 p-5 sm:p-6">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white text-teal-700 shadow-sm ring-1 ring-teal-100">
              <BadgeCheck className="size-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-slate-950">
                  {selectedWorkerName}
                </h2>
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800">
                  <CheckCircle2 className="size-3.5" />
                  Selected worker
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your request will be directed to this worker. The worker must
                still be eligible for the requested category.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Service selection */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeading
            number="01"
            icon={CheckCircle2}
            title="Choose your service"
            description="Tell us what kind of help you need."
          />

          <div className="grid gap-5 border-t border-slate-100 pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="category_id"
                className="text-sm font-semibold text-slate-800"
              >
                Service category <span className="text-red-500">*</span>
              </Label>

              <select
                id="category_id"
                name="category_id"
                value={selectedCategoryId}
                onChange={handleCategoryChange}
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <FieldHint>
                Choose the category that best matches the task.
              </FieldHint>
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="service_id"
                className="text-sm font-semibold text-slate-800"
              >
                Specific service{" "}
                <span className="font-normal text-slate-400">(optional)</span>
              </Label>

              <select
                id="service_id"
                name="service_id"
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
                disabled={!selectedCategoryId || filteredServices.length === 0}
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
              >
                <option value="">Select a specific service</option>
                {filteredServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>

              {selectedCategoryId && filteredServices.length === 0 && (
                <FieldHint>
                  No specific services are listed in this category yet. You can
                  still submit your request using the category.
                </FieldHint>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Request details */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeading
            number="02"
            icon={FileText}
            title="Describe the task"
            description="A clear description helps workers understand what you need."
          />

          <div className="space-y-5 border-t border-slate-100 pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="text-sm font-semibold text-slate-800"
              >
                Request title <span className="text-red-500">*</span>
              </Label>

              <Input
                id="title"
                name="title"
                placeholder="e.g. Repair my air conditioner"
                required
                minLength={3}
                className="h-12 rounded-xl border-slate-200 px-4 focus-visible:ring-teal-500"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-semibold text-slate-800"
              >
                Task description <span className="text-red-500">*</span>
              </Label>

              <Textarea
                id="description"
                name="description"
                placeholder="Explain what needs to be done, the problem you're experiencing, and any important details."
                required
                minLength={10}
                rows={6}
                className="min-h-36 resize-y rounded-xl border-slate-200 px-4 py-3 leading-6 focus-visible:ring-teal-500"
              />

              <FieldHint>
                Include relevant details, such as the issue, quantity,
                measurements, or any special instructions.
              </FieldHint>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Photos and videos */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeading
            number="03"
            icon={ImagePlus}
            title="Add photos or videos"
            description="Visual details can help workers understand the job before quoting."
          />

          <div className="space-y-4 border-t border-slate-100 pt-6">
            <input
              ref={fileInputRef}
              id="media"
              name="media"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="sr-only"
            />

            <label
              htmlFor="media"
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-5 py-9 text-center transition hover:border-teal-400 hover:bg-teal-50/50 focus-within:ring-4 focus-within:ring-teal-500/10"
            >
              <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm ring-1 ring-slate-200 transition group-hover:ring-teal-200">
                <ImagePlus className="size-6" />
              </div>

              <span className="font-semibold text-slate-900">
                {selectedFiles.length > 0
                  ? "Add more photos or videos"
                  : "Choose photos or videos"}
              </span>

              <span className="mt-2 text-sm text-slate-500">
                Select multiple files · Up to {MAX_MEDIA_FILES} files · 50 MB
                each
              </span>
            </label>

            {mediaError && (
              <p
                role="alert"
                className="flex items-start gap-2 text-sm text-red-600"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                {mediaError}
              </p>
            )}

            {selectedFiles.length > 0 && (
              <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">
                      Selected media
                    </p>
                    <p className="text-xs text-slate-500">
                      {selectedFiles.length} of {MAX_MEDIA_FILES} files
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearSelectedFiles}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="size-4" />
                    Clear all
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {selectedFiles.map((file, index) => (
                    <MediaPreview
                      key={`${file.name}-${file.lastModified}-${index}`}
                      file={file}
                      onRemove={() => removeSelectedFile(index)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step 4: Budget and schedule */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeading
            number="04"
            icon={Wallet}
            title="Budget and schedule"
            description="Share your estimated budget and when you would prefer the work to happen."
          />

          <div className="space-y-5 border-t border-slate-100 pt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="budget"
                  className="text-sm font-semibold text-slate-800"
                >
                  Estimated budget
                </Label>
                <Input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 50000"
                  className="h-12 rounded-xl border-slate-200 px-4 focus-visible:ring-teal-500"
                />
                <FieldHint>
                  This is an estimate; the worker can submit a quotation.
                </FieldHint>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="currency"
                  className="text-sm font-semibold text-slate-800"
                >
                  Currency
                </Label>
                <select
                  id="currency"
                  name="currency"
                  defaultValue="NGN"
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                >
                  <option value="NGN">NGN — Nigerian Naira</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="GBP">GBP — British Pound</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="preferred_date"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-800"
                >
                  <CalendarDays className="size-4 text-slate-400" />
                  Preferred date
                </Label>
                <Input
                  id="preferred_date"
                  name="preferred_date"
                  type="date"
                  className="h-12 rounded-xl border-slate-200 px-4 focus-visible:ring-teal-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="preferred_time"
                  className="flex items-center gap-2 text-sm font-semibold text-slate-800"
                >
                  <Clock3 className="size-4 text-slate-400" />
                  Preferred time
                </Label>
                <Input
                  id="preferred_time"
                  name="preferred_time"
                  type="time"
                  className="h-12 rounded-xl border-slate-200 px-4 focus-visible:ring-teal-500"
                />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 transition hover:bg-amber-50">
              <Checkbox id="is_urgent" name="is_urgent" className="mt-0.5" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2 font-semibold text-slate-900">
                  <Zap className="size-4 text-amber-600" />
                  This is an urgent request
                </span>
                <span className="mt-1 block text-sm leading-5 text-slate-600">
                  Let workers know that you need assistance as soon as possible.
                </span>
              </span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Step 5: Location */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="space-y-6 p-5 sm:p-7">
          <SectionHeading
            number="05"
            icon={MapPin}
            title="Service location"
            description="Tell the worker where the task will take place."
          />

          <div className="space-y-5 border-t border-slate-100 pt-6">
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-semibold text-slate-800"
              >
                Street address or landmark
              </Label>
              <Input
                id="address"
                name="address"
                placeholder="House number, street, area or nearby landmark"
                className="h-12 rounded-xl border-slate-200 px-4 focus-visible:ring-teal-500"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label
                  htmlFor="city"
                  className="text-sm font-semibold text-slate-800"
                >
                  City
                </Label>
                <Input
                  id="city"
                  name="city"
                  placeholder="e.g. Ibadan"
                  className="h-12 rounded-xl border-slate-200 px-4 focus-visible:ring-teal-500"
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="state"
                  className="text-sm font-semibold text-slate-800"
                >
                  State
                </Label>
                <Input
                  id="state"
                  name="state"
                  placeholder="e.g. Oyo"
                  className="h-12 rounded-xl border-slate-200 px-4 focus-visible:ring-teal-500"
                />
              </div>
            </div>

            <input type="hidden" name="latitude" value="" />
            <input type="hidden" name="longitude" value="" />
          </div>
        </CardContent>
      </Card>

      {/* Submission */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-teal-700" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Review before submitting
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Check your details before sending the request. You can review
              worker quotations before deciding which one to accept.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="h-12 rounded-xl border-slate-200 px-5"
          >
            <Link
              href="/dashboard/customer/requests"
              className="flex items-center gap-1"
            >
              <ArrowLeft className="mr-2 size-4" />
              Cancel
            </Link>
          </Button>

          <SubmitButton />
        </div>
      </div>
    </form>
  );
}
