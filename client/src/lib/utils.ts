import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a database timestamp for display.
 * The database stores timestamps in Vietnam time but without timezone info,
 * so we need to display them as-is without any timezone conversion.
 */
export function formatDbTimestamp(dateInput: Date | string): string {
  const date = new Date(dateInput);
  // Subtract 7 hours to counteract the automatic timezone conversion
  // because the database stores Vietnam time as if it were UTC
  const correctedDate = new Date(date.getTime() - 7 * 60 * 60 * 1000);
  return correctedDate.toLocaleString('vi-VN');
}
