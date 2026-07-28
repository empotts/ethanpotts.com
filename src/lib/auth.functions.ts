import { eq } from "drizzle-orm";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { db } from "@/db";
import { user } from "@/db/schema";
import { env } from "@/env";
import { auth } from "@/lib/auth";

async function loadPrivateSession() {
	const session = await auth.api.getSession({ headers: getRequestHeaders() });
	if (!session) return null;

	const record = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
	});
	if (!record) return null;

	const isOwner =
		record.email.toLowerCase() === env.ADMIN_OWNER_EMAIL.toLowerCase();
	if (!isOwner && record.accessStatus !== "active") return null;

	return {
		...session,
		access: { isOwner },
	};
}

export const getPrivateSession = createServerFn({ method: "GET" }).handler(
	loadPrivateSession,
);
