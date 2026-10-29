"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Trash2, UserRound } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type AvatarUploadProps = {
  userId: string;
  avatarUrl: string | null;
  fullName: string;
};

const MAX_FILE_SIZE = 2 * 1024 * 1024;

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function AvatarUpload({
  userId,
  avatarUrl,
  fullName,
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState(avatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleUpload(file?: File) {
    if (!file) return;

    setError("");
    setSuccess("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Image must not exceed 2 MB.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setLoading(true);

    try {
      const supabase = createClient();

      const fileExtension = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExtension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const response = await fetch("/api/profile/avatar", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarUrl: publicUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        await supabase.storage.from("avatars").remove([filePath]);
        throw new Error(result.error ?? "Unable to save profile picture.");
      }

      setCurrentAvatar(publicUrl);
      setPreview(null);
      setSuccess("Profile picture updated successfully.");

      window.dispatchEvent(new Event("profile-avatar-updated"));
    } catch (err) {
      console.error("Avatar upload error:", err);
      setPreview(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload profile picture.",
      );
    } finally {
      URL.revokeObjectURL(objectUrl);
      setLoading(false);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    if (!currentAvatar) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Unable to remove profile picture.");
      }

      setCurrentAvatar(null);
      setPreview(null);
      setSuccess("Profile picture removed successfully.");
    } catch (err) {
      console.error("Avatar removal error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove profile picture.",
      );
    } finally {
      setLoading(false);
    }
  }

  const displayedImage = preview ?? currentAvatar;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex size-36 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-background bg-emerald-100 text-2xl font-bold text-emerald-800 shadow-sm">
          {displayedImage ? (
            <Image
              src={displayedImage}
              alt={`${fullName}'s profile picture`}
              fill
              unoptimized
              className="object-cover"
              sizes="96px"
            />
          ) : initials ? (
            initials
          ) : (
            <UserRound className="size-10" />
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
              <Loader2 className="size-6 animate-spin" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <p className="font-semibold">Profile photo</p>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={loading}
              onChange={(event) => handleUpload(event.target.files?.[0])}
            />

            <Button
              type="button"
              size="sm"
              disabled={loading}
              onClick={() => fileInputRef.current?.click()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Camera className="mr-2 size-4" />
              {currentAvatar ? "Change photo" : "Upload photo"}
            </Button>

            {currentAvatar && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={loading}
                onClick={handleRemove}
              >
                <Trash2 className="mr-2 size-4" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      {success && (
        <p role="status" className="text-sm text-emerald-600">
          {success}
        </p>
      )}
    </div>
  );
}
