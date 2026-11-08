import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { awards, currently, education, experience, type Project, profile, publicProjects, seasonFrames } from "@/data/profile";
import { formatDay } from "@/lib/dates";
import type { PostSummary } from "@/posts/worker";
import { formatTime, setH24, useH24, useNow } from "./clock";
import { type IconName, PixelIcon } from "./icons";
import { Logo } from "./Logo";
import { PregameWin } from "./Pregame";
import { ExportResumeButton } from "./ResumePrint";
import { THEMES, useTheme } from "./theme";
import { Wallpaper, wallpaperMode, wallpaperShot } from "./Wallpaper";
import { DeskRef, Window } from "./Window";
import { boot, closeWin, emptyTrash, openWin, ROUTE_OF, resetDesk, routeWin, trashTarget, useWindows, type WinId } from "./windows";

/** Menu-bar clock. Click for 24-hour time; press and hold to see your own time. */
function MenuClock() {
	const h24 = useH24();
	const now = useNow(1000);
	const [mine, setMine] = useState(false);
	const hold = useRef<number | undefined>(undefined);
	const held = useRef(false);
	const release = () => {
		clearTimeout(hold.current);
		if (held.current) setMine(false);
	};
	return (
		<button
			type="button"
			onPointerDown={() => {
				held.current = false;
				hold.current = window.setTimeout(() => {
					held.current = true;
					setMine(true);
				}, 350);
			}}
			onPointerUp={release}
			onPointerLeave={release}
			onClick={() => {
				if (!held.current) setH24(!h24);
				held.current = false;
			}}
			aria-label="Time in Rogers, Arkansas"
			className="ml-auto hidden px-2 whitespace-nowrap tabular-nums select-none min-[420px]:inline"
		>
			{now && (mine ? `You ${formatTime(now, { h24, local: true })}` : formatTime(now, { h24 }))}
		</button>
	);
}

type DesktopApp = { icon: IconName | "logo"; label: string; onOpen: () => void; info: [string, string][] };

/** A disclosure: normal buttons stay in the tab order, with Escape and outside dismissal. */
function ToolbarMenu({ label, name, open, onToggle, onClose, children, wide = false, alignEnd = false }: {
	label: React.ReactNode; name: string; open: boolean; onToggle: () => void; onClose: () => void; children: React.ReactNode; wide?: boolean; alignEnd?: boolean;
}) {
	const ref = useRef<HTMLDivElement>(null);
	const id = useId();
	useEffect(() => {
		if (!open) return;
		const outside = (e: PointerEvent) => {
			if (!ref.current?.contains(e.target as Node)) onClose();
		};
		const escape = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			e.preventDefault();
			onClose();
			ref.current?.querySelector("button")?.focus();
		};
		document.addEventListener("pointerdown", outside);
		document.addEventListener("keydown", escape);
		return () => {
			document.removeEventListener("pointerdown", outside);
			document.removeEventListener("keydown", escape);
		};
	}, [open, onClose]);
	return (
		<div ref={ref} className="relative">
			<button type="button" aria-label={name} title={name} aria-expanded={open} aria-controls={id} onClick={onToggle}
				className={`toolbar-trigger flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 min-[721px]:min-h-7 min-[721px]:px-3 ${open ? "bg-black text-white" : "hover:bg-black hover:text-white"}`}>
				{label}
			</button>
			{open && <div id={id} aria-label={name} className={`mobile-menu win scroll-retro fixed inset-x-3 top-14 max-h-[calc(100dvh-5rem)] overflow-y-auto p-2 min-[721px]:absolute min-[721px]:inset-x-auto min-[721px]:top-8 ${wide ? "min-[721px]:w-80" : "min-[721px]:w-56"} ${wide || alignEnd ? "min-[721px]:right-0" : "min-[721px]:left-0"}`}>
				{children}
			</div>}
		</div>
	);
}

function ThemeMenu({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
	const [theme, setTheme] = useTheme();
	return (
		<ToolbarMenu name="Choose theme" alignEnd label={<span><span className="theme-sun"><PixelIcon name="sun" size={22} /></span><span className="theme-moon"><PixelIcon name="moon" size={22} /></span></span>} open={open} onToggle={onToggle} onClose={onClose}>
			{THEMES.map((t) => (
				<button key={t.id} type="button" aria-pressed={theme === t.id}
					className="flex min-h-11 w-full items-center gap-2 px-3 text-left hover:bg-black hover:text-white min-[721px]:min-h-8"
					onClick={() => { setTheme(t.id); onClose(); }}>
					<span className="w-3" aria-hidden>{theme === t.id ? "✓" : ""}</span>{t.label}
				</button>
			))}
		</ToolbarMenu>
	);
}

function AppShortcut({ app, onLaunch, compact = false }: { app: DesktopApp; onLaunch: (app: DesktopApp) => void; compact?: boolean }) {
	return (
		<button type="button" onClick={() => onLaunch(app)} className={`${compact ? "" : "app-shortcut"} flex min-h-16 min-w-0 flex-col items-center justify-start gap-1 p-2 text-center focus-visible:outline-2 focus-visible:outline-offset-2 ${compact ? "px-0.5" : "hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white"}`}>
			<span>{app.icon === "logo" ? <Logo size={32} /> : <PixelIcon name={app.icon} size={compact ? 28 : 32} />}</span>
			<span className={`font-ui leading-tight ${compact ? "bg-white text-[11px]" : "text-xs"}`}>{compact && app.label === "Screensaver" ? "Screen saver" : app.label}</span>
		</button>
	);
}

function MenuBar({ apps }: { apps: DesktopApp[] }) {
	const [menu, setMenu] = useState<"site" | "apps" | "theme" | null>(null);
	const close = () => setMenu(null);
	const toggle = (name: "site" | "apps" | "theme") => () => setMenu((m) => m === name ? null : name);
	const launch = (app: DesktopApp) => { close(); app.onOpen(); if (window.matchMedia("(max-width: 720px)").matches) window.scrollTo(0, 0); };
	return (
		<div className="menu-bar saver-fade fixed inset-x-0 top-0 z-[100] flex h-12 items-center gap-0.5 border-b-2 border-black bg-white px-2 font-ui text-sm min-[721px]:h-8 min-[721px]:gap-1 min-[721px]:text-[15px]">
			<ToolbarMenu name="Ethan Potts menu" label="EP" open={menu === "site"} onToggle={toggle("site")} onClose={close}>
				<button type="button" className="block min-h-11 w-full px-3 text-left hover:bg-black hover:text-white" onClick={() => { openWin("about"); close(); }}>About Ethan</button>
				<button type="button" className="block min-h-11 w-full px-3 text-left hover:bg-black hover:text-white" onClick={() => { openWin("contact"); close(); }}>Contact</button>
				<div className="my-1 border-t border-dashed border-black" />
				<button type="button" className="block min-h-11 w-full px-3 text-left hover:bg-black hover:text-white" onClick={() => { resetDesk(); close(); }}>Clean up desktop</button>
			</ToolbarMenu>
			<Link to="/projects" className="flex min-h-11 items-center px-2 hover:bg-black hover:text-white min-[721px]:min-h-7 min-[721px]:px-3">Projects</Link>
			<Link to="/resume" className="hidden px-3 py-0.5 hover:bg-black hover:text-white min-[721px]:block">Work</Link>
			<Link to="/blog" className="hidden px-3 py-0.5 hover:bg-black hover:text-white min-[721px]:block">Writing</Link>
			<div className="ml-auto min-[721px]:ml-0">
				<ToolbarMenu name="Apps" label={<><PixelIcon name="app" size={18} />Apps</>} open={menu === "apps"} onToggle={toggle("apps")} onClose={close} wide>
					<p className="border-b border-black px-2 pb-2 font-ui text-xs">On the desktop</p>
					<div className="grid grid-cols-3 gap-1 pt-2">{apps.map((app) => <AppShortcut key={app.label} app={app} onLaunch={launch} />)}</div>
				</ToolbarMenu>
			</div>
			<ThemeMenu open={menu === "theme"} onToggle={toggle("theme")} onClose={close} />
			<MenuClock />
		</div>
	);
}

type Info = { icon: IconName | "logo"; label: string; rows: [string, string][] };

/** A desktop icon. Option/Alt + double-click (or Alt+Enter) opens Get Info instead. */
function DeskIcon({ icon, label, onOpen, info, onInfo }: { icon: IconName | "logo"; label: string; onOpen: () => void; info?: [string, string][]; onInfo?: (i: Info) => void }) {
	const [sel, setSel] = useState(false);
	const act = (alt: boolean) => (alt && info && onInfo ? onInfo({ icon, label, rows: info }) : onOpen());
	return (
		<button
			type="button"
			data-desk-icon
			onClick={() => setSel(true)}
			onDoubleClick={(e) => act(e.altKey)}
			onKeyDown={(e) => e.key === "Enter" && act(e.altKey)}
			onFocus={() => setSel(true)}
			onBlur={() => setSel(false)}
			className="flex h-20 w-20 shrink-0 flex-col items-center gap-1 outline-none"
		>
			{icon === "logo" ? (
				<span className={`flex size-10 items-center justify-center ${sel ? "bg-black" : ""}`}>
					<Logo size={36} className={sel ? "!bg-white" : ""} />
				</span>
			) : (
				<PixelIcon name={icon} size={40} inverted={sel} />
			)}
			<span className={`px-1 text-center font-ui text-[13px] leading-tight ${sel ? "bg-black text-white" : "bg-white"}`}>{label}</span>
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

function WritingWin({ onClose, posts }: { onClose: () => void; posts: PostSummary[] }) {
	return (
		<Window id="writing" title="Writing" x={180} y={160} width={420} onClose={onClose}>
			<ul className="p-2">
				{posts.map((post) => (
					<li key={post.slug}>
						<Link to="/blog/$slug" params={{ slug: post.slug }} className="flex items-center gap-3 p-2 hover:bg-black hover:text-white">
							<PixelIcon name="doc" size={28} />
							<span>
								<span className="block font-ui leading-tight">{post.data.title}</span>
								{post.data.description && <span className="block text-xs">{post.data.description}</span>}
								{post.data.date && <span className="mt-0.5 block font-ui text-[11px]">{formatDay(post.data.date)} · {post.data.minutes} min</span>}
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

function InfoWin({ info, onClose }: { info: Info; onClose: () => void }) {
	return (
		<Window id="info" title={`${info.label} Info`} x={460} y={200} width={300} onClose={onClose}>
			<div className="p-5">
				<div className="flex items-center gap-3 border-b-2 border-black pb-3">
					{info.icon === "logo" ? <Logo size={36} /> : <PixelIcon name={info.icon} size={40} />}
					<h3 className="font-ui text-lg">{info.label}</h3>
				</div>
				<dl className="mt-3 space-y-1 text-sm">
					{info.rows.map(([k, v]) => (
						<div key={k} className="flex gap-3">
							<dt className="w-28 shrink-0 text-right">{k}:</dt>
							<dd>{v}</dd>
						</div>
					))}
				</dl>
			</div>
		</Window>
	);
}

function ClockWin({ onClose }: { onClose: () => void }) {
	const h24 = useH24();
	const now = useNow(1000);
	return (
		<Window id="clock" title="Clock" x={380} y={180} width={300} onClose={onClose}>
			<div className="p-5 text-center">
				<div className="font-ui text-4xl tabular-nums">{now ? formatTime(now, { h24, seconds: true }) : "\u00a0"}</div>
				<div className="mt-1 text-sm">Rogers, Arkansas</div>
				<div className="mt-4 border-t-2 border-black pt-3 text-sm tabular-nums">Your time: {now ? formatTime(now, { h24, local: true }) : ""}</div>
				<button type="button" className="btn mt-4" onClick={() => setH24(!h24)}>
					{h24 ? "12-hour" : "24-hour"}
				</button>
			</div>
		</Window>
	);
}

/** Starts after two idle minutes (or on demand); any input ends it. */
function useScreensaver(enabled: boolean) {
	const start = useRef(() => {});
	useEffect(() => {
		let last = Date.now();
		let grace = 0;
		let active = false;
		const set = (v: boolean) => {
			active = v;
			wallpaperMode.saver = v;
			if (v) document.documentElement.dataset.saver = "";
			else delete document.documentElement.dataset.saver;
		};
		const wake = () => {
			last = Date.now();
			if (active && last > grace) set(false);
		};
		start.current = () => {
			grace = Date.now() + 800;
			set(true);
		};
		const id = setInterval(() => {
			if (enabled && !active && Date.now() - last > 120_000) start.current();
		}, 5000);
		const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"] as const;
		for (const ev of events) window.addEventListener(ev, wake, { passive: true });
		return () => {
			clearInterval(id);
			for (const ev of events) window.removeEventListener(ev, wake);
			set(false);
		};
	}, [enabled]);
	return () => start.current();
}

/** Arrow keys move focus between desktop icons, nearest first in that direction. */
function moveIconFocus(e: React.KeyboardEvent) {
	const dirs: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
	const d = dirs[e.key];
	const from = (e.target as HTMLElement).closest<HTMLElement>("[data-desk-icon]");
	if (!d || !from) return;
	const a = from.getBoundingClientRect();
	let best: HTMLElement | null = null;
	let bestScore = Number.POSITIVE_INFINITY;
	for (const el of document.querySelectorAll<HTMLElement>("[data-desk-icon]")) {
		if (el === from) continue;
		const b = el.getBoundingClientRect();
		const dx = b.left + b.width / 2 - (a.left + a.width / 2);
		const dy = b.top + b.height / 2 - (a.top + a.height / 2);
		const along = dx * d[0] + dy * d[1];
		if (along <= 1) continue;
		const score = along + Math.abs(dx * d[1] + dy * d[0]) * 2;
		if (score < bestScore) {
			bestScore = score;
			best = el;
		}
	}
	if (best) {
		e.preventDefault();
		best.focus();
	}
}

const TITLES: Record<WinId, string> = {
	about: "About",
	projects: "Projects",
	project: "Project",
	work: "Work",
	writing: "Writing",
	contact: "Contact",
	post: "Post",
	pregame: "Pregame",
	photo: "Photo",
	info: "Info",
	clock: "Clock",
};

function ContactWin({ onClose }: { onClose: () => void }) {
	return (
		<Window id="contact" title="Contact" x={520} y={260} width={320} onClose={onClose}>
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

export function Desktop({ posts, children }: { posts: PostSummary[]; children: React.ReactNode }) {
	const desk = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const current = routeWin(pathname);
	const { open, gen, trashed, opened } = useWindows();
	const [info, setInfo] = useState<Info | null>(null);
	const [night, setNight] = useState(false);
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

	// Never start the screensaver while someone is reading a post.
	const startSaver = useScreensaver(current !== "post");
	const showInfo = (i: Info) => {
		setInfo(i);
		openWin("info");
	};
	const toggleNight = () => {
		const on = !night;
		setNight(on);
		wallpaperMode.night = on;
		wallpaperMode.redraw();
		if (on) setTimeout(() => wallpaperMode.shoot(), 400);
	};
	const now = new Date();
	const version = `${now.getFullYear()}.${now.getMonth() + 1}`;
	const app = (rest: [string, string][]): [string, string][] => [["Kind", "Application"], ...rest, ["Version", version]];

	useEffect(() => {
		if (current && current !== "post") openWin(current);
	}, [current]);

	// Opening a window from the menu bar while reading leaves the article for the desktop.
	const openedAt = useRef(opened);
	useEffect(() => {
		if (opened === openedAt.current) return;
		openedAt.current = opened;
		if (current === "post") navigate({ to: "/" });
	}, [opened, current, navigate]);

	// Windows and articles animate in only once someone acts. Route code hydrates in
	// its own pass after this component, so flipping the flag on mount replayed the
	// entrance animation on every reload.
	useEffect(() => {
		const stop = () => {
			window.removeEventListener("pointerdown", arm, true);
			window.removeEventListener("keydown", arm, true);
		};
		const arm = () => {
			boot.hydrated = true;
			stop();
		};
		window.addEventListener("pointerdown", arm, true);
		window.addEventListener("keydown", arm, true);
		return stop;
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

	const mainApps: DesktopApp[] = [
		{ icon: "logo", label: "About", onOpen: () => openWin("about"), info: [["Kind", "Software engineer"], ["Where", profile.location], ["Working since", "2024"], ["Version", version]] },
		{ icon: "folder", label: "Projects", onOpen: go("projects"), info: [["Kind", "Folder"], ["Items", String(publicProjects.length)]] },
		{ icon: "briefcase", label: "Work", onOpen: go("work"), info: [["Kind", "Folder"], ["Items", `${experience.length} roles`]] },
		{ icon: "doc", label: "Writing", onOpen: go("writing"), info: [["Kind", "Folder"], ["Items", `${posts.length} posts`]] },
		{ icon: "mail", label: "Contact", onOpen: () => openWin("contact"), info: [["Kind", "Card"], ["Email", profile.email]] },
	];
	const extras: DesktopApp[] = [
		{ icon: "drum", label: "Pregame", onOpen: () => openWin("pregame"), info: app([["Marchers", "245"], ["Tempo", "152 bpm · 1.6× playback"]]) },
		{ icon: "camera", label: "Camera", onOpen: takePhoto, info: app([["Output", "1-bit PNG"], ["Subject", "The wallpaper"]]) },
		{ icon: "clock", label: "Clock", onOpen: () => openWin("clock"), info: app([["Time zone", "America/Chicago"]]) },
		{ icon: "moon", label: "Night Sky", onOpen: toggleNight, info: app([["Shows", night ? "Real time" : "Night"]]) },
		{ icon: "monitor", label: "Screensaver", onOpen: startSaver, info: app([["Starts after", "2 minutes idle"]]) },
	];
	const trashApp: DesktopApp = { icon: trashed.length ? "trashFull" : "trash", label: "Trash", onOpen: () => setTrash(true), info: [["Kind", "Trash"], ["Items", String(trashed.length)]] };

	return (
		<DeskRef.Provider value={desk}>
			<MenuBar apps={[...mainApps, ...extras, trashApp]} />
			{/* biome-ignore lint/a11y/noStaticElementInteractions: arrow keys only move focus between the icon buttons inside */}
			<div ref={desk} onKeyDown={moveIconFocus} className="desktop-surface dither relative min-h-screen overflow-hidden pt-16 min-[721px]:pt-12 max-[720px]:overflow-visible max-[720px]:pb-8">
				<Wallpaper />
				<div className="saver-fade absolute top-12 right-4 z-[5] hidden flex-col min-[721px]:flex">
					{mainApps.map((app) => <DeskIcon key={app.label} {...app} onInfo={showInfo} />)}
				</div>
				<div className="saver-fade absolute top-12 right-28 z-[5] hidden flex-col min-[721px]:flex">
					{extras.map((app) => <DeskIcon key={app.label} {...app} onInfo={showInfo} />)}
				</div>
				<div
					ref={(el) => {
						trashTarget.el = el;
					}}
					className="saver-fade absolute right-4 bottom-4 z-[5] hidden min-[721px]:block"
				>
					<DeskIcon {...trashApp} onInfo={showInfo} />
				</div>
				<div key={gen} className="saver-fade max-[720px]:flex max-[720px]:flex-col-reverse">
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
					{visible.has("info") && info && <InfoWin key={info.label} info={info} onClose={() => closeWin("info")} />}
					{visible.has("clock") && <ClockWin onClose={() => closeWin("clock")} />}
				</div>
				{children}
				{flash && <div className="pointer-events-none fixed inset-0 z-[300] bg-black" />}
				{trash && (
					<div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/50">
						<div className="win w-80 p-5" role="alertdialog" aria-label="Trash">
							<div className="flex gap-4">
								<PixelIcon name={trashed.length ? "trashFull" : "trash"} size={40} />
								{trashed.length ? (
									<p className="text-sm">
										In the Trash: {trashed.map((id) => TITLES[id]).join(", ")}.
									</p>
								) : (
									<p className="text-sm">The Trash is empty. Everything here was worth keeping.</p>
								)}
							</div>
							<div className="mt-5 flex justify-end gap-3">
								{trashed.length > 0 && (
									<button type="button" className="btn" onClick={() => { emptyTrash(); setTrash(false); }}>
										Empty Trash
									</button>
								)}
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
