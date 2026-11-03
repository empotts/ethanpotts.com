import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

// The desktop lives in the root layout; this route opens its window.
export const Route = createFileRoute("/")({
	head: () => seo({ path: "/" }),
	component: () => null,
});
