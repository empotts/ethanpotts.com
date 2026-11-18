/** Four kinds of stage as little elevation profiles. Shapes are illustrative, not real routes. */

const N = 60;
const profile = (f: (t: number) => number) => Array.from({ length: N + 1 }, (_, i) => f(i / N));
const KINDS = [
	{ name: "Flat", note: "Ends in a bunch sprint", pts: profile((t) => 0.12 + Math.sin(t * 9) * 0.02 + Math.sin(t * 23) * 0.01) },
	{ name: "Mountain", note: "Where the GC is decided", pts: profile((t) => 0.1 + Math.max(0, Math.sin((t - 0.15) * 6.5)) * 0.45 * (0.6 + t * 0.6) + (t > 0.8 ? (t - 0.8) * 2.4 : 0)) },
	{ name: "Time trial", note: "Alone against the clock", pts: profile((t) => 0.14 + Math.sin(t * 5) * 0.03) },
	{ name: "Hilly", note: "Punchy climbs, breakaways", pts: profile((t) => 0.12 + Math.abs(Math.sin(t * 15)) * 0.18 * (0.7 + Math.sin(t * 4) * 0.3)) },
];

function Profile({ pts, clock }: { pts: number[]; clock?: boolean }) {
	const w = 160;
	const h = 70;
	const line = pts.map((v, i) => `${(i / N) * w},${h - Math.min(0.95, v) * h}`).join(" ");
	return (
		<svg viewBox={`0 0 ${w} ${h}`} className="stage-svg" aria-hidden>
			<polygon points={`0,${h} ${line} ${w},${h}`} className="stage-fill" />
			<polyline points={line} className="stage-line" />
			{clock && (
				<g transform="translate(140 14)">
					<circle r={8} className="stage-clock" />
					<path d="M0 0 V-5 M0 0 H4" className="stage-line" />
				</g>
			)}
		</svg>
	);
}

export function Stages(_: { alt?: string }) {
	return (
		<ul className="stages not-prose my-8 grid !list-none grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 !p-0">
			{KINDS.map((k) => (
				<li key={k.name} className="win p-2">
					<Profile pts={k.pts} clock={k.name === "Time trial"} />
					<span className="mt-1 block font-ui text-sm">{k.name}</span>
					<span className="block font-ui text-xs leading-snug">{k.note}</span>
				</li>
			))}
		</ul>
	);
}
