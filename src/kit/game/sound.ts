import { useEffect, useState } from "react";

const KEY = "ep-sound";
let ctx: AudioContext | null = null;
let on = false;
const subs = new Set<(v: boolean) => void>();

try {
	on = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "on";
} catch {}

/** Sound is off until the visitor turns it on, and remembered after that. */
export function setSound(v: boolean) {
	on = v;
	try {
		localStorage.setItem(KEY, v ? "on" : "off");
	} catch {}
	for (const s of subs) s(v);
}

export function useSound() {
	const [v, setV] = useState(false);
	useEffect(() => {
		setV(on);
		subs.add(setV);
		return () => {
			subs.delete(setV);
		};
	}, []);
	return [v, setSound] as const;
}

/** A short square-wave blip, like a 1980s speaker. */
export function beep(freq: number, ms = 60, { type = "square", gain = 0.05, slide = 0 }: { type?: OscillatorType; gain?: number; slide?: number } = {}) {
	if (!on || typeof window === "undefined") return;
	try {
		ctx ??= new AudioContext();
		if (ctx.state === "suspended") void ctx.resume();
		const t = ctx.currentTime;
		const osc = ctx.createOscillator();
		const g = ctx.createGain();
		osc.type = type;
		osc.frequency.setValueAtTime(freq, t);
		if (slide) osc.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), t + ms / 1000);
		g.gain.setValueAtTime(gain, t);
		g.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
		osc.connect(g).connect(ctx.destination);
		osc.start(t);
		osc.stop(t + ms / 1000 + 0.02);
	} catch {}
}

/** A burst of noise: crashes, landings. */
export function noise(ms = 160, gain = 0.06) {
	if (!on || typeof window === "undefined") return;
	try {
		ctx ??= new AudioContext();
		const len = Math.floor((ctx.sampleRate * ms) / 1000);
		const buf = ctx.createBuffer(1, len, ctx.sampleRate);
		const d = buf.getChannelData(0);
		for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
		const src = ctx.createBufferSource();
		const g = ctx.createGain();
		g.gain.value = gain;
		src.buffer = buf;
		src.connect(g).connect(ctx.destination);
		src.start();
	} catch {}
}
