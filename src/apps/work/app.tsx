import { ExportResumeButton } from "@/components/ResumePrint";
import { Window } from "@/components/Window";
import { awards, education, experience } from "@/data/profile";
import { defineApp } from "../define";

function Work() {
	return (
		<Window>
			<div className="divide-y-2 divide-black">
				<div className="flex items-center justify-between gap-3 px-5 py-3">
					<span className="font-ui text-sm">{experience.length} roles</span>
					<ExportResumeButton />
				</div>
				{experience.map((e) => (
					<article key={e.role + e.start} className="p-5">
						<div className="flex flex-wrap items-baseline justify-between gap-2">
							<h3 className="font-ui text-lg leading-tight">{e.role}</h3>
							<span className="text-xs tabular-nums">
								{e.start} – {e.end}
							</span>
						</div>
						<div className="text-sm">{e.org}</div>
						<ul className="mt-3 space-y-1.5 text-sm">
							{e.bullets.map((b) => (
								<li key={b} className="flex gap-2">
									<span className="mt-[7px] size-1.5 shrink-0 bg-black" />
									{b}
								</li>
							))}
						</ul>
					</article>
				))}
				<div className="dither-light grid gap-4 p-5 sm:grid-cols-2">
					<div className="win p-4">
						<h3 className="font-ui">Education</h3>
						<p className="mt-1 text-sm">{education.school}</p>
						<p className="text-sm">
							{education.degree}, {education.year}
						</p>
						<p className="text-sm">{education.honors}</p>
					</div>
					<div className="win p-4">
						<h3 className="font-ui">Awards</h3>
						<ul className="mt-1 text-sm">
							{awards.map((a) => (
								<li key={a.name}>{a.name}</li>
							))}
						</ul>
					</div>
				</div>
			</div>
		</Window>
	);
}

export default defineApp({
	id: "work",
	title: "Work",
	icon: "briefcase",
	place: "main",
	order: 3,
	description: "Experience, education and awards.",
	route: "/resume",
	window: { x: 340, y: 110, width: 620 },
	info: () => [["Kind", "Folder"], ["Items", `${experience.length} roles`]],
	component: Work,
});
