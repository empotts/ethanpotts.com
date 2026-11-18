import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import { Window } from "@/components/Window";
import { currently, profile } from "@/data/profile";
import { defineApp } from "../define";
import { appVersion } from "../version";

function About() {
	return (
		<Window>
			<div className="p-6">
				<div className="flex items-center gap-4">
					<Logo size={64} />
					<div>
						<h1 className="font-ui text-3xl leading-none font-semibold tracking-tight">{profile.name}</h1>
						<p className="mt-1 text-sm">{profile.location}</p>
					</div>
				</div>
				<p className="mt-5">{profile.intro}</p>
				<p className="mt-3 text-sm">{profile.shortBio[1]}</p>
				<div className="mt-5 border-2 border-black p-3 text-sm">
					{currently.map((c) => (
						<div key={c.label} className="flex gap-3">
							<span className="w-32 shrink-0">{c.label}</span>
							<span>{c.value}</span>
						</div>
					))}
				</div>
				<CurlCallout />
				<div className="mt-5 flex flex-wrap gap-3">
					<Link to="/projects" className="btn btn-default">Projects</Link>
					<Link to="/resume" className="btn">Work</Link>
				</div>
			</div>
		</Window>
	);
}

/** The whole site also prints in a terminal; click to copy the command. */
function CurlCallout() {
	const [copied, setCopied] = useState(false);
	const command = "curl ethanpotts.com";
	return (
		<button
			type="button"
			onClick={() => {
				navigator.clipboard?.writeText(command).then(() => {
					setCopied(true);
					setTimeout(() => setCopied(false), 1500);
				}, () => {});
			}}
			title="Copy command"
			className="mt-3 flex w-full items-center gap-3 border-2 border-black bg-black px-3 py-2 text-left font-mono text-sm text-white"
		>
			<span aria-hidden>$</span>
			<span className="flex-1">{command}</span>
			<span className="font-ui text-xs" aria-live="polite">{copied ? "Copied" : "Try it in a terminal"}</span>
		</button>
	);
}

export default defineApp({
	id: "about",
	title: "About",
	icon: "logo",
	place: "main",
	order: 1,
	description: profile.intro,
	window: { x: 60, y: 40, width: 460 },
	info: () => [["Kind", "Software engineer"], ["Where", profile.location], ["Working since", "2024"], ["Version", appVersion()]],
	component: About,
});
