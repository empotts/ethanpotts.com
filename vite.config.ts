import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig } from "vite";

/** MDX compiler for .mdx posts. It ignores query strings, so `?raw` imports (read on the server for metadata) are skipped here. */
function mdxPosts() {
	const plugin = mdx({ include: /\.mdx$/, remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm] });
	const transform = plugin.transform as (this: unknown, code: string, id: string) => unknown;
	return {
		...plugin,
		enforce: "pre" as const,
		transform(this: unknown, code: string, id: string) {
			return id.includes("?raw") ? undefined : transform.call(this, code, id);
		},
	};
}

const config = defineConfig(({ command }) => ({
	resolve: {
		tsconfigPaths: true,
	},
	define: {
		// Draft posts show in dev and on preview deploys (SHOW_DRAFTS=1), never in a plain prod build.
		__SHOW_DRAFTS__: JSON.stringify(command === "serve" || process.env.SHOW_DRAFTS === "1"),
	},
	build: {
		rolldownOptions: { external: ["cloudflare:workers"] },
	},
	plugins: [
		// Articles can be .mdx: markdown plus React components.
		mdxPosts(),
		tailwindcss(),
		tanstackStart(),
		viteReact({ include: /\.(mdx|jsx|tsx|js|ts)$/ }),
	],
}));

export default config;
