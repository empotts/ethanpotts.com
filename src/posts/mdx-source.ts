import { parse as parseYaml } from "yaml";
import { markdownThemeCss, readMeta, render } from "@/lib/markdown";
import { SITE_URL } from "@/lib/seo";

/**
 * Server-only: reads an .mdx post's front matter and turns its body into plain
 * markdown for agents, the terminal view and reading-time counts. Components
 * become their closest markdown (an image, a link, a bold title) or drop out.
 */

const EXCERPT = "<!-- excerpt -->";
const abs = (u: string) => (/^https?:/.test(u) ? u : new URL(u, SITE_URL).toString());

type Props = Record<string, string>;
function readProps(src: string): Props {
	const out: Props = {};
	for (const m of src.matchAll(/([a-zA-Z][\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\}|\{([^}]*)\}))?/g))
		out[m[1]] = m[2] ?? m[3] ?? m[4] ?? m[5] ?? "true";
	return out;
}

/** Markdown for a self-closing component. */
function selfClosing(name: string, p: Props) {
	switch (name) {
		case "Figure":
			return `![${p.alt ?? ""}](${abs(p.src ?? "")})${p.caption ? `\n\n*${p.caption}*` : ""}`;
		case "Compare":
			return `![Before: ${p.alt ?? ""}](${abs(p.before ?? "")})\n\n![After: ${p.alt ?? ""}](${abs(p.after ?? "")})`;
		case "App":
			return `[Interactive: ${p.title ?? p.id ?? "app"}](${abs(`/apps/${p.id ?? ""}`)})`;
		default:
			return "";
	}
}
/** Markdown for the opening tag of a component with children; the children stay as written. */
function opening(name: string, p: Props) {
	if (name === "Step" && p.src) return `![${p.alt ?? ""}](${abs(p.src)})\n\n`;
	if ((name === "Callout" || name === "Window") && p.title) return `**${p.title}**\n\n`;
	return "";
}

export function mdxToMarkdown(body: string) {
	// Leave code (fenced and inline) alone; transform only the prose between.
	return body
		.split(/(^```[\s\S]*?^```|`[^`\n]+`)/m)
		.map((part, i) => {
			if (i % 2) return part;
			return part
				.replace(/^import\s[\s\S]*?from\s+["'][^"']+["'];?[ \t]*$/gm, "")
				.replace(/^export\s.*$/gm, "")
				.replace(/\{\/\*\s*excerpt\s*\*\/\}/g, EXCERPT)
				.replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
				.replace(/<([A-Z][\w.]*)((?:\s+[a-zA-Z][\w-]*(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*)\s*\/>/g, (_, n: string, p: string) => selfClosing(n, readProps(p)))
				.replace(/<([A-Z][\w.]*)((?:\s+[a-zA-Z][\w-]*(?:=(?:"[^"]*"|'[^']*'|\{[^}]*\}))?)*)\s*>/g, (_, n: string, p: string) => opening(n, readProps(p)))
				.replace(/<\/[A-Z][\w.]*>/g, "")
				// Component children are indented in the source; markdown would read that as code.
				.replace(/\n[ \t]+/g, "\n");
		})
		.join("")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

export function mdxToPost(source: string, filename: string) {
	const slug = filename.split("/").pop()?.replace(/\.mdx$/, "") ?? filename;
	const fm = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	const raw = fm ? ((parseYaml(fm[1]) ?? {}) as Record<string, unknown>) : {};
	const full = mdxToMarkdown(fm ? source.slice(fm[0].length) : source);
	const cut = full.indexOf(EXCERPT);
	const markdown = full.replace(EXCERPT, "").trim();
	return {
		data: readMeta(raw, markdown, slug),
		markdown,
		css: markdownThemeCss,
		html: "",
		excerptHtml: render(cut === -1 ? markdown : full.slice(0, cut)),
		slug,
		kind: "mdx" as const,
	};
}
