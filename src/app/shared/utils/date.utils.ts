/**
 * Converts a Date object to an ISO date string (YYYY-MM-DD), without time or timezone.
 * Uses local date components to avoid UTC offset shifts.
 */
export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a date string to a french date string (DD/MM/YYYY), without time or timezone.
 * Uses local date components to avoid UTC offset shifts.
 */
export function toFrenchDate(dateString: string): string {
  const date: Date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

export function fromBackendToDate(dateString: string): Date {
  return new Date(dateString);
}
