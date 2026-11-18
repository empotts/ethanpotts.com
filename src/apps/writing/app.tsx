import { Link } from "@tanstack/react-router";
import { useDesktopData } from "@/components/desktop/data";
import { PixelIcon } from "@/components/icons";
import { Window } from "@/components/Window";
import { formatDay } from "@/lib/dates";
import { defineApp } from "../define";

function Writing() {
	const { posts } = useDesktopData();
	return (
		<Window>
			<ul className="p-2">
				{posts.map((post) => (
					<li key={post.slug}>
						<Link to="/blog/$slug" params={{ slug: post.slug }} className="flex items-center gap-3 p-2 hover:bg-black hover:text-white">
							<PixelIcon name="doc" size={28} />
							<span>
								<span className="block font-ui leading-tight">
									{post.data.title}
									{post.data.draft && <span className="ml-2 border border-current px-1 text-[10px]">DRAFT</span>}
								</span>
								{post.data.description && <span className="block text-xs">{post.data.description}</span>}
								{post.data.date && <span className="mt-0.5 block font-ui text-[11px]">{formatDay(post.data.date)} · {post.data.minutes} min</span>}
							</span>
						</Link>
					</li>
				))}
			</ul>
		</Window>
	);
}

export default defineApp({
	id: "writing",
	title: "Writing",
	icon: "doc",
	place: "main",
	order: 4,
	description: "Notes and posts by Ethan Potts.",
	route: "/blog",
	window: { x: 180, y: 160, width: 420 },
	info: ({ posts }) => [["Kind", "Folder"], ["Items", `${posts.length} posts`]],
	component: Writing,
});
