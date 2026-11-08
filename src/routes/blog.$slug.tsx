import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { FullscreenModal } from "@/components/FullscreenModal";
import { ReadingControls, useReadingPrefs } from "@/components/ReadingControls";
import { ShareButton } from "@/components/ShareButton";
import { formatDay } from "@/lib/dates";
import { SITE_URL, seo } from "@/lib/seo";
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
	head: ({ loaderData, params }) => {
		const data = loaderData?.post.data;
		const path = `/blog/${params.slug}`;
		const meta = seo({
			title: data?.title ?? "Post",
			description: data?.description,
			path,
			type: "article",
		});
		const article = [
			{ property: "article:author", content: data?.author ?? "Ethan Potts" },
			...(data?.date ? [{ property: "article:published_time", content: data.date }] : []),
			...(data?.updated ? [{ property: "article:modified_time", content: data.updated }] : []),
			...(data?.tags ?? []).map((tag) => ({ property: "article:tag", content: tag })),
		];
		const jsonLd = data && {
			"@context": "https://schema.org",
			"@type": "BlogPosting",
			headline: data.title,
			description: data.description,
			author: { "@type": "Person", name: data.author, url: SITE_URL },
			datePublished: data.date,
			dateModified: data.updated ?? data.date,
			keywords: data.tags.join(", ") || undefined,
			url: new URL(path, SITE_URL).toString(),
		};
		return {
			...meta,
			meta: [...meta.meta, ...article],
			styles: [{ children: loaderData?.post.css ?? "" }],
			scripts: jsonLd ? [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }] : [],
		};
	},
	component: Post,
});

function Post() {
	const { post } = Route.useLoaderData();
	const navigate = useNavigate();
	const close = useCallback(() => navigate({ to: "/blog" }), [navigate]);
	const prefs = useReadingPrefs();
	const { data } = post;
	return (
		<FullscreenModal
			title={`${post.slug}.txt`}
			label={data.title}
			onClose={close}
			toolbar={<ReadingControls prefs={prefs} />}
			actions={<ShareButton title={data.title} text={data.description} />}
		>
			<article className="doc mx-auto max-w-[68ch] px-6 py-10 sm:px-10">
				<h1 className="!mt-0 !text-[2.2em]">{data.title}</h1>
				{data.description && <p className="!mt-2 text-sm">{data.description}</p>}
				<p className="post-meta !mt-4 flex flex-wrap gap-x-2 font-ui text-xs">
					<span>{data.author}</span>
					{data.date && (
						<>
							<span aria-hidden>·</span>
							<time dateTime={data.date}>{formatDay(data.date)}</time>
						</>
					)}
					{data.updated && data.updated !== data.date && (
						<>
							<span aria-hidden>·</span>
							<span>
								Updated <time dateTime={data.updated}>{formatDay(data.updated)}</time>
							</span>
						</>
					)}
					<span aria-hidden>·</span>
					<span>{data.minutes} min read</span>
				</p>
				{data.tags.length > 0 && (
					<ul className="!m-0 !mt-3 flex !list-none flex-wrap gap-1.5 !p-0" aria-label="Tags">
						{data.tags.map((tag) => (
							<li key={tag} className="border border-black px-1.5 font-ui text-xs">
								{tag}
							</li>
						))}
					</ul>
				)}
				<hr className="my-6 border-t-2 border-dashed border-black" />
				<div dangerouslySetInnerHTML={{ __html: post.html }} />
			</article>
		</FullscreenModal>
	);
}
