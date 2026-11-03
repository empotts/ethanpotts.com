import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Window } from "@/components/Window";
import { focusWin } from "@/components/windows";
import { getPost } from "@/posts/worker";

export const Route = createFileRoute("/blog/$slug")({
	loader: async ({ params }) => {
		const post = await getPost({ data: params.slug });
		post.html = post.html.replace(
			/<a(?=[^>]*href=(["'])(?:https?:|\/\/)[^"']*\1)(?![^>]*\btarget=)([^>]*)>/gi,
			'<a$2 target="_blank" rel="noopener noreferrer">',
		);
		return { post };
	},
	head: ({ loaderData }) => ({
		meta: [
			{ title: `${loaderData?.post.data?.title ?? "Post"} · Ethan Potts` },
			{ name: "description", content: loaderData?.post.data?.description },
		],
		styles: [{ children: loaderData?.post.css ?? "" }],
	}),
	component: Post,
});

function Post() {
	const { post } = Route.useLoaderData();
	const navigate = useNavigate();
	useEffect(() => focusWin("post"), []);
	return (
		<Window id="post" title={`${post.slug}.txt`} x={220} y={60} width={680} onClose={() => navigate({ to: "/blog" })}>
			<article className="doc px-8 py-6">
				<h1 className="!mt-0">{post.data?.title}</h1>
				{post.data?.description && <p className="text-sm">{post.data.description}</p>}
				<div dangerouslySetInnerHTML={{ __html: post.html }} />
			</article>
		</Window>
	);
}
