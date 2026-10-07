"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type RequestMediaItem = {
  id: string;
  file_url: string;
  file_type: string;
  created_at: string;
  signed_url: string;
};

type RequestMediaGalleryProps = {
  media: RequestMediaItem[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function RequestMediaGallery({ media }: RequestMediaGalleryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer's attached media</CardTitle>
      </CardHeader>

      <CardContent>
        {media.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            The customer did not attach any images or videos to this request.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {media.map((item) => {
              const isVideo = item.file_type.startsWith("video/");

              return (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-lg border bg-muted/20"
                >
                  {isVideo ? (
                    <video
                      src={item.signed_url}
                      controls
                      preload="metadata"
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <a
                      href={item.signed_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={item.signed_url}
                        alt="Customer attachment"
                        className="aspect-video w-full object-cover transition-opacity hover:opacity-90"
                      />
                    </a>
                  )}

                  <div className="px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      Attached {formatDate(item.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
