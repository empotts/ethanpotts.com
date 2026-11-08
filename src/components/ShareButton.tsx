import { useEffect, useState } from "react";

/**
 * Shares the current page. Uses the system share sheet where there is one (phones),
 * otherwise copies the link and says so.
 */
export function ShareButton({ title, text }: { title: string; text?: string }) {
	const [copied, setCopied] = useState(false);
	useEffect(() => {
		if (!copied) return;
		const t = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(t);
	}, [copied]);

	const share = async () => {
		const url = window.location.href;
		if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
			try {
				await navigator.share({ title, text, url });
				return;
			} catch (e) {
				// Closing the share sheet is not an error worth falling back on.
				if ((e as Error).name === "AbortError") return;
			}
		}
		try {
			await navigator.clipboard.writeText(url);
			setCopied(true);
		} catch {
			window.prompt("Copy this link:", url);
		}
	};

	return (
		<button
			type="button"
			onClick={share}
			className="relative border-2 border-black bg-white px-2 font-ui text-xs leading-4 after:absolute after:-inset-2 after:content-[''] hover:bg-black hover:text-white"
		>
			<span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
		</button>
	);
}
