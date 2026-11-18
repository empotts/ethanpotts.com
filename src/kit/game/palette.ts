import { useEffect, useState } from "react";
import { onPaletteChange } from "@/components/theme";

export type RGB = [number, number, number];

/**
 * The active theme as colours a canvas can use. Every theme has ink (`fg`),
 * paper (`bg`), one UI accent, a sky tint, a sun/highlight colour, a purple
 * (`dusk`) and a coral (`rose`).
 */
export type Palette = {
	bg: string;
	fg: string;
	accent: string;
	sky: string;
	sun: string;
	dusk: string;
	rose: string;
	rgb: { bg: RGB; fg: RGB; accent: RGB; sky: RGB; sun: RGB; dusk: RGB; rose: RGB };
	/** `a` blended toward `b` by `t`, as a CSS colour. */
	mix: (a: RGB, b: RGB, t: number) => string;
};

let probe: CanvasRenderingContext2D | null = null;
/** Any CSS colour → [r, g, b]. The canvas normalises "#fff", "rgb()", names, etc. */
export function parseColor(c: string): RGB {
	probe ??= document.createElement("canvas").getContext("2d");
	if (!probe) return [0, 0, 0];
	probe.fillStyle = "#000";
	probe.fillStyle = c.trim() || "#000";
	const v = String(probe.fillStyle);
	const hex = v.match(/^#([0-9a-f]{6})$/i);
	if (hex) {
		const n = Number.parseInt(hex[1], 16);
		return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
	}
	const rgb = v.match(/(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)[ ,]+(\d+(?:\.\d+)?)/);
	return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : [0, 0, 0];
}

export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = ([r, g, b]: RGB) => `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;

export function readPalette(el: Element = document.documentElement): Palette {
	const cs = getComputedStyle(el);
	const get = (k: string) => cs.getPropertyValue(k).trim();
	const rgb = {
		bg: parseColor(get("--bg") || "#fff"),
		fg: parseColor(get("--fg") || "#000"),
		accent: parseColor(get("--accent") || get("--fg")),
		sky: parseColor(get("--sky") || get("--fg")),
		sun: parseColor(get("--sun") || get("--fg")),
		dusk: parseColor(get("--dusk") || get("--sky") || get("--fg")),
		rose: parseColor(get("--rose") || get("--sun") || get("--fg")),
	};
	return {
		bg: css(rgb.bg),
		fg: css(rgb.fg),
		accent: css(rgb.accent),
		sky: css(rgb.sky),
		sun: css(rgb.sun),
		dusk: css(rgb.dusk),
		rose: css(rgb.rose),
		rgb,
		mix: (a, b, t) => css(mixRGB(a, b, t)),
	};
}

/** The palette, kept current as the visitor changes theme. */
export function usePalette(): Palette | null {
	const [p, setP] = useState<Palette | null>(null);
	useEffect(() => {
		const read = () => setP(readPalette());
		read();
		return onPaletteChange(read);
	}, []);
	return p;
}
