import { useSyncExternalStore } from "react";
import { getApp } from "@/apps/index";

/**
 * The window manager's state. Window ids are app ids from `src/apps` (plus
 * "post" for the reading modal), so adding an app never touches this file.
 */
export type WinId = string;

type Rect = { left: number; top: number; width: number; height: number };

/** `opened` counts openWin calls, so a full-screen page can step aside when a window is asked for. */
type State = {
	open: WinId[];
	order: WinId[];
	gen: number;
	trashed: WinId[];
	opened: number;
	/** Data an app was opened with (the project to show, the photo just taken). */
	payload: Record<WinId, unknown>;
	/** Bumped each time an app is opened with new data, so its window remounts. */
	seq: Record<WinId, number>;
	maximized: WinId[];
};
let state: State = { open: ["about"], order: ["about"], gen: 0, trashed: [], opened: 0, payload: {}, seq: {}, maximized: [] };
/** What the server rendered. Parts of the page that hydrate late (inside Suspense) must start from this, not from changes made since. */
const initial = state;
const subs = new Set<() => void>();
const emit = () => {
	for (const s of subs) s();
};

/* ---------- where things open from ---------- */

const toRect = (r: DOMRect | Rect): Rect => ({ left: r.left, top: r.top, width: r.width, height: r.height });
const visibleRect = (el: Element | null): Rect | null => {
	if (!el) return null;
	const r = el.getBoundingClientRect();
	return r.width > 0 && r.height > 0 ? toRect(r) : null;
};

/** The last thing pressed, so a window can grow out of whatever opened it. */
let lastPress: { rect: Rect; t: number } | null = null;
if (typeof window !== "undefined") {
	window.addEventListener(
		"pointerdown",
		(e) => {
			const el = (e.target as Element | null)?.closest?.("button, a, [data-desk-icon], [role='button']");
			const rect = visibleRect(el ?? null);
			if (rect) lastPress = { rect, t: performance.now() };
		},
		true,
	);
}
export function recentPress(ms = 900): Rect | null {
	return lastPress && performance.now() - lastPress.t < ms ? lastPress.rect : null;
}
/** The app's desktop icon, when it is on screen. */
export function iconRect(id: WinId): Rect | null {
	return visibleRect(typeof document === "undefined" ? null : document.querySelector(`[data-app-icon="${id}"]`));
}

/** Origin rect per window, read once by the window as it mounts. */
const origins = new Map<WinId, Rect | null>();
export function takeOrigin(id: WinId): Rect | null {
	const o = origins.get(id) ?? null;
	origins.delete(id);
	return o;
}

export type OpenOpts = { payload?: unknown; from?: Element | DOMRect | Rect | null };

export function openWin(id: WinId, opts: OpenOpts = {}) {
	const from = opts.from instanceof Element ? visibleRect(opts.from) : opts.from ? toRect(opts.from) : null;
	origins.set(id, from ?? recentPress() ?? iconRect(id));
	const hasPayload = "payload" in opts;
	state = {
		...state,
		open: state.open.includes(id) ? state.open : [...state.open, id],
		order: [...state.order.filter((x) => x !== id), id],
		opened: state.opened + 1,
		payload: hasPayload ? { ...state.payload, [id]: opts.payload } : state.payload,
		seq: hasPayload ? { ...state.seq, [id]: (state.seq[id] ?? 0) + 1 } : state.seq,
	};
	emit();
}
export function focusWin(id: WinId) {
	if (state.order[state.order.length - 1] === id) return;
	state = { ...state, order: [...state.order.filter((x) => x !== id), id] };
	emit();
}
export function closeWin(id: WinId) {
	state = {
		...state,
		open: state.open.filter((x) => x !== id),
		order: state.order.filter((x) => x !== id),
		maximized: state.maximized.filter((x) => x !== id),
	};
	emit();
}
export function toggleMaximize(id: WinId) {
	const on = state.maximized.includes(id);
	state = { ...state, maximized: on ? state.maximized.filter((x) => x !== id) : [...state.maximized, id] };
	emit();
}
/** Close everything and put windows back where they started. */
export function resetDesk() {
	state = { ...state, open: ["about"], order: ["about"], gen: state.gen + 1, maximized: [] };
	emit();
}

/** A window dragged onto the Trash is closed and listed there until the Trash is emptied. */
export function trashWin(id: WinId) {
	closeWin(id);
	state = { ...state, trashed: [...state.trashed.filter((x) => x !== id), id] };
	emit();
}
export function emptyTrash() {
	state = { ...state, trashed: [] };
	emit();
}
/** The Trash icon element, so a window drop can be tested against it. */
export const trashTarget: { el: HTMLElement | null } = { el: null };

export function useWindows() {
	return useSyncExternalStore(
		(cb) => {
			subs.add(cb);
			return () => subs.delete(cb);
		},
		() => state,
		() => initial,
	);
}

/* ---------- Snap view ---------- */

/*
 * On wide screens open windows line up in a row, in opening order, top-aligned
 * under the menu bar. When they don't all fit they fan out evenly instead of
 * piling up. Dropping a dragged window moves it to that place in the row.
 */
const SNAP_KEY = "ep-snap";
/** Snap view applies from this width up; narrower desktops keep free placement. */
const SNAP_MIN = 900;
const ROW = { left: 60, top: 40, gap: 20, icons: 230 };

let snapOn = true;
let viewW = 0;
const snapSubs = new Set<() => void>();
const snapEmit = () => {
	for (const s of snapSubs) s();
};
if (typeof window !== "undefined") {
	try {
		snapOn = localStorage.getItem(SNAP_KEY) !== "off";
	} catch {}
	viewW = window.innerWidth;
	window.addEventListener("resize", () => {
		viewW = window.innerWidth;
		snapEmit();
	});
}
export function setSnap(on: boolean) {
	snapOn = on;
	try {
		localStorage.setItem(SNAP_KEY, on ? "on" : "off");
	} catch {}
	snapEmit();
}
const subscribeSnap = (cb: () => void) => {
	snapSubs.add(cb);
	return () => snapSubs.delete(cb);
};
export const useSnapSetting = () => useSyncExternalStore(subscribeSnap, () => snapOn, () => true);
/** Viewport width, or 0 while server rendering (so the first paint matches the server's). */
const useViewW = () => useSyncExternalStore(subscribeSnap, () => viewW, () => 0);

const widthOf = (id: WinId) => getApp(id)?.window?.width ?? 420;
/** Each snapped window's left/top, or null when snap view is off or the screen is narrow. */
function snapRow(ids: WinId[], vw: number): Map<WinId, { x: number; y: number }> | null {
	if (vw < SNAP_MIN || !ids.length) return null;
	const widths = ids.map(widthOf);
	const avail = vw - ROW.icons - ROW.left;
	const total = widths.reduce((a, b) => a + b, 0) + ROW.gap * (ids.length - 1);
	const row = new Map<WinId, { x: number; y: number }>();
	let x = ROW.left;
	// Too many to fit side by side: fan them out so each still shows its left edge.
	const step = ids.length > 1 ? (avail - widths[widths.length - 1]) / (ids.length - 1) : 0;
	ids.forEach((id, i) => {
		row.set(id, { x: Math.round(total <= avail ? x : ROW.left + i * Math.max(28, step)), y: ROW.top });
		x += widths[i] + ROW.gap;
	});
	return row;
}

/**
 * Where snap view puts each open window, or null when it is off. `id` counts as
 * the newest window if it isn't open yet: a window opened by a link renders for
 * a moment before it's added to the list, and must already be in its place.
 */
export function useSnapLayout(id: WinId) {
	const { open, maximized } = useWindows();
	const on = useSnapSetting();
	const vw = useViewW();
	if (!on || !getApp(id)) return null;
	const ids = open.includes(id) ? open : [...open, id];
	return snapRow(ids.filter((x) => !maximized.includes(x)), vw);
}

/** Moves a window to the place in the row nearest `centerX` (a dropped window's middle). */
export function dropInRow(id: WinId, centerX: number) {
	const row = snapRow(state.open.filter((x) => !state.maximized.includes(x)), viewW);
	if (!row) return;
	const others = state.open.filter((x) => x !== id && row.has(x));
	const at = others.filter((x) => {
		const p = row.get(x);
		return p ? p.x + widthOf(x) / 2 < centerX : false;
	}).length;
	const next = [...others.slice(0, at), id, ...others.slice(at)];
	// Keep any maximized windows where they were in the opening order.
	const rest = state.open.filter((x) => !row.has(x));
	state = { ...state, open: [...next, ...rest] };
	emit();
}

/** False until the visitor first clicks, taps or types; windows present at load skip their entrance animation. */
export const boot = { hydrated: false };
