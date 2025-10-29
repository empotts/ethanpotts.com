import { markdownToHtml } from "@/lib/markdown";
import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";

// Import the raw text content for all posts.
const modules: Record<string, () => Promise<string>> = import.meta.glob<string>(
	"./*.md",
	{
		import: "default",
		query: "?raw",
	},
);

// For each module, we need to parse the post.
const posts = (await Promise.all(
	Object.entries(modules).map(async ([filename, module]) => {
		const value = await module(); // Raw text content as string.
		return markdownToHtml(value, filename);
	}),
)) as unknown[];

export const getPosts = createServerFn().handler(() => {
	return posts.map((post) => {
		const d = post.data as unknown as Record<string, unknown>;
		const excerpt = (d?.excerpt ?? null) as unknown;
		const excerptData = excerpt as unknown as {
			data?: { css?: { getCSS?: () => string } };
		};
		// pull slug fields safely
		const meta = post as unknown as { stem?: string; basename?: string };
		return {
			data: (d?.frontmatter ?? {}) as Record<string, unknown>,
			css: excerptData?.data?.css?.getCSS?.() ?? "",
			html: String(excerpt ?? post),
			slug: meta.stem ?? meta.basename ?? "",
		};
	});
});

export const getPost = createServerFn()
	.inputValidator((slug: string) => {
		const post = posts.find((p) => {
			const meta = p as unknown as { stem?: string; basename?: string };
			return meta.stem === slug || meta.basename === slug;
		});
		if (!post) {
			throw notFound();
		}
		return post as unknown as VFile;
	})
	.handler(({ data: post }) => {
		const d = post.data as unknown as Record<string, unknown>;
		const meta = post as unknown as { stem?: string; basename?: string };
		const dCss = d as unknown as { css?: { getCSS?: () => string } };
		return {
			data: (d?.frontmatter ?? {}) as Record<string, unknown>,
			css: dCss?.css?.getCSS?.() ?? "",
			html: String(post),
			slug: meta.stem ?? meta.basename ?? "",
		};
	});
