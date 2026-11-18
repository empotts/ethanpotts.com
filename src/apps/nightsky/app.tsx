import { wallpaperMode } from "@/components/Wallpaper";
import { defineApp } from "../define";
import { appVersion } from "../version";

function toggleNight() {
	const on = !wallpaperMode.night;
	wallpaperMode.night = on;
	wallpaperMode.redraw();
	if (on) setTimeout(() => wallpaperMode.shoot(), 400);
}

export default defineApp({
	id: "nightsky",
	title: "Night Sky",
	icon: "moon",
	place: "extras",
	order: 40,
	info: () => [["Kind", "Application"], ["Shows", wallpaperMode.night ? "Real time" : "Night"], ["Version", appVersion()]],
	launch: toggleNight,
});
