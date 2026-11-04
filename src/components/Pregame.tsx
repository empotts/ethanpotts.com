import { useEffect, useRef, useState } from "react";
import { Window } from "./Window";

/*
 * A short Razorback pregame on a one-bit field: the band files out of the end
 * zone, the Big A marches down the field and back, then the band sets HOGS.
 * Shapes are drawn from simple strokes here (not taken from a real drill chart).
 *
 * Field space is in yards: x runs goal line to goal line (−50…50, end zones to ±60),
 * y runs across the field (+y is the far sideline).
 */

type Pt = [number, number];

const N = 128;
const FIELD_W = 120;
const FIELD_H = 160 / 3;
const PX = 4; // canvas pixels per yard
const COUNT_MS = 60_000 / 152; // tempo

const snap = (v: number) => Math.round(v / 0.625) * 0.625; // one 8-to-5 step

/** Spread n marchers evenly along strokes (polylines), the way drill lines are spaced. */
function along(strokes: Pt[][], n: number): Pt[] {
	const segs: { a: Pt; b: Pt; len: number }[] = [];
	for (const s of strokes)
		for (let i = 1; i < s.length; i++) segs.push({ a: s[i - 1], b: s[i], len: Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]) });
	const step = segs.reduce((t, s) => t + s.len, 0) / n;
	const out: Pt[] = [];
	let si = 0;
	let into = step / 2;
	for (let k = 0; k < n; k++) {
		while (si < segs.length - 1 && into > segs[si].len) {
			into -= segs[si].len;
			si++;
		}
		const { a, b, len } = segs[si];
		const t = Math.min(1, into / len);
		out.push([snap(a[0] + (b[0] - a[0]) * t), snap(a[1] + (b[1] - a[1]) * t)]);
		into += step;
	}
	return out;
}

function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, steps = 18): Pt[] {
	return Array.from({ length: steps + 1 }, (_, i) => {
		const a = ((from + ((to - from) * i) / steps) * Math.PI) / 180;
		return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as Pt;
	});
}

function block(): Pt[] {
	// Eight deep from the end zone, sixteen across.
	return Array.from({ length: N }, (_, i) => [-57.5 + (i % 8) * 2.5, -18.75 + Math.floor(i / 8) * 2.5] as Pt);
}

/** The Big A on its side, point toward the left goal line, centred at x = cx. */
function bigA(cx: number): Pt[] {
	const apex = cx - 22;
	const foot = cx + 22;
	const innerApex = foot - 13 / (20 / 44);
	const barX = cx + 4;
	const barY = (barX - innerApex) * (20 / 44);
	return along(
		[
			[[foot, 20], [apex, 0], [foot, -20]],
			[[foot, 20], [foot, 13]],
			[[foot, 13], [innerApex, 0], [foot, -13]],
			[[foot, -13], [foot, -20]],
			[[barX, -barY], [barX, barY]],
		],
		N,
	);
}

function hogs(): Pt[] {
	const top = 15;
	const bot = -13;
	const mid = (top + bot) / 2;
	const ry = (top - bot) / 2;
	const H = (x: number): Pt[][] => [[[x, bot], [x, top]], [[x + 10, bot], [x + 10, top]], [[x, mid], [x + 10, mid]]];
	const O = (x: number): Pt[][] => [arc(x + 5, mid, 5, ry, 90, 450, 28)];
	const G = (x: number): Pt[][] => [[...arc(x + 5, mid, 5, ry, 35, 360, 24), [x + 5.5, mid]]];
	const S = (x: number): Pt[][] => [
		[...arc(x + 5, mid + ry / 2, 5, ry / 2, 15, 270, 14), ...arc(x + 5, mid - ry / 2, 5, ry / 2, 90, -165, 14)],
	];
	const letters = along([...H(-36), ...O(-20), ...G(10), ...S(26)], N - 12);
	// The drumline holds a small block between the O and the G.
	const drums = Array.from({ length: 12 }, (_, i) => [-3.75 + (i % 4) * 2.5, mid - 2.5 + Math.floor(i / 4) * 2.5] as Pt);
	return [...letters, ...drums];
}

/** For each marcher, an index into `next`: the nearest open spot, closest pairs first. */
function assign(prev: Pt[], next: Pt[]): number[] {
	const pairs: [number, number, number][] = [];
	for (let i = 0; i < prev.length; i++)
		for (let j = 0; j < next.length; j++) pairs.push([(prev[i][0] - next[j][0]) ** 2 + (prev[i][1] - next[j][1]) ** 2, i, j]);
	pairs.sort((a, b) => a[0] - b[0]);
	const out: number[] = new Array(prev.length);
	const usedI = new Set<number>();
	const usedJ = new Set<number>();
	for (const [, i, j] of pairs) {
		if (usedI.has(i) || usedJ.has(j)) continue;
		out[i] = j;
		usedI.add(i);
		usedJ.add(j);
	}
	return out;
}

type DrillSet = { name: string; pts: Pt[]; move: number; hold: number };

function buildShow(): DrillSet[] {
	// `slide` sets keep the same form and move it as one piece, so every marcher keeps their spot.
	const script = [
		{ name: "Entrance", shape: block(), move: 0, hold: 4 },
		{ name: "Big A", shape: bigA(-22), move: 16, hold: 4 },
		{ name: "Big A", shape: bigA(22), move: 16, hold: 2, slide: true },
		{ name: "Big A", shape: bigA(0), move: 8, hold: 4, slide: true },
		{ name: "HOGS", shape: hogs(), move: 16, hold: 0 },
	];
	const sets: DrillSet[] = [];
	let order = script[0].shape.map((_, i) => i);
	for (const [k, s] of script.entries()) {
		// Otherwise re-order the spots so each marcher takes a short path into the new form.
		if (k > 0 && !s.slide) order = assign(sets[k - 1].pts, s.shape);
		sets.push({ name: s.name, pts: order.map((j) => s.shape[j]), move: s.move, hold: s.hold });
	}
	return sets;
}

function drawField(ctx: CanvasRenderingContext2D, ink: string, paper: string) {
	const w = FIELD_W * PX;
	const h = Math.round(FIELD_H * PX);
	ctx.fillStyle = paper;
	ctx.fillRect(0, 0, w, h);
	ctx.fillStyle = ink;
	// End zones: sparse dither.
	for (const x0 of [0, (FIELD_W - 10) * PX])
		for (let y = 0; y < h; y += 2) for (let x = x0 + (y % 4 ? 0 : 1); x < x0 + 10 * PX; x += 3) ctx.fillRect(x, y, 1, 1);
	// Yard lines every five yards; the goal lines and fifty are doubled.
	for (let yd = 0; yd <= 100; yd += 5) {
		const x = (10 + yd) * PX;
		ctx.fillRect(x, 0, 1, h);
		if (yd === 0 || yd === 50 || yd === 100) ctx.fillRect(x + 1, 0, 1, h);
	}
	// Hash marks at every yard (college hashes, 20 yards in from each sideline).
	for (let yd = 1; yd < 100; yd++) {
		const x = (10 + yd) * PX;
		for (const hy of [20, FIELD_H - 20]) ctx.fillRect(x, Math.round(hy * PX) - 1, 1, 3);
		ctx.fillRect(x, 0, 1, 3);
		ctx.fillRect(x, h - 3, 1, 3);
	}
	ctx.strokeStyle = ink;
	ctx.lineWidth = 2;
	ctx.strokeRect(1, 1, w - 2, h - 2);
}

export function PregameWin({ onClose }: { onClose: () => void }) {
	const ref = useRef<HTMLCanvasElement>(null);
	const [label, setLabel] = useState("Entrance");
	const [run, setRun] = useState(0);

	useEffect(() => {
		const canvas = ref.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		const sets = buildShow();
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		// Timeline in counts: each set is a move into it, then a hold.
		const marks: { start: number; end: number; set: number }[] = [];
		let c = 0;
		sets.forEach((s, i) => {
			marks.push({ start: c, end: c + s.move, set: i });
			c += s.move + s.hold;
		});
		const total = c;

		const toPx = ([x, y]: Pt): Pt => [Math.round((x + 60) * PX), Math.round((FIELD_H / 2 - y) * PX)];
		let shown = "";
		const frame = (count: number) => {
			const cs = getComputedStyle(document.documentElement);
			const ink = cs.getPropertyValue("--fg").trim() || "#000";
			const paper = cs.getPropertyValue("--bg").trim() || "#fff";
			drawField(ctx, ink, paper);
			let m = marks[0];
			for (const mk of marks) if (count >= mk.start) m = mk;
			const to = sets[m.set].pts;
			const from = m.set > 0 ? sets[m.set - 1].pts : to;
			// Marchers move on the count: progress advances in whole steps, not a glide.
			const raw = m.end > m.start ? Math.min(1, (count - m.start) / (m.end - m.start)) : 1;
			const steps = (m.end - m.start) * 2;
			const t = reduce ? 1 : steps ? Math.floor(raw * steps) / steps : 1;
			for (let i = 0; i < to.length; i++) {
				const [x, y] = toPx([from[i][0] + (to[i][0] - from[i][0]) * t, from[i][1] + (to[i][1] - from[i][1]) * t]);
				ctx.fillStyle = paper;
				ctx.fillRect(x - 2, y - 2, 5, 5);
				ctx.fillStyle = ink;
				ctx.fillRect(x - 1, y - 1, 3, 3);
			}
			const name = sets[m.set].name;
			if (name !== shown) {
				shown = name;
				setLabel(name);
			}
		};

		let raf = 0;
		const t0 = performance.now();
		const loop = (now: number) => {
			const count = (now - t0) / COUNT_MS;
			frame(Math.min(count, total));
			if (count < total) raf = requestAnimationFrame(loop);
		};
		raf = requestAnimationFrame(loop);
		return () => cancelAnimationFrame(raf);
	}, [run]);

	return (
		<Window
			id="pregame"
			title="Pregame"
			x={200}
			y={90}
			width={540}
			onClose={onClose}
			footer={
				<div className="flex items-center justify-between px-3 py-1.5 text-xs">
					<span className="font-ui">{label}</span>
					<button type="button" className="btn py-0 text-xs" onClick={() => setRun((r) => r + 1)}>
						Replay
					</button>
				</div>
			}
		>
			<div className="p-3">
				<canvas
					ref={ref}
					width={FIELD_W * PX}
					height={Math.round(FIELD_H * PX)}
					className="block w-full border-2 border-black"
					style={{ imageRendering: "pixelated" }}
					role="img"
					aria-label="The band marches the Big A down the field and back, then spells HOGS"
				/>
			</div>
		</Window>
	);
}
