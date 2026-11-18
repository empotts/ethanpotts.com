import { SCENES, setScene, wallpaperMode } from "@/components/Wallpaper";
import { defineApp } from "../define";
import { appVersion } from "../version";

/** A short note at the bottom of the screen naming the new scene. */
function toast(text: string) {
	document.querySelector(".scene-toast")?.remove();
	const el = document.createElement("div");
	el.className = "scene-toast win pop-in";
	el.setAttribute("role", "status");
	el.textContent = text;
	document.body.appendChild(el);
	setTimeout(() => el.remove(), 1800);
}

/** Each launch moves the wallpaper to the next sky: live, sunrise, golden hour, night, rain, snow, fog. */
function nextScene() {
	const i = SCENES.findIndex((s) => s.id === wallpaperMode.scene);
	const next = SCENES[(i + 1) % SCENES.length];
	setScene(next.id);
	toast(`Forecast: ${next.label}`);
}

export default defineApp({
	id: "forecast",
	title: "Forecast",
	icon: "cloud",
	place: "extras",
	order: 40,
	description: "Changes the wallpaper's sky: the live sky, sunrise, golden hour, night, rain, snow or fog.",
	info: () => [
		["Kind", "Application"],
		["Showing", SCENES.find((s) => s.id === wallpaperMode.scene)?.label ?? "Live"],
		["Scenes", String(SCENES.length)],
		["Version", appVersion()],
	],
	launch: nextScene,
});
