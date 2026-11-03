import logoUrl from "../EP.svg";

/** The EP logo, tinted with the current theme's ink colour via a CSS mask. */
export function Logo({ size = 56, className }: { size?: number; className?: string }) {
	return (
		<span
			role="img"
			aria-label="EP logo"
			className={`inline-block shrink-0 bg-black ${className ?? ""}`}
			style={{
				width: size,
				height: size,
				maskImage: `url(${logoUrl})`,
				WebkitMaskImage: `url(${logoUrl})`,
				maskSize: "contain",
				WebkitMaskSize: "contain",
				maskRepeat: "no-repeat",
				WebkitMaskRepeat: "no-repeat",
				maskPosition: "center",
				WebkitMaskPosition: "center",
			}}
		/>
	);
}
