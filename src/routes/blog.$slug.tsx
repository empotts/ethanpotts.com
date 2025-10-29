import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { getPost } from "@/posts/worker";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPost({ data: params.slug });

    // If HTML exists, ensure external links open in a new tab (and are safe)
    if (post?.html) {
      post.html = post.html.replace(
        /<a(?=[^>]*href=(["'])(?:https?:|\/\/)[^"']*\1)(?![^>]*\btarget=)([^>]*)>/gi,
        '<a$2 target="_blank" rel="noopener noreferrer">'
      );
    }

    return { post };
  },
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
              gap: 0.5rem;
            }

            .prose a {
              color: inherit;
              text-decoration: underline;
              text-decoration-thickness: 1.5px;
              text-underline-offset: 3px;
              transition: color 150ms ease, text-decoration-color 150ms ease, text-decoration-thickness 150ms ease;
            }

            .prose a:hover,
            .prose a:focus {
              color: rgb(79 70 229); /* indigo-600 */
              text-decoration-color: rgba(79,70,229,0.9);
              text-decoration-thickness: 2px;
              outline: none;
            }

            @media (prefers-reduced-motion: reduce) {
              .prose a {
                transition: none;
              }
            }

            /* Ensure caption renders above the code block */
            .prose figure > figcaption {
              order: -1;
              margin-bottom: 0.25rem;
              font-size: 0.9rem;
              color: rgba(75,85,99,0.9); /* tailwind slate-600-ish */
              line-height: 1.25;
            }

            /* Keep pre/code as the main content below the caption */
            .prose figure > pre,
            .prose figure > div {
              order: 0;
            }

            /* Code block styling and horizontal scroll on small screens */
            .prose pre {
              border-radius: 0.5rem;
              padding: 1rem;
              box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 6px -1px,
                rgba(0, 0, 0, 0.06) 0px 2px 4px -1px;
              overflow: auto;
              -webkit-overflow-scrolling: touch;
              font-size: 0.9rem;
              line-height: 1.5;
            }

            /* Ensure inline code wraps and long tokens break nicely on mobile */
            .prose code {
              word-break: break-word;
              white-space: pre-wrap;
            }

            /* Make images, videos and svgs responsive */
            .prose img,
            .prose video,
            .prose svg {
              max-width: 100%;
              height: auto;
              display: block;
              margin: 0.75rem 0;
            }

            /* Mermaid and other SVG-based diagrams should scale to container */
            .prose .mermaid,
            .prose svg[data-processed="true"] {
              width: 100% !important;
              height: auto !important;
            }

            /* Make tables scroll horizontally on small screens */
            .prose table {
              width: 100%;
              border-collapse: collapse;
              overflow: auto;
              display: block;
            }

            /* Responsive iframes / embeds */
            .prose iframe {
              max-width: 100%;
            }

            /* Small-screen adjustments */
            @media (max-width: 640px) {
              .prose {
                font-size: 1rem; /* slightly larger for readability on phones */
                word-break: break-word;
              }
              .prose pre {
                padding: 0.75rem;
                font-size: 0.85rem;
              }
            }

            /* Desktop tweaks */
            @media (min-width: 768px) {
              .prose {
                font-size: 1.0625rem;
                line-height: 1.7;
              }
              .prose img {
                margin: 1rem 0;
              }
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
        <h1 className="text-3xl sm:text-4xl font-extrabold  ">
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
