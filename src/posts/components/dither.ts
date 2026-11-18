import { type RGB, readPalette } from "@/kit/game/palette";

const BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21].map(
	(v) => (v + 0.5) / 64 - 0.5,
);

const lum = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * Draws `img` into `canvas` at a reduced resolution, ordered-dithered to the
 * theme: `bits: 1` uses only ink and paper, `bits: 2` adds the accent and sky.
 */
export function ditherInto(canvas: HTMLCanvasElement, img: HTMLImageElement, el: Element, bits: 1 | 2, width = 320) {
	const w = Math.min(width, img.naturalWidth || width);
	const h = Math.max(1, Math.round((w * (img.naturalHeight || 1)) / (img.naturalWidth || 1)));
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext("2d", { willReadFrequently: true });
	if (!ctx) return;
	ctx.drawImage(img, 0, 0, w, h);
	let data: ImageData;
	try {
		data = ctx.getImageData(0, 0, w, h);
	} catch {
		return; // cross-origin image: leave the plain copy
	}
	const pal = readPalette(el).rgb;
	const light = lum(pal.bg) >= lum(pal.fg) ? pal.bg : pal.fg;
	const dark = light === pal.bg ? pal.fg : pal.bg;
	const colors: RGB[] = bits === 1 ? [dark, light] : [pal.bg, pal.fg, pal.accent, pal.sky];
	const d = data.data;
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			const t = BAYER[(y & 7) * 8 + (x & 7)];
			let out: RGB;
			if (bits === 1) {
				const v = lum([d[i], d[i + 1], d[i + 2]]) / 255 + t;
				out = v > 0.5 ? light : dark;
			} else {
				const s = 72 * t;
				const c: RGB = [d[i] + s, d[i + 1] + s, d[i + 2] + s];
				let best = colors[0];
				let bestD = Number.POSITIVE_INFINITY;
				for (const p of colors) {
					const dd = (c[0] - p[0]) ** 2 * 0.3 + (c[1] - p[1]) ** 2 * 0.59 + (c[2] - p[2]) ** 2 * 0.11;
					if (dd < bestD) {
						bestD = dd;
						best = p;
					}
				}
				out = best;
			}
			d[i] = out[0];
			d[i + 1] = out[1];
			d[i + 2] = out[2];
			d[i + 3] = 255;
		}
	ctx.putImageData(data, 0, 0);
}
