import { createFileRoute } from "@tanstack/react-router";
import { seo } from "@/lib/seo";

// The desktop lives in the root layout; this route opens its window.
export const Route = createFileRoute("/resume")({
	head: () => seo({ title: "Work", description: "Software engineer on revenue recovery at SPS Commerce. Previously SupplyPike; biomedical engineering at the University of Arkansas.", path: "/resume" }),
	component: () => null,
});
