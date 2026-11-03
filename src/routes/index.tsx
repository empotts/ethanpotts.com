import { createFileRoute } from "@tanstack/react-router";

// The desktop lives in the root layout; this route opens its window.
export const Route = createFileRoute("/")({
	component: () => null,
});
