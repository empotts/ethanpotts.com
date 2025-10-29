import { createFileRoute, Link, Outlet, useLoaderData } from "@tanstack/react-router";

import { getPosts } from "@/posts/worker";

export const Route = createFileRoute('/blog')({
  loader: async () => ({ posts: await getPosts() }),
  component: RouteComponent,
});

function RouteComponent() {
  const posts = useLoaderData({
    from: "/blog",
    select: (state) => state.posts,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <ul>
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="block px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {String(post.data?.title || "Untitled Post")}
                </Link>
              </li>
            ))}
            </ul>

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
    </div>
  );
}
