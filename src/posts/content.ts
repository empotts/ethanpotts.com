import { markdownToHtml } from "@/lib/markdown";

/** Server-only: every post, parsed once at startup. */
const modules: Record<string, () => Promise<string>> = import.meta.glob<string>("./*.md", {
	import: "default",
	query: "?raw",
});

// Newest first; undated posts go last.
export const posts = (
	await Promise.all(Object.entries(modules).map(async ([filename, module]) => markdownToHtml(await module(), filename)))
).sort((a, b) => (b.data.date ?? "").localeCompare(a.data.date ?? ""));
