import { wallpaperMode } from "@/components/Wallpaper";

/*
 * A small exposure model. Settings are counted in whole stops, the way the
 * dials click: each aperture or shutter step halves the light, each ISO step
 * doubles the sensor's sensitivity. Getting the exposure right means matching
 * the settings' EV to the scene's EV.
 */

export const APERTURES = ["f/2", "f/2.8", "f/4", "f/5.6", "f/8", "f/11", "f/16"];
export const SHUTTERS = ["1s", "1/2", "1/4", "1/8", "1/15", "1/30", "1/60", "1/125", "1/250", "1/500", "1/1000", "1/2000"];
export const ISOS = ["100", "200", "400", "800", "1600", "3200"];

export type Settings = { a: number; s: number; i: number };

/** Exposure value (at ISO 100) the settings are set for. f/2 at 1s is EV 2. */
export const settingsEV = ({ a, s, i }: Settings) => 2 + a + s - i;

/** Shutter time in seconds. */
export const shutterSeconds = (s: number) => 2 ** -s;

/** How bright the wallpaper's current sky is, as an EV at ISO 100 (sunny day ≈ 15, night ≈ 4). */
export function sceneEV(isDayNow: boolean) {
	switch (wallpaperMode.scene) {
		case "sunrise":
		case "golden":
		case "fog":
			return 12;
		case "rain":
			return 11;
		case "snow":
			return 14;
		case "night":
			return 4;
		default:
			return isDayNow ? 15 : 4;
	}
}

/** Stops of over (+) or under (−) exposure. */
export const stopsOff = (scene: number, set: Settings) => scene - settingsEV(set);

export function verdict(stops: number) {
	if (stops === 0) return "Well exposed";
	const n = Math.abs(stops);
	const word = stops > 0 ? "over" : "under";
	if (n === 1) return stops > 0 ? "A little bright" : "A little dark";
	return `${n} stops ${word}exposed`;
}

/** Random starting settings that are 2–3 stops off, too bright or too dark. */
export function badStart(scene: number): Settings {
	const off = (Math.random() < 0.5 ? -1 : 1) * (2 + Math.floor(Math.random() * 2));
	for (let tries = 0; tries < 200; tries++) {
		const a = Math.floor(Math.random() * APERTURES.length);
		const i = Math.floor(Math.random() * 3);
		const s = scene - off - 2 - a + i;
		if (s >= 0 && s < SHUTTERS.length) return { a, s, i };
	}
	return { a: 3, s: 8, i: 0 };
}

const toLinear = new Float32Array(256).map((_, v) => {
	const c = v / 255;
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const toSRGB = (l: number) => 255 * (l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055);

/**
 * Renders `src` into `out` as the camera would record it: brighter or darker by
 * `stops` (clipping to white or black), grainier at high ISO, and smeared
 * sideways by handshake when the shutter is slower than 1/30.
 */
export function develop(src: ImageData, out: ImageData, stops: number, set: Settings) {
	const gain = 2 ** stops;
	const lut = new Uint8ClampedArray(256);
	for (let v = 0; v < 256; v++) lut[v] = toSRGB(Math.min(1, toLinear[v] * gain));
	const grain = set.i * 9;
	const t = shutterSeconds(set.s);
	const shake = t > 1 / 30 ? Math.min(10, Math.round(t * 36)) : 0;
	const { width: w, height: h } = src;
	const d = src.data;
	const o = out.data;
	for (let y = 0; y < h; y++)
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			let r = d[i];
			let g = d[i + 1];
			let b = d[i + 2];
			if (shake) {
				const j = (y * w + Math.max(0, x - shake)) * 4;
				const k = (y * w + Math.max(0, x - (shake >> 1))) * 4;
				r = (r + d[j] + d[k]) / 3;
				g = (g + d[j + 1] + d[k + 1]) / 3;
				b = (b + d[j + 2] + d[k + 2]) / 3;
			}
			const n = grain ? (Math.random() - 0.5) * grain : 0;
			o[i] = lut[r | 0] + n;
			o[i + 1] = lut[g | 0] + n;
			o[i + 2] = lut[b | 0] + n;
			o[i + 3] = 255;
		}
}
