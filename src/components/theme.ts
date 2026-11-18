import { useEffect, useState } from "react";

export const THEMES = [
	{ id: "auto", label: "Match system" },
	{ id: "classic", label: "Classic" },
	{ id: "dark", label: "Dark" },
	{ id: "phosphor", label: "Green phosphor" },
	{ id: "amber", label: "Amber" },
	{ id: "blueprint", label: "Blueprint" },
	{ id: "handheld", label: "Handheld" },
	{ id: "paper", label: "Paper" },
	{ id: "razorback", label: "Razorback" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
const KEY = "ep-theme";
/** "off" keeps the original one-bit look: every accent falls back to the ink colour. */
const COLOR_KEY = "ep-color";
/** "on" adds a CRT glass layer: scanlines, glow and a vignette. */
const CRT_KEY = "ep-crt";

/** Runs in <head> before first paint so the saved look never flashes. */
export const themeBootScript = `try{var d=document.documentElement,t=localStorage.getItem("${KEY}");if(t&&t!=="auto")d.dataset.theme=t;if(localStorage.getItem("${COLOR_KEY}")==="off")d.dataset.color="off";if(localStorage.getItem("${CRT_KEY}")==="on")d.dataset.crt=""}catch(e){}`;

export function applyTheme(id: ThemeId) {
	const el = document.documentElement;
	if (id === "auto") delete el.dataset.theme;
	else el.dataset.theme = id;
	try {
		localStorage.setItem(KEY, id);
	} catch {}
}

export function useTheme() {
	const [theme, setTheme] = useState<ThemeId>("auto");
	useEffect(() => {
		try {
			setTheme((localStorage.getItem(KEY) as ThemeId | null) ?? "auto");
		} catch {}
	}, []);
	return [
		theme,
		(id: ThemeId) => {
			applyTheme(id);
			setTheme(id);
		},
	] as const;
}

/** A boolean look setting stored in localStorage and mirrored on <html>. */
function useFlag(key: string, attr: "color" | "crt", fromStore: (v: string | null) => boolean, apply: (on: boolean) => void) {
	const [on, setOn] = useState(attr === "color");
	useEffect(() => {
		try {
			setOn(fromStore(localStorage.getItem(key)));
		} catch {}
		// biome-ignore lint/correctness/useExhaustiveDependencies: read once on mount
	}, []);
	return [
		on,
		(v: boolean) => {
			apply(v);
			setOn(v);
		},
	] as const;
}

export function useColorAccents() {
	return useFlag(
		COLOR_KEY,
		"color",
		(v) => v !== "off",
		(on) => {
			const el = document.documentElement;
			if (on) delete el.dataset.color;
			else el.dataset.color = "off";
			try {
				localStorage.setItem(COLOR_KEY, on ? "on" : "off");
			} catch {}
		},
	);
}

export function useCrt() {
	return useFlag(
		CRT_KEY,
		"crt",
		(v) => v === "on",
		(on) => {
			const el = document.documentElement;
			if (on) el.dataset.crt = "";
			else delete el.dataset.crt;
			try {
				localStorage.setItem(CRT_KEY, on ? "on" : "off");
			} catch {}
		},
	);
}

/** Calls back whenever the palette may have changed: theme, colour setting or system scheme. */
export function onPaletteChange(cb: () => void) {
	const mo = new MutationObserver(cb);
	mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "data-color"] });
	const mq = window.matchMedia("(prefers-color-scheme: dark)");
	mq.addEventListener("change", cb);
	return () => {
		mo.disconnect();
		mq.removeEventListener("change", cb);
	};
}
