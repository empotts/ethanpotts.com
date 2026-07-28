import { env as cloudflareEnv } from "cloudflare:workers";

export interface WebsiteEnv {
	DB: D1Database;
	BETTER_AUTH_URL: string;
	BETTER_AUTH_SECRET: string;
	ADMIN_OWNER_EMAIL: string;
}

export const env = cloudflareEnv as unknown as WebsiteEnv;
