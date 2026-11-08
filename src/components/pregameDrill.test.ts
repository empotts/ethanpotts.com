import assert from "node:assert/strict";
import { test } from "node:test";
import { assign, buildShow, HOGS_CENTERS, line, N, PLAYBACK_RATE, sidelineSpots, spotOrder } from "./pregameDrill.ts";

test("either drill can start; both drills have distinct opening sets with no entrance", () => {
	for (const first of ["bigA", "hogs"] as const) {
		const sets = buildShow(first);
		assert.equal(sets[0].drill, first);
		assert.equal(sets.filter((s) => s.move === 0).length, 1);
		assert.equal(sets.at(-1)?.drill, first);
		for (const set of sets) {
			assert.equal(set.pts.length, N, set.name);
			assert.equal(new Set(set.pts.map((p) => p.join(","))).size, N, set.name);
			assert.ok(set.pts.every(([x, y]) => Number.isFinite(x + y) && Math.abs(x) <= 50 && Math.abs(y) <= 25), set.name);
		}
	}
	assert.equal(PLAYBACK_RATE, 1.6);
});

test("HOGS starts in four 5-by-11 blocks and forms exactly one letter at a time", () => {
	const sets = buildShow("hogs");
	for (let letter = 0; letter < 4; letter++) {
		const initial = sets[0].pts.slice(letter * 56, letter * 56 + 55);
		assert.equal(new Set(initial.map(([x]) => x)).size, 5);
		assert.equal(new Set(initial.map(([, y]) => y)).size, 11);
		assert.ok(initial.every(([x]) => Math.abs(x - HOGS_CENTERS[letter]) <= 5));
		let moved = 0;
		for (let marcher = 0; marcher < N; marcher++) {
			if (JSON.stringify(sets[letter].pts[marcher]) === JSON.stringify(sets[letter + 1].pts[marcher])) continue;
			moved++;
			assert.equal(marcher === 244 ? 0 : Math.floor(marcher / 56), letter, "other sections must hold");
		}
		assert.ok(moved > 0);
		assert.deepEqual(sets[letter + 1].pts.slice(224, 244), sets[0].pts.slice(224, 244), "drumline holds");
	}
});

test("Big A uses the reference opening ranks, then translates without distorting", () => {
	const sets = buildShow("bigA");
	for (const spot of [[-20, 19.375], [35, -18.75], [40, 14.375], [-22.5, 4.375]])
		assert.ok(sets[0].pts.some((p) => p[0] === spot[0] && p[1] === spot[1]));
	for (const [index, dx] of [[3, 10], [4, -25], [5, 0]])
		assert.deepEqual(sets[index].pts, sets[2].pts.map(([x, y]) => [x + dx, y]));
});

test("every diagonal dot is collinear rather than independently snapped to a grid", () => {
	const a: [number, number] = [-25, 10];
	const b: [number, number] = [40, 24];
	for (const [x, y] of line(a, b, 48))
		assert.ok(Math.abs((x - a[0]) * (b[1] - a[1]) - (y - a[1]) * (b[0] - a[0])) < 1e-9);
});


test("formation routes minimize the maximum distance, then total distance", () => {
	const permutations = (values: number[]): number[][] => values.length === 0 ? [[]] : values.flatMap((value, i) =>
		permutations(values.filter((_, j) => i !== j)).map((rest) => [value, ...rest]),
	);
	for (let seed = 1; seed <= 4; seed++) {
		const prev: [number, number][] = Array.from({ length: 6 }, (_, i) => [(i * seed * 7) % 19, (i * 3 + seed) % 11]);
		const next: [number, number][] = Array.from({ length: 6 }, (_, i) => [(i * 5 + seed) % 17, (i * seed * 2) % 13]);
		const score = (spots: [number, number][]) => {
			const distances = spots.map(([x, y], i) => Math.hypot(x - prev[i][0], y - prev[i][1]));
			return [Math.max(...distances), distances.reduce((a, b) => a + b, 0)];
		};
		const all = permutations(next.map((_, i) => i)).map((order) => score(order.map((i) => next[i])));
		all.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
		const actual = score(assign(prev, next));
		assert.ok(Math.abs(actual[0] - all[0][0]) < 1e-9);
		assert.ok(Math.abs(actual[1] - all[0][1]) < 1e-9);
	}
});

test("both setup transitions are animated and every marcher continues through repeated cycles", () => {
	for (const first of ["bigA", "hogs"] as const) {
		const sets = buildShow(first);
		const closing = sets[sets.length - 1];
		const followingIndex = sets.findIndex((set) => set.drill !== first);
		const following = sets[followingIndex];
		assert.notEqual(following.drill, first);
		assert.ok(following.move > 0 && closing.move > 0);
		assert.equal(closing.hold, 0);
		assert.equal(closing.name, sets[0].name);
		for (const index of [followingIndex, sets.length - 1]) {
			const prev = sets[index - 1].pts;
			assert.ok(sets[index].pts.every(([x, y], i) => Math.hypot(x - prev[i][0], y - prev[i][1]) / sets[index].move <= 0.625 + 1e-9));
		}
		const guardLoop = spotOrder(sets[0].guards, closing.guards);
		assert.deepEqual(guardLoop.map((i) => sets[0].guards[i]), closing.guards);
		const loop = spotOrder(sets[0].pts, closing.pts);
		let order = Array.from({ length: N }, (_, i) => i);
		for (let cycle = 0; cycle < 3; cycle++) {
			const last = order.map((i) => closing.pts[i]);
			order = order.map((i) => loop[i]);
			assert.deepEqual(order.map((i) => sets[0].pts[i]), last, "no dot teleports at the cycle boundary");
		}
	}
	assert.equal(sidelineSpots("hogs").length, sidelineSpots("bigA").length);
});

test("Big A folds intact four-person squads without crossing neighboring squads", () => {
	const [, opening, fold] = buildShow("bigA");
	for (let squad = 0; squad < 48; squad++) {
		const pts = fold.pts.slice(squad * 4, squad * 4 + 4);
		for (let row = 1; row < 4; row++) {
			assert.ok(Math.abs(pts[row][0] - pts[row - 1][0]) < 1.4, "squad stays contiguous");
			assert.equal(Math.sign(pts[row][0] - pts[row - 1][0]), squad % 4 < 2 ? -1 : 1);
		}
	}
	// Analytic closest approach over the entire fold, including between animation frames.
	for (let i = 0; i < 192; i++) for (let j = i + 1; j < 192; j++) {
		const x = opening.pts[i][0] - opening.pts[j][0];
		const y = opening.pts[i][1] - opening.pts[j][1];
		const dx = fold.pts[i][0] - fold.pts[j][0] - x;
		const dy = fold.pts[i][1] - fold.pts[j][1] - y;
		const t = Math.max(0, Math.min(1, -(x * dx + y * dy) / (dx * dx + dy * dy) || 0));
		assert.ok(Math.hypot(x + t * dx, y + t * dy) >= 0.5, `squads overlap: ${i}, ${j}`);
	}
});


test("Big A aligns vertical files before folding and keeps the end files intact", () => {
	const [opening, aligned, fold] = buildShow("bigA");
	for (let i = 0; i < 192; i += 4) {
		assert.equal(new Set(aligned.pts.slice(i, i + 4).map(([x]) => x)).size, 1);
	}
	for (const [start, end] of [[192, 200], [200, 208], [208, 224]]) {
		for (let step = 0; step <= 32; step++) {
			const t = step / 32;
			const pts = opening.pts.slice(start, end).map(([x, y], j) => [x + (aligned.pts[start + j][0] - x) * t, y + (aligned.pts[start + j][1] - y) * t]);
			assert.equal(new Set(pts.map(([x]) => x)).size, 1, "end file stays vertical during setup");
			for (let j = 1; j < pts.length; j++) assert.ok(pts[j - 1][1] > pts[j][1]);
		}
		for (let j = start + 1; j < end; j++) assert.ok(Math.abs((opening.pts[j][1] - opening.pts[j - 1][1]) - (aligned.pts[j][1] - aligned.pts[j - 1][1])) < 1e-9, "alignment preserves spacing");
		if (start === 208) assert.ok(fold.pts[start][0] < aligned.pts[start][0], "bar moves left on fold");
	}
	assert.ok(buildShow().every((set) => !set.name.includes("four blocks")));
});


test("alignment changes only y, including when Big A follows HOGS", () => {
	for (const first of ["bigA", "hogs"] as const) {
		const sets = buildShow(first);
		const index = sets.findIndex((s) => s.name === "Big A · align files");
		assert.deepEqual(sets[index].pts.map(([x]) => x), sets[index - 1].pts.map(([x]) => x));
	}
});

test("only picture-set members are present, with an extra marcher at the inner A tip", () => {
	for (const first of ["bigA", "hogs"] as const)
		for (const set of buildShow(first)) assert.deepEqual(set.guards, []);
	const [opening, aligned, folded] = buildShow("bigA");
	assert.deepEqual(opening.pts[244], [-20, 4.375]);
	assert.deepEqual(aligned.pts[244], [-20, 0]);
	assert.deepEqual(folded.pts[244], [-20, 0]);
	const hogs = buildShow("hogs")[0];
	assert.equal(hogs.pts.length, 245);
	assert.ok(hogs.pts.every(([x, y]) => Math.abs(x) <= 35 && Math.abs(y) <= 12.5));
});


test("inner A diagonals meet at their tip and parallel the outer strokes", () => {
	const fold = buildShow("bigA")[2].pts;
	const tip = fold[244];
	for (const rank of [1, 2]) {
		const sign = rank === 1 ? 1 : -1;
		const pts = Array.from({ length: 12 }, (_, file) => fold.slice(file * 16 + rank * 4, file * 16 + rank * 4 + 4)).flat().sort((a, b) => a[0] - b[0]);
		for (const [x, y] of pts) assert.ok(Math.abs((y - tip[1]) * 65 - sign * (x - tip[0]) * 14) < 1e-9);
		const sequence = [tip, ...pts];
		for (let i = 1; i < sequence.length; i++) assert.ok(Math.abs(sequence[i][0] - sequence[i - 1][0] - 1.25) < 1e-9, "no missing spots at tip or along diagonal");
	}
});


test("HOGS letters share top and bottom extents", () => {
	const final = buildShow("hogs")[4].pts;
	for (let letter = 0; letter < 4; letter++) {
		const ys = final.slice(letter * 56, (letter + 1) * 56).map((p) => p[1]);
		assert.equal(Math.min(...ys), -15);
		assert.equal(Math.max(...ys), 15);
	}
});

test("alignment translates squads without changing their intervals", () => {
	const [opening, aligned] = buildShow("bigA");
	for (let squad = 0; squad < 48; squad++) {
		const start = squad * 4;
		const dy = aligned.pts[start][1] - opening.pts[start][1];
		for (let i = start; i < start + 4; i++) assert.ok(Math.abs(aligned.pts[i][1] - opening.pts[i][1] - dy) < 1e-9);
	}
	assert.equal(opening.pts.slice(208, 224).length, 16);
	assert.deepEqual(aligned.pts.slice(208, 224).map((p) => p[1]), opening.pts.slice(208, 224).map((p) => p[1]));
});
