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

/** The last thing pressed, so a window can zoom out of whatever opened it. */
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

/** False until the visitor first clicks, taps or types; windows present at load skip their entrance animation. */
export const boot = { hydrated: false };
