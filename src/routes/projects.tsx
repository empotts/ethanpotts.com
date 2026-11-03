import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

// The desktop lives in the root layout; this route opens its window.
export const Route = createFileRoute("/projects")({
	head: () => seo({ title: "Projects", description: "Small apps, games and tools by Ethan Potts: multiplayer card games, crossword puzzles, a marching drill simulator and more.", path: "/projects" }),
	component: () => null,
});
