import { wallpaperShot } from "@/components/Wallpaper";
import { iconRect, openWin } from "@/components/windows";
import { defineApp } from "../define";
import { appVersion } from "../version";

/** The camera icon blinks like a shutter (no full-screen flash), then the shot opens in the Photo window. */
function takePhoto() {
	const src = wallpaperShot.take?.();
	if (!src) return;
	const icon = document.querySelector<HTMLElement>('[data-app-icon="camera"]');
	icon?.classList.remove("shutter");
	void icon?.offsetWidth;
	icon?.classList.add("shutter");
	setTimeout(() => openWin("photo", { payload: { src, taken: new Date() }, from: iconRect("camera") }), 160);
}

export default defineApp({
	id: "camera",
	title: "Camera",
	icon: "camera",
	place: "extras",
	order: 20,
	info: () => [["Kind", "Application"], ["Output", "Dithered PNG"], ["Subject", "The wallpaper"], ["Version", appVersion()]],
	launch: takePhoto,
});
