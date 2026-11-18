/**
 * Close, minimize and maximize, as three round buttons on the left of a title
 * bar. Their marks show on hover (always on touch screens). Inactive windows show
 * them hollow, like a background window on a Mac.
 */
export function TrafficLights({
	title,
	onClose,
	onMinimize,
	onMaximize,
	maximized = false,
	dim = false,
}: {
	title: string;
	onClose: () => void;
	onMinimize?: () => void;
	onMaximize?: () => void;
	maximized?: boolean;
	dim?: boolean;
}) {
	return (
		<div className={`traffic flex shrink-0 items-center ${dim ? "traffic-dim" : ""}`} onPointerDown={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
			<button type="button" className="tl tl-close" onClick={onClose} aria-label={`Close ${title}`} title="Close">
				<svg viewBox="0 0 8 8" aria-hidden>
					<path d="M1.5 1.5l5 5M6.5 1.5l-5 5" />
				</svg>
			</button>
			<button type="button" className="tl tl-min" onClick={onMinimize ?? onClose} aria-label={`Minimize ${title}`} title="Minimize">
				<svg viewBox="0 0 8 8" aria-hidden>
					<path d="M1.25 4h5.5" />
				</svg>
			</button>
			{onMaximize && (
				<button type="button" className="tl tl-max" onClick={onMaximize} aria-label={maximized ? `Restore ${title}` : `Maximize ${title}`} aria-pressed={maximized} title={maximized ? "Restore" : "Maximize"}>
					<svg viewBox="0 0 8 8" aria-hidden>
						{maximized ? <path className="fill" d="M4.4 3.6V0.9L7.1 3.6ZM3.6 4.4V7.1L0.9 4.4Z" /> : <path className="fill" d="M1.4 1.4H5L1.4 5ZM6.6 6.6H3L6.6 3Z" />}
					</svg>
				</button>
			)}
		</div>
	);
}
