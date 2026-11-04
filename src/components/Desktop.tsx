import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { awards, currently, education, experience, type Project, profile, publicProjects } from "@/data/profile";
import type { PostSummary } from "@/posts/worker";
import { type IconName, PixelIcon } from "./icons";
import { Logo } from "./Logo";
import { PregameWin } from "./Pregame";
import { THEMES, useTheme } from "./theme";
import { Wallpaper, wallpaperShot } from "./Wallpaper";
import { DeskRef, Window } from "./Window";
import { boot, closeWin, openWin, ROUTE_OF, resetDesk, routeWin, useWindows, type WinId } from "./windows";

function useClock() {
	const [t, setT] = useState("");
	useEffect(() => {
		const tick = () =>
			setT(new Date().toLocaleTimeString("en-US", { timeZone: profile.timezone, hour: "numeric", minute: "2-digit" }));
		tick();
		const id = setInterval(tick, 15_000);
		return () => clearInterval(id);
	}, []);
	return t;
}

function ThemeMenu() {
	const [open, setOpen] = useState(false);
	const [theme, setTheme] = useTheme();
	return (
		<div className="relative">
			<button type="button" onClick={() => setOpen((o) => !o)} className={`px-2 py-0.5 sm:px-3 ${open ? "bg-black text-white" : ""}`}>
				Theme
			</button>
			{open && (
				<>
					<button type="button" className="fixed inset-0 cursor-default" aria-label="Close menu" onClick={() => setOpen(false)} />
					<div className="win absolute top-7 right-0 w-52 py-1 sm:right-auto sm:left-0" role="menu">
						{THEMES.map((t) => (
							<button
								key={t.id}
								type="button"
								role="menuitemradio"
								aria-checked={theme === t.id}
								className="flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-black hover:text-white"
								onClick={() => {
									setTheme(t.id);
									setOpen(false);
								}}
							>
								<span className="w-3">{theme === t.id ? "✓" : ""}</span>
								{t.label}
							</button>
						))}
					</div>
				</>
			)}
		</div>
	);
}

function MenuBar() {
	const time = useClock();
	const [menu, setMenu] = useState(false);
	return (
		<div className="fixed inset-x-0 top-0 z-[100] flex h-8 items-center gap-0.5 border-b-2 sm:gap-1 border-black bg-white px-2 font-ui text-[15px]">
			<div className="relative">
				<button type="button" onClick={() => setMenu((m) => !m)} className={`px-2 py-0.5 sm:px-3 ${menu ? "bg-black text-white" : ""}`}>
					EP
				</button>
				{menu && (
					<>
						<button type="button" className="fixed inset-0 cursor-default" aria-label="Close menu" onClick={() => setMenu(false)} />
						<div className="win absolute top-7 left-0 w-56 py-1">
							<button type="button" className="block w-full px-4 py-1 text-left hover:bg-black hover:text-white" onClick={() => { openWin("about"); setMenu(false); }}>
								About Ethan
							</button>
							<button type="button" className="block w-full px-4 py-1 text-left hover:bg-black hover:text-white" onClick={() => { openWin("contact"); setMenu(false); }}>
								Contact
							</button>
							<div className="my-1 border-t border-dashed border-black" />
							<button type="button" className="block w-full px-4 py-1 text-left hover:bg-black hover:text-white" onClick={() => { resetDesk(); setMenu(false); }}>
								Clean up desktop
							</button>
						</div>
					</>
				)}
			</div>
			<Link to="/projects" className="px-2 py-0.5 hover:bg-black hover:text-white sm:px-3">Projects</Link>
			<Link to="/resume" className="px-2 py-0.5 hover:bg-black hover:text-white sm:px-3">Work</Link>
			<Link to="/blog" className="px-2 py-0.5 hover:bg-black hover:text-white sm:px-3">Writing</Link>
			<ThemeMenu />
			<span className="ml-auto hidden px-2 whitespace-nowrap tabular-nums min-[420px]:inline">{time}</span>
		</div>
	);
}

function DeskIcon({ icon, label, onOpen }: { icon: IconName | "logo"; label: string; onOpen: () => void }) {
	const [sel, setSel] = useState(false);
	return (
		<button
			type="button"
			onClick={() => setSel(true)}
			onDoubleClick={onOpen}
			onKeyDown={(e) => e.key === "Enter" && onOpen()}
			onBlur={() => setSel(false)}
			className="flex w-20 flex-col items-center gap-1 outline-none"
		>
			{icon === "logo" ? (
				<span className={`flex size-10 items-center justify-center ${sel ? "bg-black" : ""}`}>
					<Logo size={36} className={sel ? "!bg-white" : ""} />
				</span>
			) : (
				<PixelIcon name={icon} size={40} inverted={sel} />
			)}
			<span className={`px-1 font-ui text-[13px] leading-tight ${sel ? "bg-black text-white" : "bg-white"}`}>{label}</span>
		</button>
	);
}

function ProjectsWin({ onClose, onOpen, selected, setSelected }: { onClose: () => void; onOpen: (p: Project) => void; selected: string | null; setSelected: (s: string) => void }) {
	return (
		<Window id="projects" title="Projects" x={260} y={70} width={540} onClose={onClose}>
			<div className="flex justify-between border-b border-black px-3 py-1 text-xs">
				<span>{publicProjects.length} items</span>
				<span>click twice to open</span>
			</div>
			<div className="grid grid-cols-3 gap-y-4 p-4 sm:grid-cols-4">
				{publicProjects.map((p) => {
					const active = selected === p.slug;
					return (
						<button
							key={p.slug}
							type="button"
							onClick={() => (active ? onOpen(p) : setSelected(p.slug))}
							onDoubleClick={() => onOpen(p)}
							onKeyDown={(e) => e.key === "Enter" && onOpen(p)}
							className="flex flex-col items-center gap-1 outline-none"
						>
							<PixelIcon name={p.href ? "app" : "folder"} size={36} inverted={active} />
							<span className={`max-w-full px-1 text-center font-ui text-[13px] leading-tight ${active ? "bg-black text-white" : ""}`}>{p.name}</span>
						</button>
					);
				})}
			</div>
		</Window>
	);
}

function ProjectWin({ p, onClose }: { p: Project; onClose: () => void }) {
	return (
		<Window id="project" title={p.name} x={420} y={150} width={360} onClose={onClose}>
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

function WorkWin({ onClose }: { onClose: () => void }) {
	return (
		<Window id="work" title="Work" x={340} y={110} width={620} onClose={onClose}>
			<div className="divide-y-2 divide-black">
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

function WritingWin({ onClose, posts }: { onClose: () => void; posts: PostSummary[] }) {
	return (
		<Window id="writing" title="Writing" x={180} y={160} width={420} onClose={onClose}>
			<ul className="p-2">
				{posts.map((post) => (
					<li key={post.slug}>
						<Link to="/blog/$slug" params={{ slug: post.slug }} className="flex items-center gap-3 p-2 hover:bg-black hover:text-white">
							<PixelIcon name="doc" size={28} />
							<span>
								<span className="block font-ui leading-tight">{String(post.data?.title ?? "Untitled")}</span>
								{post.data?.description && <span className="block text-xs">{post.data.description}</span>}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</Window>
	);
}

function AboutWin({ onClose }: { onClose: () => void }) {
	return (
		<Window id="about" title="About" x={60} y={40} width={460} onClose={onClose}>
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
				<div className="mt-5 flex flex-wrap gap-3">
					<Link to="/projects" className="btn btn-default">Projects</Link>
					<Link to="/resume" className="btn">Work</Link>
				</div>
			</div>
		</Window>
	);
}

type Photo = { src: string; taken: Date };

function PhotoWin({ photo, onClose }: { photo: Photo; onClose: () => void }) {
	const when = photo.taken.toLocaleString("en-US", { timeZone: profile.timezone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
	const stamp = photo.taken.toLocaleString("sv-SE", { timeZone: profile.timezone }).slice(0, 16).replace(/[-: ]/g, "");
	return (
		<Window id="photo" title="Photo" x={300} y={120} width={400} onClose={onClose}>
			<div className="p-3">
				<img src={photo.src} alt="The desktop wallpaper: dithered Ozark hills" className="block w-full border-2 border-black" style={{ imageRendering: "pixelated" }} />
				<div className="mt-2 flex items-center justify-between gap-3 text-xs">
					<span>
						Rogers, AR · {when}
						<br />
						f/8 · 1/250 · ISO 100
					</span>
					<a href={photo.src} download={`ozarks-${stamp}.png`} className="btn">
						Save
					</a>
				</div>
			</div>
		</Window>
	);
}

/** Typed words that open hidden windows. Ignored while typing in a field. */
function useTypedWords(words: Record<string, () => void>) {
	const ref = useRef(words);
	ref.current = words;
	useEffect(() => {
		let buf = "";
		const onKey = (e: KeyboardEvent) => {
			const el = e.target as HTMLElement | null;
			if (e.metaKey || e.ctrlKey || e.altKey || el?.closest("input, textarea, [contenteditable]")) return;
			if (e.key.length !== 1) return;
			buf = (buf + e.key.toLowerCase()).slice(-12);
			for (const [w, fn] of Object.entries(ref.current)) if (buf.endsWith(w)) {
				buf = "";
				fn();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
}

let greeted = false;
function greet() {
	if (greeted) return;
	greeted = true;
	const cs = getComputedStyle(document.documentElement);
	const fg = cs.getPropertyValue("--fg").trim() || "#000";
	const bg = cs.getPropertyValue("--bg").trim() || "#fff";
	const art = [
		" ███████ ██████ ",
		" ██      ██   ██",
		" █████   ██████ ",
		" ██      ██     ",
		" ███████ ██     ",
	].join("\n");
	const box = `color:${fg};background:${bg};font-family:monospace;padding:2px 6px;`;
	console.log(`%c${art}`, `${box}line-height:1.1;`);
	console.log(`%cSource: https://github.com/empotts/ethanpotts.com\nType "hogs" on the desktop.`, box);
}

function ContactWin({ onClose }: { onClose: () => void }) {
	return (
		<Window id="contact" title="Contact" x={520} y={260} width={320} onClose={onClose}>
			<div className="space-y-2 p-5 text-sm">
				<a className="flex items-center gap-3 p-1 hover:bg-black hover:text-white" href={`mailto:${profile.email}`}>
					<PixelIcon name="mail" size={24} /> {profile.email}
				</a>
				<a className="block p-1 pl-10 hover:bg-black hover:text-white" href={profile.github} target="_blank" rel="noreferrer">GitHub</a>
				<a className="block p-1 pl-10 hover:bg-black hover:text-white" href={profile.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
			</div>
		</Window>
	);
}

export function Desktop({ posts, children }: { posts: PostSummary[]; children: React.ReactNode }) {
	const desk = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const current = routeWin(pathname);
	const { open, gen } = useWindows();
	const [trash, setTrash] = useState(false);
	const [selected, setSelected] = useState<string | null>(null);
	const [project, setProject] = useState<Project | null>(null);
	const [photo, setPhoto] = useState<Photo | null>(null);
	const [flash, setFlash] = useState(false);

	useTypedWords({ hogs: () => openWin("pregame"), band: () => openWin("pregame") });
	useEffect(greet, []);

	const takePhoto = () => {
		const src = wallpaperShot.take?.();
		if (!src) return;
		setFlash(true);
		setTimeout(() => {
			setFlash(false);
			setPhoto({ src, taken: new Date() });
			openWin("photo");
		}, 90);
	};

	useEffect(() => {
		if (current && current !== "post") openWin(current);
	}, [current]);

	useEffect(() => {
		boot.hydrated = true;
	}, []);

	const visible = new Set<WinId>(open);
	if (current && current !== "post") visible.add(current);

	const close = (id: WinId) => () => {
		closeWin(id);
		if (current === id) navigate({ to: "/" });
	};
	const go = (id: WinId) => () => {
		const r = ROUTE_OF[id];
		if (r) navigate({ to: r });
		else openWin(id);
	};

	return (
		<DeskRef.Provider value={desk}>
			<MenuBar />
			<div ref={desk} className="dither relative min-h-screen overflow-hidden pt-12 max-[720px]:overflow-visible max-[720px]:pb-8">
				<Wallpaper />
				<div className="absolute top-12 right-4 z-[5] hidden flex-col gap-5 min-[721px]:flex">
					<DeskIcon icon="logo" label="About" onOpen={() => openWin("about")} />
					<DeskIcon icon="folder" label="Projects" onOpen={go("projects")} />
					<DeskIcon icon="briefcase" label="Work" onOpen={go("work")} />
					<DeskIcon icon="doc" label="Writing" onOpen={go("writing")} />
					<DeskIcon icon="mail" label="Contact" onOpen={() => openWin("contact")} />
				</div>
				{/* Sits under the About window until it is moved or closed. */}
				<div className="absolute top-[260px] left-[240px] z-[5] hidden min-[721px]:block">
					<DeskIcon icon="camera" label="Camera" onOpen={takePhoto} />
				</div>
				<div className="absolute right-4 bottom-4 z-[5] hidden min-[721px]:block">
					<DeskIcon icon="trash" label="Trash" onOpen={() => setTrash(true)} />
				</div>
				<div key={gen} className="max-[720px]:flex max-[720px]:flex-col-reverse">
					{visible.has("about") && <AboutWin onClose={close("about")} />}
					{visible.has("projects") && (
						<ProjectsWin
							onClose={close("projects")}
							selected={selected}
							setSelected={setSelected}
							onOpen={(p) => {
								setProject(p);
								openWin("project");
							}}
						/>
					)}
					{visible.has("project") && project && <ProjectWin key={project.slug} p={project} onClose={() => closeWin("project")} />}
					{visible.has("work") && <WorkWin onClose={close("work")} />}
					{visible.has("writing") && <WritingWin onClose={close("writing")} posts={posts} />}
					{visible.has("contact") && <ContactWin onClose={close("contact")} />}
					{visible.has("pregame") && <PregameWin onClose={() => closeWin("pregame")} />}
					{visible.has("photo") && photo && <PhotoWin key={photo.src.length + photo.taken.getTime()} photo={photo} onClose={() => closeWin("photo")} />}
				</div>
				{children}
				{flash && <div className="pointer-events-none fixed inset-0 z-[300] bg-black" />}
				{trash && (
					<div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/50">
						<div className="win w-80 p-5" role="alertdialog" aria-label="Trash">
							<div className="flex gap-4">
								<PixelIcon name="trash" size={40} />
								<p className="text-sm">The Trash is empty. Everything here was worth keeping.</p>
							</div>
							<div className="mt-5 text-right">
								<button type="button" className="btn btn-default" onClick={() => setTrash(false)}>
									OK
								</button>
							</div>
						</div>
					</div>
				)}
			</div>
		</DeskRef.Provider>
	);
}
