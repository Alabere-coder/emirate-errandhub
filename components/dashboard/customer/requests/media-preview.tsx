"use client";

import { useEffect, useState } from "react";
import { FileVideo, X } from "lucide-react";

type MediaPreviewProps = {
  file: File;
  onRemove: () => void;
};

export function MediaPreview({ file, onRemove }: MediaPreviewProps) {
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
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-black"
        aria-label={`Remove ${file.name}`}
      >
        <X className="h-4 w-4" />
      </button>

      <div className="truncate border-t bg-background px-2 py-1.5 text-xs">
        {file.name}
      </div>
    </div>
  );
}
