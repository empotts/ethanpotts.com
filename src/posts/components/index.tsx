import { Suspense, useEffect, useRef, useState } from "react";
import { appBody, getApp } from "@/apps/index";
import { PixelIcon } from "@/components/icons";
import { AppFrameContext } from "@/components/Window";
import { DitherImage } from "./DitherImage";

/*
 * Components any .mdx post can use without importing them. Each one also has a
 * markdown fallback in src/posts/mdx-source.ts for agents and the terminal.
 */

/** An image that develops from dither to colour as it scrolls in. */
export function Figure({ src, alt, caption }: { src: string; alt: string; caption?: string }) {
	return (
		<figure className="not-prose my-8">
			<DitherImage src={src} alt={alt} />
			{caption && <figcaption className="mt-2 font-ui text-xs">{caption}</figcaption>}
		</figure>
	);
}

/** A boxed aside with an accent rule. */
export function Callout({ title, children }: { title?: string; children: React.ReactNode }) {
	return (
		<aside className="callout my-6 border-2 border-black p-4 pl-5">
			{title && (
				<p className="!mt-0 flex items-center gap-2 font-ui text-sm font-semibold">
					<PixelIcon name="doc" size={18} />
					{title}
				</p>
			)}
			<div className="callout-body">{children}</div>
		</aside>
	);
}

/** A still window frame around any content. */
export function Window({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<section className="win my-6" aria-label={title}>
			<header className="titlebar flex h-7 items-center border-b-2 border-black px-1.5">
				<span className="mx-auto bg-white px-2 font-ui text-sm leading-none">{title}</span>
			</header>
			<div className="px-4 py-1">{children}</div>
		</section>
	);
}

/** Drag the handle to wipe between two images. */
export function Compare({ before, after, alt, beforeLabel = "Before", afterLabel = "After" }: { before: string; after: string; alt: string; beforeLabel?: string; afterLabel?: string }) {
	const [at, setAt] = useState(50);
	return (
		<figure className="not-prose my-8">
			<div className="relative overflow-hidden border-2 border-black select-none">
				<img src={after} alt={`${afterLabel}: ${alt}`} className="block h-auto w-full" />
				<img src={before} alt={`${beforeLabel}: ${alt}`} className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - at}% 0 0)` }} />
				<div className="pointer-events-none absolute inset-y-0 w-0.5 bg-black" style={{ left: `${at}%` }} />
				<span className="absolute top-2 left-2 bg-white px-1 font-ui text-xs">{beforeLabel}</span>
				<span className="absolute top-2 right-2 bg-white px-1 font-ui text-xs">{afterLabel}</span>
			</div>
			<input type="range" min={0} max={100} value={at} onChange={(e) => setAt(Number(e.target.value))} aria-label={`Wipe between ${beforeLabel.toLowerCase()} and ${afterLabel.toLowerCase()}`} className="retro-range mt-2 w-full" />
		</figure>
	);
}

/** A desktop app, playable inside the article. */
export function App({ id }: { id: string; title?: string }) {
	const app = getApp(id);
	const Body = app && appBody(app);
	if (!app || !Body) return null;
	return (
		<div className="not-prose embedded-app">
			<AppFrameContext.Provider value={{ app, active: true, embedded: true, close: () => {} }}>
				<Suspense fallback={<p className="win my-6 p-5 font-ui text-sm">Loading {app.title}…</p>}>
					<Body payload={undefined} />
				</Suspense>
			</AppFrameContext.Provider>
		</div>
	);
}

/** One beat of a scrollytelling section: text on one side, its picture held on the other. */
export function Step({ children }: { src?: string; alt?: string; children: React.ReactNode }) {
	return <div className="scrolly-step">{children}</div>;
}

type StepEl = React.ReactElement<{ src?: string; alt?: string; children: React.ReactNode }>;

/**
 * Scrollytelling: the picture stays pinned while the steps scroll past, and
 * changes (in a short pixel dissolve) as each step reaches the middle.
 */
export function Scrolly({ children }: { children: React.ReactNode }) {
	const steps = (Array.isArray(children) ? children : [children]).filter((c): c is StepEl => Boolean(c && typeof c === "object" && "props" in c));
	const [active, setActive] = useState(0);
	const list = useRef<HTMLDivElement>(null);
	// The active step is the last one whose top has passed the middle of the screen.
	useEffect(() => {
		let raf = 0;
		const measure = () => {
			raf = 0;
			const els = list.current?.querySelectorAll<HTMLElement>("[data-step]");
			if (!els?.length) return;
			const mid = window.innerHeight * 0.55;
			let i = 0;
			els.forEach((el, k) => {
				if (el.getBoundingClientRect().top < mid) i = k;
			});
			setActive(i);
		};
		const onScroll = () => {
			if (!raf) raf = requestAnimationFrame(measure);
		};
		measure();
		window.addEventListener("scroll", onScroll, { capture: true, passive: true });
		window.addEventListener("resize", onScroll);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("scroll", onScroll, { capture: true });
			window.removeEventListener("resize", onScroll);
		};
	}, []);
	return (
		<div className="scrolly not-prose my-10">
			<div className="scrolly-graphic">
				<div className="relative border-2 border-black bg-white">
					{steps.map((s, i) =>
						s.props.src ? (
							<img
								key={s.props.src + i}
								src={s.props.src}
								alt={s.props.alt ?? ""}
								aria-hidden={i !== active}
								className={`block h-auto w-full ${i === 0 ? "relative" : "absolute inset-0"} scrolly-frame`}
								data-on={i === active ? "" : undefined}
							/>
						) : null,
					)}
					<span className="absolute right-2 bottom-2 bg-white px-1 font-ui text-xs tabular-nums">
						{active + 1}/{steps.length}
					</span>
				</div>
			</div>
			<div ref={list} className="scrolly-steps">
				{steps.map((s, i) => (
					<div key={i} data-step={i} data-on={i === active ? "" : undefined} className="scrolly-card win p-4">
						{s.props.children}
					</div>
				))}
			</div>
		</div>
	);
}

/** Wipes its children in, in steps, as they scroll into view. */
export function Reveal({ children }: { children: React.ReactNode }) {
	return <div className="reveal">{children}</div>;
}

/** Markdown images in .mdx posts develop too. */
function Img(props: React.ImgHTMLAttributes<HTMLImageElement>) {
	if (!props.src || typeof props.src !== "string") return <img {...props} alt={props.alt ?? ""} />;
	return <DitherImage src={props.src} alt={props.alt ?? ""} className="my-6" />;
}

export const postComponents = { Figure, Callout, Window, Compare, App, Scrolly, Step, Reveal, img: Img };
