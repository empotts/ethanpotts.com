/**
 * The classic desktop "zoom rects": a few outlines step from where something was
 * opened to where its window lands (or back again on close). Drawn on a fixed
 * overlay so it never touches layout, and skipped for reduced motion.
 */

type Rect = { left: number; top: number; width: number; height: number };

const FRAMES = 8;
const FRAME_MS = 22;
const TRAIL = 3;

export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function zoomRects(from: Rect | null, to: Rect | null): Promise<void> {
	if (!from || !to || typeof document === "undefined" || reducedMotion()) return Promise.resolve();
	const layer = document.createElement("div");
	layer.className = "zoom-layer";
	layer.setAttribute("aria-hidden", "true");
	const boxes = Array.from({ length: TRAIL }, () => {
		const b = document.createElement("div");
		b.className = "zoom-rect";
		layer.appendChild(b);
		return b;
	});
	document.body.appendChild(layer);
	const at = (t: number) => {
		// Ease out so the outlines slow as they reach the window.
		const e = 1 - (1 - t) ** 2;
		return {
			left: from.left + (to.left - from.left) * e,
			top: from.top + (to.top - from.top) * e,
			width: from.width + (to.width - from.width) * e,
			height: from.height + (to.height - from.height) * e,
		};
	};
	return new Promise((resolve) => {
		let frame = 0;
		const tick = () => {
			boxes.forEach((b, i) => {
				const f = frame - i;
				if (f < 0 || f > FRAMES) {
					b.style.display = "none";
					return;
				}
				const r = at(f / FRAMES);
				b.style.display = "block";
				b.style.transform = `translate(${r.left}px, ${r.top}px)`;
				b.style.width = `${Math.max(4, r.width)}px`;
				b.style.height = `${Math.max(4, r.height)}px`;
			});
			frame++;
			// The window can appear as soon as the lead outline lands; the trail finishes on its own.
			if (frame === FRAMES + 1) resolve();
			if (frame > FRAMES + TRAIL) layer.remove();
			else setTimeout(tick, FRAME_MS);
		};
		tick();
	});
}
