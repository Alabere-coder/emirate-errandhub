"use client";

import { useActionState, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { createServiceRequest } from "@/lib/actions/service-requests";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { BadgeCheck, ImagePlus } from "lucide-react";
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

  // Optional worker selected from the worker discovery page
  selectedWorkerId?: string | null;
  selectedWorkerName?: string | null;
};

const initialState = {
  error: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? "Submitting request..." : "Submit Request"}
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

  const MAX_MEDIA_FILES = 10;
  const MAX_FILE_SIZE = 50 * 1024 * 1024;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState("");

  const filteredServices = useMemo(() => {
    if (!selectedCategoryId) {
      return [];
    }

    return services.filter(
      (service) => service.category_id === selectedCategoryId,
    );
  }, [services, selectedCategoryId]);

  function handleCategoryChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const categoryId = event.target.value;

    setSelectedCategoryId(categoryId);

    const currentService = services.find(
      (service) =>
        service.id === selectedServiceId && service.category_id === categoryId,
    );

    setSelectedServiceId(currentService?.id ?? "");
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    setMediaError("");

    const invalidType = files.find(
      (file) =>
        !file.type.startsWith("image/") && !file.type.startsWith("video/"),
    );

    if (invalidType) {
      setMediaError(`"${invalidType.name}" is not a supported image or video.`);

      event.target.value = "";
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFile) {
      setMediaError(
        `"${oversizedFile.name}" is too large. Maximum size is 50MB.`,
      );

      event.target.value = "";
      return;
    }

    const combinedFiles = [...selectedFiles, ...files];

    if (combinedFiles.length > MAX_MEDIA_FILES) {
      setMediaError(`You can upload a maximum of ${MAX_MEDIA_FILES} files.`);

      event.target.value = "";
      return;
    }

    setSelectedFiles(combinedFiles);

    /*
     * Keep all selected files in the actual input.
     */
    const dataTransfer = new DataTransfer();

    combinedFiles.forEach((file) => {
      dataTransfer.items.add(file);
    });

    event.target.files = dataTransfer.files;
  };

  const removeSelectedFile = (index: number) => {
    const updatedFiles = selectedFiles.filter(
      (_, fileIndex) => fileIndex !== index,
    );

    setSelectedFiles(updatedFiles);

    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();

      updatedFiles.forEach((file) => {
        dataTransfer.items.add(file);
      });

      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setMediaError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      {/*
       * -------------------------------------------------------
       * SELECTED WORKER
       * -------------------------------------------------------
       *
       * This is submitted with the request as worker_id.
       *
       * The value is worker_profiles.id, NOT auth.users.id.
       */}
      {selectedWorkerId && (
        <input type="hidden" name="worker_id" value={selectedWorkerId} />
      )}

      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      {/* Selected worker */}
      {selectedWorkerId && selectedWorkerName && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />

              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Selected worker
                </p>

                <p className="mt-1 font-semibold">{selectedWorkerName}</p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Your request will be sent specifically to this verified
                  worker.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service */}
      <Card>
        <CardHeader>
          <CardTitle>Service</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="category_id">
              Service category <span className="text-destructive">*</span>
            </Label>

            <select
              id="category_id"
              name="category_id"
              value={selectedCategoryId}
              onChange={handleCategoryChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a category</option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <p className="text-xs text-muted-foreground">
              Choose the type of service you need.
            </p>
          </div>

          {selectedCategoryId && (
            <div className="space-y-2">
              <Label htmlFor="service_id">
                Specific service{" "}
                <span className="text-muted-foreground">(optional)</span>
              </Label>

              <select
                id="service_id"
                name="service_id"
                value={selectedServiceId}
                onChange={(event) => setSelectedServiceId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a specific service</option>

                {filteredServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>

              {filteredServices.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  There are no specific services available in this category yet.
                  You can still submit your request using the category.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request details */}
      <Card>
        <CardHeader>
          <CardTitle>What do you need?</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">
              Request title <span className="text-destructive">*</span>
            </Label>

            <Input
              id="title"
              name="title"
              placeholder="e.g. My air conditioner is not cooling"
              required
              minLength={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>

            <Textarea
              id="description"
              name="description"
              placeholder="Describe what you need done. Include any useful details about the problem or task."
              required
              minLength={10}
              rows={6}
            />

            <p className="text-xs text-muted-foreground">
              Give the service provider enough information to understand what
              you need.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Media */}
      <div className="space-y-4">
        <div>
          <label htmlFor="media" className="text-sm font-medium">
            Photos or videos
          </label>

          <p className="mt-1 text-sm text-muted-foreground">
            Add photos or videos that help explain the work you need. You can
            upload up to {MAX_MEDIA_FILES} files.
          </p>
        </div>

        <input
          ref={fileInputRef}
          id="media"
          name="media"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />

        <label
          htmlFor="media"
          className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition hover:bg-muted/50"
        >
          <ImagePlus className="mb-3 h-8 w-8 text-muted-foreground" />

          <span className="font-medium">
            {selectedFiles.length > 0
              ? "Add more photos or videos"
              : "Upload photos or videos"}
          </span>

          <span className="mt-1 text-sm text-muted-foreground">
            Click to select multiple files
          </span>
        </label>

        {mediaError && <p className="text-sm text-destructive">{mediaError}</p>}

        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Selected files ({selectedFiles.length}/{MAX_MEDIA_FILES})
              </p>

              <button
                type="button"
                onClick={clearSelectedFiles}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
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

      {/* Budget and schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Budget and schedule</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Estimated budget</Label>

              <Input
                id="budget"
                name="budget"
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 50000"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>

              <select
                id="currency"
                name="currency"
                defaultValue="NGN"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="NGN">NGN — Nigerian Naira</option>

                <option value="USD">USD — US Dollar</option>

                <option value="GBP">GBP — British Pound</option>

                <option value="EUR">EUR — Euro</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="preferred_date">Preferred date</Label>

              <Input id="preferred_date" name="preferred_date" type="date" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferred_time">Preferred time</Label>

              <Input id="preferred_time" name="preferred_time" type="time" />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border p-4">
            <Checkbox id="is_urgent" name="is_urgent" />

            <div className="space-y-1">
              <Label htmlFor="is_urgent" className="cursor-pointer">
                This is an urgent request
              </Label>

              <p className="text-xs text-muted-foreground">
                Mark this if you need the service as soon as possible.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Service location</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>

            <Input
              id="address"
              name="address"
              placeholder="House number, street, landmark..."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>

              <Input id="city" name="city" placeholder="e.g. Ibadan" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">State</Label>

              <Input id="state" name="state" placeholder="e.g. Oyo" />
            </div>
          </div>

          <input type="hidden" name="latitude" />

          <input type="hidden" name="longitude" />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" type="button">
          <Link href="/dashboard/customer/requests">Cancel</Link>
        </Button>

        <SubmitButton />
      </div>
    </form>
  );
}
