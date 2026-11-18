import { useEffect, useRef, useState } from "react";
import { onPaletteChange } from "@/components/theme";
import { reducedMotion } from "@/components/motion";
import { ditherInto } from "./dither";

/**
 * A photo that "develops" as it scrolls into view: one-bit dither, then the
 * theme's four colours, then the full-colour original, fading between stages.
 */
export function DitherImage({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
	const wrap = useRef<HTMLSpanElement>(null);
	const img = useRef<HTMLImageElement>(null);
	const one = useRef<HTMLCanvasElement>(null);
	const two = useRef<HTMLCanvasElement>(null);
	const [stage, setStage] = useState(0); // 0 one-bit · 1 palette · 2 colour
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const el = img.current;
		if (!el) return;
		const draw = () => {
			if (!el.naturalWidth || !wrap.current || !one.current || !two.current) return;
			ditherInto(one.current, el, wrap.current, 1);
			ditherInto(two.current, el, wrap.current, 2);
			setLoaded(true);
		};
		if (el.complete) draw();
		el.addEventListener("load", draw);
		const off = onPaletteChange(draw);
		return () => {
			el.removeEventListener("load", draw);
			off();
		};
	}, []);

	useEffect(() => {
		if (!loaded) return;
		if (reducedMotion()) {
			setStage(2);
			return;
		}
		const el = wrap.current;
		if (!el) return;
		const timers: number[] = [];
		const io = new IntersectionObserver(
			([e]) => {
				if (!e.isIntersecting) return;
				io.disconnect();
				timers.push(window.setTimeout(() => setStage(1), 350), window.setTimeout(() => setStage(2), 850));
			},
			{ threshold: 0.45 },
		);
		io.observe(el);
		return () => {
			io.disconnect();
			for (const t of timers) clearTimeout(t);
		};
	}, [loaded]);

	return (
		// Spans, not divs: markdown images sit inside paragraphs.
		<span ref={wrap} className={`dither-img relative block overflow-hidden border-2 border-black ${className}`} data-stage={stage}>
			<img ref={img} src={src} alt={alt} loading="lazy" decoding="async" className="block h-auto w-full" />
			<canvas ref={two} aria-hidden className="dither-layer dither-two" />
			<canvas ref={one} aria-hidden className="dither-layer dither-one" />
		</span>
	);
}
