const CAIRO_TIMEZONE = "Africa/Cairo";

const toDateFromTimestamp = (timestamp: any): Date | null => {
  if (!timestamp) return null;

  if (timestamp?.toDate && typeof timestamp.toDate === "function") {
    const converted = timestamp.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime()) ? converted : null;
  }

  if (timestamp instanceof Date) {
    return Number.isNaN(timestamp.getTime()) ? null : timestamp;
  }

  if (typeof timestamp === "string" || typeof timestamp === "number") {
    const parsed = new Date(timestamp);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
};

export const getCurrentCairoDateString = (): string => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: CAIRO_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";

  return `${year}-${month}-${day}`;
};

export const getCairoTimeString = (timestamp: any): string => {
  const date = toDateFromTimestamp(timestamp);
  if (!date) return "—";

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: CAIRO_TIMEZONE,
  });
};
