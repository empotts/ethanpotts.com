import { readBest } from "@/kit/game/best";
import { defineApp } from "../define";
import { appVersion } from "../version";

export default defineApp({
	id: "singletrack",
	title: "Singletrack",
	icon: "bike",
	place: "games",
	order: 1,
	description: "Ride an endless Ozark trail: pump the downhills, hop the rocks, don't stall.",
	window: { x: 160, y: 60, width: 560 },
	info: () => [
		["Kind", "Game"],
		["Controls", "Space hop · ↓ pump"],
		["Your best", typeof window === "undefined" ? "—" : `${readBest("singletrack")} m`],
		["Version", appVersion()],
	],
	load: () => import("./Singletrack"),
});
