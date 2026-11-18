/**
 * How the Linux box is reached: Mac and phone sign in at Cloudflare Access,
 * which reaches the box through a tunnel the box dials out. Packets hop along
 * the path in steps; a wide and a tall layout swap by the column's width.
 */

type Node = { x: number; y: number; w: number; h: number; title: string; lines: string[]; strong?: boolean };

function Box({ x, y, w, h, title, lines, strong }: Node) {
	return (
		<g>
			<rect x={x + 3} y={y + 3} width={w} height={h} className="net-shadow" />
			<rect x={x} y={y} width={w} height={h} className={strong ? "net-box net-strong" : "net-box"} />
			<text x={x + w / 2} y={y + 20} className="net-title">
				{title}
			</text>
			{lines.map((l, i) => (
				<text key={l} x={x + w / 2} y={y + 38 + i * 16} className="net-sub">
					{l}
				</text>
			))}
		</g>
	);
}

/** A square that hops along `path` in 10 steps. */
function Packet({ path, delay }: { path: string; delay: number }) {
	const steps = 10;
	const keys = Array.from({ length: steps + 1 }, (_, i) => (i / steps).toFixed(2)).join(";");
	return (
		<rect x={-4} y={-4} width={8} height={8} className="net-packet">
			<animateMotion path={path} dur="2.4s" begin={`${delay}s`} repeatCount="indefinite" calcMode="discrete" keyPoints={keys} keyTimes={keys} />
		</rect>
	);
}

const MAC = { title: "Mac", lines: ["the remote control"] };
const PHONE = { title: "Phone", lines: ["SSH in the browser"] };
const ACCESS = { title: "Cloudflare Access", lines: ["sign in first", "sessions last a week"] };
const ROUTER = { title: "Home router", lines: ["no open ports"] };
const BOX = { title: "Linux box", lines: ["Ubuntu 26.04", "T3 Code", "OpenBot", "agents, always on"], strong: true };

function Wide() {
	return (
		<svg viewBox="0 0 690 230" className="net-wide" role="img" aria-label="Mac and phone sign in at Cloudflare Access, which reaches the Linux box through a tunnel the box opens outward; the home router has no open ports.">
			<path d="M160 56 L220 104" className="net-line" />
			<path d="M160 176 L220 128" className="net-line" />
			<path d="M530 116 L380 116" className="net-tunnel" />
			<text x={455} y={102} className="net-label">tunnel dials out</text>
			<path d="M390 110 L380 116 L390 122" className="net-arrow" />
			<Box x={10} y={30} w={150} h={52} {...MAC} />
			<Box x={10} y={150} w={150} h={52} {...PHONE} />
			<Box x={220} y={80} w={160} h={70} {...ACCESS} />
			<Box x={400} y={142} w={112} h={52} {...ROUTER} />
			<Box x={530} y={50} w={150} h={116} {...BOX} />
			<Packet path="M160 56 L220 104 L380 116 L530 116" delay={0} />
			<Packet path="M160 176 L220 128 L380 116 L530 116" delay={1.2} />
		</svg>
	);
}

function Tall() {
	return (
		<svg viewBox="0 0 320 530" className="net-tall" role="img" aria-label="Mac and phone sign in at Cloudflare Access, which reaches the Linux box through a tunnel the box opens outward; the home router has no open ports.">
			<path d="M80 72 L140 150" className="net-line" />
			<path d="M240 72 L180 150" className="net-line" />
			<path d="M160 400 L160 222" className="net-tunnel" />
			<text x={160} y={300} className="net-label net-label-side">tunnel dials out</text>
			<path d="M154 232 L160 222 L166 232" className="net-arrow" />
			<Box x={4} y={20} w={150} h={52} {...MAC} />
			<Box x={166} y={20} w={150} h={52} {...PHONE} />
			<Box x={85} y={150} w={150} h={72} {...ACCESS} />
			<Box x={190} y={320} w={120} h={52} {...ROUTER} />
			<Box x={70} y={400} w={180} h={116} {...BOX} />
			<Packet path="M80 72 L140 150 L160 222 L160 400" delay={0} />
			<Packet path="M240 72 L180 150 L160 222 L160 400" delay={1.2} />
		</svg>
	);
}

export function NetDiagram(_: { alt?: string }) {
	return (
		<figure className="net-diagram not-prose my-8">
			<Wide />
			<Tall />
		</figure>
	);
}
