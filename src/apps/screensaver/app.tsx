import { desktopActions } from "@/components/desktop/data";
import { defineApp } from "../define";
import { appVersion } from "../version";

export default defineApp({
	id: "screensaver",
	title: "Screensaver",
	icon: "monitor",
	place: "extras",
	order: 50,
	info: () => [["Kind", "Application"], ["Starts after", "2 minutes idle"], ["Version", appVersion()]],
	launch: () => desktopActions.startScreensaver(),
});
