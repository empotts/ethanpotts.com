import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/about-me")({
	beforeLoad: () => {
		throw redirect({ to: "/" });
	},
});
