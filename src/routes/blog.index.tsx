import {
	createFileRoute,
	Link,
	Outlet,
	useLoaderData,
} from "@tanstack/react-router";

import { getPosts } from "@/posts/worker";

export const Route = createFileRoute("/blog/")({
	loader: async () => ({ posts: await getPosts() }),
	component: RouteComponent,
});

function RouteComponent() {
	const posts = useLoaderData({
		from: "/blog/",
		select: (state) => state.posts,
	});
	return (
		<div className="min-h-screen flex flex-col items-center py-6">
			<div className="  p-6 overflow-y-auto">
				<ul className="space-y-6">
					{posts.map((post) => (
						<li key={post.slug}>
							<article className="bg-white  dark:bg-gray-900 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700 max-w-xl">
								<h2 className="text-xl font-semibold mb-2">
									<Link
										to="/blog/$slug"
										params={{ slug: post.slug }}
										className="text-gray-900 dark:text-gray-100 hover:underline"
									>
										{String(post.data?.title || "Untitled Post")}
									</Link>
								</h2>

								{/* post.html is the excerpt */}
								<div
									className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300 mb-3"
									dangerouslySetInnerHTML={{ __html: post.html }}
								/>

								<div className="mt-3">
									<Link
										to="/blog/$slug"
										params={{ slug: post.slug }}
										className="inline-block text-sm font-medium rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
									>
										Continue reading →
									</Link>
								</div>
							</article>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
