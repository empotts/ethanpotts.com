import { useSyncExternalStore } from "react";

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
/** Each open desk window's way of throwing itself in the Trash, so the Trash can clear the screen. */
export const binners = new Map<WinId, () => void>();
/**
 * Clicking the Trash: with windows on screen, they all tumble into it, one just
 * after another; on a clear desk, a full Trash is emptied.
 */
export function clearScreen() {
	const ids = state.order.filter((id) => binners.has(id)).reverse();
	if (!ids.length) return emptyTrash();
	ids.forEach((id, i) => setTimeout(() => binners.get(id)?.(), i * 60));
}

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

/** False until the visitor first clicks, taps or types; windows present at load skip their entrance animation. */
export const boot = { hydrated: false };

/* ---------- Tiled mode ---------- */

/*
 * A tiling window manager's layout on wide screens: windows fill the desk with
 * even gaps, never overlap and share it equally, in opening order across rows:
 * one fills it, two take half each, four a quarter each. Tiled windows can't be
 * dragged; closing one lets the others grow back.
 */
const TILE_KEY = "ep-tile";
/** Tiling applies from this width up; narrower desktops keep free placement. */
const TILE_MIN = 900;
/** Gaps, the menu bar above and the icon columns on the right. */
const DESK = { gap: 12, top: 32, icons: 196 };

export type Tile = { x: number; y: number; w: number; h: number };

let tileOn = false;
let view = { w: 0, h: 0 };
const tileSubs = new Set<() => void>();
const tileEmit = () => {
	for (const s of tileSubs) s();
};
if (typeof window !== "undefined") {
	try {
		tileOn = localStorage.getItem(TILE_KEY) === "on";
	} catch {}
	const measure = () => {
		view = { w: window.innerWidth, h: window.innerHeight };
	};
	measure();
	window.addEventListener("resize", () => {
		measure();
		tileEmit();
	});
}
export function setTiled(on: boolean) {
	tileOn = on;
	try {
		localStorage.setItem(TILE_KEY, on ? "on" : "off");
	} catch {}
	tileEmit();
}
const subscribeTile = (cb: () => void) => {
	tileSubs.add(cb);
	return () => tileSubs.delete(cb);
};
/** The setting, false while server rendering so the first paint matches the server's. */
export const useTileSetting = () => useSyncExternalStore(subscribeTile, () => tileOn, () => false);
const useView = () => useSyncExternalStore(subscribeTile, () => view, () => null);

function grid(ids: WinId[], vw: number, vh: number): Map<WinId, Tile> {
	const g = DESK.gap;
	const area = { x: g, y: DESK.top + g, w: vw - DESK.icons - 2 * g, h: vh - DESK.top - 2 * g };
	const n = ids.length;
	// As many rows as keeps the tiles closest to the desk's own shape: halves, then thirds or quarters…
	const rows = Math.max(1, Math.min(n, Math.round(Math.sqrt((n * area.h) / area.w))));
	const tiles = new Map<WinId, Tile>();
	let i = 0;
	for (let r = 0; r < rows; r++) {
		// Spread the windows evenly; later rows take any extra.
		const inRow = Math.floor(n / rows) + (r >= rows - (n % rows) ? 1 : 0);
		const h = (area.h - g * (rows - 1)) / rows;
		const w = (area.w - g * (inRow - 1)) / inRow;
		for (let c = 0; c < inRow; c++, i++) {
			tiles.set(ids[i], { x: Math.round(area.x + c * (w + g)), y: Math.round(area.y + r * (h + g)), w: Math.round(w), h: Math.round(h) });
		}
	}
	return tiles;
}

/**
 * This window's tile, or null when tiling is off, the screen is narrow or the
 * window is maximized. `id` counts as the newest window if it isn't open yet: a
 * window opened by a link renders for a moment before it's added to the list.
 */
export function useTile(id: WinId): Tile | null {
	const { open, maximized } = useWindows();
	const on = useTileSetting();
	const v = useView();
	if (!on || !v || v.w < TILE_MIN || maximized.includes(id)) return null;
	const ids = (open.includes(id) ? open : [...open, id]).filter((x) => !maximized.includes(x));
	return grid(ids, v.w, v.h).get(id) ?? null;
}
