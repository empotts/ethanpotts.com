import { createFileRoute } from "@tanstack/react-router";

// The desktop lives in the root layout; this route opens the Writing window.
export const Route = createFileRoute("/blog/")({
	component: () => null,
});
