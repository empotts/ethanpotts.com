import plexMono from "@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2?url";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Desktop } from "@/components/Desktop";
import { readingBootScript } from "@/components/ReadingControls";
import { themeBootScript } from "@/components/theme";
import { profile } from "@/data/profile";
import { seo } from "@/lib/seo";
import { getPosts } from "@/posts/worker";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	loader: async () => ({ posts: await getPosts() }),
	// Posts only change on deploy, so moving between pages never refetches them.
	staleTime: Number.POSITIVE_INFINITY,
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
			{ name: "author", content: profile.name },
			{ name: "theme-color", content: "#fffcf6" },
			...seo({}).meta,
		],
		links: [
			// The interface face, fetched alongside the stylesheet instead of after it.
			{ rel: "preload", href: plexMono, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/EP.ico", sizes: "any" },
			{ rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
			{ rel: "manifest", href: "/manifest.json" },
		],
		scripts: [{ children: themeBootScript + readingBootScript }],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const posts = Route.useLoaderData({ select: (d) => d?.posts ?? [] });
	return (
		<html lang="en" data-read-font="sans" data-read-size="m" suppressHydrationWarning>
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
