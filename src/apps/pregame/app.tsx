import { defineApp } from "../define";
import { appVersion } from "../version";

export default defineApp({
	id: "pregame",
	title: "Pregame",
	icon: "drum",
	place: "extras",
	order: 10,
	description: "Two marching band pregame drills, Big A and HOGS, played on a one-bit field.",
	window: { x: 200, y: 90, width: 540, resizable: true, minWidth: 340 },
	info: () => [["Kind", "Application"], ["Marchers", "245"], ["Tempo", "152 bpm · 1.6× playback"], ["Version", appVersion()]],
	load: () => import("./Pregame"),
});
