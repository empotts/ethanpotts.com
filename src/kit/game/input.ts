import { useEffect, useRef } from "react";

/** Action name → keys (KeyboardEvent.code) and gamepad buttons that trigger it. */
export type Bindings<A extends string> = Record<A, { keys: string[]; pad?: number[] }>;

export type Input<A extends string> = {
	/** Held right now. */
	down: (a: A) => boolean;
	/** Went down since the last `endFrame()`. */
	pressed: (a: A) => boolean;
	/** Call once per update step, after reading `pressed`. */
	endFrame: () => void;
	/** For on-screen buttons. */
	set: (a: A, on: boolean) => void;
};

/**
 * Keyboard, gamepad and touch in one place. Keys are only captured while
 * `enabled` (the window is in front), so a game never steals typing elsewhere.
 */
export function useInput<A extends string>(bindings: Bindings<A>, enabled: boolean): Input<A> {
	const held = useRef(new Set<A>());
	const fresh = useRef(new Set<A>());
	const map = useRef(bindings);
	map.current = bindings;

	const api = useRef<Input<A>>({
		down: (a) => held.current.has(a),
		pressed: (a) => fresh.current.has(a),
		endFrame: () => {
			fresh.current.clear();
			pollPads();
		},
		set: (a, on) => {
			if (on && !held.current.has(a)) fresh.current.add(a);
			if (on) held.current.add(a);
			else held.current.delete(a);
		},
	});

	const padHeld = useRef(new Set<A>());
	function pollPads() {
		const pads = typeof navigator !== "undefined" && navigator.getGamepads ? navigator.getGamepads() : [];
		const now = new Set<A>();
		for (const pad of pads) {
			if (!pad) continue;
			for (const [a, b] of Object.entries(map.current) as [A, Bindings<A>[A]][]) if (b.pad?.some((i) => pad.buttons[i]?.pressed)) now.add(a);
		}
		for (const a of now) if (!padHeld.current.has(a)) api.current.set(a, true);
		for (const a of padHeld.current) if (!now.has(a)) api.current.set(a, false);
		padHeld.current = now;
	}

	useEffect(() => {
		if (!enabled) {
			held.current.clear();
			return;
		}
		const action = (code: string) => (Object.entries(map.current) as [A, Bindings<A>[A]][]).find(([, b]) => b.keys.includes(code))?.[0];
		const onDown = (e: KeyboardEvent) => {
			const el = e.target as HTMLElement | null;
			if (el?.closest("input, textarea, [contenteditable]")) return;
			const a = action(e.code);
			if (!a) return;
			e.preventDefault();
			if (!e.repeat) api.current.set(a, true);
		};
		const onUp = (e: KeyboardEvent) => {
			const a = action(e.code);
			if (a) api.current.set(a, false);
		};
		const clear = () => held.current.clear();
		window.addEventListener("keydown", onDown);
		window.addEventListener("keyup", onUp);
		window.addEventListener("blur", clear);
		return () => {
			window.removeEventListener("keydown", onDown);
			window.removeEventListener("keyup", onUp);
			window.removeEventListener("blur", clear);
		};
	}, [enabled]);

	return api.current;
}

/** Big press-and-hold buttons for phones. Each maps to one action. */
export function touchHandlers<A extends string>(input: Input<A>, a: A) {
	return {
		onPointerDown: (e: React.PointerEvent) => {
			e.preventDefault();
			(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
			input.set(a, true);
		},
		onPointerUp: () => input.set(a, false),
		onPointerCancel: () => input.set(a, false),
		onContextMenu: (e: React.SyntheticEvent) => e.preventDefault(),
	};
}
