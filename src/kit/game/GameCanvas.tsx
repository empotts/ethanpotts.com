import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type GameCanvasHandle = { ctx: CanvasRenderingContext2D | null; canvas: HTMLCanvasElement | null };

/**
 * A low-resolution canvas scaled up with hard pixel edges. Draw at `width` ×
 * `height` game pixels; the element fills its container at that aspect ratio.
 * Anything passed as children sits on top (title cards, score overlays).
 */
export const GameCanvas = forwardRef<GameCanvasHandle, { width: number; height: number; label: string; children?: React.ReactNode; onPointerDown?: (e: React.PointerEvent) => void; onPointerUp?: (e: React.PointerEvent) => void }>(
	function GameCanvas({ width, height, label, children, onPointerDown, onPointerUp }, ref) {
		const canvas = useRef<HTMLCanvasElement>(null);
		const handle = useRef<GameCanvasHandle>({ ctx: null, canvas: null });
		useImperativeHandle(ref, () => handle.current, []);
		useEffect(() => {
			const c = canvas.current;
			handle.current.canvas = c;
			handle.current.ctx = c?.getContext("2d") ?? null;
			if (handle.current.ctx) handle.current.ctx.imageSmoothingEnabled = false;
		}, []);
		return (
			<div
				className="game-stage relative select-none"
				style={{ aspectRatio: `${width} / ${height}`, touchAction: "none" }}
				onPointerDown={onPointerDown}
				onPointerUp={onPointerUp}
				onPointerCancel={onPointerUp}
				onContextMenu={(e) => e.preventDefault()}
			>
				<canvas ref={canvas} width={width} height={height} className="absolute inset-0 block h-full w-full" style={{ imageRendering: "pixelated" }} role="img" aria-label={label} />
				{children}
			</div>
		);
	},
);

/** Puts the element in browser full screen, or leaves it. */
export function toggleFullscreen(el: Element | null) {
	if (!el) return;
	if (document.fullscreenElement) void document.exitFullscreen();
	else void el.requestFullscreen?.().catch(() => {});
}
