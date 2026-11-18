import { useEffect, useRef } from "react";
import { wallpaperMode } from "../Wallpaper";
import { boot } from "../windows";

/** Typed words that open hidden windows. Ignored while typing in a field. */
export function useTypedWords(words: Record<string, () => void>) {
	const ref = useRef(words);
	ref.current = words;
	useEffect(() => {
		let buf = "";
		const onKey = (e: KeyboardEvent) => {
			const el = e.target as HTMLElement | null;
			if (e.metaKey || e.ctrlKey || e.altKey || el?.closest("input, textarea, [contenteditable]")) return;
			if (e.key.length !== 1) return;
			buf = (buf + e.key.toLowerCase()).slice(-12);
			for (const [w, fn] of Object.entries(ref.current))
				if (buf.endsWith(w)) {
					buf = "";
					fn();
				}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
}

let greeted = false;
export function greet() {
	if (greeted) return;
	greeted = true;
	const cs = getComputedStyle(document.documentElement);
	const fg = cs.getPropertyValue("--fg").trim() || "#000";
	const bg = cs.getPropertyValue("--bg").trim() || "#fff";
	const art = [" ███████ ██████ ", " ██      ██   ██", " █████   ██████ ", " ██      ██     ", " ███████ ██     "].join("\n");
	const box = `color:${fg};background:${bg};font-family:monospace;padding:2px 6px;`;
	console.log(`%c${art}`, `${box}line-height:1.1;`);
	console.log(`%cSource: https://github.com/empotts/ethanpotts.com\nType "hogs" on the desktop.`, box);
}

/** Starts after two idle minutes (or on demand); any input ends it. */
export function useScreensaver(enabled: boolean) {
	const start = useRef(() => {});
	useEffect(() => {
		let last = Date.now();
		let grace = 0;
		let active = false;
		const set = (v: boolean) => {
			active = v;
			wallpaperMode.saver = v;
			if (v) document.documentElement.dataset.saver = "";
			else delete document.documentElement.dataset.saver;
		};
		const wake = () => {
			last = Date.now();
			if (active && last > grace) set(false);
		};
		start.current = () => {
			grace = Date.now() + 800;
			set(true);
		};
		const id = setInterval(() => {
			if (enabled && !active && Date.now() - last > 120_000) start.current();
		}, 5000);
		const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;
		for (const ev of events) window.addEventListener(ev, wake, { passive: true });
		return () => {
			clearInterval(id);
			for (const ev of events) window.removeEventListener(ev, wake);
			set(false);
		};
	}, [enabled]);
	return () => start.current();
}

/**
 * Windows and articles animate in only once someone acts. Route code hydrates in
 * its own pass after the desktop, so flipping the flag on mount replayed the
 * entrance animation on every reload.
 */
export function useArmAnimations() {
	useEffect(() => {
		const stop = () => {
			window.removeEventListener("pointerdown", arm, true);
			window.removeEventListener("keydown", arm, true);
		};
		const arm = () => {
			boot.hydrated = true;
			stop();
		};
		window.addEventListener("pointerdown", arm, true);
		window.addEventListener("keydown", arm, true);
		return stop;
	}, []);
}

/** Arrow keys move focus between desktop icons, nearest first in that direction. */
export function moveIconFocus(e: React.KeyboardEvent) {
	const dirs: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
	const d = dirs[e.key];
	const from = (e.target as HTMLElement).closest<HTMLElement>("[data-desk-icon]");
	if (!d || !from) return;
	const a = from.getBoundingClientRect();
	let best: HTMLElement | null = null;
	let bestScore = Number.POSITIVE_INFINITY;
	for (const el of document.querySelectorAll<HTMLElement>("[data-desk-icon]")) {
		if (el === from) continue;
		const b = el.getBoundingClientRect();
		const dx = b.left + b.width / 2 - (a.left + a.width / 2);
		const dy = b.top + b.height / 2 - (a.top + a.height / 2);
		const along = dx * d[0] + dy * d[1];
		if (along <= 1) continue;
		const score = along + Math.abs(dx * d[1] + dy * d[0]) * 2;
		if (score < bestScore) {
			bestScore = score;
			best = el;
		}
	}
	if (best) {
		e.preventDefault();
		best.focus();
	}
}
