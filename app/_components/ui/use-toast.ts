import { useEffect, useState, type ReactNode } from "react";
import type { ToastActionElement } from "@/app/_components/ui/toast";

export type Toast = {
  id: string;
  title: string;
  description?: ReactNode;
  action?: ToastActionElement;
  variant?: "destructive" | "default";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type ToastOptions = {
  title: string;
  description?: ReactNode;
  action?: ToastActionElement;
  variant?: "destructive" | "default";
};

const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 4000;

let toastCount = 0;
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
let listeners: Array<(state: Toast[]) => void> = [];
let toasts: Toast[] = [];

function genToastId() {
  toastCount = (toastCount + 1) % Number.MAX_VALUE;
  return toastCount.toString();
}

function dispatch(state: Toast[]) {
  toasts = state;
  listeners.forEach((listener) => listener(toasts));
}

function addToast(toast: Toast) {
  dispatch([toast, ...toasts].slice(0, TOAST_LIMIT));

  if (!toastTimeouts.has(toast.id)) {
    const timeout = setTimeout(() => {
      removeToast(toast.id);
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toast.id, timeout);
  }
}

function removeToast(toastId?: string) {
  if (!toastId) {
    toasts.forEach((toast) => {
      const timeout = toastTimeouts.get(toast.id);
      if (timeout) clearTimeout(timeout);
      toastTimeouts.delete(toast.id);
    });
    dispatch([]);
    return;
  }

  const timeout = toastTimeouts.get(toastId);
  if (timeout) clearTimeout(timeout);
  toastTimeouts.delete(toastId);

  dispatch(toasts.filter((toast) => toast.id !== toastId));
}

function toast(options: ToastOptions) {
  const id = genToastId();

  const dismiss = () => removeToast(id);
  const update = (next: ToastOptions) =>
    addToast({ ...next, id, open: true, onOpenChange: (open) => !open && dismiss() });

  addToast({
    ...options,
    id,
    open: true,
    onOpenChange: (open) => !open && dismiss(),
  });

  return {
    id,
    dismiss,
    update,
  };
}

export function useToast() {
  const [state, setState] = useState<Toast[]>(toasts);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((listener) => listener !== setState);
    };
  }, []);

  return {
    toast,
    dismiss: removeToast,
    toasts: state,
  };
}

export { toast };
