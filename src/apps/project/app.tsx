import { Link } from "@tanstack/react-router";
import { PixelIcon } from "@/components/icons";
import { Window } from "@/components/Window";
import type { Project as ProjectData } from "@/data/profile";
import { defineApp } from "../define";

function Project({ payload: p }: { payload: ProjectData | undefined }) {
	if (!p) return null;
	return (
		<Window title={p.name}>
			<div className="p-5">
				<div className="flex items-center gap-3">
					<PixelIcon name={p.href ? "app" : "folder"} size={40} />
					<div>
						<h3 className="font-ui text-xl leading-tight">{p.name}</h3>
						<div className="text-xs">
							{p.kind} · {p.year}
						</div>
					</div>
				</div>
				<p className="mt-4 text-sm">{p.description}</p>
				<div className="mt-5 flex justify-end gap-3">
					{p.repo && (
						<a href={p.repo} target="_blank" rel="noreferrer" className={p.href ? "btn" : "btn btn-default"}>
							Source
						</a>
					)}
					{p.href?.startsWith("/") ? (
						<Link to={p.href} className="btn btn-default">
							Read
						</Link>
					) : (
						p.href && (
							<a href={p.href} target="_blank" rel="noreferrer" className="btn btn-default">
								Visit
							</a>
						)
					)}
				</div>
			</div>
		</Window>
	);
}

/** One project's card; opened from the Projects folder with the project as payload. */
export default defineApp<ProjectData>({
	id: "project",
	title: "Project",
	icon: "app",
	place: "hidden",
	window: { x: 420, y: 150, width: 360 },
	component: Project,
});
