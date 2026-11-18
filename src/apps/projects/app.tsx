import { useState } from "react";
import { PixelIcon } from "@/components/icons";
import { Window } from "@/components/Window";
import { openWin } from "@/components/windows";
import { publicProjects } from "@/data/profile";
import { defineApp } from "../define";

function Projects() {
	const [selected, setSelected] = useState<string | null>(null);
	return (
		<Window>
			<div className="flex justify-between border-b border-black px-3 py-1 text-xs">
				<span>{publicProjects.length} items</span>
				<span>click twice to open</span>
			</div>
			<div className="grid grid-cols-[repeat(auto-fill,minmax(92px,1fr))] gap-x-2 gap-y-4 p-4">
				{publicProjects.map((p) => {
					const active = selected === p.slug;
					const open = (e: React.SyntheticEvent) => openWin("project", { payload: p, from: e.currentTarget });
					return (
						<button
							key={p.slug}
							type="button"
							onClick={(e) => (active ? open(e) : setSelected(p.slug))}
							onDoubleClick={open}
							onKeyDown={(e) => e.key === "Enter" && open(e)}
							className="flex flex-col items-center gap-1 outline-none"
						>
							<PixelIcon name={p.href ? "app" : "folder"} size={36} inverted={active} />
							<span className={`max-w-full px-1 text-center font-ui text-[13px] leading-tight [overflow-wrap:anywhere] ${active ? "bg-black text-white" : ""}`}>{p.name}</span>
						</button>
					);
				})}
			</div>
		</Window>
	);
}

export default defineApp({
	id: "projects",
	title: "Projects",
	icon: "folder",
	place: "main",
	order: 2,
	description: "Apps, games and tools I've built.",
	route: "/projects",
	window: { x: 260, y: 70, width: 540 },
	info: () => [["Kind", "Folder"], ["Items", String(publicProjects.length)]],
	component: Projects,
});
