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
  // Parse YYYY-MM-DD as local time to avoid UTC offset shifting the date
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Converts a date string to a french time string (HH'h'mm), without date or timezone.
 * Uses local time components to avoid UTC offset shifts.
 */
export function toFrenchTime(dateString: string): string {
  const date: Date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}h${minutes}`;
}

/**
 * Computes a human-readable label for the estimated wait time before a match starts.
 * - Returns null if estimatedStartAt is null (nothing to display).
 * - If the wait is 60 minutes or less, returns a relative label (e.g. "Dans environ 25 min").
 * - If the wait exceeds 60 minutes, returns the absolute estimated start time (e.g. "13h30").
 * - If the estimated start time has already passed (wait <= 0), returns "Imminent".
 */
export function estimatedWaitLabel(estimatedStartAt: string | null, now: Date = new Date()): string | null {
  if (!estimatedStartAt) {
    return null;
  }

  const estimatedStart = new Date(estimatedStartAt);
  const waitInMinutes = Math.round((estimatedStart.getTime() - now.getTime()) / 60000);

  if (waitInMinutes <= 0) {
    return 'Imminent';
  }

  if (waitInMinutes <= 60) {
    return `Dans environ ${waitInMinutes} min`;
  }

  return toFrenchTime(estimatedStartAt);
}
