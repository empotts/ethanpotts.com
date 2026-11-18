import { createRouter } from "@tanstack/react-router";

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
export const getRouter = () => {
	return createRouter({
		routeTree,
		scrollRestoration: true,
		// Hovering (or touching) a link fetches its page, so opening it starts at once.
		defaultPreload: "intent",
		defaultPreloadStaleTime: 30_000,
	});
};
