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
	tagline:
		"I build revenue recovery software at SPS Commerce, turning messy retailer data into workflows that get suppliers paid. Off the clock: marching band photos, side projects on Cloudflare, and too much pro cycling.",
	shortBio: [
		"I'm a software engineer at SPS Commerce, where I build revenue recovery applications that help teams turn complex retailer data into actionable workflows: ingestion, dispute submission, repayment tracking, onboarding.",
		"My work spans full-stack development, data pipelines, integrations and automation. I like understanding a problem, building a practical solution, and making it reliable and easy to use. Lately that means AI workflows, and I'm sharpening that through the MEGA.dev AI Engineering course.",
		"Before software I did biomedical engineering research: cardiovascular imaging in one lab, gene editing in another. That plus photography shaped how I work: stay curious, work carefully with evidence, and communicate clearly.",
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
		role: "Software Engineer · Revenue Recovery",
		start: "Mar 2026",
		end: "Now",
		place: "Rogers, AR · Hybrid",
		blurb:
			"Revenue recovery workflows for multiple retailers, from data ingestion and dispute submission to repayment tracking and onboarding.",
		bullets: [
			"Built a shared AI workflow on Amazon Bedrock that analyzes retailer dispute responses, matching them to disputes before model analysis and routing unmatched responses to review.",
			"Built a hermetic end-to-end suite covering 32 production-boundary contracts across the web app, worker, queue processor and gateway.",
			"Retailer integrations and automated workflows with TypeScript, Temporal, PostgreSQL, RabbitMQ and AWS on Kubernetes.",
			"Reliability via idempotent submission checks, OpenTelemetry tracing, CI, mutation testing and incident analysis.",
		],
		tags: ["TypeScript", "Temporal", "Bedrock", "Postgres", "RabbitMQ", "K8s"],
	},
	{
		org: "SPS Commerce",
		role: "Associate Software Engineer",
		start: "Dec 2024",
		end: "Mar 2026",
		place: "Rogers, AR",
		blurb:
			"Helped build Navigator, the multi-retailer app that lets the revenue recovery product add new retailers.",
		bullets: [
			"Stood up Navigator on TanStack Start with search, filtering and streaming exports.",
			"Dispute submission and repayment workflows on Temporal + Mailgun, including inbound email and attachments.",
			"Built a RabbitMQ → Temporal queue processor for Core events and automated onboarding.",
			"Automated disputing with readiness checks, supplier settings, daily limits and post-refresh execution.",
		],
		tags: ["TanStack Start", "Temporal", "Mailgun", "Prisma"],
	},
	{
		org: "SupplyPike",
		role: "Intern → Software Engineer I",
		start: "May 2024",
		end: "Jan 2025",
		place: "Rogers, AR",
		blurb:
			"Joined as an intern, stayed through the SPS Commerce acquisition. Laid the foundation for the Walgreens app and shipped CVS features.",
		bullets: [
			"Cut a payment sync step from 30+ minutes to a couple of minutes by threading a document ID through the workflow.",
			"Built the Walgreens pipeline: ingest retailer files to S3, transform into deductions, detect duplicates and changes.",
			"Helped split a single-retailer codebase into shared + retailer-specific packages with separate deployments.",
			"CVS dashboards, exports, archiving, bulk disputes, redisputes and payment reconciliation.",
		],
		tags: ["React", "PostgreSQL", "AWS S3", "Monorepo"],
	},
	{
		org: "University of Arkansas Bands",
		role: "Social Media Manager",
		start: "Jan 2024",
		end: "Now",
		place: "Fayetteville, AR",
		blurb:
			"Photo + video for the Razorback Marching Band, Hogwild Basketball Band and UA Concert Bands.",
		bullets: [
			"2M+ Instagram impressions and 15% follower growth during the 2025 marching season.",
			"Half of the media team behind the RMB's 2027 Macy's Thanksgiving Day Parade selection announcement.",
		],
		tags: ["Photo", "Video", "Strategy"],
	},
	{
		org: "PottsShotts Photography",
		role: "Owner",
		start: "Apr 2023",
		end: "Now",
		place: "Rogers, AR",
		blurb:
			"Sports and marching arts photography across Arkansas and beyond: AMAA and WGI events, plus a stint as intern photographer for the Winston-Salem Dash (MiLB).",
		bullets: [
			"One of Arkansas' leading marching arts photography providers.",
			"Runs on software I built: galleries, events and a type-safe SmugMug SDK.",
		],
		tags: ["Canon", "Lightroom", "Premiere"],
	},
	{
		org: "Cardiovascular Biomechanics Lab",
		role: "Undergraduate Research Assistant",
		start: "Jan 2021",
		end: "Jan 2024",
		place: "Fayetteville, AR",
		blurb:
			"Dr. Morten Jensen's lab: cardiovascular imaging and signal processing.",
		bullets: [
			"Left ventricle flow: Blood Speckle Imaging of hemodynamics in children with congenital heart defects. Gel phantoms, ultrasound, MATLAB.",
			"Peripheral venous pressure: predicting hemorrhage blood loss from heart signals.",
			"Helped write and edit multiple manuscripts for submission.",
		],
		tags: ["MATLAB", "Ultrasound", "Signals"],
	},
];

export const education = {
	school: "University of Arkansas",
	degree: "B.S. Biomedical Engineering",
	minor: "Minor in Computer Science",
	years: "2020 – 2024",
	year: "2024",
	honors: "Summa Cum Laude · First Ranked Senior Scholar",
	thesis:
		"Honors thesis: Transcriptomic Profiling of Engineered Human Gene Integration in the Mouse Genome Following In Vitro Gene Editing (Dr. Christopher Nelson).",
	activities: [
		"President, Kappa Kappa Psi — Lambda Chapter",
		"Section Leader, Razorback Marching Band",
		"Tau Beta Pi",
		"McMillon Innovation Studio project lead",
	],
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
	daily: ["TypeScript", "React", "TanStack Start", "Temporal", "PostgreSQL", "RabbitMQ"],
	infra: ["AWS", "Amazon Bedrock", "Kubernetes", "OpenTelemetry", "Cloudflare Workers", "Durable Objects"],
	also: ["Python", "C++", "Swift", "MATLAB", "R", "Three.js"],
};

export const currently = [
	{ label: "Building", value: "AI dispute workflows" },
	{ label: "Learning", value: "MEGA.dev AI Engineering" },
	{ label: "Shooting", value: "Razorback game days" },
	{ label: "Playing", value: "Hollow Knight: Silksong" },
	{ label: "Watching", value: "every Grand Tour stage" },
	{ label: "Riding", value: "the Razorback Greenway" },
];

export const funFacts = [
	"Went from ultrasound phantoms to Temporal workflows.",
	"Half of the media team behind the RMB's Macy's Parade application content.",
	"Owns more lenses than is reasonable.",
	"Used to play trumpet; now just photographs the people who do.",
	"Has opinions about Tour de France stage profiles.",
	"Will build a side project instead of using the existing app.",
];
