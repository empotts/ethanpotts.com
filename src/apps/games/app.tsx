import { useNavigate } from "@tanstack/react-router";
import { PixelIcon } from "@/components/icons";
import { Window } from "@/components/Window";
import { appsIn, preloadApp } from "../index";
import { defineApp } from "../define";

function Games() {
	const games = appsIn("games");
	const navigate = useNavigate();
	// Each game has its own URL, so a running game can be linked.
	const play = (id: string) => navigate({ to: "/apps/$id", params: { id } });
	return (
		<Window>
			<div className="flex justify-between border-b border-black px-3 py-1 text-xs">
				<span>{games.length} {games.length === 1 ? "game" : "games"}</span>
				<span>double-click to play</span>
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-x-2 gap-y-4 p-4">
				{games.map((g) => (
					<button
						key={g.id}
						type="button"
						data-desk-icon
						onPointerEnter={() => preloadApp(g.id)}
						onDoubleClick={() => play(g.id)}
						onKeyDown={(e) => e.key === "Enter" && play(g.id)}
						className="group flex flex-col items-center gap-1 outline-none"
						title={g.description}
					>
						<span className="group-focus:bg-black"><PixelIcon name={g.icon === "logo" ? "app" : g.icon} size={36} /></span>
						<span className="px-1 text-center font-ui text-[13px] leading-tight group-focus:bg-black group-focus:text-white">{g.title}</span>
					</button>
				))}
			</div>
		</Window>
	);
}

/** A folder of every app with `place: "games"`. */
export default defineApp({
	id: "games",
	title: "Games",
	icon: "gamepad",
	place: "extras",
	order: 5,
	description: "Small games that run on the desktop.",
	window: { x: 300, y: 140, width: 320 },
	info: () => [["Kind", "Folder"], ["Items", String(appsIn("games").length)]],
	component: Games,
});
