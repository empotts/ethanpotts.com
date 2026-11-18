/** The racing year at a glance: the Monuments, the three Grand Tours and the Worlds. */

const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
// Positions are in months from the start of March (0) to the end of October (8).
const TOURS = [
	{ name: "Giro", start: 2.1, end: 2.95, color: "#f48fb5" },
	{ name: "Tour", start: 4.05, end: 4.8, color: "#f6cf16" },
	{ name: "Vuelta", start: 5.75, end: 6.5, color: "#d0202e" },
];
const MONUMENTS = [
	{ name: "Milan–San Remo", at: 0.6 },
	{ name: "Flanders", at: 1.15 },
	{ name: "Roubaix", at: 1.35 },
	{ name: "Liège", at: 1.75 },
	{ name: "Lombardia", at: 7.35 },
];
const WORLDS = 6.8;

export function Season(_: { alt?: string }) {
	const W = 640;
	const left = 10;
	const span = (W - 20) / MONTHS.length;
	const x = (m: number) => left + m * span;
	return (
		<figure className="season not-prose my-8 border-2 border-black p-3">
			<svg viewBox={`0 0 ${W} 150`} role="img" aria-label="Season calendar: Monuments in spring and in October, the Giro in May, the Tour in July, the Vuelta in late summer, and the World Championships near the end of September.">
				{MONTHS.map((m, i) => (
					<g key={m}>
						<rect x={x(i)} y={20} width={span} height={74} className={i % 2 ? "season-month season-alt" : "season-month"} />
						<text x={x(i) + span / 2} y={14} className="season-label" textAnchor="middle">
							{m}
						</text>
					</g>
				))}
				{TOURS.map((t) => (
					<g key={t.name}>
						<rect x={x(t.start)} y={62} width={x(t.end) - x(t.start)} height={22} fill={t.color} className="season-tour" />
						<text x={(x(t.start) + x(t.end)) / 2} y={77} className="season-tour-label" textAnchor="middle">
							{t.name}
						</text>
					</g>
				))}
				{MONUMENTS.map((m, i) => (
					<g key={m.name}>
						<rect x={x(m.at) - 5} y={32} width={10} height={10} className="season-monument" />
						<text x={x(m.at) + (i === 2 ? 2 : -2)} y={112 + (i % 2) * 14} className="season-small" textAnchor={i === 2 ? "start" : "end"}>
							{m.name}
						</text>
						<path d={`M${x(m.at)} 42 V${102 + (i % 2) * 14}`} className="season-tick" />
					</g>
				))}
				<g>
					{["#1f4fb5", "#d7262e", "#111111", "#f2c80f", "#1d9e48"].map((c, i) => (
						<rect key={c} x={x(WORLDS) - 6} y={30 + i * 3} width={12} height={3} fill={c} />
					))}
					<text x={x(WORLDS)} y={140} className="season-small" textAnchor="middle">
						Worlds
					</text>
					<path d={`M${x(WORLDS)} 45 V130`} className="season-tick" />
				</g>
			</svg>
			<figcaption className="mt-1 flex flex-wrap gap-x-4 font-ui text-xs">
				<span>
					<span className="season-key-monument" /> Monument (one day)
				</span>
				<span>Bars: Grand Tours, about three weeks each</span>
			</figcaption>
		</figure>
	);
}
