import { createHighlighter } from "@tanstack/highlight/core";
import { css } from "@tanstack/highlight/languages/css";
import { html } from "@tanstack/highlight/languages/html";
import { js } from "@tanstack/highlight/languages/js";
import { json } from "@tanstack/highlight/languages/json";
import { markdown } from "@tanstack/highlight/languages/markdown";
import { shell } from "@tanstack/highlight/languages/shell";
import { ts } from "@tanstack/highlight/languages/ts";
import { tsx } from "@tanstack/highlight/languages/tsx";
import { createTanStackMarkdownHighlighter } from "@tanstack/highlight/markdown";
import { createThemeCss } from "@tanstack/highlight/theme";
import { draculaTheme } from "@tanstack/highlight/themes/dracula";
import { githubLightTheme } from "@tanstack/highlight/themes/github-light";
import { renderHtml } from "@tanstack/markdown/html";
import { parseMarkdown } from "@tanstack/markdown/parser";
import { parse as parseYaml } from "yaml";

const EXCERPT_BOUNDARY = "<!-- excerpt -->";

const highlighter = createHighlighter({
	languages: [css, html, js, json, markdown, shell, ts, tsx],
});

const highlightCode = createTanStackMarkdownHighlighter(highlighter);

export const markdownThemeCss = createThemeCss({
	light: githubLightTheme,
	dark: draculaTheme,
	darkSelector: ".dark",
	codeBlockSelector: "pre.tm-code",
	lineNumbersSelector: ".tm-code--line-numbers",
});

function render(value: string) {
	return renderHtml(parseMarkdown(value), {
		highlighter: highlightCode,
	});
}

export function markdownToHtml(value: string, filename: string) {
	const document = parseMarkdown(value);
	const excerptBoundaryIndex = value.indexOf(EXCERPT_BOUNDARY);
	const excerpt =
		excerptBoundaryIndex === -1
			? value
			: value.substring(0, excerptBoundaryIndex);

	return {
		data: document.frontmatter
			? (parseYaml(document.frontmatter) as Record<string, string>)
			: {},
		css: markdownThemeCss,
		html: renderHtml(document, { highlighter: highlightCode }),
		excerptHtml: render(excerpt),
		slug: filename.split("/").pop()?.replace(/\.md$/, "") ?? filename,
	};
}
