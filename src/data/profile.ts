/**
 * Single source of truth for site content. Every design reads from here.
 *
 * Career and education come from Ethan's LinkedIn (linkedin.com/in/ethanmpotts).
 */

export const profile = {
	name: "Ethan Potts",
	first: "Ethan",
	last: "Potts",
	initials: "EP",
	pronouns: "He/Him",
	role: "Software Engineer",
	team: "Revenue Recovery",
	company: "SPS Commerce",
	headline: "Software Engineer | Revenue Recovery @ SPS Commerce",
	location: "Rogers, Arkansas",
	timezone: "America/Chicago",
	email: "ethanmpotts@gmail.com",
	github: "https://github.com/empotts",
	githubHandle: "empotts",
	linkedin: "https://www.linkedin.com/in/ethanmpotts",
	/** One sentence. Used under the name. */
	intro: "Software engineer at SPS Commerce. I build tools that help suppliers get paid.",
	tagline: "Software engineer at SPS Commerce. I build tools that help suppliers get paid.",
	shortBio: [
		"I work on revenue recovery at SPS Commerce: retailer data in, disputes out, money back to suppliers.",
		"Before software I studied biomedical engineering. On weekends I photograph marching bands and build small apps.",
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
		org: "SPS Commerce",
		role: "Software Engineer",
		start: "Mar 2026",
		end: "Now",
		place: "Rogers, AR",
		blurb: "Revenue recovery for multiple retailers.",
		bullets: [
			"Built a shared AI workflow on Amazon Bedrock that reads retailer dispute responses and routes the ones it can't match to a person.",
			"Built an end-to-end test suite that covers 32 production contracts across the web app, worker, queue processor and gateway.",
			"Build retailer integrations and automated workflows with TypeScript, Temporal, PostgreSQL, RabbitMQ and AWS.",
			"Made submissions safer with idempotency checks, OpenTelemetry tracing and mutation testing.",
		],
		tags: ["TypeScript", "Temporal", "AWS"],
	},
	{
		org: "SPS Commerce",
		role: "Associate Software Engineer",
		start: "Dec 2024",
		end: "Mar 2026",
		place: "Rogers, AR",
		blurb: "Helped build Navigator, the multi-retailer app.",
		bullets: [
			"Started Navigator on TanStack Start, with search, filters and streaming exports.",
			"Built dispute and repayment workflows on Temporal and Mailgun, including inbound email.",
			"Built a RabbitMQ-to-Temporal queue processor for onboarding events.",
			"Automated disputing with readiness checks, supplier settings and daily limits.",
		],
		tags: ["TanStack Start", "Temporal"],
	},
	{
		org: "SupplyPike",
		role: "Software Engineer I",
		start: "May 2024",
		end: "Jan 2025",
		place: "Rogers, AR",
		blurb: "Started as an intern. Stayed through the SPS acquisition.",
		bullets: [
			"Cut a payment sync step from over 30 minutes to about two.",
			"Built the Walgreens data pipeline: retailer files to S3, then to deductions, with duplicate detection.",
			"Helped split a single-retailer codebase into shared and per-retailer packages.",
			"Shipped CVS dashboards, exports, bulk disputes and payment reconciliation.",
		],
		tags: ["React", "PostgreSQL"],
	},
	{
		org: "University of Arkansas Bands",
		role: "Social Media Manager",
		start: "Jan 2024",
		end: "Now",
		place: "Fayetteville, AR",
		blurb: "Photo and video for the Razorback Marching Band.",
		bullets: [
			"2M+ Instagram impressions and 15% follower growth in the 2025 marching season.",
			"Photo and video for the Razorback Marching Band, Hogwild and the Concert Bands.",
			"Made content for the band's 2027 Macy's Thanksgiving Day Parade application.",
		],
		tags: ["Photo", "Video"],
	},
	{
		org: "PottsShotts Photography",
		role: "Owner",
		start: "Apr 2023",
		end: "Now",
		place: "Rogers, AR",
		blurb: "Sports and marching arts photography.",
		bullets: [
			"Covers AMAA and WGI marching arts events across Arkansas.",
			"Former intern photographer for the Winston-Salem Dash (MiLB).",
		],
		tags: ["Photography"],
	},
	{
		org: "Cardiovascular Biomechanics Lab",
		role: "Undergraduate Researcher",
		start: "Jan 2021",
		end: "Jan 2024",
		place: "Fayetteville, AR",
		blurb: "Ultrasound blood-flow imaging and signal processing.",
		bullets: [
			"Measured blood flow in children with heart defects using ultrasound and gel phantoms.",
			"Analyzed heart signals to predict blood loss in hemorrhage.",
			"Helped write and edit several manuscripts.",
		],
		tags: ["MATLAB"],
	},
];

export const education = {
	school: "University of Arkansas",
	degree: "B.S. Biomedical Engineering",
	minor: "Minor in Computer Science",
	years: "2020 – 2024",
	year: "2024",
	honors: "Summa Cum Laude",
	thesis:
		"Honors thesis: Transcriptomic Profiling of Engineered Human Gene Integration in the Mouse Genome Following In Vitro Gene Editing (Dr. Christopher Nelson).",
	activities: ["President, Kappa Kappa Psi", "Section leader, Razorback Marching Band"],
	grad: "Graduate coursework in Computer Science, 2024: algorithms, databases, mobile full-stack",
};

export const awards = [
	{
		name: "J. Lee Burke Student Achievement Award",
		from: "Kappa Kappa Psi",
		year: "2024",
		note: "The fraternity's highest honor for an active member.",
	},
	{ name: "Summa Cum Laude", from: "University of Arkansas", year: "2024", note: "First Ranked Senior Scholar." },
	{ name: "Responsive Web Design", from: "freeCodeCamp", year: "2024", note: "Certification." },
	{ name: "National AP Scholar", from: "College Board", year: "2020", note: "Rogers High School." },
];

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
		description: "A push-your-luck card game. Share a link and play with friends in real time.",
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
		description: "One cryptic crossword clue a day, plus an endless mode.",
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
		description: "Each player gets a different grid. Shared letters show up on everyone's board.",
		stack: ["Durable Objects", "Puzzle generation", "React"],
		href: "https://crossword-archipelago.ethanmpotts.workers.dev",
		color: "#00b3a4",
		featured: true,
	},
	{
		slug: "drill-sim",
		name: "Drill Sim",
		kind: "app",
		year: "2026",
		oneLiner: "Practice marching drill in first person.",
		description: "Load a marching show and walk your own spot on the field in 3D.",
		stack: ["Three.js", "TypeScript", "File formats"],
		href: "https://drill-sim.ethanmpotts.workers.dev",
		color: "#2fbf4a",
		featured: true,
	},
	{
		slug: "velorank",
		name: "Velorank",
		kind: "data",
		year: "2026",
		oneLiner: "Pro cycling rankings from scraped race history.",
		description: "Rankings for pro cyclists, built from scraped race results.",
		stack: ["TanStack Start", "D1", "R2", "Playwright"],
		href: "https://velorank.ethanmpotts.workers.dev",
		color: "#ffd400",
		featured: true,
	},
	{
		slug: "pottsshotts",
		name: "PottsShotts",
		kind: "app",
		year: "2026",
		oneLiner: "The platform behind my photography business.",
		description: "Galleries, events and booking for my photography business.",
		stack: ["TanStack Start", "D1", "Better Auth", "Passkeys"],
		href: "https://pottsshotts.com",
		color: "#ff8fb1",
		featured: true,
	},
	{
		slug: "cullmonster",
		name: "CullMonster",
		kind: "app",
		year: "2026",
		oneLiner: "Fast, keyboard-first photo culling for macOS.",
		description: "Ingest a card, cull with the keyboard, tag and deliver. Works on plain folders with no catalog. SwiftUI app with a Rust backend.",
		stack: ["SwiftUI", "Rust", "macOS"],
		href: "https://cullmonster.ethanmpotts.workers.dev",
		color: "#9b5cff",
	},
	{
		slug: "agent-box",
		name: "Agent Box",
		kind: "tool",
		year: "2026",
		oneLiner: "An old laptop that runs my AI agents around the clock.",
		description: "Ubuntu on a spare laptop. T3 Code runs coding agents and scheduled jobs, and I reach it over SSH through a Cloudflare Tunnel.",
		stack: ["Ubuntu", "T3 Code", "Cloudflare Tunnel"],
		href: "/blog/Linux-Agent-Box",
		color: "#4a4a4a",
	},
	{
		slug: "om-mcp",
		name: "OpenMarch MCP",
		kind: "tool",
		year: "2026",
		oneLiner: "Let an AI agent write marching drill.",
		description: "A fork of OpenMarch that lets an AI agent write drill.",
		stack: ["MCP", "Electron", "TypeScript"],
		color: "#3d7bff",
	},
	{
		slug: "smugmug-sdk",
		name: "SmugMug SDK",
		kind: "library",
		year: "2026",
		oneLiner: "Type-safe TypeScript SDK for SmugMug API v2.",
		description: "A typed TypeScript client for the SmugMug API.",
		stack: ["TypeScript", "Codegen"],
		color: "#9ad62a",
	},
	{
		slug: "every-catan-board",
		name: "Every Catan Board",
		kind: "tool",
		year: "2026",
		oneLiner: "Browse every possible Catan board, deterministically.",
		description: "Every possible Catan board, each with its own address.",
		stack: ["JavaScript", "Combinatorics"],
		repo: "https://github.com/empotts/every-catan-board",
		href: "https://every-catan-board.ethanmpotts.workers.dev",
		color: "#d9822b",
	},
	{
		slug: "safety-car",
		name: "safety-car",
		kind: "starter",
		year: "2026",
		oneLiner: "Private-app starter with passkeys and owner approval.",
		description: "A starter for private apps with passkeys and owner approval.",
		stack: ["TanStack Start", "D1", "Better Auth"],
		repo: "https://github.com/empotts/safety-car",
		color: "#ff5a5a",
	},
];

/**
 * Projects with something public to show: a live site or a public repo.
 * Private repos are never linked; private projects without a site are hidden.
 */
export const publicProjects = projects.filter((p) => p.href || p.repo);

export const skills = {
	daily: ["TypeScript", "React", "TanStack Start", "Temporal", "PostgreSQL", "RabbitMQ"],
	infra: ["AWS", "Amazon Bedrock", "Kubernetes", "OpenTelemetry", "Cloudflare Workers", "Durable Objects"],
	also: ["Python", "C++", "Swift", "MATLAB", "R", "Three.js"],
};

export const currently = [
	{ label: "Building", value: "AI dispute workflows" },
	{ label: "Learning", value: "AI engineering" },
	{ label: "Photographing", value: "Razorback game days" },
];

export const funFacts = [
	"Studied biomedical engineering.",
	"Photographs marching bands.",
	"Watches every Grand Tour stage.",
];
