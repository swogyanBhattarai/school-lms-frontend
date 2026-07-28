import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { isAxiosError } from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError(error)) {
    const data = error.response?.data;

    if (typeof data === "string" && data.trim()) {
      return data;
    }

    if (data && typeof data === "object") {
      const message = (data as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }

      const fieldMessages = Object.values(data).filter(
        (value) => typeof value === "string" && value.trim(),
      );

      if (fieldMessages.length > 0) {
        return fieldMessages.join("\n");
      }
    }
  }

  return fallback;
};

/**
 * Convert a Date to a YYYY-MM-DD string in the browser's local timezone.
 * Pass no argument to get today's date.
 *
 * Unlike date.toISOString().split('T')[0], this does NOT shift the date to UTC,
 * so it produces the correct local date regardless of timezone offset.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
