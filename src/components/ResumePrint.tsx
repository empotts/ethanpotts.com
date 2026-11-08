import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { awards, education, experience, profile, skills } from "@/data/profile";

const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "");

/**
 * A one-page, black-on-white resume built from the same data as the Work window.
 * It is mounted only while printing, so Ctrl+P elsewhere on the site prints the page as usual.
 */
function Resume() {
	return (
		<div className="resume-print" aria-hidden>
			<header>
				<h1>{profile.name}</h1>
				<p className="resume-contact">
					<a href={`mailto:${profile.email}`}>{profile.email}</a>
					<span> | </span>
					<a href={profile.linkedin}>{bare(profile.linkedin)}</a>
					<span> | </span>
					<a href={profile.github}>{bare(profile.github)}</a>
					<span> | </span>
					<a href="https://ethanpotts.com">ethanpotts.com</a>
					<span> | </span>
					{profile.location.replace("Arkansas", "AR")}
				</p>
			</header>

			<section>
				<h2>Experience</h2>
				{experience.map((e) => (
					<div key={e.role + e.start} className="resume-entry">
						<div className="resume-row">
							<strong>
								{e.role}, {e.org}
							</strong>
							<span>
								{e.start} – {e.end === "Now" ? "Present" : e.end}
							</span>
						</div>
						<ul>
							{e.bullets.map((b) => (
								<li key={b}>{b}</li>
							))}
						</ul>
					</div>
				))}
			</section>

			<section>
				<h2>Education</h2>
				<div className="resume-entry">
					<div className="resume-row">
						<strong>
							{education.degree}, {education.minor}
						</strong>
						<span>{education.years}</span>
					</div>
					<ul>
						<li>
							{education.school}, Fayetteville, AR | {education.honors}
						</li>
						<li>{education.thesis}</li>
						<li>{education.grad}</li>
						<li>{education.activities.join("; ")}</li>
					</ul>
				</div>
			</section>

			<section>
				<h2>Skills</h2>
				<ul>
					<li>Daily: {skills.daily.join(", ")}</li>
					<li>Infrastructure: {skills.infra.join(", ")}</li>
					<li>Also: {skills.also.join(", ")}</li>
				</ul>
			</section>

			<section>
				<h2>Honors and Awards</h2>
				{awards.map((a) => (
					<div key={a.name} className="resume-row">
						<span>
							<strong>{a.name}</strong>, {a.from}
						</span>
						<span>{a.year}</span>
					</div>
				))}
			</section>
		</div>
	);
}

/** Button that opens the print dialog on the resume; "Save as PDF" names the file after Ethan. */
export function ExportResumeButton({ className = "btn" }: { className?: string }) {
	const [printing, setPrinting] = useState(false);

	useEffect(() => {
		if (!printing) return;
		const title = document.title;
		document.title = `${profile.name} Resume`;
		document.documentElement.dataset.printing = "resume";
		const done = () => setPrinting(false);
		window.addEventListener("afterprint", done);
		// Let the portal paint before the dialog opens.
		const frame = requestAnimationFrame(() => window.print());
		return () => {
			cancelAnimationFrame(frame);
			window.removeEventListener("afterprint", done);
			document.title = title;
			delete document.documentElement.dataset.printing;
		};
	}, [printing]);

	return (
		<>
			<button type="button" className={className} onClick={() => setPrinting(true)}>
				Export PDF
			</button>
			{printing && createPortal(<Resume />, document.body)}
		</>
	);
}
