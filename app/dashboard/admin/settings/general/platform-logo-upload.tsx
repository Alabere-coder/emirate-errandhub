"use client";

import { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";

type PlatformLogoUploadProps = {
  initialLogoUrl: string;
  canEdit: boolean;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
];

function getPlatformLogoPath(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const marker = "/storage/v1/object/public/platform-assets/";

    const markerIndex = parsedUrl.pathname.indexOf(marker);

    if (markerIndex === -1) return null;

    const path = parsedUrl.pathname.slice(markerIndex + marker.length);

    return path ? decodeURIComponent(path) : null;
  } catch {
    return null;
  }
}

export default function PlatformLogoUpload({
  initialLogoUrl,
  canEdit,
}: PlatformLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLogoUrl(initialLogoUrl);
  }, [initialLogoUrl]);

  async function handleUpload(file?: File) {
    if (!file) return;

    setError("");
    setSuccess("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Choose a PNG, JPEG, WebP, or SVG image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Logo must not exceed 2 MB.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    try {
      const extension =
        file.type === "image/svg+xml"
          ? "svg"
          : file.type === "image/png"
            ? "png"
            : file.type === "image/webp"
              ? "webp"
              : "jpg";

      const filePath = `logos/platform-logo-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("platform-assets")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("platform-assets")
        .getPublicUrl(filePath);

      console.log("Uploaded file path:", filePath);
      console.log("Supabase public URL response:", data);

      const publicUrl = data.publicUrl;

      const previousLogoPath = getPlatformLogoPath(logoUrl);

      console.log("Previous logo URL:", logoUrl);
      console.log("Extracted logo path:", previousLogoPath);

      const { error: updateError } = await supabase
        .from("platform_settings")
        .update({
          platform_logo_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .not("id", "is", null);

      if (updateError) {
        await supabase.storage.from("platform-assets").remove([filePath]);
        throw updateError;
      }

      if (previousLogoPath && previousLogoPath !== filePath) {
        const { error: cleanupError } = await supabase.storage
          .from("platform-assets")
          .remove([previousLogoPath]);

        if (cleanupError) {
          console.error("Previous platform logo cleanup error:", cleanupError);
        }
      }

      setLogoUrl(publicUrl);
      setSuccess("Platform logo uploaded successfully.");
      console.log("Saved logo URL in component:", publicUrl);
    } catch (err) {
      console.error("Platform logo upload error:", err);
      setError(
        err instanceof Error ? err.message : "Unable to upload platform logo.",
      );
    } finally {
      setLoading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    if (!logoUrl) return;

    setError("");
    setSuccess("");
    setLoading(true);

    const supabase = createClient();
    try {
      const previousLogoPath = getPlatformLogoPath(logoUrl);

      console.log("Logo URL during removal:", logoUrl);
      console.log("Storage path during removal:", previousLogoPath);

      const { error: updateError } = await supabase
        .from("platform_settings")
        .update({
          platform_logo_url: null,
          updated_at: new Date().toISOString(),
        })
        .not("id", "is", null);

      if (updateError) throw updateError;

      setLogoUrl("");

      const { data: permissionCheck, error: permissionError } =
        await supabase.rpc("is_super_admin");

      console.log("Super admin permission:", permissionCheck);
      console.log("Permission check error:", permissionError);

      if (previousLogoPath) {
        const { data: deletedFiles, error: cleanupError } =
          await supabase.storage
            .from("platform-assets")

            .remove([previousLogoPath]);

        console.log("Deleted files response:", deletedFiles);
        console.log("Deletion error:", cleanupError);
      }

      setSuccess("Platform logo removed successfully.");
    } catch (err) {
      console.error("Platform logo removal error:", err);
      setError(
        err instanceof Error ? err.message : "Unable to remove platform logo.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">Platform Logo</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload the logo displayed across Emirate ErrandHub. PNG, JPEG, WebP,
          and SVG are supported. Maximum size: 2 MB.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
        <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt="Platform logo"
              width={160}
              height={160}
              unoptimized
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <ImagePlus className="size-9 text-muted-foreground" />
          )}
        </div>

        {canEdit && (
          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              disabled={loading}
              onChange={(event) => handleUpload(event.target.files?.[0])}
            />

            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {logoUrl ? "Replace logo" : "Upload logo"}
            </button>

            {logoUrl && (
              <button
                type="button"
                disabled={loading}
                onClick={handleRemove}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-destructive/30 px-4 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                Remove
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-emerald-700">
          {success}
        </p>
      )}

      {!canEdit && (
        <p className="text-xs text-muted-foreground">
          Only a Top level admin can change the platform logo.
        </p>
      )}
    </div>
  );
}
