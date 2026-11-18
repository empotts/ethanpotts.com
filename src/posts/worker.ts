import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { PostMeta } from "@/lib/markdown";
import { posts } from "./content";

export interface PostSummary {
	data: PostMeta;
	css: string;
	html: string;
	slug: string;
	/** `mdx` posts render their own React body; `md` posts ship HTML. */
	kind: "md" | "mdx";
}

export const getPosts = createServerFn().handler((): PostSummary[] =>
	posts.map((post) => ({
		data: post.data,
		css: post.css,
		html: post.excerptHtml,
		slug: post.slug,
		kind: post.kind,
	})),
);

export const getPost = createServerFn()
	.validator((slug: string) => slug)
	.handler(({ data: slug }): PostSummary => {
		const post = posts.find((candidate) => candidate.slug === slug);
		if (!post) throw notFound();

		return {
			data: post.data,
			css: post.css,
			html: post.html,
			slug: post.slug,
			kind: post.kind,
		};
	});
