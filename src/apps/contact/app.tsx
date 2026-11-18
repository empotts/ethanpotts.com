import { PixelIcon } from "@/components/icons";
import { Window } from "@/components/Window";
import { profile, seasonFrames } from "@/data/profile";
import { defineApp } from "../define";

function Contact() {
	return (
		<Window>
			<div className="space-y-2 p-5 text-sm">
				<a className="flex items-center gap-3 p-1 hover:bg-black hover:text-white" href={`mailto:${profile.email}`}>
					<PixelIcon name="mail" size={24} /> {profile.email}
				</a>
				<a className="block p-1 pl-10 hover:bg-black hover:text-white" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
				<a className="block p-1 pl-10 hover:bg-black hover:text-white" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
				{seasonFrames !== null && (
					<p className="paper-only border-t border-dashed border-black pt-2 text-xs tabular-nums">frames photographed this season: {seasonFrames.toLocaleString("en-US")}</p>
				)}
			</div>
		</Window>
	);
}

export default defineApp({
	id: "contact",
	title: "Contact",
	icon: "mail",
	place: "main",
	order: 5,
	description: "Email, GitHub and LinkedIn.",
	window: { x: 520, y: 260, width: 320 },
	info: () => [["Kind", "Card"], ["Email", profile.email]],
	component: Contact,
});
