import { useEffect, useRef, useState } from "react";
import { Window } from "./Window";

import { buildShow, PLAYBACK_RATE, spotOrder, type Drill, type Pt } from "./pregameDrill";

const FIELD_W = 104;
const FIELD_H = 160 / 3;
const PX = 8;
const FIELD_MARGIN = 3;
const COUNT_MS = 60_000 / 152 / PLAYBACK_RATE;

function drawField(ctx: CanvasRenderingContext2D, ink: string, paper: string) {
	const w = FIELD_W * PX;
	const h = Math.round(FIELD_H * PX);
	ctx.fillStyle = paper;
	ctx.fillRect(0, 0, w, (FIELD_H + FIELD_MARGIN * 2) * PX);
	ctx.save();
	ctx.translate(0, FIELD_MARGIN * PX);
	ctx.fillStyle = ink;
	// Yard lines every five yards; the goal lines and fifty are doubled.
	for (let yd = 0; yd <= 100; yd += 5) {
		const x = (2 + yd) * PX;
		ctx.fillRect(x, 0, 1, h);
		if (yd === 0 || yd === 50 || yd === 100) ctx.fillRect(x + 1, 0, 1, h);
	}
	// Hash marks at every yard (college hashes, 20 yards in from each sideline).
	for (let yd = 1; yd < 100; yd++) {
		const x = (2 + yd) * PX;
		for (const hy of [20, FIELD_H - 20]) ctx.fillRect(x, Math.round(hy * PX) - 1, 1, 3);
		ctx.fillRect(x, 0, 1, 3);
		ctx.fillRect(x, h - 3, 1, 3);
	}
	ctx.strokeStyle = ink;
	ctx.lineWidth = 2;
	ctx.strokeRect(2 * PX, 1, 100 * PX, h - 2);
	ctx.restore();
}

export function PregameWin({ onClose }: { onClose: () => void }) {
	const ref = useRef<HTMLCanvasElement>(null);
	const [label, setLabel] = useState("Pregame");
	const [run, setRun] = useState(0);
	const first = useRef<Drill | null>(null);

	useEffect(() => {
		const canvas = ref.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		first.current ??= Math.random() < 0.5 ? "bigA" : "hogs";
		const sets = buildShow(first.current);
		const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		// Timeline in counts: each set is a move into it, then a hold.
		const marks: { start: number; end: number; set: number }[] = [];
		let c = 0;
		sets.forEach((s, i) => {
			marks.push({ start: c, end: c + s.move, set: i });
			c += s.move + s.hold;
		});
		const total = c;
		// A cycle may permute spots, but each marcher keeps their identity across its seam.
		const loopOrder = spotOrder(sets[0].pts, sets[sets.length - 1].pts);
		let order = Array.from({ length: sets[0].pts.length }, (_, i) => i);
		let cycle = 0;

		const toPx = ([x, y]: Pt): Pt => [(x + FIELD_W / 2) * PX, (FIELD_H / 2 + FIELD_MARGIN - y) * PX];
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
			const dot = (pt: Pt, radius: number) => {
				const [x, y] = toPx(pt);
				ctx.beginPath();
				ctx.arc(x, y, radius, 0, Math.PI * 2);
				ctx.fillStyle = ink;
				ctx.fill();
				ctx.strokeStyle = paper;
				ctx.lineWidth = 1.5;
				ctx.stroke();
			};
			for (let i = 0; i < to.length; i++) {
				const j = order[i];
				dot([from[j][0] + (to[j][0] - from[j][0]) * t, from[j][1] + (to[j][1] - from[j][1]) * t], 3.25);
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
			const nextCycle = Math.floor(count / total);
			while (cycle < nextCycle) {
				order = order.map((j) => loopOrder[j]);
				cycle++;
			}
			frame(count % total);
			raf = requestAnimationFrame(loop);
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
					<button type="button" className="btn py-0 text-xs" onClick={() => { first.current = first.current === "bigA" ? "hogs" : "bigA"; setRun((r) => r + 1); }}>
						Next drill
					</button>
				</div>
			}
		>
			<div className="p-3">
				<canvas
					ref={ref}
					width={FIELD_W * PX}
					height={Math.round((FIELD_H + FIELD_MARGIN * 2) * PX)}
					className="block w-full border-2 border-black"
					style={{ aspectRatio: `${FIELD_W} / ${FIELD_H + FIELD_MARGIN * 2}` }}
					role="img"
					aria-label="Two alternating pregame drills: the Big A folds from its opening files and travels the field; H, O, G and S form one letter at a time"
				/>
			</div>
		</Window>
	);
}
