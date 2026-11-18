import { markdownToHtml } from "@/lib/markdown";
import { mdxToPost } from "./mdx-source";

/**
 * Server-only: every post, parsed once at startup. Posts are `.md` (rendered to
 * HTML here) or `.mdx` (rendered as React on the page; read here for metadata
 * and a markdown version).
 */
const md = import.meta.glob<string>("./*.md", { import: "default", query: "?raw" });
const mdx = import.meta.glob<string>("./*.mdx", { import: "default", query: "?raw" });

// Newest first; undated posts go last. Drafts only where drafts are shown.
export const posts = (
	await Promise.all([
		...Object.entries(md).map(async ([filename, load]) => markdownToHtml(await load(), filename)),
		...Object.entries(mdx).map(async ([filename, load]) => mdxToPost(await load(), filename)),
	])
)
	.filter((p) => __SHOW_DRAFTS__ || !p.data.draft)
	.sort((a, b) => (b.data.date ?? "").localeCompare(a.data.date ?? ""));
