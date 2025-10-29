import { transformerStyleToClass } from "@shikijs/transformers";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";
import remarkFrontmatter from "remark-frontmatter";
import remarkParse from "remark-parse";
import remarkParseFrontmatter from "remark-parse-frontmatter";
import remarkRehype from "remark-rehype";
import { createHighlighter } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { unified } from "unified";

const EXCERPT_BOUNDARY = "<!-- excerpt -->";

function process(
	value: string,
	filename: string,
	initialData?: Record<string, unknown>,
) {
	const extractCss = transformerStyleToClass();
	return unified()
		.use(remarkFrontmatter)
		.use(remarkParseFrontmatter)
		.use(remarkParse)
		.use(remarkRehype)
		.use(rehypePrettyCode, {
			getHighlighter: (options) =>
				createHighlighter({
					...options,
					engine: createJavaScriptRegexEngine(),
				}),
			grid: true,
			theme: "dracula",
			transformers: [extractCss],
		})
		.use(rehypeStringify)
		.process({
			data: { ...initialData, css: extractCss },
			path: filename,
			value,
		});
}

export async function markdownToHtml(value: string, filename: string) {
	const excerptBoundaryIndex = value.indexOf(EXCERPT_BOUNDARY);
	const excerpt =
		excerptBoundaryIndex === -1
			? value
			: value.substring(0, excerptBoundaryIndex);
	return process(value, filename, {
		excerpt: await process(excerpt, filename),
	});
}
