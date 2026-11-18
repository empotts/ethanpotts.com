/**
 * Shared motion: one soft easing curve for everything that moves, windows that
 * grow out of whatever opened them, and a dithered sweep for full-screen pages.
 */
import { parseColor } from "@/kit/game/palette";

type Rect = { left: number; top: number; width: number; height: number };
type Point = { x: number; y: number };

/** Fast start, long gentle landing. Matches `--ease-soft` in styles.css. */
export const EASE_SOFT = [0.2, 0.7, 0.2, 1] as const;
/** For things leaving: eases in, gets out of the way. */
export const EASE_EXIT = [0.4, 0, 1, 1] as const;

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** CSS transform-origin (in the window's own box) that puts `from`'s centre under the scale, so the window grows out of it. */
export function originFor(from: Rect, win: Rect) {
	const x = from.left + from.width / 2 - win.left;
	const y = from.top + from.height / 2 - win.top;
	return `${Math.round(x)}px ${Math.round(y)}px`;
}

export const centerOf = (r: Rect | null): Point | null => (r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null);

/* ---------- Dithered sweep ---------- */

const PIX = 2;
/** Width of the accent-coloured front of the sweep, as a share of the whole. */
const BAND = 0.05;
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const easeOut = (t: number) => 1 - (1 - t) ** 3;
const easeIn = (t: number) => t * t * t;

/** Packs RGB into the little-endian ABGR word an ImageData's Uint32 view expects. */
const pack = ([r, g, b]: number[]) => ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;

/**
 * A field of paper-coloured pixels that spreads out from `at` with an accent
 * front, ordered-dithered so its edge stays pixel-sharp ("cover"), or the same
 * thing pulling back toward `at` ("uncover"). Draws on a fixed canvas over
 * `area` (default: the screen under the menu bar); `colors` is the element whose
 * palette to use. `at` may lie outside the area: the front then enters from the
 * side nearest it.
 */
export function ditherSweep(mode: "cover" | "uncover", at: Point | null, colors: Element, ms = 300, area?: Rect) {
	const bar = document.querySelector(".menu-bar")?.getBoundingClientRect().bottom ?? 0;
	const box = area ?? { left: 0, top: bar, width: window.innerWidth, height: window.innerHeight - bar };
	const canvas = document.createElement("canvas");
	canvas.setAttribute("aria-hidden", "true");
	canvas.className = "sweep-layer";
	const w = Math.max(1, Math.ceil(box.width / PIX));
	const h = Math.max(1, Math.ceil(box.height / PIX));
	canvas.width = w;
	canvas.height = h;
	Object.assign(canvas.style, { left: `${box.left}px`, top: `${box.top}px`, width: `${box.width}px`, height: `${box.height}px` });
	if (area) {
		const css = getComputedStyle(colors);
		canvas.style.borderRadius = css.borderRadius;
		// A window's outline shows at once and the sweep fills it.
		if (mode === "cover") Object.assign(canvas.style, { outline: `2px solid ${css.getPropertyValue("--fg")}`, outlineOffset: "-2px" });
	}
	document.body.appendChild(canvas);
	const remove = () => canvas.remove();
	const ctx = canvas.getContext("2d");
	if (!ctx) return { done: Promise.resolve(), remove };

	const css = getComputedStyle(colors);
	const paper = pack(parseColor(css.getPropertyValue("--bg")));
	const accent = pack(parseColor(css.getPropertyValue("--accent")));
	const img = ctx.createImageData(w, h);
	const px = new Uint32Array(img.data.buffer);

	// Threshold per pixel: distance from the click (scaled to the area's nearest and
	// farthest points), wobbled a little by angle, plus Bayer dither.
	const cx = ((at?.x ?? box.left + box.width / 2) - box.left) / PIX;
	const cy = ((at?.y ?? box.top + box.height / 2) - box.top) / PIX;
	const near = Math.hypot(Math.max(0, -cx, cx - w), Math.max(0, -cy, cy - h));
	const far = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy));
	const span = far - near || 1;
	const seed = Math.random() * 6.28;
	const thr = new Float32Array(w * h);
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const a = Math.atan2(y - cy, x - cx);
			const d = ((Math.hypot(x - cx, y - cy) - near) / span) * (1 + 0.07 * Math.sin(a * 5 + seed) + 0.04 * Math.sin(a * 11 - seed));
			const t = Math.min(1, Math.max(0, d)) * 0.92 + (BAYER4[(y & 3) * 4 + (x & 3)] / 16) * 0.08;
			thr[y * w + x] = mode === "cover" ? t : 1 - t;
		}

	const draw = (p: number) => {
		const level = (mode === "cover" ? easeOut(p) : easeIn(p)) * (1 + BAND);
		for (let i = 0; i < px.length; i++) {
			const k = level - thr[i];
			// Cover: behind the front is paper. Uncover: behind the front is clear.
			if (mode === "cover") px[i] = k <= 0 ? 0 : k < BAND ? accent : paper;
			else px[i] = k <= 0 ? paper : k < BAND ? accent : 0;
		}
		ctx.putImageData(img, 0, 0);
	};
	draw(0);
	const done = new Promise<void>((resolve) => {
		const start = performance.now();
		const tick = (now: number) => {
			const p = Math.min(1, (now - start) / ms);
			draw(p);
			if (p < 1) requestAnimationFrame(tick);
			else resolve();
		};
		requestAnimationFrame(tick);
	});
	if (mode === "uncover") void done.then(remove);
	return { done, remove };
}
