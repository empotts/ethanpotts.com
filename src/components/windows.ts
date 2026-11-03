import { useSyncExternalStore } from "react";

export type WinId = "about" | "projects" | "work" | "writing" | "contact" | "post";

type State = { open: WinId[]; order: WinId[]; gen: number };
let state: State = { open: ["about"], order: ["about"], gen: 0 };
const subs = new Set<() => void>();
const emit = () => {
	for (const s of subs) s();
};

export function openWin(id: WinId) {
	state = {
		...state,
		open: state.open.includes(id) ? state.open : [...state.open, id],
		order: [...state.order.filter((x) => x !== id), id],
	};
	emit();
}
export function focusWin(id: WinId) {
	if (state.order[state.order.length - 1] === id) return;
	state = { ...state, order: [...state.order.filter((x) => x !== id), id] };
	emit();
}
export function closeWin(id: WinId) {
	state = { ...state, open: state.open.filter((x) => x !== id), order: state.order.filter((x) => x !== id) };
	emit();
}
/** Close everything and put windows back where they started. */
export function resetDesk() {
	state = { open: ["about"], order: ["about"], gen: state.gen + 1 };
	emit();
}

export function useWindows() {
	return useSyncExternalStore(
		(cb) => {
			subs.add(cb);
			return () => subs.delete(cb);
		},
		() => state,
		() => state,
	);
}

export function routeWin(pathname: string): WinId | null {
	if (pathname.startsWith("/projects")) return "projects";
	if (pathname.startsWith("/resume")) return "work";
	if (pathname === "/blog" || pathname === "/blog/") return "writing";
	if (pathname.startsWith("/blog/")) return "post";
	return null;
}

export const ROUTE_OF: Partial<Record<WinId, string>> = {
	projects: "/projects",
	work: "/resume",
	writing: "/blog",
};
