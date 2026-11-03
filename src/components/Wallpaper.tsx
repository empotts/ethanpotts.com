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

function parseColor(c: string): [number, number, number] {
	const m = c.trim().match(/^#([0-9a-f]{6})$/i);
	if (m) {
		const n = Number.parseInt(m[1], 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}
	return [0, 0, 0];
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
		let light: [number, number, number] = [255, 255, 255];
		let dark: [number, number, number] = [0, 0, 0];

		const readColors = () => {
			const cs = getComputedStyle(document.documentElement);
			const bg = parseColor(cs.getPropertyValue("--bg"));
			const fg = parseColor(cs.getPropertyValue("--fg"));
			const lum = (c: number[]) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
			[light, dark] = lum(bg) >= lum(fg) ? [bg, fg] : [fg, bg];
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
			// Sun is up 6:30–19:30; arc across the sky.
			const dayP = (hour - 6.5) / 13;
			const isDay = dayP > 0 && dayP < 1;
			const nightP = isDay ? 0 : (((hour - 19.5 + 24) % 24) / 11);
			const p = isDay ? dayP : Math.min(1, nightP);
			const bodyX = 0.1 + p * 0.8;
			const bodyY = 0.62 - Math.sin(p * Math.PI) * 0.45;
			// Twilight: dim near sunrise/sunset.
			const edge = isDay ? Math.min(dayP, 1 - dayP) : 0;
			const daylight = isDay ? Math.min(1, 0.45 + edge * 3) : 0.1;

			const sx = bodyX * w;
			const sy = bodyY * h;
			const bodyR = Math.max(6, h * 0.06);
			const cloudShift = t * 0.00002;

			// Ridge lines, far to near.
			const layers = [
				{ base: 0.58, amp: 0.1, freq: 2.2, speed: 0.000002, tone: 0.72 },
				{ base: 0.66, amp: 0.12, freq: 3.1, speed: 0.000005, tone: 0.52 },
				{ base: 0.76, amp: 0.11, freq: 4.6, speed: 0.00001, tone: 0.3 },
				{ base: 0.87, amp: 0.08, freq: 6.5, speed: 0.00002, tone: 0.12 },
			];
			const ridge = layers.map((L, li) => {
				const arr = new Float32Array(w);
				for (let x = 0; x < w; x++) {
					arr[x] = (L.base - fbm1((x / w) * L.freq + t * L.speed + li * 31) * L.amp) * h;
				}
				return arr;
			});

			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					let v: number;
					// Which hill (if any) covers this pixel? Nearest layer wins.
					let layer = -1;
					for (let li = layers.length - 1; li >= 0; li--) {
						if (y >= ridge[li][x]) {
							layer = li;
							break;
						}
					}
					if (layer >= 0) {
						const L = layers[layer];
						const depth = (y - ridge[layer][x]) / h;
						v = L.tone * daylight + 0.06 - depth * 0.6;
						// Rim light on the ridge crest.
						if (y - ridge[layer][x] < 1.5) v += 0.25 * daylight;
					} else {
						// Sky: brighter toward the horizon by day.
						const sky = y / h;
						v = isDay ? 0.55 + sky * 0.4 * daylight : 0.04 + sky * 0.08;
						// Glow around the sun/moon.
						const d = Math.hypot(x - sx, y - sy);
						if (d < bodyR) v = isDay ? 1 : 0.95;
						else v += Math.max(0, 1 - d / (bodyR * 5)) * (isDay ? 0.35 : 0.12);
						// Clouds by day, faint haze by night.
						const c = noise2(x / 28 + cloudShift * w, y / 9) * 0.6 + noise2(x / 11 + cloudShift * w * 1.6, y / 5) * 0.4;
						const cloud = Math.max(0, c - (0.58 - (1 - sky) * 0.05)) * 3;
						if (cloud > 0 && sky < 0.55) v = isDay ? Math.min(1, v + cloud * 0.6) : v + cloud * 0.08;
					}
					const threshold = BAYER8[(y & 7) * 8 + (x & 7)];
					const c = v > threshold ? light : dark;
					const i = (y * w + x) * 4;
					data[i] = c[0];
					data[i + 1] = c[1];
					data[i + 2] = c[2];
					data[i + 3] = 255;
				}
			}
			// Stars at night (single pixels, gently twinkling).
			if (!isDay) {
				for (const s of stars) {
					const x = Math.floor(s.x * w);
					const y = Math.floor(s.y * h);
					if (ridge[0][x] <= y) continue;
					if (Math.sin(t / 900 + s.x * 50) * 0.5 + 0.5 > 1 - s.b) {
						const i = (y * w + x) * 4;
						data[i] = light[0];
						data[i + 1] = light[1];
						data[i + 2] = light[2];
					}
				}
			}
			ctx.putImageData(img, 0, 0);
		};

		readColors();
		resize();
		draw(performance.now());

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
			className="pointer-events-none fixed inset-0 h-full w-full"
			style={{ imageRendering: "pixelated" }}
			aria-label="Dithered landscape of rolling hills; the sky follows the time of day in Rogers, Arkansas"
			role="img"
		/>
	);
}
