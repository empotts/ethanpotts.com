/** "2026-11-03" → "Nov 3, 2026". Formatted in UTC so server and client agree. */
export function formatDay(day: string) {
	return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
