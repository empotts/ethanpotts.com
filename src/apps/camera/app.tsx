import { defineApp } from "../define";
import { appVersion } from "../version";

/** A camera pointed at the wallpaper. It starts badly exposed; set aperture, shutter and ISO to get it right. */
export default defineApp({
	id: "camera",
	title: "Camera",
	icon: "camera",
	place: "extras",
	order: 20,
	description: "Photograph the wallpaper. Set the aperture, shutter and ISO until the meter reads zero.",
	window: { x: 240, y: 60, width: 500, minWidth: 340 },
	info: () => [["Kind", "Application"], ["Controls", "Aperture · Shutter · ISO"], ["Subject", "The wallpaper"], ["Version", appVersion()]],
	load: () => import("./Camera"),
});
