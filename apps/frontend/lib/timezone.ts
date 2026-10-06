// Date helpers that work in a given IANA time zone (the sagra one), not in the browser's

type ZonedParts = { hour: number; minute: number; second: number; day: string; month: string };

const partsFormatters = new Map<string, Intl.DateTimeFormat>();

function zonedParts(date: Date, timeZone: string): ZonedParts {
  let dtf = partsFormatters.get(timeZone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
    partsFormatters.set(timeZone, dtf);
  }
  const map = new Map(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    hour: Number(map.get("hour")),
    minute: Number(map.get("minute")),
    second: Number(map.get("second")),
    day: map.get("day") ?? "",
    month: map.get("month") ?? "",
  };
}

// "HH:mm dd/MM" in the given time zone, for chart labels
export function formatTimeDay(date: Date, timeZone: string): string {
  const p = zonedParts(date, timeZone);
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")} ${p.day}/${p.month}`;
}

// Floors a timestamp to a multiple of `hours` within the day of the given time zone
// (hours = 1, 4, 12 or 24). Subtracts the time elapsed since the boundary, so it stays correct
// with any offset; only the rare buckets crossing a DST change are approximate.
export function floorToHoursInZone(tsMs: number, hours: number, timeZone: string): number {
  const date = new Date(tsMs);
  const p = zonedParts(date, timeZone);
  const hoursPast = p.hour % hours;
  const elapsedMs = ((hoursPast * 60 + p.minute) * 60 + p.second) * 1000 + date.getUTCMilliseconds();
  return tsMs - elapsedMs;
}
