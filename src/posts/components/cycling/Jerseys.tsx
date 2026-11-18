/** The leaders' jerseys, drawn as pixel icons in their real colours. */

const SHAPE = [
	"................",
	"....##....##....",
	"...#oo####oo#...",
	"..#oooooooooo#..",
	".#oooooooooooo#.",
	"#ooo#oooooo#ooo#",
	"#oo##oooooo##oo#",
	".##.#oooooo#.##.",
	"....#oooooo#....",
	"....#oooooo#....",
	"....#oooooo#....",
	"....#oooooo#....",
	"....#oooooo#....",
	"....########....",
	"................",
	"................",
];

type Fill = (x: number, y: number) => string;
const solid = (c: string): Fill => () => c;
const polka: Fill = (x, y) => ((x + y * 3) % 5 === 0 && y > 2 ? "#d7262e" : "#ffffff");
const RAINBOW = ["#1f4fb5", "#d7262e", "#111111", "#f2c80f", "#1d9e48"];
const rainbow: Fill = (_x, y) => (y >= 6 && y <= 10 ? RAINBOW[y - 6] : "#ffffff");

const JERSEYS: { name: string; race: string; meaning: string; fill: Fill }[] = [
	{ name: "Yellow", race: "Tour de France", meaning: "Overall leader", fill: solid("#f6cf16") },
	{ name: "Green", race: "Tour de France", meaning: "Points, usually a sprinter", fill: solid("#1d9e48") },
	{ name: "Polka dot", race: "Tour de France", meaning: "Best climber", fill: polka },
	{ name: "White", race: "Tour de France", meaning: "Best young rider, 25 or under", fill: solid("#ffffff") },
	{ name: "Pink", race: "Giro d'Italia", meaning: "Overall leader", fill: solid("#f48fb5") },
	{ name: "Red", race: "Vuelta a España", meaning: "Overall leader", fill: solid("#d0202e") },
	{ name: "Rainbow stripes", race: "World Championships", meaning: "World champion, for a year", fill: rainbow },
];

function Jersey({ fill }: { fill: Fill }) {
	return (
		<svg viewBox="0 0 16 16" width={56} height={56} shapeRendering="crispEdges" aria-hidden>
			{SHAPE.flatMap((row, y) =>
				[...row].map((c, x) => (c === "." ? null : <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={c === "#" ? "var(--fg)" : fill(x, y)} />)),
			)}
		</svg>
	);
}

export function Jerseys(_: { alt?: string }) {
	return (
		<ul className="jerseys not-prose my-8 grid !list-none grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3 !p-0">
			{JERSEYS.map((j) => (
				<li key={j.name + j.race} className="win flex items-center gap-3 p-2">
					<Jersey fill={j.fill} />
					<span className="min-w-0 font-ui text-xs leading-snug">
						<strong className="block text-sm">{j.name}</strong>
						{j.meaning}
						<span className="block opacity-70">{j.race}</span>
					</span>
				</li>
			))}
		</ul>
	);
}
