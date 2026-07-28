import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { markdownToHtml } from "@/lib/markdown";

const modules: Record<string, () => Promise<string>> = import.meta.glob<string>(
	"./*.md",
	{
		import: "default",
		query: "?raw",
	},
);

const posts = await Promise.all(
	Object.entries(modules).map(async ([filename, module]) =>
		markdownToHtml(await module(), filename),
	),
);

export interface PostSummary {
	data: Record<string, string>;
	css: string;
	html: string;
	slug: string;
}

export const getPosts = createServerFn().handler((): PostSummary[] =>
	posts.map((post) => ({
		data: post.data,
		css: post.css,
		html: post.excerptHtml,
		slug: post.slug,
	})),
);

export const getPost = createServerFn()
	.validator((slug: string) => slug)
	.handler(({ data: slug }) => {
		const post = posts.find((candidate) => candidate.slug === slug);
		if (!post) throw notFound();

		return {
			data: post.data,
			css: post.css,
			html: post.html,
			slug: post.slug,
		};
	});
