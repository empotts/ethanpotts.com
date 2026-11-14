import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const config = defineConfig({
	resolve: {
		tsconfigPaths: true,
	},
	build: {
		rolldownOptions: { external: ["cloudflare:workers"] },
	},
	plugins: [
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
});

export default config;
