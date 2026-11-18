import { formatTime, setH24, useH24, useNow } from "@/components/clock";
import { Window } from "@/components/Window";
import { defineApp } from "../define";
import { appVersion } from "../version";

function Clock() {
	const h24 = useH24();
	const now = useNow(1000);
	return (
		<Window>
			<div className="p-5 text-center">
				<div className="font-ui text-4xl tabular-nums">{now ? formatTime(now, { h24, seconds: true }) : " "}</div>
				<div className="mt-1 text-sm">Rogers, Arkansas</div>
				<div className="mt-4 border-t-2 border-black pt-3 text-sm tabular-nums">Your time: {now ? formatTime(now, { h24, local: true }) : ""}</div>
				<button type="button" className="btn mt-4" onClick={() => setH24(!h24)}>
					{h24 ? "12-hour" : "24-hour"}
				</button>
			</div>
		</Window>
	);
}

export default defineApp({
	id: "clock",
	title: "Clock",
	icon: "clock",
	place: "extras",
	order: 30,
	description: "The time in Rogers, Arkansas.",
	window: { x: 380, y: 180, width: 300 },
	info: () => [["Kind", "Application"], ["Time zone", "America/Chicago"], ["Version", appVersion()]],
	component: Clock,
});
