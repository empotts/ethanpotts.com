import { useEffect, useId, useRef, useState } from "react";

export const READING_FONTS = [
	{ id: "sans", label: "Sans" },
	{ id: "serif", label: "Serif" },
	{ id: "mono", label: "Mono" },
	{ id: "pixel", label: "Pixel" },
] as const;
export const READING_SIZES = [
	{ id: "s", label: "A", title: "Small text" },
	{ id: "m", label: "A", title: "Medium text" },
	{ id: "l", label: "A", title: "Large text" },
] as const;

export type ReadingFont = (typeof READING_FONTS)[number]["id"];
export type ReadingSize = (typeof READING_SIZES)[number]["id"];
const KEY = "ep-reading";

/**
 * Runs in <head> before first paint. Puts the saved reading font and size on <html>
 * (`data-read-font`, `data-read-size`), which is what the article CSS reads, so a
 * reload never shows the defaults first.
 */
export const readingBootScript = `try{var r=JSON.parse(localStorage.getItem("${KEY}")||"{}"),d=document.documentElement;if(${JSON.stringify(READING_FONTS.map((f) => f.id))}.indexOf(r.font)>-1)d.dataset.readFont=r.font;if(${JSON.stringify(READING_SIZES.map((s) => s.id))}.indexOf(r.size)>-1)d.dataset.readSize=r.size}catch(e){}`;

/** Reader font + size, remembered across visits. Defaults to a highly legible sans. */
export function useReadingPrefs() {
	const [font, setFont] = useState<ReadingFont>("sans");
	const [size, setSize] = useState<ReadingSize>("m");
	useEffect(() => {
		// The boot script already applied the saved prefs to <html>; mirror them into state.
		const { readFont, readSize } = document.documentElement.dataset;
		if (READING_FONTS.some((f) => f.id === readFont)) setFont(readFont as ReadingFont);
		if (READING_SIZES.some((s) => s.id === readSize)) setSize(readSize as ReadingSize);
	}, []);
	const save = (next: { font?: ReadingFont; size?: ReadingSize }) => {
		const f = next.font ?? font;
		const s = next.size ?? size;
		setFont(f);
		setSize(s);
		document.documentElement.dataset.readFont = f;
		document.documentElement.dataset.readSize = s;
		try {
			localStorage.setItem(KEY, JSON.stringify({ font: f, size: s }));
		} catch {}
	};
	return { font, size, setFont: (f: ReadingFont) => save({ font: f }), setSize: (s: ReadingSize) => save({ size: s }) };
}

function Segment<T extends string>({
	label,
	attr,
	options,
	value,
	onChange,
	render,
}: {
	label: string;
	/** Data attribute naming each option, matched against <html> in CSS for the selected look. */
	attr: "data-font-opt" | "data-size-opt";
	options: readonly { id: T; label: string; title?: string }[];
	value: T;
	onChange: (v: T) => void;
	render?: (o: { id: T; label: string }) => React.ReactNode;
}) {
	return (
		<div role="radiogroup" aria-label={label} className="flex border-2 border-black">
			{options.map((o) => (
				<button
					key={o.id}
					type="button"
					role="radio"
					aria-checked={value === o.id}
					title={o.title ?? o.label}
					aria-label={o.title ?? o.label}
					{...{ [attr]: o.id }}
					onClick={() => onChange(o.id)}
					className="min-h-8 min-w-10 border-l-2 border-black px-2.5 font-ui text-sm first:border-l-0 hover:bg-black/10"
				>
					{render ? render(o) : o.label}
				</button>
			))}
		</div>
	);
}

export function ReadingControls({ prefs }: { prefs: ReturnType<typeof useReadingPrefs> }) {
	const sizePx: Record<ReadingSize, string> = { s: "12px", m: "15px", l: "19px" };
	return (
		<div className="grid grid-cols-[auto_auto] items-center gap-x-3 gap-y-2">
			<span className="font-ui text-xs">Font</span>
			<Segment
				label="Reading font"
				attr="data-font-opt"
				options={READING_FONTS}
				value={prefs.font}
				onChange={prefs.setFont}
				render={(o) => (
					<span
						style={{
							fontFamily:
								o.id === "sans" ? "var(--font-read-sans)" : o.id === "serif" ? "var(--font-read-serif)" : o.id === "mono" ? "var(--font-mono)" : "var(--font-retro)",
						}}
					>
						{o.label}
					</span>
				)}
			/>
			<span className="font-ui text-xs">Size</span>
			<Segment
				label="Text size"
				attr="data-size-opt"
				options={READING_SIZES}
				value={prefs.size}
				onChange={prefs.setSize}
				render={(o) => <span style={{ fontSize: sizePx[o.id as ReadingSize] }}>{o.label}</span>}
			/>
		</div>
	);
}

/**
 * The reading controls, tucked behind an "Aa" button in the title bar so they
 * don't sit over every article. Closes on a click outside or Escape.
 */
export function ReadingMenu({ prefs }: { prefs: ReturnType<typeof useReadingPrefs> }) {
	const [open, setOpen] = useState(false);
	const wrap = useRef<HTMLDivElement>(null);
	const id = useId();
	useEffect(() => {
		if (!open) return;
		const away = (e: PointerEvent) => {
			if (!wrap.current?.contains(e.target as Node)) setOpen(false);
		};
		// Capture, so Escape closes this menu before it reaches the article (which would close too).
		const esc = (e: KeyboardEvent) => {
			if (e.key !== "Escape") return;
			e.preventDefault();
			e.stopPropagation();
			setOpen(false);
		};
		window.addEventListener("pointerdown", away);
		window.addEventListener("keydown", esc, true);
		return () => {
			window.removeEventListener("pointerdown", away);
			window.removeEventListener("keydown", esc, true);
		};
	}, [open]);
	return (
		<div ref={wrap} className="relative flex">
			<button
				type="button"
				aria-expanded={open}
				aria-controls={id}
				aria-label="Text settings"
				title="Text settings"
				onClick={() => setOpen(!open)}
				className={`relative border-2 border-black px-2 font-ui text-xs leading-4 after:absolute after:-inset-2 after:content-[''] hover:bg-black hover:text-white ${open ? "bg-black text-white" : "bg-white"}`}
			>
				Aa
			</button>
			{open && (
				<div id={id} role="dialog" aria-label="Text settings" className="win menu-drop absolute top-full right-0 z-10 mt-2 p-3 text-black">
					<ReadingControls prefs={prefs} />
				</div>
			)}
		</div>
	);
}
