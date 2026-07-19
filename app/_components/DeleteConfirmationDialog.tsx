"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/app/_components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  isPending?: boolean;
  confirmLabel?: string;
  pendingLabel?: string;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  isPending = false,
  confirmLabel = "Delete",
  pendingLabel = "Deleting...",
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-w-[calc(100vw-2rem)] sm:w-full mx-auto rounded-2xl p-6">
        <AlertDialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <Trash2 className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-base sm:text-lg">
              {title}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-xs sm:text-sm leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="border-t my-4 sm:my-5" />
        
        <AlertDialogFooter className="!flex-row gap-2.5 sm:gap-3">
          <AlertDialogCancel className="flex-1 h-12 px-4 text-sm font-medium border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-xl">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="flex-1 h-12 px-4 text-sm font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-[0.98] transition-transform rounded-xl"
            disabled={isPending}
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
          >
            {isPending ? pendingLabel : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}