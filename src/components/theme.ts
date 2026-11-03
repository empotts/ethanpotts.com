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
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];
const KEY = "ep-theme";

/** Runs in <head> before first paint so the saved theme never flashes. */
export const themeBootScript = `try{var t=localStorage.getItem("${KEY}");if(t&&t!=="auto")document.documentElement.dataset.theme=t}catch(e){}`;

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
