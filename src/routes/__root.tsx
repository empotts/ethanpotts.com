import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Desktop } from "@/components/Desktop";
import { themeBootScript } from "@/components/theme";
import { profile } from "@/data/profile";
import { seo } from "@/lib/seo";
import { getPosts } from "@/posts/worker";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	loader: async () => ({ posts: await getPosts() }),
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ name: "author", content: profile.name },
			{ name: "theme-color", content: "#ffffff", media: "(prefers-color-scheme: light)" },
			{ name: "theme-color", content: "#0b0b0b", media: "(prefers-color-scheme: dark)" },
			...seo({}).meta,
		],
		links: [
			{ rel: "preconnect", href: "https://fonts.googleapis.com" },
			{ rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&family=IBM+Plex+Mono:ital,wght@0,400;0,500;1,400&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,650;1,7..72,400&family=Pixelify+Sans:wght@400;600&display=swap",
			},
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/EP.ico", sizes: "any" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
			{ rel: "manifest", href: "/manifest.json" },
		],
		scripts: [{ children: themeBootScript }],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const posts = Route.useLoaderData({ select: (d) => d?.posts ?? [] });
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<Desktop posts={posts}>{children}</Desktop>
				<Scripts />
			</body>
		</html>
	);
}
