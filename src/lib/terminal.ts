/**
 * Server-only: the site for terminals. `curl ethanpotts.com` (or any page path)
 * prints that page as styled text, built from the same markdown agents get.
 *
 * One-bit like the desktop: bold, dim and underline only, no colors. Wrapped to
 * 80 columns. `?color=0` turns styling off.
 */
import { profile } from "@/data/profile";
import { blogPageCount, blogPagePosts, pageMarkdown } from "@/lib/agents";
import { formatDay } from "@/lib/dates";

const WIDTH = 80;
const ESC = "\x1b[";

type Style = { bold: string; dim: string; under: string; italic: string; reset: string };
const ON: Style = { bold: `${ESC}1m`, dim: `${ESC}2m`, under: `${ESC}4m`, italic: `${ESC}3m`, reset: `${ESC}0m` };
const OFF: Style = { bold: "", dim: "", under: "", italic: "", reset: "" };

/** Visible width of a string that may hold ANSI codes. */
const visible = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "").length;

/** Greedy word wrap that ignores ANSI codes when measuring. */
function wrap(text: string, width: number, indent = "", hanging = indent) {
	const words = text.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let line = indent;
	let lineHasWord = false;
	for (const word of words) {
		if (lineHasWord && visible(line) + 1 + visible(word) > width) {
			lines.push(line);
			line = hanging + word;
		} else {
			line += (lineHasWord ? " " : "") + word;
		}
		lineHasWord = true;
	}
	if (lineHasWord) lines.push(line);
	return lines;
}

/** Inline markdown: **bold**, `code`, [text](url). Links keep their URL, dimmed. */
function inline(text: string, s: Style) {
	return text
		.replace(/\*\*(.+?)\*\*/g, `${s.bold}$1${s.reset}`)
		.replace(/`([^`]+)`/g, `${s.bold}$1${s.reset}`)
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, url: string) =>
			label === url ? `${s.under}${url}${s.reset}` : `${s.under}${label}${s.reset} ${s.dim}${url.replace(/^https?:\/\//, "")}${s.reset}`,
		);
}

/** Small block-level markdown renderer, enough for this site's pages and posts. */
export function renderMarkdown(markdown: string, s: Style) {
	const out: string[] = [];
	const lines = markdown.replace(/^---\n[\s\S]*?\n---\n/, "").split("\n");
	let paragraph: string[] = [];
	let inCode = false;

	const flush = () => {
		if (!paragraph.length) return;
		out.push(...wrap(inline(paragraph.join(" "), s), WIDTH, "  "), "");
		paragraph = [];
	};

	for (const raw of lines) {
		if (raw.startsWith("```")) {
			flush();
			inCode = !inCode;
			if (!inCode) out.push("");
			continue;
		}
		if (inCode) {
			out.push(`${s.dim}    ${raw}${s.reset}`);
			continue;
		}
		const line = raw.trimEnd();
		if (!line.trim()) {
			flush();
			continue;
		}
		const heading = line.match(/^(#{1,4})\s+(.*)$/);
		if (heading) {
			flush();
			if (out.length && out[out.length - 1] !== "") out.push("");
			const [, hashes, title] = heading;
			if (hashes.length === 1) out.push(`  ${s.bold}${s.under}${title}${s.reset}`, "");
			else if (hashes.length === 2) out.push(`  ${s.bold}${title.toUpperCase()}${s.reset}`, `  ${s.dim}${"─".repeat(Math.min(title.length, WIDTH - 4))}${s.reset}`, "");
			else out.push(`  ${s.bold}${title}${s.reset}`);
			continue;
		}
		const quote = line.match(/^>\s?(.*)$/);
		if (quote) {
			flush();
			out.push(...wrap(`${s.italic}${inline(quote[1], s)}${s.reset}`, WIDTH, "  "), "");
			continue;
		}
		const bullet = line.match(/^\s*[-*]\s+(.*)$/);
		if (bullet) {
			flush();
			out.push(...wrap(inline(bullet[1], s), WIDTH, "  • ", "    "));
			continue;
		}
		const numbered = line.match(/^\s*(\d+)\.\s+(.*)$/);
		if (numbered) {
			flush();
			out.push(...wrap(inline(numbered[2], s), WIDTH, `  ${numbered[1]}. `, "     "));
			continue;
		}
		paragraph.push(line.trim());
	}
	flush();
	// Collapse runs of blank lines left by mixed blocks.
	return out.join("\n").replace(/\n{3,}/g, "\n\n");
}

const LOGO = [" ███████ ██████ ", " ██      ██   ██", " █████   ██████ ", " ██      ██     ", " ███████ ██     "];

function banner(s: Style) {
	const left = `  ${LOGO[0]}   `;
	const right = [
		`${s.bold}${profile.name}${s.reset}`,
		`${profile.role} · ${profile.company}`,
		profile.location,
		"",
		...wrap(profile.intro, WIDTH - visible(left)).map((l) => `${s.dim}${l}${s.reset}`),
	];
	const rows = Math.max(LOGO.length, right.length);
	return Array.from({ length: rows }, (_, i) => `  ${LOGO[i] ?? " ".repeat(LOGO[0].length)}   ${right[i] ?? ""}`.trimEnd()).join("\n");
}

function footer(pathname: string, s: Style) {
	const pages: [string, string][] = [
		["About", "/"],
		["Projects", "/projects"],
		["Work", "/resume"],
		["Writing", "/blog"],
	];
	const nav = pages
		.filter(([, path]) => path !== pathname)
		.map(([label, path]) => `  ${label.padEnd(10)}${s.dim}curl ethanpotts.com${path === "/" ? "" : path}${s.reset}`);
	return [`  ${s.dim}${"─".repeat(WIDTH - 4)}${s.reset}`, ...nav, "", `  ${s.dim}Browser: https://ethanpotts.com${pathname === "/" ? "" : pathname}${s.reset}`].join("\n");
}

/** The writing list for terminals: each post with the command that prints it. */
function blogList(page: number, s: Style) {
	const pages = blogPageCount();
	if (page < 1 || page > pages) return null;
	const out = [`  ${s.bold}${s.under}Writing${s.reset}`, ""];
	if (pages > 1) out.push(`  ${s.dim}Page ${page} of ${pages}${s.reset}`, "");
	for (const post of blogPagePosts(page)) {
		const { data } = post;
		const meta = [data.date && formatDay(data.date), `${data.minutes} min read`].filter(Boolean).join(" · ");
		out.push(`  ${s.bold}${data.title}${s.reset}`, `  ${s.dim}${meta}${s.reset}`);
		if (data.description) out.push(...wrap(data.description, WIDTH, "  "));
		out.push(`  ${s.dim}$ curl ethanpotts.com/blog/${post.slug}${s.reset}`, "");
	}
	if (page > 1) out.push(`  Newer     ${s.dim}curl ethanpotts.com/blog${page === 2 ? "" : `?page=${page - 1}`}${s.reset}`);
	if (page < pages) out.push(`  Older     ${s.dim}curl "ethanpotts.com/blog?page=${page + 1}"${s.reset}`);
	return out.join("\n").trimEnd();
}

/** True for command-line HTTP clients that would print raw HTML otherwise. */
export function isTerminalClient(request: Request) {
	const ua = request.headers.get("user-agent") ?? "";
	const accept = request.headers.get("accept") ?? "";
	if (/text\/html/i.test(accept)) return false;
	return /^(curl|Wget|HTTPie|xh|PowerShell)\b/i.test(ua) || /Windows PowerShell/i.test(ua);
}

/** The page at `pathname` as terminal text, or null when the page has no text view. */
export function terminalPage(pathname: string, color: boolean, page = 1) {
	const path = pathname.replace(/\/+$/, "") || "/";
	if (path === "/blog") {
		const s = color ? ON : OFF;
		const list = blogList(page, s);
		return list && `\n${list}\n\n${footer(path, s)}\n\n`;
	}
	const markdown = pageMarkdown(path);
	if (!markdown) return null;
	const s = color ? ON : OFF;
	// On the home page the banner has the title and intro, and the footer lists the pages.
	const body = path === "/" ? markdown.replace(/^# .*\n+(> .*\n+)?/, "").replace(/## Pages\n[\s\S]*?(?=\n## )/, "") : markdown;
	const top = path === "/" ? `\n${banner(s)}\n\n` : "\n";
	return `${top}${renderMarkdown(body, s)}\n\n${footer(path, s)}\n\n`;
}
