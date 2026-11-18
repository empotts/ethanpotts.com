import { wallpaperShot } from "@/components/Wallpaper";
import { iconRect, openWin } from "@/components/windows";
import { defineApp } from "../define";
import { appVersion } from "../version";

/** A one-frame flash, then the shot opens in the Photo window. */
function takePhoto() {
	const src = wallpaperShot.take?.();
	if (!src) return;
	const flash = document.createElement("div");
	flash.className = "pointer-events-none fixed inset-0 z-[300] bg-black";
	document.body.appendChild(flash);
	setTimeout(() => {
		flash.remove();
		openWin("photo", { payload: { src, taken: new Date() }, from: iconRect("camera") });
	}, 90);
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
