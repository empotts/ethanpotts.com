import { animate, motion, useDragControls, useMotionValue } from "motion/react";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AppDef } from "@/apps/define";
import { TrafficLights } from "./TrafficLights";
import { boot, dropInRow, focusWin, iconRect, takeOrigin, toggleMaximize, trashTarget, trashWin, useSnapLayout, useWindows, type WinId } from "./windows";
import { centerOf, ditherSweep, EASE_EXIT, EASE_SOFT, originFor, reducedMotion } from "./motion";

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
	const controls = useDragControls();
	const { open, order, maximized } = useWindows();
	const narrow = useNarrow();
	const z = order.indexOf(id) + 10;
	const active = order[order.length - 1] === id;
	const max = maximized.includes(id);
	// Snap view (wide screens) places the window in the row; otherwise it sits where its app says.
	const slot = useSnapLayout(id)?.get(id);
	// Same idea for the phone stack: a window not yet in the list is the newest.
	const stackIndex = open.includes(id) ? open.indexOf(id) : open.length;
	const x = slot?.x ?? x0;
	const y = slot?.y ?? y0;
	const [trashing, setTrashing] = useState(false);
	const el = useRef<HTMLElement>(null);
	const dx = useMotionValue(0);
	const dy = useMotionValue(0);

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

	// Maximizing snaps the window back from wherever it was dragged. On phones the
	// page behind a maximized window stops scrolling.
	useEffect(() => {
		if (!max) return;
		dx.set(0);
		dy.set(0);
		if (!narrow) return;
		const root = document.documentElement;
		const { overflow } = root.style;
		root.style.overflow = "hidden";
		return () => {
			root.style.overflow = overflow;
		};
	}, [max, narrow, dx, dy]);
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

	return (
		<motion.section
			ref={el}
			drag={!narrow && !max}
			dragControls={controls}
			dragListener={false}
			dragMomentum={false}
			dragElastic={0}
			dragConstraints={desk ?? undefined}
			onPointerDown={() => focusWin(id)}
			onDragEnd={(_, info) => {
				const r = trashTarget.el?.getBoundingClientRect();
				const px = info.point.x - window.scrollX;
				const py = info.point.y - window.scrollY;
				if (r && px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) {
					// Shrink and tumble into the Trash.
					const node = el.current;
					if (node) node.style.transformOrigin = originFor(r, node.getBoundingClientRect());
					setTrashing(true);
					return;
				}
				// In snap view a dropped window takes its new place in the row and glides into it.
				if (slot) {
					const box = el.current?.getBoundingClientRect();
					if (box) dropInRow(id, box.left + box.width / 2);
					const glide = { duration: 0.3, ease: EASE_SOFT };
					animate(dx, 0, glide);
					animate(dy, 0, glide);
				}
			}}
			initial={false}
			animate={trashing ? { scale: 0.05, opacity: 0, rotate: -24 } : { scale: 1, opacity: 1 }}
			transition={{ duration: 0.28, ease: EASE_EXIT }}
			onAnimationComplete={() => {
				if (trashing) {
					trashWin(id);
					close();
				}
			}}
			className="win desk-win flex flex-col"
			data-max={max ? "" : undefined}
			// Windows already there on first load rise in with CSS instead.
			data-boot={animateIn ? undefined : ""}
			// Glide between snap places once the visitor is using the desk (not on first paint).
			data-glide={slot && boot.hydrated ? "" : undefined}
			style={
				{
					x: dx,
					y: dy,
					"--x": `${x}px`,
					"--y": `${y}px`,
					"--w": `${w0}px`,
					"--h": cfg?.height ? `${cfg.height}px` : undefined,
					"--stack-order": stackIndex,
					zIndex: z,
					// Hidden (but laid out) while the sweep fills its place.
					visibility: shown ? undefined : "hidden",
				} as unknown as React.CSSProperties
			}
			aria-label={title}
		>
			<header
				onPointerDown={(e) => !narrow && !max && controls.start(e)}
				onDoubleClick={() => !narrow && maximize()}
				className={`relative flex h-7 shrink-0 cursor-grab items-center border-b-2 border-black px-2 py-1 select-none active:cursor-grabbing ${active ? "titlebar" : ""} ${max ? "cursor-default" : ""}`}
			>
				<TrafficLights title={title} onClose={requestClose} onMaximize={maximize} maximized={max} dim={!active} />
				<h2 className="pointer-events-none absolute left-1/2 max-w-[calc(100%-9rem)] -translate-x-1/2 truncate bg-white px-2 font-ui text-sm leading-none">{title}</h2>
			</header>
			<div data-win-body data-enter={animateIn && shown ? "" : undefined} className={`scroll-retro min-h-0 flex-1 overflow-auto ${cfg?.height ? "win-fixed-h" : ""}`}>
				{children}
			</div>
			{footer && <div className="shrink-0 border-t-2 border-black">{footer}</div>}
		</motion.section>
	);
}
