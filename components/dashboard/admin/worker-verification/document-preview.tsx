"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";

type DocumentPreviewProps = {
  url: string;
  documentType: string;
};

export function DocumentPreview({ url, documentType }: DocumentPreviewProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-xl border bg-muted/30"
      >
        <img
          src={url}
          alt={`${documentType} document`}
          className="max-h-80 w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
        />

        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <span className="flex items-center gap-2 rounded-lg bg-background/90 px-3 py-2 text-sm font-medium opacity-0 shadow transition-opacity group-hover:opacity-100">
            <ZoomIn className="h-4 w-4" />
            View Full Image
          </span>
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-4 top-4 z-10 rounded-full bg-background/90 p-2"
            aria-label="Close image"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="flex max-h-[95vh] max-w-[95vw] items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={url}
              alt={`${documentType} document`}
              className="max-h-[95vh] max-w-[95vw] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
