import { useEffect, useRef, useState } from "react";

/**
 * A paceline you can rotate. The rider on the front takes the wind; everyone
 * behind sits in the draft and works roughly a third less. Rotating sends the
 * front rider out of the line and back to the rear while the rest move up.
 */
const RIDERS = ["A", "B", "C", "D", "E"];
const FRONT = 100;
const DRAFTING = 67;
/** How far the rider pulling off swings out (drawn higher, as if in the far lane). */
const LANE = -26;

function Rider({ id, x, y, front }: { id: string; x: number; y: number; front: boolean }) {
	const effort = front ? FRONT : DRAFTING;
	return (
		// Two groups so the swing out (y) is quick and the drift back (x) is slow.
		<g className={`draft-lane${front ? " draft-front" : ""}${y ? " draft-out" : ""}`} style={{ transform: `translate(0px, ${y}px)` }}>
			<g className="draft-rider" style={{ transform: `translate(${x}px, 0px)` }}>
			<text x={4} y={38} className="draft-label draft-bib" textAnchor="middle">
				{id}
			</text>
			<circle cx={-14} cy={92} r={11} className="draft-wheel" />
			<circle cx={14} cy={92} r={11} className="draft-wheel" />
			<path d="M-14 92 L-2 92 L6 72 L-8 72 Z M6 72 L14 92 M-8 72 L-10 66 M6 72 L8 66" className="draft-frame" />
			<path d="M-9 66 L4 52" className="draft-body" />
			<rect x={2} y={44} width={9} height={7} className="draft-helmet" />
			<g transform="translate(-24 116)" className="draft-effort">
				<rect width={48} height={14} className="draft-bar-bg" />
				<rect width={(48 * effort) / 100} height={14} className={front ? "draft-bar draft-bar-front" : "draft-bar"} />
				<text x={24} y={30} className="draft-label" textAnchor="middle">
					{effort}%
				</text>
			</g>
			</g>
		</g>
	);
}

export function Draft(_: { alt?: string }) {
	const [order, setOrder] = useState(RIDERS);
	const [solo, setSolo] = useState(false);
	/** The rider swinging out of the line mid-rotation, if any. */
	const [out, setOut] = useState<string | null>(null);
	const timers = useRef<number[]>([]);
	useEffect(() => () => timers.current.forEach(clearTimeout), []);

	const line = solo ? order.slice(0, 1) : order;
	const busy = out !== null;
	const rotate = () => {
		if (busy) return;
		const leader = order[0];
		const later = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
		// Swing out, drift back while the others move up, then tuck in at the rear.
		setOut(leader);
		later(220, () => setOrder((o) => [...o.slice(1), o[0]]));
		later(1000, () => setOut(null));
	};
	// Front rider is rightmost, riding into the wind from the right.
	const xOf = (i: number) => 470 - i * 62;
	return (
		<figure className="draft not-prose my-8 border-2 border-black p-3">
			<svg viewBox="0 0 640 170" role="img" aria-label={solo ? "One rider alone, taking all the wind." : `Five riders in a line; rider ${order[0]} is on the front taking the wind and the rest draft behind.`}>
				{[30, 60, 90].map((y, i) => (
					<path key={y} d={`M630 ${y + 10} L${590 - i * 12} ${y + 10}`} className="draft-wind">
						<animate attributeName="stroke-dashoffset" values="0;-24" dur="0.6s" repeatCount="indefinite" calcMode="discrete" />
					</path>
				))}
				<text x={630} y={22} className="draft-label" textAnchor="end">
					wind
				</text>
				<path d="M0 104 H640" className="draft-road" />
				{/* Stable keys so each rider keeps its identity and slides to its new place. */}
				{RIDERS.filter((r) => line.includes(r)).map((r) => {
					const i = line.indexOf(r);
					return <Rider key={r} id={r} x={xOf(i)} y={r === out ? LANE : 0} front={i === 0 && r !== out} />;
				})}
			</svg>
			<figcaption className="mt-2 flex flex-wrap items-center gap-2 font-ui text-xs">
				<button type="button" className="btn py-0 text-xs" onClick={rotate} disabled={solo || busy}>
					Rotate the front
				</button>
				<button type="button" className="btn py-0 text-xs" aria-pressed={solo} onClick={() => setSolo(!solo)} disabled={busy}>
					{solo ? "Back to the group" : "Go solo"}
				</button>
				<span className="ml-auto">Effort at race speed, approximate</span>
			</figcaption>
		</figure>
	);
}
