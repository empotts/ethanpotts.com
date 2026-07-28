import { env as cloudflareEnv } from "cloudflare:workers";

import type { WebsiteEnv } from "../alchemy.run";

export const env = new Proxy({} as WebsiteEnv, {
	get(_, property) {
		return cloudflareEnv[property as keyof typeof cloudflareEnv];
	},
});
