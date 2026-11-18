/** Coordinates transcribed from the supplied pregame references, in field yards. */
export type Pt = [number, number];
export type Drill = "bigA" | "hogs";
export const N = 245;
export const PLAYBACK_RATE = 1.6;
export type DrillSet = { name: string; drill: Drill; pts: Pt[]; move: number; hold: number };

/** Keep every dot on its stroke: rounding x and y separately bends the diagonals. */
export function line(a: Pt, b: Pt, n: number): Pt[] {
	return Array.from({ length: n }, (_, i) => {
		const t = (i + 0.5) / n;
		return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
	});
}

function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n: number): Pt[] {
	return Array.from({ length: n }, (_, i) => {
		const a = (from + (to - from) * (i + 0.5) / n) * Math.PI / 180;
		return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
	});
}

function block(cx: number, columns: number, rows: number, spacing = 2.5): Pt[] {
	return Array.from({ length: columns * rows }, (_, i) => [
		cx + (i % columns - (columns - 1) / 2) * spacing,
		(Math.floor(i / columns) - (rows - 1) / 2) * spacing,
	]);
}

/** Tightest possible longest route, then minimum total distance within that limit. */
export function assign(prev: Pt[], next: Pt[]): Pt[] {
	const n = prev.length;
	if (n !== next.length) throw new Error("Formation sizes must match");
	if (n === 0) return [];
	const distances = prev.map(([x, y]) => next.map(([nx, ny]) => Math.hypot(x - nx, y - ny)));
	const bounds = [...new Set(distances.flat())].sort((a, b) => a - b);
	const feasible = (limit: number) => {
		const left = new Int32Array(n).fill(-1);
		const right = new Int32Array(n).fill(-1);
		const levels = new Int32Array(n);
		const queue = new Int32Array(n);
		const breadth = () => {
			levels.fill(-1);
			let head = 0;
			let tail = 0;
			let available = false;
			for (let i = 0; i < n; i++) if (left[i] < 0) { levels[i] = 0; queue[tail++] = i; }
			while (head < tail) {
				const i = queue[head++];
				for (let j = 0; j < n; j++) {
					if (distances[i][j] > limit) continue;
					const other = right[j];
					if (other < 0) available = true;
					else if (levels[other] < 0) { levels[other] = levels[i] + 1; queue[tail++] = other; }
				}
			}
			return available;
		};
		const visit = (i: number): boolean => {
			for (let j = 0; j < n; j++) {
				if (distances[i][j] > limit) continue;
				const other = right[j];
				if (other < 0 || (levels[other] === levels[i] + 1 && visit(other))) {
					left[i] = j; right[j] = i; return true;
				}
			}
			levels[i] = -1;
			return false;
		};
		let matched = 0;
		while (breadth()) for (let i = 0; i < n; i++) if (left[i] < 0 && visit(i)) matched++;
		return matched === n;
	};
	let low = 0;
	let high = bounds.length - 1;
	while (low < high) {
		const mid = Math.floor((low + high) / 2);
		if (feasible(bounds[mid])) high = mid;
		else low = mid + 1;
	}
	const limit = bounds[low];
	// Hungarian minimum-cost assignment. Forbidden routes exceed any feasible total.
	const penalty = (bounds[bounds.length - 1] + 1) * (n + 1);
	const u = new Float64Array(n + 1);
	const v = new Float64Array(n + 1);
	const matched = new Int32Array(n + 1);
	const via = new Int32Array(n + 1);
	for (let i = 1; i <= n; i++) {
		matched[0] = i;
		let j0 = 0;
		const best = new Float64Array(n + 1).fill(Infinity);
		const used = new Uint8Array(n + 1);
		do {
			used[j0] = 1;
			const i0 = matched[j0];
			let delta = Infinity;
			let j1 = 0;
			for (let j = 1; j <= n; j++) {
				if (used[j]) continue;
				const distance = distances[i0 - 1][j - 1];
				const cost = (distance <= limit ? distance : penalty) - u[i0] - v[j];
				if (cost < best[j]) { best[j] = cost; via[j] = j0; }
				if (best[j] < delta) { delta = best[j]; j1 = j; }
			}
			for (let j = 0; j <= n; j++) {
				if (used[j]) { u[matched[j]] += delta; v[j] -= delta; }
				else best[j] -= delta;
			}
			j0 = j1;
		} while (matched[j0] !== 0);
		do {
			const j1 = via[j0];
			matched[j0] = matched[j1];
			j0 = j1;
		} while (j0 !== 0);
	}
	const out: Pt[] = new Array(n);
	for (let j = 1; j <= n; j++) out[matched[j] - 1] = next[j - 1];
	return out;
}

/** Preserve the twenty drumline assignments when changing between the two drills. */
function changeSetup(prev: Pt[], next: Pt[]): Pt[] {
	return [...assign(prev.slice(0, 224), next.slice(0, 224)), ...assign(prev.slice(224), next.slice(224))];
}

export function spotOrder(original: Pt[], assigned: Pt[]): number[] {
	const indexes = new Map(original.map((p, i) => [p.join(","), i]));
	return assigned.map((p) => {
		const index = indexes.get(p.join(","));
		if (index === undefined) throw new Error("Assigned spot missing from formation");
		return index;
	});
}

function transitionCounts(prev: Pt[], next: Pt[]): number {
	const distance = Math.max(...next.map(([x, y], i) => Math.hypot(x - prev[i][0], y - prev[i][1])));
	return Math.max(8, Math.ceil(distance / 0.625 / 8) * 8);
}

function bigA(): DrillSet[] {
	// Big A starts on the 30 through the opposite 10, in four separated ranks of files.
	const files: Pt[] = [];
	for (let file = 0; file < 12; file++) {
		for (const top of [19.375, 9.375, -5, -15])
			for (let row = 0; row < 4; row++) files.push([-20 + file * 5, top - row * 1.25]);
	}
	for (const top of [14.375, -5])
		for (let row = 0; row < 8; row++) files.push([40, top - row * 1.25]);
	for (let row = 0; row < 16; row++) files.push([-22.5, 9.375 - row * 1.25]);

	// Each opening file contributes one intact four-person segment to each stroke.
	// Keep files in field order and reverse the upper ranks as they fold clockwise.
	// A global nearest-spot assignment breaks these squads apart and crosses paths.
	const innerHeight = 60 * 14 / 65;
	// Both inner strokes share the tip and use the outer strokes' exact slope.
	// Sample one full interval after the tip; its extra marcher supplies the vertex.
	const inner = (sign: number): Pt[] => Array.from({ length: 48 }, (_, i) => {
		const dx = (i + 1) * 60 / 48;
		return [-20 + dx, sign * dx * 14 / 65];
	});
	const strokes = [
		line([-25, 10], [40, 24], 48),
		inner(1),
		inner(-1),
		line([-25, -10], [40, -24], 48),
	];
	const folded: Pt[] = [];
	for (let file = 0; file < 12; file++) {
		for (let rank = 0; rank < 4; rank++) {
			for (let row = 0; row < 4; row++) {
				folded.push(strokes[rank][file * 4 + (rank < 2 ? 3 - row : row)]);
			}
		}
	}
	const ends = [
		...line([40, 24], [40, innerHeight], 8),
		...line([40, -innerHeight], [40, -24], 8),
		...line([-25, 10], [-25, -10], 16),
	];
	const drums = block(8.75, 4, 5).map(([x, y]): Pt => [x, y * 0.75]);
	// Fifth member of the first inner squad closes the inside point.
	const tipOpening: Pt = [-20, 4.375];
	const tip: Pt = [-20, 0];
	const a = [...folded, ...ends, ...drums, tip];
	// Translate each intact vertical squad near its destination before it folds.
	const aligned = folded.map((_, i): Pt => {
		const start = Math.floor(i / 4) * 4;
		const squad = folded.slice(start, start + 4);
		const center = squad.reduce((sum, p) => sum + p[1], 0) / 4;
		const rank = Math.floor(i / 4) % 4;
		const cy = rank === 1 ? Math.max(2.5, center) : rank === 2 ? Math.min(-2.5, center) : Math.max(-23.125, Math.min(23.125, center));
		return [files[i][0], cy + (1.5 - i % 4) * 1.25];
	});
	const setup = [...aligned, ...ends.map((_, i): Pt => {
		const start = i < 8 ? 0 : i < 16 ? 8 : 16;
		const count = i < 16 ? 8 : 16;
		const targetCenter = ends.slice(start, start + count).reduce((sum, pt) => sum + pt[1], 0) / count;
		return [files[192 + i][0], targetCenter + ((count - 1) / 2 - (i - start)) * 1.25];
	}), ...drums, [-20, 0] as Pt];
	const shift = (dx: number): Pt[] => a.map(([x, y]) => [x + dx, y]);
	return [
		{ name: "Big A · opening set", drill: "bigA", pts: [...files, ...drums, tipOpening], move: 0, hold: 8 },
		{ name: "Big A · align files", drill: "bigA", pts: setup, move: transitionCounts([...files, ...drums, tipOpening], setup), hold: 4 },
		{ name: "Big A · fold", drill: "bigA", pts: a, move: 16, hold: 4 },
		{ name: "Big A · downfield", drill: "bigA", pts: shift(10), move: 16, hold: 4 },
		{ name: "Big A · upfield", drill: "bigA", pts: shift(-25), move: 56, hold: 4 },
		{ name: "Big A", drill: "bigA", pts: a, move: 40, hold: 8 },
	];
}

export const HOGS_CENTERS = [-30, -10, 10, 30];
function hogs(): DrillSet[] {
	const sections = HOGS_CENTERS.map((x) => [...block(x, 5, 11), [x, 1.25] as Pt]);
	const drums = block(0, 5, 4);
	const letters: Pt[][] = [
		[...line([-35, -12.5], [-35, 15], 23), ...line([-25, -12.5], [-25, 15], 23), ...line([-35, -1.25], [-25, -1.25], 10)],
		[...line([-15, -12.5], [-15, 10], 18), ...arc(-10, 10, 5, 3.75, 180, 0, 10), ...line([-5, 10], [-5, -12.5], 18), ...arc(-10, -12.5, 5, 3.75, 0, -180, 10)],
		[...arc(10, 10, 5, 3.75, 0, 180, 11), ...line([5, 10], [5, -12.5], 18), ...arc(10, -12.5, 5, 3.75, 180, 360, 10), ...line([15, -12.5], [15, -1.25], 9), ...line([15, -1.25], [10, -1.25], 5), ...line([15, 10], [15, 6.25], 3)],
		[...arc(30, 10, 5, 3.75, 0, 180, 13), ...line([25, 10], [25, 1.25], 8), ...line([25, 1.25], [35, -2.5], 12), ...line([35, -2.5], [35, -12.5], 9), ...arc(30, -12.5, 5, 3.75, 0, -180, 14)],
	];
	// Normalize the actual dot extents, including the rounded letters.
	for (let i = 0; i < letters.length; i++) {
		const ys = letters[i].map((p) => p[1]);
		const low = Math.min(...ys);
		const high = Math.max(...ys);
		letters[i] = letters[i].map(([x, y]): Pt => [x, -15 + (y - low) * 30 / (high - low)]);
	}
	let extra: Pt = [-30, 3.75];
	const spots = () => [...sections.flat(), ...drums, extra];
	const sets: DrillSet[] = [{ name: "HOGS", drill: "hogs", pts: spots(), move: 0, hold: 8 }];
	for (let i = 0; i < 4; i++) {
		sections[i] = assign(sections[i], letters[i]);
		if (i === 0) extra = [-30, letters[0][46][1]];
		sets.push({ name: i === 3 ? "HOGS" : `HOGS · ${"HOGS"[i]}`, drill: "hogs", pts: spots(), move: 16, hold: i === 3 ? 12 : 4 });
	}
	return sets;
}

/** Connected loop: first setup → first drill → second setup → second drill → first setup. */
export function buildShow(first: Drill = "bigA"): (DrillSet & { guards: Pt[] })[] {
	const a = bigA();
	const h = hogs();
	const [opening, following] = first === "bigA" ? [a, h] : [h, a];
	const from = opening[opening.length - 1].pts;
	const setup = changeSetup(from, following[0].pts);
	const order = spotOrder(following[0].pts, setup);
	const next = following.map((set, i) => ({
		...set,
		pts: order.map((j) => set.pts[j]),
		move: i === 0 ? transitionCounts(from, setup) : set.move,
	}));
	const end = next[next.length - 1].pts;
	const closing = changeSetup(end, opening[0].pts);
	const sets = [...opening, ...next, {
		...opening[0], pts: closing, move: transitionCounts(end, closing), hold: 0,
	}];
	return sets.map((set) => ({ ...set, guards: [] }));
}

/** Sideline and edge performers are excluded from the picture sets. */
export function sidelineSpots(_drill: Drill): Pt[] {
	return [];
}
