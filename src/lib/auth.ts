import { passkey } from "@better-auth/passkey";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { db, schema } from "@/db";
import { env } from "@/env";

export const auth = betterAuth({
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	database: drizzleAdapter(db, {
		provider: "sqlite",
		schema,
	}),
	emailAndPassword: {
		enabled: true,
	},
	user: {
		additionalFields: {
			accessStatus: {
				type: "string",
				required: false,
				defaultValue: "pending",
				input: false,
			},
			approvedAt: {
				type: "date",
				required: false,
				input: false,
			},
		},
	},
	plugins: [passkey(), tanstackStartCookies()],
});
