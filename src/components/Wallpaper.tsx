import { useEffect, useRef } from "react";
import { profile } from "@/data/profile";

/*
 * Animated desktop wallpaper: rolling Ozark hills, drifting clouds, and a sun or
 * moon that follows the real time in Rogers, Arkansas. The scene is shaded in
 * greyscale, then reduced to the theme's two colours with an 8×8 Bayer matrix.
 */

const BAYER8 = [
	0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1,
	33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21,
].map((v) => (v + 0.5) / 64);

const PIXEL = 3; // screen pixels per dither pixel

function hash(n: number) {
	const x = Math.sin(n * 127.1) * 43758.5453;
	return x - Math.floor(x);
}
function noise1(x: number) {
	const i = Math.floor(x);
	const f = x - i;
	const u = f * f * (3 - 2 * f);
	return hash(i) * (1 - u) + hash(i + 1) * u;
}
function fbm1(x: number) {
	return noise1(x) * 0.6 + noise1(x * 2.1 + 7) * 0.28 + noise1(x * 4.3 + 19) * 0.12;
}
function noise2(x: number, y: number) {
	const xi = Math.floor(x);
	const yi = Math.floor(y);
	const xf = x - xi;
	const yf = y - yi;
	const u = xf * xf * (3 - 2 * xf);
	const v = yf * yf * (3 - 2 * yf);
	const h = (a: number, b: number) => hash(a * 57 + b * 131);
	const a = h(xi, yi) * (1 - u) + h(xi + 1, yi) * u;
	const b = h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u;
	return a * (1 - v) + b * v;
}

/** Any CSS colour → [r, g, b]. The canvas normalises "#fff", "rgb()", names, etc. to #rrggbb. */
function parseColor(c: string, ctx: CanvasRenderingContext2D): [number, number, number] {
	ctx.fillStyle = "#000";
	ctx.fillStyle = c.trim() || "#000";
	const hex = String(ctx.fillStyle);
	const m = hex.match(/^#([0-9a-f]{6})$/i);
	if (!m) return [0, 0, 0];
	const n = Number.parseInt(m[1], 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Hours since midnight in Rogers, AR (fractional). */
function localHour() {
	const parts = new Intl.DateTimeFormat("en-US", { timeZone: profile.timezone, hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
	const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
	return (get("hour") % 24) + get("minute") / 60;
}

export function Wallpaper() {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const ctx = canvas.getContext("2d");
		if (!ctx) return;
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		let w = 0;
		let h = 0;
		let img: ImageData | null = null;
		let paper: [number, number, number] = [255, 255, 255];
		let ink: [number, number, number] = [0, 0, 0];

		const readColors = () => {
			const cs = getComputedStyle(document.documentElement);
			paper = parseColor(cs.getPropertyValue("--bg"), ctx);
			ink = parseColor(cs.getPropertyValue("--fg"), ctx);
		};
		const resize = () => {
			w = Math.ceil(canvas.clientWidth / PIXEL);
			h = Math.ceil(canvas.clientHeight / PIXEL);
			canvas.width = w;
			canvas.height = h;
			img = ctx.createImageData(w, h);
		};

		// Stars are fixed positions in sky space.
		const stars = Array.from({ length: 140 }, (_, i) => ({ x: hash(i + 1), y: hash(i + 77) * 0.6, b: 0.6 + hash(i + 300) * 0.4 }));

		const draw = (t: number) => {
			if (!img) return;
			const data = img.data;
			const hour = localHour();
			// Sun is up 6:30–19:30 and arcs across the sky; the moon takes the night.
			const dayP = (hour - 6.5) / 13;
			const isDay = dayP > 0 && dayP < 1;
			const p = isDay ? dayP : (((hour - 19.5 + 24) % 24) / 11);
			const bodyX = (0.12 + Math.min(1, p) * 0.76) * w;
			const bodyY = (0.5 - Math.sin(Math.min(1, p) * Math.PI) * 0.36) * h;
			const bodyR = Math.max(5, Math.min(w, h) * 0.05);
			const drift = t * 0.0006;

			// Ridge lines, far to near. `fill` is ink density below the crest.
			const layers = [
				{ base: 0.66, amp: 0.09, freq: 2.2, speed: 0.000002, fill: 0.14 },
				{ base: 0.74, amp: 0.09, freq: 3.2, speed: 0.000005, fill: 0.28 },
				{ base: 0.83, amp: 0.08, freq: 4.8, speed: 0.00001, fill: 0.46 },
				{ base: 0.93, amp: 0.06, freq: 7, speed: 0.00002, fill: 0.68 },
			];
			const ridge = layers.map((L, li) => {
				const arr = new Float32Array(w);
				for (let x = 0; x < w; x++) arr[x] = (L.base - fbm1((x / w) * L.freq + t * L.speed + li * 31) * L.amp) * h;
				return arr;
			});

			for (let y = 0; y < h; y++) {
				const sky = y / h;
				for (let x = 0; x < w; x++) {
					let d: number;
					let layer = -1;
					for (let li = layers.length - 1; li >= 0; li--) {
						if (y >= ridge[li][x]) {
							layer = li;
							break;
						}
					}
					if (layer >= 0) {
						const below = y - ridge[layer][x];
						// Crisp crest line, then a halftone fill that deepens toward the bottom.
						d = below < 1 ? 1 : layers[layer].fill + (below / h) * 0.5;
					} else {
						// Sky: nearly empty by day, a little denser at night.
						d = isDay ? 0.05 * (1 - sky * 1.6) : 0.2 * (1 - sky * 1.2);
						const dx = x - bodyX;
						const dy = y - bodyY;
						const r = Math.hypot(dx, dy);
						if (isDay) {
							// Sun: outlined disk with a halftone face.
							if (r < bodyR) d = r > bodyR - 1 ? 1 : 0.22;
							else if (r < bodyR * 1.9) d = Math.max(d, 0.08);
						} else {
							// Moon: a crescent cut by an offset disk.
							const cut = Math.hypot(dx - bodyR * 0.45, dy + bodyR * 0.15);
							if (r < bodyR && cut > bodyR * 0.85) d = 0;
							else if (r < bodyR) d = Math.max(d, 0.25);
						}
						// Clouds by day: soft speckled blobs with denser undersides.
						if (isDay && sky < 0.6) {
							const n = noise2(x / 26 + drift, y / 8) * 0.65 + noise2(x / 9 + drift * 1.7, y / 4) * 0.35;
							if (n > 0.6) {
								const under = noise2(x / 26 + drift, (y + 2) / 8) * 0.65 + noise2(x / 9 + drift * 1.7, (y + 2) / 4) * 0.35;
								d = under > 0.6 ? 0.1 : 0.32;
							}
						}
					}
					const on = d > BAYER8[(y & 7) * 8 + (x & 7)];
					const c = on ? ink : paper;
					const i = (y * w + x) * 4;
					data[i] = c[0];
					data[i + 1] = c[1];
					data[i + 2] = c[2];
					data[i + 3] = 255;
				}
			}
			// Stars at night: single pixels that twinkle.
			if (!isDay) {
				for (const st of stars) {
					const x = Math.floor(st.x * w);
					const y = Math.floor(st.y * h);
					if (y >= ridge[0][x]) continue;
					const on = Math.sin(t / 700 + st.x * 60) * 0.5 + 0.5 > 1 - st.b;
					const c = on ? ink : paper;
					const i = (y * w + x) * 4;
					data[i] = c[0];
					data[i + 1] = c[1];
					data[i + 2] = c[2];
				}
			}
			ctx.putImageData(img, 0, 0);
		};

		readColors();
		resize();
		draw(performance.now());
		canvas.dataset.ready = "";

		let raf = 0;
		let last = 0;
		const loop = (t: number) => {
			raf = requestAnimationFrame(loop);
			if (document.hidden || t - last < 80) return; // ~12 fps is plenty for drifting clouds
			last = t;
			draw(t);
		};
		if (!reduce) raf = requestAnimationFrame(loop);

		const ro = new ResizeObserver(() => {
			resize();
			draw(performance.now());
		});
		ro.observe(canvas);
		const mo = new MutationObserver(() => {
			readColors();
			draw(performance.now());
		});
		mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onScheme = () => {
			readColors();
			draw(performance.now());
		};
		mq.addEventListener("change", onScheme);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			mo.disconnect();
			mq.removeEventListener("change", onScheme);
		};
	}, []);

	return (
		<canvas
			ref={ref}
			className="wallpaper pointer-events-none fixed inset-0 h-full w-full"
			style={{ imageRendering: "pixelated" }}
			aria-label="Dithered landscape of rolling hills; the sky follows the time of day in Rogers, Arkansas"
			role="img"
		/>
	);
}
