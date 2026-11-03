import { useEffect, useState } from "react";

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

/** Reader font + size, remembered across visits. Defaults to a highly legible sans. */
export function useReadingPrefs() {
	const [font, setFont] = useState<ReadingFont>("sans");
	const [size, setSize] = useState<ReadingSize>("m");
	useEffect(() => {
		try {
			const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");
			if (READING_FONTS.some((f) => f.id === saved.font)) setFont(saved.font);
			if (READING_SIZES.some((s) => s.id === saved.size)) setSize(saved.size);
		} catch {}
	}, []);
	const save = (next: { font?: ReadingFont; size?: ReadingSize }) => {
		const f = next.font ?? font;
		const s = next.size ?? size;
		setFont(f);
		setSize(s);
		try {
			localStorage.setItem(KEY, JSON.stringify({ font: f, size: s }));
		} catch {}
	};
	return { font, size, setFont: (f: ReadingFont) => save({ font: f }), setSize: (s: ReadingSize) => save({ size: s }) };
}

function Segment<T extends string>({
	label,
	options,
	value,
	onChange,
	render,
}: {
	label: string;
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
					onClick={() => onChange(o.id)}
					className={`min-h-8 min-w-10 border-l-2 border-black px-2.5 font-pixel text-sm first:border-l-0 ${value === o.id ? "bg-black text-white" : "hover:bg-black/10"}`}
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
		<div className="flex flex-wrap items-center gap-3 px-3 py-2">
			<span className="hidden font-pixel text-xs sm:inline">Font</span>
			<Segment
				label="Reading font"
				options={READING_FONTS}
				value={prefs.font}
				onChange={prefs.setFont}
				render={(o) => (
					<span
						style={{
							fontFamily:
								o.id === "sans" ? "var(--font-read-sans)" : o.id === "serif" ? "var(--font-read-serif)" : o.id === "mono" ? "var(--font-mono)" : "var(--font-pixel)",
						}}
					>
						{o.label}
					</span>
				)}
			/>
			<span className="hidden font-pixel text-xs sm:inline">Size</span>
			<Segment
				label="Text size"
				options={READING_SIZES}
				value={prefs.size}
				onChange={prefs.setSize}
				render={(o) => <span style={{ fontSize: sizePx[o.id as ReadingSize] }}>{o.label}</span>}
			/>
		</div>
	);
}
