"use client";

import { useActionState } from "react";
import { uploadCustomerAvatar, type AvatarUploadState } from "./avatar-actions";

const initialState: AvatarUploadState = {};

export function CustomerAvatarForm() {
  const [state, formAction, isPending] = useActionState(
    uploadCustomerAvatar,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp"
        required
        disabled={isPending}
      />

      {state.error && <p className="text-sm text-destructive">{state.error}</p>}

      {state.success && (
        <p className="text-sm text-green-600">{state.success}</p>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? "Uploading..." : "Upload photo"}
      </button>
    </form>
  );
}
