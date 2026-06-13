"use client";

import type { ReactNode } from "react";
import { useToast } from "@/app/_components/ui/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/app/_components/ui/toast";

export function ToastNotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { toasts, dismiss } = useToast();

  return (
    <ToastProvider>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant ?? "default"}
          open={toast.open ?? true}
          onOpenChange={(open) => {
            toast.onOpenChange?.(open);
            if (!open) dismiss(toast.id);
          }}
        >
          <div className="grid gap-1">
            <ToastTitle>{toast.title}</ToastTitle>
            {toast.description && (
              <ToastDescription>{toast.description}</ToastDescription>
            )}
          </div>
          {toast.action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
