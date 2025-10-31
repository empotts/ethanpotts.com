---
title: Demo Blog Post
description: This is a sample post
---

# This is a test markdown file

I can write posts in **markdown** and have them server-side rendered on my blog.

<!-- excerpt -->


Inspiration taken from [Implementing a simple blog with TanStack Start](https://www.vseventer.com/blog/implementing-a-simple-blog-with-tanstack-start)






```ts caption="Test.md"
// I can also show off code excerpts with syntax highlighting
// Import the raw text content for all posts.
const modules = import.meta.glob<string>("./*.md", {
  import: "default",
  query: "?raw",
});

// For each module, we need to parse the post.
const posts = await Promise.all(
  Object.entries(modules).map(async ([filename, module]) => {
    const value = await module(); // Raw text content as string.
    return markdownToHtml(value, filename);
  }),
);
```


