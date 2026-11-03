/**
 * Single source of truth for site content. Every design reads from here.
 *
 * Career/education details come from Ethan's self-reported notes (LinkedIn was
 * not reachable when this was written) — verify titles and dates before launch.
 */

export const profile = {
	name: "Ethan Potts",
	first: "Ethan",
	last: "Potts",
	initials: "EP",
	role: "Software Engineer",
	company: "SupplyPike, an SPS Commerce company",
	location: "Northwest Arkansas",
	timezone: "America/Chicago",
	email: "ethanmpotts@gmail.com",
	github: "https://github.com/empotts",
	githubHandle: "empotts",
	tagline:
		"Biomedical engineer turned software engineer. I build TypeScript apps on the edge, shoot marching band photos, and watch way too much pro cycling.",
	shortBio: [
		"I'm a software engineer at SupplyPike (an SPS Commerce company) in Northwest Arkansas, working on the retail-supplier side of the world: deductions, EDI data, and the workflow plumbing that keeps it moving.",
		"I studied Biomedical Engineering with a CS minor at the University of Arkansas, did gene-editing research, then figured out I liked shipping software even more than pipetting.",
		"Off the clock I run PottsShotts Photography, shoot for the Razorback Marching Band, build too many side projects on Cloudflare, and follow every Grand Tour stage.",
	],
} as const;

export type Experience = {
	org: string;
	role: string;
	start: string;
	end: string;
	place: string;
	blurb: string;
	bullets: string[];
	tags: string[];
};

export const experience: Experience[] = [
	{
		org: "SupplyPike · SPS Commerce",
		role: "Software Engineer I",
		start: "2024",
		end: "Now",
		place: "Fayetteville / Rogers, AR",
		blurb:
			"Climbed from intern → associate → SWE I building tools that help suppliers win against retailer deductions.",
		bullets: [
			"Navigator: turning SPS EDI data into multi-retailer deduction insights.",
			"Shipped across the CVS and Walgreens retailer teams in a large TypeScript monorepo.",
			"Durable workflows with Temporal + RabbitMQ; NestJS, Prisma and PostgreSQL services; React front ends.",
		],
		tags: ["TypeScript", "React", "NestJS", "Temporal", "RabbitMQ", "Postgres"],
	},
	{
		org: "PottsShotts Photography",
		role: "Founder & Photographer",
		start: "2023",
		end: "Now",
		place: "Northwest Arkansas",
		blurb:
			"Sports, events and marching-arts photography, plus the custom software that runs the business.",
		bullets: [
			"Event galleries, participant lookup and client contact built on TanStack Start + Cloudflare D1.",
			"Wrote a type-safe TypeScript SDK for the SmugMug API to automate delivery.",
		],
		tags: ["Canon R5", "Lightroom", "Premiere", "Cloudflare"],
	},
	{
		org: "University of Arkansas Bands",
		role: "Photographer, Videographer & Social Media",
		start: "2020",
		end: "Now",
		place: "Fayetteville, AR",
		blurb:
			"Game days, halftime shows, drumline, parades. Former trumpet section leader in the Razorback Marching Band.",
		bullets: [
			"Shoots and edits photo/video content for the Razorback Marching Band's channels.",
			"Built analytics tooling tracking Facebook + Instagram growth across a 79-band watchlist.",
			"Former president, Kappa Kappa Psi — Lambda Chapter.",
		],
		tags: ["Photo", "Video", "Social"],
	},
	{
		org: "Nelson Lab · University of Arkansas",
		role: "Undergraduate Researcher",
		start: "2022",
		end: "2024",
		place: "Fayetteville, AR",
		blurb:
			"Honors thesis on promoterless CRISPR-Cas9 integration of human Factor IX in C2C12 muscle cells.",
		bullets: [
			"Illumina + Nanopore sequencing analysis with HISAT2, DESeq2 and IGV on custom genomes.",
			"MATLAB image analysis: HSV segmentation, SLIC superpixels, Delta-E color metrics.",
		],
		tags: ["CRISPR", "Bioinformatics", "MATLAB"],
	},
];

export const education = {
	school: "University of Arkansas",
	degree: "B.S. Biomedical Engineering",
	minor: "Minor in Computer Science",
	year: "2024",
	gpa: "4.0",
};

export type Project = {
	slug: string;
	name: string;
	kind: "game" | "app" | "tool" | "library" | "starter" | "data";
	year: string;
	oneLiner: string;
	description: string;
	stack: string[];
	href?: string;
	repo?: string;
	color: string;
	featured?: boolean;
};

export const projects: Project[] = [
	{
		slug: "lucky-seven",
		name: "Lucky Seven",
		kind: "game",
		year: "2026",
		oneLiner: "Push-your-luck card game, realtime with friends.",
		description:
			"Mobile-first multiplayer card game. Create a table, share a link, race to 200 without flipping the same number twice. One SQLite-backed Durable Object per game with hibernatable WebSockets.",
		stack: ["TanStack Start", "Durable Objects", "WebSockets", "Alchemy"],
		href: "https://flip-7.ethanmpotts.workers.dev",
		repo: "https://github.com/empotts/flip-7",
		color: "#ff4d2e",
		featured: true,
	},
	{
		slug: "cryptic-conditioning",
		name: "Cryptic Conditioning",
		kind: "game",
		year: "2026",
		oneLiner: "A daily cryptic crossword trainer.",
		description:
			"One deterministic cryptic clue a day, plus endless mode with shareable seeds, a timer, and check/reveal. Server functions stream one clue at a time so it stays snappy.",
		stack: ["TanStack Start", "Cloudflare Workers"],
		href: "https://cryptic-conditioning.ethanmpotts.workers.dev",
		repo: "https://github.com/empotts/cryptic-conditioning",
		color: "#7c5cff",
		featured: true,
	},
	{
		slug: "crossword-archipelago",
		name: "Crossword Archipelago",
		kind: "game",
		year: "2026",
		oneLiner: "Multiplayer crosswords where clues link across boards.",
		description:
			"Every player gets a freshly generated grid; typed cells sync through the room and linked clue substrings light up on everyone else's board. The generator enforces a five-second budget per four-player room.",
		stack: ["Durable Objects", "Puzzle generation", "React"],
		color: "#00b3a4",
		featured: true,
	},
	{
		slug: "drill-sim",
		name: "Drill Sim",
		kind: "app",
		year: "2026",
		oneLiner: "Practice marching drill in first person.",
		description:
			"A Three.js drill viewer that loads OpenMarch and Pyware files and lets you walk your own spot on the field in first person: 287 performers, 932 counts, synced to the show audio.",
		stack: ["Three.js", "TypeScript", "File formats"],
		color: "#2fbf4a",
		featured: true,
	},
	{
		slug: "velorank",
		name: "Velorank",
		kind: "data",
		year: "2026",
		oneLiner: "Pro cycling rankings from scraped race history.",
		description:
			"A rider ranking site fed by a browser-driven scraper of WorldTour, Worlds and Olympic results. Auth, profiles, R2 avatars, the works.",
		stack: ["TanStack Start", "D1", "R2", "Playwright"],
		color: "#ffd400",
		featured: true,
	},
	{
		slug: "pottsshotts",
		name: "PottsShotts",
		kind: "app",
		year: "2026",
		oneLiner: "The platform behind my photography business.",
		description:
			"Events, participants, galleries and client contact on Cloudflare D1 with passkey auth and an owner-approval admin flow.",
		stack: ["TanStack Start", "D1", "Better Auth", "Passkeys"],
		color: "#ff8fb1",
		featured: true,
	},
	{
		slug: "om-mcp",
		name: "OpenMarch MCP",
		kind: "tool",
		year: "2026",
		oneLiner: "Let an AI agent write marching drill.",
		description:
			"A fork of the open-source OpenMarch drill writer that exposes drill authoring through MCP, with editable example shows.",
		stack: ["MCP", "Electron", "TypeScript"],
		color: "#3d7bff",
	},
	{
		slug: "smugmug-sdk",
		name: "SmugMug SDK",
		kind: "library",
		year: "2026",
		oneLiner: "Type-safe TypeScript SDK for SmugMug API v2.",
		description:
			"Curated camel-case models over generated endpoint metadata, a typed result API, and a safe raw escape hatch. Runtime-portable.",
		stack: ["TypeScript", "Codegen"],
		color: "#9ad62a",
	},
	{
		slug: "glide",
		name: "Glide",
		kind: "tool",
		year: "2026",
		oneLiner: "GitHub Projects as the UI for AI coding agents.",
		description:
			"A local daemon that watches a GitHub Project, routes each card to the right checkout, plans when it hits Ready and starts coding when it moves to In Progress.",
		stack: ["Node", "GitHub API", "Agents"],
		repo: "https://github.com/empotts/glide",
		color: "#ff9f1c",
	},
	{
		slug: "semi-infinite-craft",
		name: "Semi-Infinite Craft",
		kind: "game",
		year: "2026",
		oneLiner: "Combine elements; an LLM invents the result.",
		description:
			"An element-crafting toy on Cloudflare: Workers AI (Llama 3.1) dreams up new combinations, D1 remembers them forever.",
		stack: ["Workers AI", "D1", "Drizzle"],
		repo: "https://github.com/empotts/semi-infinite-craft",
		color: "#e84cff",
	},
	{
		slug: "every-catan-board",
		name: "Every Catan Board",
		kind: "tool",
		year: "2026",
		oneLiner: "Browse every possible Catan board, deterministically.",
		description:
			"A deterministic browser over base-game and 5–6 player Catan layouts. Every board has an address.",
		stack: ["JavaScript", "Combinatorics"],
		repo: "https://github.com/empotts/every-catan-board",
		color: "#d9822b",
	},
	{
		slug: "jotto",
		name: "Jotto",
		kind: "app",
		year: "2026",
		oneLiner: "Seven synced scratch pages + a macOS menu-bar app.",
		description:
			"A tiny Tot-inspired scratchpad: seven synced pages, one local-only page, autosave, and a native SwiftUI companion.",
		stack: ["TanStack Start", "SwiftUI"],
		repo: "https://github.com/empotts/jotto",
		color: "#5ec8ff",
	},
	{
		slug: "safety-car",
		name: "safety-car",
		kind: "starter",
		year: "2026",
		oneLiner: "Private-app starter with passkeys and owner approval.",
		description:
			"TanStack Start on Workers + D1 with Better Auth, WebAuthn passkeys, pending-by-default accounts and an /admin approval flow.",
		stack: ["TanStack Start", "D1", "Better Auth"],
		repo: "https://github.com/empotts/safety-car",
		color: "#ff5a5a",
	},
	{
		slug: "shelfish",
		name: "Shelfish",
		kind: "app",
		year: "2026",
		oneLiner: "Drag files to the screen edge, get a shelf.",
		description: "A modern Dropshelf replacement for macOS that lives in the menu bar.",
		stack: ["Swift", "macOS"],
		repo: "https://github.com/empotts/shelfish",
		color: "#8fd3c7",
	},
];

export const skills = {
	daily: ["TypeScript", "React", "TanStack Start", "Node", "NestJS", "PostgreSQL"],
	infra: ["Cloudflare Workers", "Durable Objects", "D1", "Temporal", "RabbitMQ", "Alchemy"],
	also: ["Python", "C++", "Swift", "MATLAB", "R", "Three.js"],
};

export const currently = [
	{ label: "Building", value: "this website (again)" },
	{ label: "Shooting", value: "Razorback game days" },
	{ label: "Playing", value: "Hollow Knight: Silksong" },
	{ label: "Watching", value: "every Grand Tour stage" },
	{ label: "Riding", value: "the Razorback Greenway" },
];

export const funFacts = [
	"Went from CRISPR to cron jobs.",
	"Owns more lenses than is reasonable.",
	"Used to play trumpet; now just photographs the people who do.",
	"Has opinions about Tour de France stage profiles.",
	"Will build a side project instead of using the existing app.",
];
