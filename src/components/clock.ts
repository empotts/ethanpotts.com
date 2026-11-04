import { useEffect, useState, useSyncExternalStore } from "react";
import { profile } from "@/data/profile";

const KEY = "ep-clock-24h";
let h24 = false;
try {
	h24 = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";
} catch {}
const subs = new Set<() => void>();

export function setH24(v: boolean) {
	h24 = v;
	try {
		localStorage.setItem(KEY, v ? "1" : "0");
	} catch {}
	for (const s of subs) s();
}

/** Whether clocks show 24-hour time. Shared by the menu bar and the Clock window. */
export function useH24() {
	return useSyncExternalStore(
		(cb) => {
			subs.add(cb);
			return () => subs.delete(cb);
		},
		() => h24,
		() => false,
	);
}

export function formatTime(d: Date, opts: { h24: boolean; seconds?: boolean; local?: boolean }) {
	return d.toLocaleTimeString("en-US", {
		timeZone: opts.local ? undefined : profile.timezone,
		hour: "numeric",
		minute: "2-digit",
		second: opts.seconds ? "2-digit" : undefined,
		hourCycle: opts.h24 ? "h23" : "h12",
	});
}

/** The current time, refreshed every `ms`. Null until mounted so server and client agree. */
export function useNow(ms: number) {
	const [now, setNow] = useState<Date | null>(null);
	useEffect(() => {
		setNow(new Date());
		const id = setInterval(() => setNow(new Date()), ms);
		return () => clearInterval(id);
	}, [ms]);
	return now;
}
