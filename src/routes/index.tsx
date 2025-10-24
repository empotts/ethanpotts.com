import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";

import { getPosts } from "@/posts/worker";

export const Route = createFileRoute("/")({
  loader: async () => ({ posts: await getPosts() }),
  head: ({ loaderData }) => ({
    styles: loaderData?.posts
      .filter((post) => Boolean(post.css)) // Omit empty styles.
      .map((post) => ({ children: post.css })),
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const posts = useLoaderData({
    from: "/",
    select: (state) => state.posts,
  });

  return (
    <ul className="prose">
      {posts.map((post) => (
        <li key={post.slug}>
          <h1>
            <Link params={{ slug: post.slug }} to="/blog/$slug">{post.data.title}</Link>
          </h1>
          <div
            className="prose-pre:bg-[var(--shiki-light-bg)] prose-pre:**:text-[var(--shiki-light)]"
            dangerouslySetInnerHTML={{ __html: post.html }}
          />
        </li>
      ))}
    </ul>
  );
}