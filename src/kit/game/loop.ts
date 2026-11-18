import { useEffect, useRef } from "react";

const STEP = 1 / 60;

/**
 * A fixed-step game loop: `update` runs at exactly 60 Hz of game time however
 * fast the screen refreshes, `render` once per frame. Stops while `running` is
 * false or the tab is hidden, and never tries to catch up on a long pause.
 */
export function useGameLoop({ update, render, running }: { update: (dt: number) => void; render: () => void; running: boolean }) {
	const fns = useRef({ update, render });
	fns.current = { update, render };
	useEffect(() => {
		if (!running) {
			fns.current.render();
			return;
		}
		let raf = 0;
		let last = performance.now();
		let acc = 0;
		const frame = (now: number) => {
			raf = requestAnimationFrame(frame);
			if (document.hidden) {
				last = now;
				return;
			}
			acc += Math.min(0.1, (now - last) / 1000);
			last = now;
			while (acc >= STEP) {
				fns.current.update(STEP);
				acc -= STEP;
			}
			fns.current.render();
		};
		raf = requestAnimationFrame(frame);
		return () => cancelAnimationFrame(raf);
	}, [running]);
}
