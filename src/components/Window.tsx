import { motion, useDragControls, useMotionValue } from "motion/react";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { AppDef } from "@/apps/define";
import { TrafficLights } from "./TrafficLights";
import { boot, focusWin, iconRect, takeOrigin, toggleMaximize, trashTarget, trashWin, useWindows, type WinId } from "./windows";
import { reducedMotion, zoomRects } from "./zoom";

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
		<section className="win not-prose my-6 flex flex-col" aria-label={title}>
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
	/** Narrowest the window may get, so its contents never collide. */
	const minW = Math.min(w0, cfg?.minWidth ?? 280);

	const desk = useContext(DeskRef);
	const controls = useDragControls();
	const { open, order, maximized } = useWindows();
	const narrow = useNarrow();
	const z = order.indexOf(id) + 10;
	const active = order[order.length - 1] === id;
	const max = maximized.includes(id);
	const [trashing, setTrashing] = useState(false);
	const [closing, setClosing] = useState(false);
	const [size, setSize] = useState<{ w: number; h?: number }>({ w: w0, h: cfg?.height });
	const el = useRef<HTMLElement>(null);
	const dx = useMotionValue(0);
	const dy = useMotionValue(0);

	// Opening: outlines zoom from whatever opened the window, then it appears.
	const animateIn = boot.hydrated && !reducedMotion();
	const [shown, setShown] = useState(!animateIn);
	const origin = useRef<ReturnType<typeof takeOrigin>>(null);
	useIsoLayout(() => {
		origin.current = takeOrigin(id);
		if (shown) return;
		const r = el.current?.getBoundingClientRect();
		if (!origin.current || !r) {
			setShown(true);
			return;
		}
		let live = true;
		zoomRects(origin.current, r).then(() => live && setShown(true));
		return () => {
			live = false;
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

	// Closing: the window folds back into its icon (or wherever it came from).
	const requestClose = () => {
		const r = el.current?.getBoundingClientRect();
		const to = iconRect(id) ?? origin.current;
		if (r && to) zoomRects(r, to);
		if (reducedMotion()) close();
		else setClosing(true);
	};

	const startResize = (e: React.PointerEvent) => {
		e.preventDefault();
		e.stopPropagation();
		const r = el.current?.getBoundingClientRect();
		const body = el.current?.querySelector<HTMLElement>("[data-win-body]");
		if (!r || !body) return;
		const sx = e.clientX;
		const sy = e.clientY;
		const startW = r.width;
		const startH = body.getBoundingClientRect().height;
		const minH = cfg?.minHeight ?? 120;
		// Dragging the grow box would otherwise select (and highlight) the window's text.
		const { userSelect } = document.body.style;
		document.body.style.userSelect = "none";
		const move = (ev: PointerEvent) => {
			setSize({ w: Math.max(minW, startW + ev.clientX - sx), h: Math.max(minH, startH + ev.clientY - sy) });
		};
		const up = () => {
			document.body.style.userSelect = userSelect;
			window.removeEventListener("pointermove", move);
			window.removeEventListener("pointerup", up);
		};
		window.addEventListener("pointermove", move);
		window.addEventListener("pointerup", up);
	};

	const visible = shown && !closing && !trashing;
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
				if (r && px >= r.left && px <= r.right && py >= r.top && py <= r.bottom) setTrashing(true);
			}}
			initial={animateIn ? { opacity: 0, scale: 1 } : false}
			animate={
				trashing
					? { scale: 0.05, opacity: 0, rotate: -30 }
					: closing
						? { scale: 0.9, opacity: 0 }
						: visible
							? { scale: 1, opacity: 1 }
							: { opacity: 0, scale: 1 }
			}
			// One-bit motion: hard steps rather than glides.
			transition={
				trashing
					? { duration: 0.3, ease: (t: number) => Math.floor(t * 6) / 6 }
					: closing
						? { duration: 0.14, ease: (t: number) => Math.floor(t * 3) / 3 }
						: { duration: 0.1, ease: (t: number) => Math.ceil(t * 3) / 3 }
			}
			onAnimationComplete={() => {
				if (trashing) {
					trashWin(id);
					close();
				} else if (closing) close();
			}}
			className="win desk-win flex flex-col"
			data-max={max ? "" : undefined}
			style={
				{
					x: dx,
					y: dy,
					"--x": `${x0}px`,
					"--y": `${y0}px`,
					"--w": `${size.w}px`,
					"--min-w": `${minW}px`,
					"--h": size.h ? `${size.h}px` : undefined,
					"--stack-order": open.indexOf(id),
					zIndex: z,
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
			<div data-win-body className={`scroll-retro min-h-0 flex-1 overflow-auto ${size.h ? "win-fixed-h" : ""}`}>
				{children}
			</div>
			{footer && <div className="shrink-0 border-t-2 border-black">{footer}</div>}
			{cfg?.resizable && !narrow && !max && (
				<button
					type="button"
					aria-label={`Resize ${title}`}
					tabIndex={-1}
					onPointerDown={startResize}
					className="grow-box absolute right-0 bottom-0 size-4 cursor-nwse-resize"
				/>
			)}
		</motion.section>
	);
}
