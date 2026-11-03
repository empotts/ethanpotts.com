import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { FullscreenModal } from "@/components/FullscreenModal";
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
	const close = useCallback(() => navigate({ to: "/blog" }), [navigate]);
	return (
		<FullscreenModal title={`${post.slug}.txt`} label={String(post.data?.title ?? post.slug)} onClose={close}>
			<article className="doc mx-auto max-w-[68ch] px-6 py-10 sm:px-10">
				<h1 className="!mt-0 !text-4xl">{post.data?.title}</h1>
				{post.data?.description && <p className="!mt-2 text-sm">{post.data.description}</p>}
				<hr className="my-6 border-t-2 border-dashed border-black" />
				<div dangerouslySetInnerHTML={{ __html: post.html }} />
			</article>
		</FullscreenModal>
	);
}
