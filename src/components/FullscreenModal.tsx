import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { boot } from "./windows";

/**
 * Full-screen retro modal. Covers the desktop (but not the menu bar, which stays
 * usable above it) with a single window: title bar,
 * close box, scrollable body, optional footer. Closes on Escape. Locks page scroll
 * and returns focus to whatever was focused before it opened.
 *
 * Used for articles today; reusable for anything that needs the whole screen.
 */
export function FullscreenModal({
	title,
	onClose,
	children,
	footer,
	toolbar,
	actions,
	label,
}: {
	title: string;
	onClose: () => void;
	children: React.ReactNode;
	footer?: React.ReactNode;
	/** Optional row of controls under the title bar. */
	toolbar?: React.ReactNode;
	/** Small controls at the right end of the title bar. */
	actions?: React.ReactNode;
	/** Accessible name if the visible title is not descriptive enough. */
	label?: string;
}) {
	const panel = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const previous = document.activeElement as HTMLElement | null;
		const { overflow } = document.body.style;
		document.body.style.overflow = "hidden";
		panel.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			// A menu-bar menu handles its own Escape first.
			if (e.key === "Escape" && !e.defaultPrevented) onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => {
			document.body.style.overflow = overflow;
			window.removeEventListener("keydown", onKey);
			previous?.focus?.();
		};
	}, [onClose]);

	return (
		<div className="modal-under-bar fixed inset-x-0 bottom-0 z-[90] p-0 sm:p-6" role="dialog" aria-modal="true" aria-label={label ?? title}>
			<motion.div
				ref={panel}
				tabIndex={-1}
				initial={boot.hydrated ? { scale: 0.97, opacity: 0 } : false}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ duration: 0.12, ease: "easeOut" }}
				className="win flex h-full flex-col outline-none"
			>
				<header className="titlebar flex h-8 shrink-0 items-center gap-2 border-b-2 border-black px-2">
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="relative size-4 shrink-0 border-2 border-black bg-white after:absolute after:-inset-3 after:content-[''] hover:bg-black"
					/>
					<h2 className="mx-auto truncate bg-white px-3 font-ui text-sm leading-none">{title}</h2>
					<span className="hidden shrink-0 bg-white px-2 font-ui text-xs sm:block">esc to close</span>
					{actions && <div className="flex shrink-0 items-center bg-white px-1">{actions}</div>}
				</header>
				{toolbar && <div className="shrink-0 border-b-2 border-black">{toolbar}</div>}
				<div className="scroll-retro min-h-0 flex-1 overflow-auto">{children}</div>
				{footer && <div className="shrink-0 border-t-2 border-black">{footer}</div>}
			</motion.div>
		</div>
	);
}
