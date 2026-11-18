import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { TrafficLights } from "./TrafficLights";
import { wallpaperMode } from "./Wallpaper";
import { boot, recentPress } from "./windows";
import { centerOf, ditherSweep, reducedMotion } from "./motion";

const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Full-screen retro modal. Covers the desktop (but not the menu bar, which stays
 * usable above it) with a single window: title bar,
 * close box, scrollable body, optional footer. Closes on Escape. Locks page scroll
 * and returns focus to whatever was focused before it opened.
 *
 * Opens with a dithered sweep spreading from whatever was clicked, and pulls
 * back into it on close.
 * Used for articles today; reusable for anything that needs the whole screen.
 */
export function FullscreenModal({
	title,
	onClose,
	children,
	footer,
	toolbar,
	actions,
	label,
	progress = false,
	theme,
	accent,
}: {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
	footer?: React.ReactNode;
	/** Optional row of controls under the title bar. */
	toolbar?: React.ReactNode;
	/** Small controls at the right end of the title bar. */
	actions?: React.ReactNode;
	/** Accessible name if the visible title is not descriptive enough. */
	label?: string;
	/** Shows a reading-progress bar under the title bar. */
	progress?: boolean;
	/** Renders the modal in one theme, whatever the visitor picked. */
	theme?: string;
	/** Overrides the accent colour inside the modal. */
	accent?: string;
}) {
	const panel = useRef<HTMLDivElement>(null);
	const body = useRef<HTMLDivElement>(null);
	const origin = useRef<ReturnType<typeof recentPress>>(null);
	const animateIn = boot.hydrated && !reducedMotion();
	const [shown, setShown] = useState(!animateIn);
	const [fullscreen, setFullscreen] = useState(false);
	useEffect(() => {
		const on = () => setFullscreen(document.fullscreenElement === panel.current);
		document.addEventListener("fullscreenchange", on);
		return () => document.removeEventListener("fullscreenchange", on);
	}, []);
	// Maximize here means real full screen, hiding the menu bar too.
	const toggleFullscreen = () => {
		if (document.fullscreenElement) void document.exitFullscreen();
		else void panel.current?.requestFullscreen?.().catch(() => {});
	};
	// Nothing of the desk shows while the page is up, so the wallpaper stops drawing.
	useEffect(() => {
		if (!shown) return;
		wallpaperMode.covered = true;
		return () => {
			wallpaperMode.covered = false;
		};
	}, [shown]);

	// Reading progress: the bar under the title fills as you scroll, and the
	// wallpaper drifts a little with it. Written straight to the element, no renders.
	const bar = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = body.current;
		if (!el) return;
		const on = () => {
			const max = el.scrollHeight - el.clientHeight;
			const v = max > 0 ? el.scrollTop / max : 0;
			wallpaperMode.scroll = v;
			if (bar.current) bar.current.style.transform = `scaleX(${v})`;
		};
		on();
		el.addEventListener("scroll", on, { passive: true });
		return () => {
			el.removeEventListener("scroll", on);
			wallpaperMode.scroll = 0;
		};
	}, []);

	const wrap = useRef<HTMLDivElement>(null);
	useIsoLayout(() => {
		origin.current = recentPress();
		if (shown || !wrap.current) return;
		// Paper spreads over the desktop, the page appears under it, and the paper lifts.
		const sweep = ditherSweep("cover", centerOf(origin.current), wrap.current);
		let live = true;
		sweep.done.then(() => {
			if (live) setShown(true);
			requestAnimationFrame(() => requestAnimationFrame(sweep.remove));
		});
		return () => {
			live = false;
			sweep.remove();
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: runs once on open
	}, []);

	const close = useRef(onClose);
	close.current = () => {
		// The page pulls back into whatever opened it (the post's line in Writing, usually).
		if (wrap.current && !reducedMotion()) ditherSweep("uncover", centerOf(origin.current), wrap.current, 260);
		onClose();
	};

	useEffect(() => {
		const previous = document.activeElement as HTMLElement | null;
		const { overflow } = document.body.style;
		document.body.style.overflow = "hidden";
		panel.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			// A menu-bar menu handles its own Escape first.
			if (e.key === "Escape" && !e.defaultPrevented) close.current();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = overflow;
			window.removeEventListener("keydown", onKey);
			previous?.focus?.();
		};
	}, []);

	return (
		<div
			ref={wrap}
			className="modal-under-bar fixed inset-x-0 bottom-0 z-[90]"
			role="dialog"
			aria-modal="true"
			aria-label={label ?? title}
			data-theme={theme}
			style={accent ? ({ "--accent": accent } as React.CSSProperties) : undefined}
		>
			<div
				ref={panel}
				tabIndex={-1}
				// Hidden under the sweep until it has covered the screen.
				style={shown ? undefined : { opacity: 0 }}
				className="win modal-full flex h-full flex-col text-black outline-none"
			>
				<header className="titlebar relative flex h-8 shrink-0 items-center gap-2 border-b-2 border-black px-2">
					<TrafficLights title={label ?? title} onClose={() => close.current()} onMaximize={toggleFullscreen} maximized={fullscreen} />
					<h2 className="mx-auto truncate bg-white px-3 font-ui text-sm leading-none">{title}</h2>
					<span className="hidden shrink-0 bg-white px-2 font-ui text-xs sm:block">esc to close</span>
					{actions && <div className="flex shrink-0 items-center bg-white px-1">{actions}</div>}
					{progress && <div ref={bar} aria-hidden className="read-progress" style={{ transform: "scaleX(0)" }} />}
				</header>
				{toolbar && <div className="shrink-0 border-b-2 border-black">{toolbar}</div>}
				<div ref={body} className="scroll-retro relative min-h-0 flex-1 overflow-auto" data-enter={animateIn && shown ? "" : undefined}>
					{children}
				</div>
				{footer && <div className="shrink-0 border-t-2 border-black">{footer}</div>}
			</div>
		</div>
	);
}
