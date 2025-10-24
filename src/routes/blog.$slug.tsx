// ...existing code...
import { createFileRoute, useLoaderData } from "@tanstack/react-router";

import { getPost } from "@/posts/worker";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => ({
    post: await getPost({ data: params.slug }),
  }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData?.post.data?.title },
      { name: "description", content: loaderData?.post.data?.description },
    ],
       styles: [
      {
        children:
          (loaderData?.post.css ?? "") +
          `
            /* Put code block captions above the code */
            .prose figure {
            display: flex;
            flex-direction: column;
            }

            /* Ensure caption renders above the code block */
            .prose figure > figcaption {
            order: -1;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
            color: rgba(75,85,99,0.9); /* tailwind slate-600-ish */
            }

            /* Keep pre/code as the main content below the caption */
            .prose figure > pre,
            .prose figure > div {
            order: 0;
            }
            pre{
            border-radius: 0.5rem;
            padding: 1rem;
            box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px -1px,
              rgba(0, 0, 0, 0.06) 0px 2px 4px -1px;
            }
            `,
      },
    ],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const post = useLoaderData({
    from: "/blog/$slug",
    select: (state) => state.post,
  });

  const pubDate = post?.data?.date
    ? new Date(post.data.date).toLocaleDateString()
    : null;
  const readingTime = post?.data?.readingTime;

  return (
    <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-pink-500">
          {post?.data?.title}
        </h1>

        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
          {pubDate && (
            <time dateTime={post.data.date} className="opacity-90">
              {pubDate}
            </time>
          )}
          {readingTime && <span className="opacity-80">· {readingTime}</span>}
          {post?.data?.author && (
            <span className="opacity-80">· {post.data.author}</span>
          )}
        </div>
      </header>

      <div
        className="prose prose-lg dark:prose-invert max-w-none leading-relaxed space-y-6 "
        dangerouslySetInnerHTML={{ __html: post?.html ?? "" }}
      />
    </article>
  );
}
// ...existing code...