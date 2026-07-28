import alchemy from "alchemy";
import { D1Database, TanStackStart } from "alchemy/cloudflare";

const app = await alchemy("ethanpotts", {
	password: process.env.ALCHEMY_PASSWORD ?? process.env.BETTER_AUTH_SECRET,
});

export const database = await D1Database("database", {
	name: app.stage === "prod" ? "ethanpotts-db" : undefined,
	migrationsDir: "./drizzle/migrations",
});

export const website = await TanStackStart("website", {
	name: app.stage === "prod" ? "ethanpotts" : undefined,
	compatibilityDate: "2025-09-02",
	compatibilityFlags: ["nodejs_compat"],
	assets: {
		run_worker_first: true,
	},
	bindings: {
		DB: database,
		BETTER_AUTH_URL: alchemy.env("BETTER_AUTH_URL"),
		BETTER_AUTH_SECRET: alchemy.secret.env("BETTER_AUTH_SECRET"),
		ADMIN_OWNER_EMAIL: alchemy.env("ADMIN_OWNER_EMAIL"),
	},
});

console.log({
	databaseId: database.id,
	url: website.url,
});

await app.finalize();
