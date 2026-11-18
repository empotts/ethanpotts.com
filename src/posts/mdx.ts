import type { MDXContent } from "mdx/types";
import { use } from "react";

/** Each .mdx post compiles to its own chunk, loaded when the post opens. */
const modules = import.meta.glob<{ default: MDXContent }>("./*.mdx");

type Tracked = Promise<MDXContent> & { status?: "fulfilled"; value?: MDXContent };
const loads = new Map<string, Tracked>();

/** One promise per post. Once settled it is marked fulfilled, so `use()` reads it without suspending. */
export function loadMdx(slug: string): Promise<MDXContent> {
	let p = loads.get(slug);
	if (!p) {
		const load = modules[`./${slug}.mdx`];
		if (!load) return Promise.reject(new Error(`No post ${slug}`));
		const tracked: Tracked = load().then((m) => {
			tracked.status = "fulfilled";
			tracked.value = m.default;
			return m.default;
		});
		p = tracked;
		loads.set(slug, p);
	}
	return p;
}

/** The compiled post; suspends until its chunk is loaded (call inside <Suspense>). */
export function useMdx(slug: string): MDXContent {
	return use(loadMdx(slug));
}
