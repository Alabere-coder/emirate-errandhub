"use client";

import { useState } from "react";
import { Play, X } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type JobMediaGalleryItem = {
  id: string;
  file_url: string;
  file_type: string;
  media_type: "before" | "during" | "after" | "proof" | "other";
  created_at: string;
  signed_url: string;
};

type JobMediaGalleryProps = {
  media: JobMediaGalleryItem[];
};

const MEDIA_LABELS: Record<JobMediaGalleryItem["media_type"], string> = {
  before: "Before",
  during: "During",
  after: "After",
  proof: "Proof of completion",
  other: "Other",
};

const MEDIA_ORDER: JobMediaGalleryItem["media_type"][] = [
  "before",
  "during",
  "after",
  "proof",
  "other",
];

export function JobMediaGallery({ media }: JobMediaGalleryProps) {
  const [selectedMedia, setSelectedMedia] =
    useState<JobMediaGalleryItem | null>(null);

  if (media.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Media</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="rounded-xl border border-dashed p-8 text-center">
            <p className="text-sm font-medium">No job media yet</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Photos and videos uploaded during the job will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const groupedMedia = MEDIA_ORDER.map((type) => ({
    type,
    items: media.filter((item) => item.media_type === type),
  })).filter((group) => group.items.length > 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>
            Job Media
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({media.length})
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="space-y-8">
            {groupedMedia.map((group) => (
              <section key={group.type}>
                <div className="mb-3">
                  <h3 className="font-semibold">{MEDIA_LABELS[group.type]}</h3>

                  <p className="text-sm text-muted-foreground">
                    {group.items.length}{" "}
                    {group.items.length === 1 ? "file" : "files"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {group.items.map((item) => {
                    const isVideo = item.file_type.startsWith("video/");

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedMedia(item)}
                        className="group relative overflow-hidden rounded-xl border bg-muted text-left"
                      >
                        <div className="aspect-square">
                          {isVideo ? (
                            <div className="relative flex h-full w-full items-center justify-center">
                              <video
                                src={item.signed_url}
                                className="h-full w-full object-cover"
                                preload="metadata"
                              />

                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white">
                                  <Play className="ml-0.5 h-5 w-5 fill-current" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <img
                              src={item.signed_url}
                              alt={`${MEDIA_LABELS[item.media_type]} job media`}
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                            />
                          )}
                        </div>

                        <div className="border-t bg-background px-2 py-2">
                          <span className="text-xs text-muted-foreground">
                            {new Intl.DateTimeFormat("en-NG", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(item.created_at))}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedMedia(null)}
        >
          <button
            type="button"
            onClick={() => setSelectedMedia(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Close media viewer"
          >
            <X className="h-5 w-5" />
          </button>

          <div
            className="max-h-[90vh] max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            {selectedMedia.file_type.startsWith("video/") ? (
              <video
                src={selectedMedia.signed_url}
                controls
                autoPlay
                className="max-h-[85vh] max-w-full rounded-xl"
              />
            ) : (
              <img
                src={selectedMedia.signed_url}
                alt={`${MEDIA_LABELS[selectedMedia.media_type]} job media`}
                className="max-h-[85vh] max-w-full rounded-xl object-contain"
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
