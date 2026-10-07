"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { FileVideo, ImagePlus, Loader2, Upload, X } from "lucide-react";

import {
  uploadJobMediaAction,
  type JobMediaActionState,
} from "@/lib/actions/job-media";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const MEDIA_TYPES = [
  {
    value: "before",
    label: "Before",
  },
  {
    value: "during",
    label: "During",
  },
  {
    value: "after",
    label: "After",
  },
  {
    value: "proof",
    label: "Proof of completion",
  },
  {
    value: "other",
    label: "Other",
  },
] as const;

const initialState: JobMediaActionState = {};

type JobMediaUploaderProps = {
  jobId: string;
};

export function JobMediaUploader({ jobId }: JobMediaUploaderProps) {
  const [state, formAction] = useActionState(
    uploadJobMediaAction,
    initialState,
  );

  const [files, setFiles] = useState<File[]>([]);
  const [mediaType, setMediaType] = useState("before");

  const [clientError, setClientError] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      setFiles([]);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [state.success]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);

    if (selectedFiles.length === 0) {
      return;
    }

    setClientError("");

    const invalidFile = selectedFiles.find(
      (file) =>
        !file.type.startsWith("image/") && !file.type.startsWith("video/"),
    );

    if (invalidFile) {
      setClientError(
        `"${invalidFile.name}" is not a supported image or video.`,
      );

      event.target.value = "";
      return;
    }

    const oversizedFile = selectedFiles.find(
      (file) => file.size > MAX_FILE_SIZE,
    );

    if (oversizedFile) {
      setClientError(`"${oversizedFile.name}" is larger than 50MB.`);

      event.target.value = "";
      return;
    }

    const combinedFiles = [...files, ...selectedFiles];

    if (combinedFiles.length > MAX_FILES) {
      setClientError(`You can upload a maximum of ${MAX_FILES} files.`);

      event.target.value = "";
      return;
    }

    setFiles(combinedFiles);

    /*
     * Keep the actual input synchronized with
     * our React state so the Server Action receives
     * every selected file.
     */
    const dataTransfer = new DataTransfer();

    combinedFiles.forEach((file) => {
      dataTransfer.items.add(file);
    });

    event.target.files = dataTransfer.files;
  };

  const removeFile = (index: number) => {
    const updatedFiles = files.filter((_, fileIndex) => fileIndex !== index);

    setFiles(updatedFiles);

    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer();

      updatedFiles.forEach((file) => {
        dataTransfer.items.add(file);
      });

      fileInputRef.current.files = dataTransfer.files;
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setClientError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job media</CardTitle>
      </CardHeader>

      <CardContent>
        <form ref={formRef} action={formAction} className="space-y-6">
          <input type="hidden" name="jobId" value={jobId} />

          <input type="hidden" name="mediaType" value={mediaType} />

          <div className="space-y-2">
            <label htmlFor="media-type" className="text-sm font-medium">
              Media type
            </label>

            <select
              id="media-type"
              value={mediaType}
              onChange={(event) => setMediaType(event.target.value)}
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              {MEDIA_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              id="job-media"
              name="files"
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <label
              htmlFor="job-media"
              className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center transition hover:bg-muted/50"
            >
              <ImagePlus className="mb-3 h-8 w-8 text-muted-foreground" />

              <span className="font-medium">Add photos or videos</span>

              <span className="mt-1 text-sm text-muted-foreground">
                Up to {MAX_FILES} files, 50MB each
              </span>
            </label>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Selected files ({files.length})
                </p>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFiles}
                >
                  Clear all
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {files.map((file, index) => (
                  <MediaPreview
                    key={`${file.name}-${file.size}-${index}`}
                    file={file}
                    onRemove={() => removeFile(index)}
                  />
                ))}
              </div>
            </div>
          )}

          {(clientError || state.error) && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {clientError || state.error}
            </div>
          )}

          {state.success && (
            <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
              {state.success}
            </div>
          )}

          <UploadButton disabled={files.length === 0} />
        </form>
      </CardContent>
    </Card>
  );
}

function UploadButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={disabled || pending}
      className="w-full sm:w-auto"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Uploading...
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          Upload media
        </>
      )}
    </Button>
  );
}

function MediaPreview({
  file,
  onRemove,
}: {
  file: File;
  onRemove: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);

    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const isVideo = file.type.startsWith("video/");

  return (
    <div className="group relative overflow-hidden rounded-xl border bg-muted">
      <div className="aspect-square">
        {previewUrl && !isVideo ? (
          <img
            src={previewUrl}
            alt={file.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FileVideo className="h-10 w-10 text-muted-foreground" />
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="truncate border-t bg-background px-2 py-1.5 text-xs">
        {file.name}
      </div>
    </div>
  );
}
