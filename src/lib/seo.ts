import { profile } from "@/data/profile";

export const SITE_URL = "https://ethanpotts.com";
export const SITE_NAME = "Ethan Potts";
const DEFAULT_IMAGE = { url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: "Ethan Potts — a retro desktop with dithered hills" };

/**
 * Title, description and share tags (Open Graph + Twitter) for one page.
 * Spread the result into a route's `head()`.
 */
export function seo({
	title,
	description = profile.intro,
	path = "/",
	type = "website",
}: {
	title?: string;
	description?: string;
	path?: string;
	type?: "website" | "article";
}) {
	const fullTitle = title ? `${title} · ${SITE_NAME}` : `${SITE_NAME} · Software engineer`;
	const url = new URL(path, SITE_URL).toString();
	return {
		meta: [
			{ title: fullTitle },
			{ name: "description", content: description },
			{ property: "og:title", content: title ?? SITE_NAME },
			{ property: "og:description", content: description },
			{ property: "og:url", content: url },
			{ property: "og:type", content: type },
			{ property: "og:site_name", content: SITE_NAME },
			{ property: "og:locale", content: "en_US" },
			{ property: "og:image", content: DEFAULT_IMAGE.url },
			{ property: "og:image:width", content: String(DEFAULT_IMAGE.width) },
			{ property: "og:image:height", content: String(DEFAULT_IMAGE.height) },
			{ property: "og:image:alt", content: DEFAULT_IMAGE.alt },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: title ?? SITE_NAME },
			{ name: "twitter:description", content: description },
			{ name: "twitter:image", content: DEFAULT_IMAGE.url },
			{ name: "twitter:image:alt", content: DEFAULT_IMAGE.alt },
		],
		links: [{ rel: "canonical", href: url }],
	};
}
