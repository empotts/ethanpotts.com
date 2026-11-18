import { createFileRoute, notFound } from "@tanstack/react-router";
import { getApp, hasWindow } from "@/apps/index";
import { seo } from "@/lib/seo";

// The desktop lives in the root layout; this route opens one app's window, so any app can be linked.
export const Route = createFileRoute("/apps/$id")({
	loader: ({ params }) => {
		const app = getApp(params.id);
		if (!app || !hasWindow(app)) throw notFound();
		return { title: app.title, description: app.description };
	},
	head: ({ loaderData, params }) =>
		seo({ title: loaderData?.title ?? "App", description: loaderData?.description, path: `/apps/${params.id}` }),
	component: () => null,
});
