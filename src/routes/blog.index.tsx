import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

// The desktop lives in the root layout; this route opens the Writing window.
export const Route = createFileRoute("/blog/")({
	head: () => seo({ title: "Writing", description: "Notes and posts by Ethan Potts.", path: "/blog" }),
	component: () => null,
});
