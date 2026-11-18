import { useState } from "react";

/**
 * A paceline you can rotate. The rider on the front takes the wind; everyone
 * behind sits in the draft and works roughly a third less.
 */
const RIDERS = ["A", "B", "C", "D", "E"];
const FRONT = 100;
const DRAFTING = 67;

function Rider({ x, front }: { x: number; front: boolean }) {
	return (
		<g transform={`translate(${x} 0)`} className={front ? "draft-front" : undefined}>
			<circle cx={-14} cy={92} r={11} className="draft-wheel" />
			<circle cx={14} cy={92} r={11} className="draft-wheel" />
			<path d="M-14 92 L-2 92 L6 72 L-8 72 Z M6 72 L14 92 M-8 72 L-10 66 M6 72 L8 66" className="draft-frame" />
			<path d="M-9 66 L4 52" className="draft-body" />
			<rect x={2} y={44} width={9} height={7} className="draft-helmet" />
		</g>
	);
}

export function Draft(_: { alt?: string }) {
	const [order, setOrder] = useState(RIDERS);
	const [solo, setSolo] = useState(false);
	const line = solo ? order.slice(0, 1) : order;
	const rotate = () => setOrder((o) => [...o.slice(1), o[0]]);
	// Front rider is rightmost, riding into the wind from the right.
	const xOf = (i: number) => 470 - i * 62;
	return (
		<figure className="draft not-prose my-8 border-2 border-black p-3">
			<svg viewBox="0 0 640 170" role="img" aria-label={solo ? "One rider alone, taking all the wind." : "Five riders in a line; the front rider takes the wind and the rest draft behind."}>
				{[30, 60, 90].map((y, i) => (
					<path key={y} d={`M630 ${y + 10} L${590 - i * 12} ${y + 10}`} className="draft-wind">
						<animate attributeName="stroke-dashoffset" values="0;-24" dur="0.6s" repeatCount="indefinite" calcMode="discrete" />
					</path>
				))}
				<text x={630} y={22} className="draft-label" textAnchor="end">wind</text>
				<path d="M0 104 H640" className="draft-road" />
				{line.map((r, i) => (
					<Rider key={r} x={xOf(i)} front={i === 0} />
				))}
				{line.map((r, i) => {
					const effort = i === 0 ? FRONT : DRAFTING;
					return (
						<g key={`${r}-bar`} transform={`translate(${xOf(i) - 24} 116)`}>
							<rect width={48} height={14} className="draft-bar-bg" />
							<rect width={(48 * effort) / 100} height={14} className={i === 0 ? "draft-bar draft-bar-front" : "draft-bar"} />
							<text x={24} y={30} className="draft-label" textAnchor="middle">
								{effort}%
							</text>
						</g>
					);
				})}
			</svg>
			<figcaption className="mt-2 flex flex-wrap items-center gap-2 font-ui text-xs">
				<button type="button" className="btn py-0 text-xs" onClick={rotate} disabled={solo}>
					Rotate the front
				</button>
				<button type="button" className="btn py-0 text-xs" aria-pressed={solo} onClick={() => setSolo(!solo)}>
					{solo ? "Back to the group" : "Go solo"}
				</button>
				<span className="ml-auto">Effort at race speed, approximate</span>
			</figcaption>
		</figure>
	);
}
