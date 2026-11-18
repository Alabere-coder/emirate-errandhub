"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ShieldCheck } from "lucide-react";

import { CreateAdminForm } from "./create-admin-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function CreateAdminDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      router.refresh();
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button className="gap-2 bg-emerald-600 text-white hover:bg-emerald-700">
            <UserPlus className="size-4" />
            Create Administrator
          </Button>
        }
      />

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-5" />
          </div>

          <DialogTitle className="text-xl">Create Administrator</DialogTitle>

          <DialogDescription>
            Enter the details below to create a new administrator account for
            Emirate ErrandHub.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-3">
          <CreateAdminForm />
        </div>

        <p className="text-xs leading-5 text-muted-foreground">
          After creating the account, copy the temporary password before closing
          this dialog. It will not be displayed again after you leave or refresh
          the page.
        </p>
      </DialogContent>
    </Dialog>
  );
}
