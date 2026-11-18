/**
 * The EP logo as inline vector shapes, so it draws with the page (no image to
 * fetch) and takes the current theme's ink colour.
 */
export function Logo({ size = 56, className }: { size?: number; className?: string }) {
	return (
		<svg role="img" aria-label="EP logo" width={size} height={size} viewBox="0 0 500 500" fill="currentColor" className={`inline-block shrink-0 text-black ${className ?? ""}`}>
			{/* E: a comb of three legs under a top bar, with two short bars between them. */}
			<path d="M102 50h291v181h-33V87h-93v136h-32V87h-100v144h-33z" />
			<rect x="170" y="126" width="22" height="88" />
			<rect x="303" y="126" width="22" height="88" />
			{/* P: a bar with a round-bottomed bowl hanging from it. */}
			<rect x="102" y="251" width="291" height="37" />
			<path d="M206 287V353.5A93.5 93.5 0 0 0 393 353.5V287H361V353.5A61.5 57.5 0 0 1 238 353.5V287Z" />
		</svg>
	);
}
