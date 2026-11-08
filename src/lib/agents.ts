/**
 * Server-only: machine-readable views of the site for crawlers and AI agents.
 *
 * - `Accept: text/markdown` on any page returns that page as markdown.
 * - /sitemap.xml and /llms.txt are generated from the same data as the desktop.
 * - HTML pages carry a `Link` header pointing at those resources.
 *
 * Cloudflare's own Markdown for Agents does the markdown part at the edge, but it
 * needs a Pro zone; this keeps it working on the Free plan and reads cleaner than
 * a conversion of the desktop's HTML would.
 */
import { awards, currently, education, experience, profile, publicProjects, skills } from "@/data/profile";
import { formatDay } from "@/lib/dates";
import { SITE_URL } from "@/lib/seo";
import { posts } from "@/posts/content";

const abs = (path: string) => new URL(path, SITE_URL).toString();

function home() {
	return [
		`# ${profile.name}`,
		"",
		`> ${profile.intro}`,
		"",
		profile.shortBio.join("\n\n"),
		"",
		...currently.map((c) => `- ${c.label}: ${c.value}`),
		"",
		"## Pages",
		"",
		`- [Projects](${abs("/projects")}): things I've built`,
		`- [Work](${abs("/resume")}): experience, education and awards`,
		`- [Writing](${abs("/blog")}): posts`,
		"",
		"## Contact",
		"",
		`- Email: ${profile.email}`,
		`- GitHub: ${profile.github}`,
		`- LinkedIn: ${profile.linkedin}`,
		`- Location: ${profile.location}`,
	].join("\n");
}

function projectsPage() {
	return [
		"# Projects",
		"",
		...publicProjects.flatMap((p) => [
			`## ${p.name} (${p.year})`,
			"",
			p.description,
			"",
			`- Stack: ${p.stack.join(", ")}`,
			...(p.href ? [`- Site: ${abs(p.href)}`] : []),
			...(p.repo ? [`- Source: ${p.repo}`] : []),
			"",
		]),
	].join("\n");
}

function workPage() {
	return [
		`# Work: ${profile.name}`,
		"",
		`${profile.role}, ${profile.team} at ${profile.company}. ${profile.location}.`,
		"",
		"## Experience",
		"",
		...experience.flatMap((e) => [
			`### ${e.role}, ${e.org}`,
			"",
			`${e.start} – ${e.end === "Now" ? "Present" : e.end} · ${e.place}`,
			"",
			...e.bullets.map((b) => `- ${b}`),
			"",
		]),
		"## Education",
		"",
		`### ${education.degree}, ${education.minor}`,
		"",
		`${education.school}, ${education.years} · ${education.honors}`,
		"",
		`- ${education.thesis}`,
		`- ${education.grad}`,
		...education.activities.map((a) => `- ${a}`),
		"",
		"## Skills",
		"",
		`- Daily: ${skills.daily.join(", ")}`,
		`- Infrastructure: ${skills.infra.join(", ")}`,
		`- Also: ${skills.also.join(", ")}`,
		"",
		"## Honors and awards",
		"",
		...awards.map((a) => `- ${a.name}, ${a.from} (${a.year}). ${a.note}`),
	].join("\n");
}

function postLine(p: (typeof posts)[number]) {
	const date = p.data.date ? ` (${formatDay(p.data.date)})` : "";
	return `- [${p.data.title}](${abs(`/blog/${p.slug}`)})${date}${p.data.description ? `: ${p.data.description}` : ""}`;
}

/** Posts per page in the markdown and terminal views of /blog. */
export const POSTS_PER_PAGE = 10;
export const blogPageCount = () => Math.max(1, Math.ceil(posts.length / POSTS_PER_PAGE));
export const blogPagePosts = (page: number) => posts.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

function blogIndex(page: number) {
	const pages = blogPageCount();
	if (page < 1 || page > pages) return null;
	const nav = [
		...(page > 1 ? [`- Newer: ${abs(page === 2 ? "/blog" : `/blog?page=${page - 1}`)}`] : []),
		...(page < pages ? [`- Older: ${abs(`/blog?page=${page + 1}`)}`] : []),
	];
	return [
		"# Writing",
		"",
		...(pages > 1 ? [`Page ${page} of ${pages}`, ""] : []),
		...blogPagePosts(page).map(postLine),
		...(nav.length ? ["", ...nav] : []),
	].join("\n");
}

function postPage(slug: string) {
	const post = posts.find((p) => p.slug === slug);
	if (!post) return null;
	const { data } = post;
	const front = [
		"---",
		`title: ${JSON.stringify(data.title)}`,
		...(data.description ? [`description: ${JSON.stringify(data.description)}`] : []),
		`author: ${JSON.stringify(data.author)}`,
		...(data.date ? [`date: ${data.date}`] : []),
		...(data.updated ? [`updated: ${data.updated}`] : []),
		...(data.tags.length ? [`tags: [${data.tags.map((t) => JSON.stringify(t)).join(", ")}]`] : []),
		`url: ${abs(`/blog/${slug}`)}`,
		"---",
	];
	return [...front, "", `# ${data.title}`, "", post.markdown].join("\n");
}

/** Markdown for a page path, or null when the path has no markdown view. */
export function pageMarkdown(pathname: string, page = 1): string | null {
	const path = pathname.replace(/\/+$/, "") || "/";
	if (path === "/") return home();
	if (path === "/projects") return projectsPage();
	if (path === "/resume") return workPage();
	if (path === "/blog") return blogIndex(page);
	const post = path.match(/^\/blog\/([^/]+)$/);
	if (post) return postPage(decodeURIComponent(post[1]));
	return null;
}

/** https://llmstxt.org */
function llmsTxt() {
	return [
		`# ${profile.name}`,
		"",
		`> ${profile.intro}`,
		"",
		"Every page below is also available as markdown: request it with `Accept: text/markdown`.",
		"",
		"## Pages",
		"",
		`- [About](${abs("/")}): who I am and how to reach me`,
		`- [Projects](${abs("/projects")}): apps, games and tools I've built`,
		`- [Work](${abs("/resume")}): experience, education, skills and awards`,
		`- [Writing](${abs("/blog")}): index of posts`,
		"",
		"## Posts",
		"",
		...posts.map(postLine),
	].join("\n");
}

function sitemap() {
	const latest = posts.map((p) => p.data.updated ?? p.data.date).filter(Boolean).sort().at(-1);
	const urls: { loc: string; lastmod?: string }[] = [
		{ loc: abs("/") },
		{ loc: abs("/projects") },
		{ loc: abs("/resume") },
		{ loc: abs("/blog"), lastmod: latest },
		...posts.map((p) => ({ loc: abs(`/blog/${p.slug}`), lastmod: p.data.updated ?? p.data.date })),
	];
	const body = urls
		.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ""}</url>`)
		.join("\n");
	return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

const CACHE = "public, max-age=300";

function markdownResponse(markdown: string, method: string) {
	return new Response(method === "HEAD" ? null : markdown, {
		headers: {
			"content-type": "text/markdown; charset=utf-8",
			// Rough count, the same ~4 characters per token Cloudflare's header estimates.
			"x-markdown-tokens": String(Math.ceil(markdown.length / 4)),
			vary: "Accept",
			"cache-control": CACHE,
		},
	});
}

/** `?page=N` as a whole number, defaulting to 1. */
export function pageParam(request: Request) {
	const n = Number(new URL(request.url).searchParams.get("page") ?? "1");
	return Number.isInteger(n) ? n : 0;
}

/** True when the client prefers markdown over HTML. */
export function wantsMarkdown(request: Request) {
	const accept = request.headers.get("accept") ?? "";
	return /\btext\/markdown\b/i.test(accept);
}

/** Responses for agent-facing URLs, or null to let the app handle the request. */
export function agentResponse(request: Request): Response | null {
	if (request.method !== "GET" && request.method !== "HEAD") return null;
	const { pathname } = new URL(request.url);

	if (pathname === "/sitemap.xml") {
		return new Response(request.method === "HEAD" ? null : sitemap(), {
			headers: { "content-type": "application/xml; charset=utf-8", "cache-control": CACHE },
		});
	}
	if (pathname === "/llms.txt") {
		return new Response(request.method === "HEAD" ? null : llmsTxt(), {
			headers: { "content-type": "text/plain; charset=utf-8", "cache-control": CACHE },
		});
	}
	if (wantsMarkdown(request)) {
		const markdown = pageMarkdown(pathname, pageParam(request));
		if (markdown) return markdownResponse(markdown, request.method);
	}
	return null;
}

/** Link header (RFC 8288) for HTML pages: the llms.txt index, the sitemap and the page's markdown twin. */
export function linkHeader(pathname: string) {
	const links = [`</llms.txt>; rel="describedby"; type="text/plain"`, `</sitemap.xml>; rel="sitemap"; type="application/xml"`];
	if (pageMarkdown(pathname)) links.push(`<${pathname}>; rel="alternate"; type="text/markdown"`);
	return links.join(", ");
}
