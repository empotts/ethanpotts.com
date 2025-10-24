import { markdownToHtml } from "@/lib/markdown";
import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";

// Import the raw text content for all posts.
const modules = import.meta.glob<string>("./*.md", {
	import: "default",
	query: "?raw",
});

// For each module, we need to parse the post.
const posts = await Promise.all(
	Object.entries(modules).map(async ([filename, module]) => {
		const value = await module(); // Raw text content as string.
		return markdownToHtml(value, filename);
	}),
);

export const getPosts = createServerFn().handler(() => {
	return posts.map((post) => ({
		data: post.data.frontmatter,
		css: post.data.excerpt?.data.css?.getCSS() ?? "",
		html: String(post.data.excerpt),
		slug: post.stem,
	}));
});

export const getPost = createServerFn()
	.inputValidator((slug: string) => {
		const post = posts.find((post) => post.stem === slug);
		if (!post) {
			throw notFound();
		}
		return post;
	})
	.handler(({ data: post }) => {
		return {
			data: post.data.frontmatter,
			css: post.data.css?.getCSS() ?? "",
			html: String(post),
			slug: post.stem,
		};
	});
