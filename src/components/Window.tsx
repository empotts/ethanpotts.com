import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AppDef } from "@/apps/define";
import { TrafficLights } from "./TrafficLights";
import { boot, focusWin, iconRect, takeOrigin, toggleMaximize, trashTarget, trashWin, useTile, useWindows, type WinId } from "./windows";
import { centerOf, ditherSweep, originFor, reducedMotion } from "./motion";

export const DeskRef = createContext<React.RefObject<HTMLDivElement | null> | null>(null);

/** Set by the desktop around each app's body; read by `Window` and by app code. */
export type AppFrame = {
	app: AppDef;
	/** True when this window is in front, so games know when to listen to keys. */
	active: boolean;
	/** True when the app is embedded in an article instead of floating on the desk. */
	embedded: boolean;
	close: () => void;
};
export const AppFrameContext = createContext<AppFrame | null>(null);
export const useAppFrame = () => useContext(AppFrameContext);

export function useNarrow() {
	const [n, setN] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 720px)");
		const on = () => setN(mq.matches);
		on();
		mq.addEventListener("change", on);
		return () => mq.removeEventListener("change", on);
	}, []);
	return n;
}

type WindowProps = {
	/** Defaults to the app's title. */
	title?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	/** Overrides for the app's `window` settings. */
	x?: number;
	y?: number;
	width?: number;
	id?: WinId;
	onClose?: () => void;
};

const useIsoLayout = typeof window === "undefined" ? useEffect : useLayoutEffect;

/** An app's window. Position, size and behaviour come from the app definition. */
export function Window(props: WindowProps) {
	const frame = useAppFrame();
	if (frame?.embedded) return <EmbeddedWindow title={props.title ?? frame.app.title} footer={props.footer}>{props.children}</EmbeddedWindow>;
	return <DeskWindow {...props} />;
}

/** The same chrome, sitting still inside an article. */
function EmbeddedWindow({ title, children, footer }: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
	return (
		<section className="win relative not-prose my-6 flex flex-col" aria-label={title}>
			<header className="titlebar flex h-7 shrink-0 items-center border-b-2 border-black px-1.5">
				<span className="mx-auto bg-white px-2 font-ui text-sm leading-none">{title}</span>
			</header>
			<div>{children}</div>
			{footer && <div className="shrink-0 border-t-2 border-black">{footer}</div>}
		</section>
	);
}

function DeskWindow({ title: titleProp, children, footer, x: xProp, y: yProp, width: wProp, id: idProp, onClose: onCloseProp }: WindowProps) {
	const frame = useAppFrame();
	const id = idProp ?? frame?.app.id ?? "window";
	const cfg = frame?.app.window;
	const title = titleProp ?? frame?.app.title ?? "";
	const close = onCloseProp ?? frame?.close ?? (() => {});
	const x0 = xProp ?? cfg?.x ?? 120;
	const y0 = yProp ?? cfg?.y ?? 80;
	const w0 = wProp ?? cfg?.width ?? 420;

	const desk = useContext(DeskRef);
	const { open, order, maximized } = useWindows();
	const narrow = useNarrow();
	const z = order.indexOf(id) + 10;
	const active = order[order.length - 1] === id;
	const max = maximized.includes(id);
	// Tiled mode (wide screens) gives the window a fixed tile; it can't be dragged out of it.
	const tile = useTile(id);
	const fixed = max || !!tile;
	// On the phone stack a window not yet in the list is the newest.
	const stackIndex = open.includes(id) ? open.indexOf(id) : open.length;
	const el = useRef<HTMLElement>(null);
	/** How far the window has been dragged from its place, applied as a transform. */
	const offset = useRef({ x: 0, y: 0 });
	const moveTo = (x: number, y: number) => {
		const node = el.current;
		if (!node) return;
		offset.current = { x, y };
		node.style.transform = x || y ? `translate(${x}px, ${y}px)` : "";
	};

	// Opening: the same dithered sweep as articles, sized to the window. Paper spreads
	// over its place from whatever opened it, then the window shows under it and
	// its contents settle in. Starts before the first paint, so there's no wait.
	const animateIn = boot.hydrated && !reducedMotion();
	const [shown, setShown] = useState(!animateIn);
	const origin = useRef<ReturnType<typeof takeOrigin>>(null);
	useIsoLayout(() => {
		origin.current = takeOrigin(id);
		const node = el.current;
		if (!animateIn || !node) return;
		const sweep = ditherSweep("cover", centerOf(origin.current), node, 240, node.getBoundingClientRect());
		let live = true;
		sweep.done.then(() => {
			if (live) setShown(true);
			requestAnimationFrame(() => requestAnimationFrame(sweep.remove));
		});
		return () => {
			live = false;
			sweep.remove();
		};
		// biome-ignore lint/correctness/useExhaustiveDependencies: runs once as the window mounts
	}, []);

	// Maximizing or tiling snaps the window back from wherever it was dragged.
	useEffect(() => {
		if (fixed) moveTo(0, 0);
		// biome-ignore lint/correctness/useExhaustiveDependencies: moveTo only touches the element
	}, [fixed]);
	// On phones the page behind a maximized window stops scrolling.
	useEffect(() => {
		if (!max || !narrow) return;
		const root = document.documentElement;
		const { overflow } = root.style;
		root.style.overflow = "hidden";
		return () => {
			root.style.overflow = overflow;
		};
	}, [max, narrow]);
	const maximize = () => {
		focusWin(id);
		toggleMaximize(id);
	};

	// Closing: the window turns to paper and dissolves back toward its icon (or wherever it came from).
	const requestClose = () => {
		const node = el.current;
		// Not on phones: there the stack closes up at once and the paper would sit over the next window.
		if (node && !narrow && !reducedMotion()) ditherSweep("uncover", centerOf(iconRect(id) ?? origin.current), node, 200, node.getBoundingClientRect());
		close();
	};

	// Dropped on the Trash: shrink and tumble into it, then go.
	const trash = (bin: DOMRect) => {
		const node = el.current;
		if (!node || reducedMotion()) {
			trashWin(id);
			close();
			return;
		}
		node.style.transformOrigin = originFor(bin, node.getBoundingClientRect());
		const from = node.style.transform || "none";
		const to = `${node.style.transform} scale(0.05) rotate(-24deg)`;
		const a = node.animate([{ transform: from, opacity: 1 }, { transform: to, opacity: 0 }], { duration: 280, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" });
		a.onfinish = () => {
			trashWin(id);
			close();
		};
	};

	// Dragging by the title bar, kept inside the desk. Starts after a few pixels so
	// clicks and double-clicks on the bar still work.
	const startDrag = (e: React.PointerEvent<HTMLElement>) => {
		const node = el.current;
		const area = desk?.current;
		if (narrow || fixed || e.button !== 0 || !node || !area || (e.target as Element).closest("button")) return;
		const bar = e.currentTarget;
		const sx = e.clientX;
		const sy = e.clientY;
		const start = { ...offset.current };
		const win = node.getBoundingClientRect();
		const box = area.getBoundingClientRect();
		const lo = { x: start.x + box.left - win.left, y: start.y + box.top - win.top };
		const hi = { x: start.x + box.right - win.right, y: start.y + box.bottom - win.bottom };
		const clamp = (v: number, a: number, b: number) => (a > b ? v : Math.min(b, Math.max(a, v)));
		let moving = false;
		const move = (ev: PointerEvent) => {
			const mx = ev.clientX - sx;
			const my = ev.clientY - sy;
			if (!moving) {
				if (Math.abs(mx) + Math.abs(my) < 4) return;
				moving = true;
				bar.setPointerCapture(ev.pointerId);
				document.body.style.userSelect = "none";
			}
			moveTo(clamp(start.x + mx, lo.x, hi.x), clamp(start.y + my, lo.y, hi.y));
		};
		const up = (ev: PointerEvent) => {
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
			window.removeEventListener("pointercancel", up);
			if (!moving) return;
			document.body.style.userSelect = "";
			const bin = trashTarget.el?.getBoundingClientRect();
			if (bin && ev.clientX >= bin.left && ev.clientX <= bin.right && ev.clientY >= bin.top && ev.clientY <= bin.bottom) trash(bin);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
		window.addEventListener("pointercancel", up);
	};

	return (
		<section
			ref={el}
			onPointerDown={() => focusWin(id)}
			className="win desk-win flex flex-col"
			data-max={max ? "" : undefined}
			data-tiled={tile ? "" : undefined}
			// Windows already there on first load rise in with CSS instead.
			data-boot={animateIn ? undefined : ""}
			style={
				{
					"--x": `${x0}px`,
					"--y": `${y0}px`,
					"--w": `${w0}px`,
					"--h": cfg?.height ? `${cfg.height}px` : undefined,
					...(tile && { "--tx": `${tile.x}px`, "--ty": `${tile.y}px`, "--tw": `${tile.w}px`, "--th": `${tile.h}px` }),
					"--stack-order": stackIndex,
					zIndex: z,
					// Hidden (but laid out) while the sweep fills its place.
					visibility: shown ? undefined : "hidden",
				} as React.CSSProperties
			}
			aria-label={title}
		>
			<header
				onPointerDown={startDrag}
				onDoubleClick={() => !narrow && maximize()}
				className={`relative flex h-7 shrink-0 items-center border-b-2 border-black px-2 py-1 select-none ${fixed ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${active ? "titlebar" : ""}`}
			>
				<TrafficLights title={title} onClose={requestClose} onMaximize={maximize} maximized={max} dim={!active} />
				<h2 className="pointer-events-none absolute left-1/2 max-w-[calc(100%-9rem)] -translate-x-1/2 truncate bg-white px-2 font-ui text-sm leading-none">{title}</h2>
			</header>
			<div data-win-body data-enter={animateIn && shown ? "" : undefined} className={`scroll-retro min-h-0 flex-1 overflow-auto ${cfg?.height ? "win-fixed-h" : ""}`}>
				{children}
			</div>
			{footer && <div className="shrink-0 border-t-2 border-black">{footer}</div>}
		</section>
	);
}
