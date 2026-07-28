import * as Alchemy from "alchemy";
import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";

export const Database = Cloudflare.D1.Database(
	"Database",
	Alchemy.Stack.useSync((stack) => ({
		name: stack.stage === "prod" ? "ethanpotts-db" : undefined,
		migrationsDir: "./drizzle/migrations",
	})),
);

export class Website extends Cloudflare.Website.Vite<Website>()(
	"Website",
	Alchemy.Stack.useSync((stack) => ({
		name: stack.stage === "prod" ? "ethanpotts" : undefined,
		domain: stack.stage === "prod" ? "ethanpotts.com" : undefined,
		compatibility: {
			date: "2025-09-02",
			flags: ["nodejs_compat"],
		},
		env: {
			DB: Database,
			BETTER_AUTH_URL: Config.string("BETTER_AUTH_URL"),
			BETTER_AUTH_SECRET: Config.redacted("BETTER_AUTH_SECRET"),
			ADMIN_OWNER_EMAIL: Config.redacted("ADMIN_OWNER_EMAIL"),
		},
	})),
) {}

export type WebsiteEnv = Cloudflare.InferEnv<typeof Website>;

export default Alchemy.Stack(
	"ethanpotts",
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state(),
	},
	Effect.gen(function* () {
		const database = yield* Database;
		const website = yield* Website;

		return {
			databaseId: database.databaseId.as<string>(),
			url: website.url.as<string>(),
		};
	}),
);
