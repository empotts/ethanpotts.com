import { motion, useDragControls } from "motion/react";
import { createContext, useContext, useEffect, useState } from "react";
import { boot, focusWin, trashTarget, trashWin, useWindows, type WinId } from "./windows";

export const DeskRef = createContext<React.RefObject<HTMLDivElement | null> | null>(null);

function useNarrow() {
	const [n, setN] = useState(false);
	useEffect(() => {
		const mq = window.matchMedia("(max-width: 720px)");
		const on = () => setN(mq.matches);
		on();
		mq.addEventListener("change", on);
		return () => mq.removeEventListener("change", on);
	}, []);
	return n;
}

export function Window({
	id,
	title,
	x,
	y,
	width,
	onClose,
	children,
	footer,
}: {
	id: WinId;
	title: string;
	x: number;
	y: number;
	width: number;
	onClose: () => void;
	children: React.ReactNode;
	footer?: React.ReactNode;
}) {
	const desk = useContext(DeskRef);
	const controls = useDragControls();
	const { order } = useWindows();
	const narrow = useNarrow();
	const z = order.indexOf(id) + 10;
	const active = order[order.length - 1] === id;
	const [trashing, setTrashing] = useState(false);

	return (
		<motion.section
			drag={!narrow}
			dragControls={controls}
			dragListener={false}
			dragMomentum={false}
			dragElastic={0}
			dragConstraints={desk ?? undefined}
			onPointerDown={() => focusWin(id)}
			onDragEnd={(_, info) => {
				const r = trashTarget.el?.getBoundingClientRect();
				const x = info.point.x - window.scrollX;
				const y = info.point.y - window.scrollY;
				if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) setTrashing(true);
			}}
			initial={boot.hydrated ? { scale: 0.92, opacity: 0 } : false}
			animate={trashing ? { scale: 0.05, opacity: 0, rotate: -30 } : { scale: 1, opacity: 1 }}
			// Crumple in six hard steps, like a one-bit animation.
			transition={trashing ? { duration: 0.3, ease: (t: number) => Math.floor(t * 6) / 6 } : { duration: 0.12, ease: "easeOut" }}
			onAnimationComplete={() => {
				if (!trashing) return;
				trashWin(id);
				onClose();
			}}
			className="win desk-win flex flex-col"
			style={{ "--x": `${x}px`, "--y": `${y}px`, "--w": `${width}px`, zIndex: z } as React.CSSProperties}
			aria-label={title}
		>
			<header
				onPointerDown={(e) => !narrow && controls.start(e)}
				className={`flex h-7 shrink-0 cursor-grab items-center gap-2 border-b-2 border-black px-1.5 py-1 select-none active:cursor-grabbing ${active ? "titlebar" : ""}`}
			>
				<button
					type="button"
					onPointerDown={(e) => e.stopPropagation()}
					onClick={onClose}
					aria-label={`Close ${title}`}
					className="relative size-4 shrink-0 border-2 border-black bg-white after:absolute after:-inset-3 after:content-[''] hover:bg-black"
				/>
				<h2 className="mx-auto bg-white px-2 font-ui text-sm leading-none">{title}</h2>
				<span className="size-4 shrink-0" />
			</header>
			<div className="scroll-retro min-h-0 flex-1 overflow-auto">{children}</div>
			{footer && <div className="shrink-0 border-t-2 border-black">{footer}</div>}
		</motion.section>
	);
}
