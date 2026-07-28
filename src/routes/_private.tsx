import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { getPrivateSession } from "@/lib/auth.functions";

export const Route = createFileRoute("/_private")({
	beforeLoad: async () => {
		const session = await getPrivateSession();
		if (!session) throw redirect({ to: "/login" });
		return { session };
	},
	component: () => <Outlet />,
});
