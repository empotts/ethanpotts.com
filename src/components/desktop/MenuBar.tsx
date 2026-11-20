import { Link } from "@tanstack/react-router";
import { useEffect, useId, useRef, useState } from "react";
import { formatTime, setH24, useH24, useNow } from "../clock";
import { type IconName, PixelIcon } from "../icons";
import { Logo } from "../Logo";
import { THEMES, useCrt, useTheme } from "../theme";
import { openWin, resetDesk, setTiled, useTileSetting } from "../windows";

/** One launchable thing, as the menu bar and desktop show it. */
export type DesktopApp = { id: string; icon: IconName | "logo"; label: string; onOpen: (from?: Element) => void; info: [string, string][] };

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
			{open && <div id={id} aria-label={name} className={`menu-drop mobile-menu win scroll-retro fixed inset-x-3 top-14 max-h-[calc(100dvh-5rem)] overflow-y-auto p-2 min-[721px]:absolute min-[721px]:inset-x-auto min-[721px]:top-8 ${wide ? "min-[721px]:w-80" : "min-[721px]:w-56"} ${wide || alignEnd ? "min-[721px]:right-0" : "min-[721px]:left-0"}`}>
				{children}
			</div>}
		</div>
	);
}

const menuItem = "flex min-h-11 w-full items-center gap-2 px-3 text-left hover:bg-black hover:text-white min-[721px]:min-h-8";

function ThemeMenu({ open, onToggle, onClose }: { open: boolean; onToggle: () => void; onClose: () => void }) {
	const [theme, setTheme] = useTheme();
	const [crt, setCrt] = useCrt();
	return (
		<ToolbarMenu name="Choose theme" alignEnd label={<span><span className="theme-sun"><PixelIcon name="sun" size={22} /></span><span className="theme-moon"><PixelIcon name="moon" size={22} /></span></span>} open={open} onToggle={onToggle} onClose={onClose}>
			{THEMES.map((t) => (
				<button key={t.id} type="button" aria-pressed={theme === t.id} className={menuItem}
					onClick={() => { setTheme(t.id); onClose(); }}>
					<span className="w-3" aria-hidden>{theme === t.id ? "✓" : ""}</span>{t.label}
					<span className="ml-auto flex gap-0.5" data-theme={t.id === "auto" ? undefined : t.id} aria-hidden>
						<span className="swatch" style={{ background: "var(--fg)" }} />
						<span className="swatch" style={{ background: "var(--accent)" }} />
						<span className="swatch" style={{ background: "var(--sun)" }} />
						<span className="swatch" style={{ background: "var(--dusk)" }} />
					</span>
				</button>
			))}
			<div className="my-1 border-t border-dashed border-black" />
			<button type="button" aria-pressed={crt} className={menuItem} onClick={() => setCrt(!crt)}>
				<span className="w-3" aria-hidden>{crt ? "✓" : ""}</span>CRT glass
			</button>
		</ToolbarMenu>
	);
}

function AppShortcut({ app, onLaunch, compact = false }: { app: DesktopApp; onLaunch: (app: DesktopApp, el: Element) => void; compact?: boolean }) {
	return (
		<button type="button" onClick={(e) => onLaunch(app, e.currentTarget)} className={`${compact ? "" : "app-shortcut"} flex min-h-16 min-w-0 flex-col items-center justify-start gap-1 p-2 text-center focus-visible:outline-2 focus-visible:outline-offset-2 ${compact ? "px-0.5" : "hover:bg-black hover:text-white focus-visible:bg-black focus-visible:text-white"}`}>
			<span>{app.icon === "logo" ? <Logo size={32} /> : <PixelIcon name={app.icon} size={compact ? 28 : 32} />}</span>
			<span className={`font-ui leading-tight ${compact ? "bg-white text-[11px]" : "text-xs"}`}>{compact && app.label === "Screensaver" ? "Screen saver" : app.label}</span>
		</button>
	);
}

/** Tiling only matters where windows sit side by side, so phones and small screens don't see it. */
function TileToggle() {
	const on = useTileSetting();
	return (
		<button type="button" aria-pressed={on} className="hidden min-h-11 w-full items-center justify-between gap-3 px-3 text-left hover:bg-black hover:text-white min-[900px]:flex" onClick={() => setTiled(!on)}>
			Tile windows
			<span aria-hidden>{on ? "✓" : ""}</span>
		</button>
	);
}

export function MenuBar({ apps }: { apps: DesktopApp[] }) {
	const [menu, setMenu] = useState<"site" | "apps" | "theme" | null>(null);
	const close = () => setMenu(null);
	const toggle = (name: "site" | "apps" | "theme") => () => setMenu((m) => m === name ? null : name);
	const launch = (app: DesktopApp, el: Element) => { close(); app.onOpen(el); if (window.matchMedia("(max-width: 720px)").matches) window.scrollTo(0, 0); };
	return (
		<div className="menu-bar saver-fade fixed inset-x-0 top-0 z-[100] flex h-12 items-center gap-0.5 border-b-2 border-black bg-white px-2 font-ui text-sm min-[721px]:h-8 min-[721px]:gap-1 min-[721px]:text-[15px]">
			<ToolbarMenu name="Ethan Potts menu" label="EP" open={menu === "site"} onToggle={toggle("site")} onClose={close}>
				<button type="button" className="block min-h-11 w-full px-3 text-left hover:bg-black hover:text-white" onClick={(e) => { openWin("about", { from: e.currentTarget }); close(); }}>About Ethan</button>
				<button type="button" className="block min-h-11 w-full px-3 text-left hover:bg-black hover:text-white" onClick={(e) => { openWin("contact", { from: e.currentTarget }); close(); }}>Contact</button>
				<div className="my-1 border-t border-dashed border-black" />
				<button type="button" className="block min-h-11 w-full px-3 text-left hover:bg-black hover:text-white" onClick={() => { resetDesk(); close(); }}>Clean up desktop</button>
				<TileToggle />
			</ToolbarMenu>
			<Link to="/projects" className="flex min-h-11 items-center px-2 hover:bg-black hover:text-white min-[721px]:min-h-7 min-[721px]:px-3">Projects</Link>
			<Link to="/resume" className="hidden px-3 py-0.5 hover:bg-black hover:text-white min-[721px]:block">Work</Link>
			<Link to="/blog" className="hidden px-3 py-0.5 hover:bg-black hover:text-white min-[721px]:block">Writing</Link>
			<div className="ml-auto min-[721px]:ml-0">
				<ToolbarMenu name="Apps" label={<><PixelIcon name="app" size={18} />Apps</>} open={menu === "apps"} onToggle={toggle("apps")} onClose={close} wide>
					<p className="border-b border-black px-2 pb-2 font-ui text-xs">On the desktop</p>
					<div className="grid grid-cols-3 gap-1 pt-2">{apps.map((app) => <AppShortcut key={app.id} app={app} onLaunch={launch} />)}</div>
				</ToolbarMenu>
			</div>
			<ThemeMenu open={menu === "theme"} onToggle={toggle("theme")} onClose={close} />
			<MenuClock />
		</div>
	);
}
