import { useCallback, useEffect, useRef, useState } from "react";
import { localHour, wallpaperShot } from "@/components/Wallpaper";
import { useAppFrame, Window } from "@/components/Window";
import { openWin } from "@/components/windows";
import { beep } from "@/kit/game/sound";
import type { Photo } from "../photo/app";
import { APERTURES, badStart, develop, ISOS, type Settings, SHUTTERS, sceneEV, shutterSeconds, stopsOff, verdict } from "./exposure";

const isDayNow = () => {
	const h = localHour();
	return h > 6.5 && h < 19.5;
};

/** One dial: the value with its neighbours, stepped by the arrows, a click or the scroll wheel. */
function Dial({ label, values, at, onChange, hint }: { label: string; values: string[]; at: number; onChange: (n: number) => void; hint: string }) {
	const set = (n: number) => onChange(Math.max(0, Math.min(values.length - 1, n)));
	return (
		<div className="cam-dial" title={hint}>
			<span className="w-16 shrink-0 font-ui text-xs">{label}</span>
			<div
				className="flex items-center gap-1"
				onWheel={(e) => {
					e.preventDefault();
					set(at + (e.deltaY > 0 ? 1 : -1));
				}}
			>
				<button type="button" className="btn px-2 py-0 text-xs" onClick={() => set(at - 1)} disabled={at === 0} aria-label={`${label} down`}>
					‹
				</button>
				<div className="cam-strip" role="group" aria-label={`${label}: ${values[at]}`}>
					{[-1, 0, 1].map((o) => {
						const v = values[at + o];
						return v ? (
							<button key={o} type="button" className={o === 0 ? "cam-now" : "cam-side"} onClick={() => set(at + o)} tabIndex={o === 0 ? 0 : -1}>
								{v}
							</button>
						) : (
							<span key={o} className="cam-side" />
						);
					})}
				</div>
				<button type="button" className="btn px-2 py-0 text-xs" onClick={() => set(at + 1)} disabled={at === values.length - 1} aria-label={`${label} up`}>
					›
				</button>
			</div>
		</div>
	);
}

/** The classic match-needle meter: −3 … 0 … +3 stops. */
function Meter({ stops }: { stops: number }) {
	const clamped = Math.max(-3, Math.min(3, stops));
	return (
		<div className="cam-meter" aria-live="polite" aria-label={`Light meter: ${verdict(stops)}`}>
			<div className="cam-track">
				{["−3", "−2", "−1", "0", "+1", "+2", "+3"].map((n, i) => (
					<span key={n} className="cam-tick" style={{ left: `${(i / 6) * 100}%` }}>
						{n}
					</span>
				))}
				<span className="cam-needle" data-ok={stops === 0 ? "" : undefined} style={{ left: `${((clamped + 3) / 6) * 100}%` }} />
			</div>
			<p className="mt-1 text-center font-ui text-xs">
				{verdict(stops)}
				{Math.abs(stops) > 3 && " (off the scale)"}
			</p>
		</div>
	);
}

export default function Camera() {
	const frame = useAppFrame();
	const view = useRef<HTMLCanvasElement>(null);
	const source = useRef<HTMLCanvasElement | null>(null);
	const lastFrame = useRef<ImageData | null>(null);
	/** Develops the last grabbed frame with the current settings. */
	const paint = useCallback(() => {
		const canvas = view.current;
		const img = lastFrame.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !img || !ctx) return;
		if (canvas.width !== img.width || canvas.height !== img.height) {
			canvas.width = img.width;
			canvas.height = img.height;
		}
		const out = ctx.createImageData(img.width, img.height);
		develop(img, out, live.current.stops, live.current.set);
		ctx.putImageData(out, 0, 0);
	}, []);
	const [scene, setScene] = useState(() => sceneEV(isDayNow()));
	const [set, setSet] = useState<Settings>(() => badStart(sceneEV(isDayNow())));
	const [blink, setBlink] = useState(false);
	const stops = stopsOff(scene, set);
	const live = useRef({ set, stops });
	live.current = { set, stops };

	// The viewfinder: grab the wallpaper a few times a second and develop it with the current settings.
	useEffect(() => {
		source.current ??= document.createElement("canvas");
		let timer = 0;
		const tick = () => {
			const src = source.current;
			if (src && wallpaperShot.grab?.(src)) {
				// Frame a 3:2 photo from the wallpaper, centred a little below the middle so the hills stay in.
				const fw = Math.min(src.width, Math.round((src.height * 3) / 2));
				const fh = Math.min(src.height, Math.round((fw * 2) / 3));
				const fx = Math.round((src.width - fw) / 2);
				const fy = Math.round(Math.min(src.height - fh, Math.max(0, src.height * 0.58 - fh / 2)));
				lastFrame.current = src.getContext("2d", { willReadFrequently: true })?.getImageData(fx, fy, fw, fh) ?? null;
				paint();
			}
			// The sky can change under you (Forecast, nightfall).
			setScene(sceneEV(isDayNow()));
			timer = window.setTimeout(tick, document.hidden ? 1000 : 220);
		};
		tick();
		return () => clearTimeout(timer);
	}, [paint]);
	// Turning a dial shows its effect at once, not on the next grab.
	// biome-ignore lint/correctness/useExhaustiveDependencies: repaint whenever the exposure changes
	useEffect(paint, [stops, set, paint]);

	const take = useCallback(
		(from?: Element | null) => {
			const canvas = view.current;
			if (!canvas?.width) return;
			const { set: s, stops: off } = live.current;
			setBlink(true);
			beep(1800, 18, { gain: 0.04 });
			setTimeout(() => beep(1200, 30, { gain: 0.04 }), Math.min(600, shutterSeconds(s.s) * 1000));
			setTimeout(() => setBlink(false), 120);
			const photo: Photo = {
				src: canvas.toDataURL("image/png"),
				taken: new Date(),
				settings: `${APERTURES[s.a]} · ${SHUTTERS[s.s]} · ISO ${ISOS[s.i]}`,
				verdict: verdict(off),
			};
			setTimeout(() => openWin("photo", { payload: photo, from }), 160);
		},
		[],
	);

	// Space or Enter takes the photo while the Camera is the front window.
	useEffect(() => {
		if (!frame?.active || frame.embedded) return;
		const onKey = (e: KeyboardEvent) => {
			if ((e.code === "Space" || e.code === "Enter") && !(e.target as HTMLElement)?.closest("button, input")) {
				e.preventDefault();
				take(document.querySelector(".cam-release"));
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [frame?.active, frame?.embedded, take]);

	const t = shutterSeconds(set.s);
	return (
		<Window
			footer={
				<div className="flex items-center gap-3 px-3 py-1.5 font-ui text-xs tabular-nums">
					<span>
						{APERTURES[set.a]} · {SHUTTERS[set.s]} · ISO {ISOS[set.i]}
					</span>
					<button type="button" className="ml-auto btn py-0 text-xs" onClick={() => setSet(badStart(scene))}>
						New challenge
					</button>
				</div>
			}
		>
			<div className="space-y-3 p-3">
				<div className="cam-finder relative border-2 border-black bg-black">
					<canvas ref={view} className="block w-full" role="img" aria-label="Viewfinder: the desktop wallpaper as the camera sees it" />
					<span className="cam-corner cam-tl" aria-hidden />
					<span className="cam-corner cam-tr" aria-hidden />
					<span className="cam-corner cam-bl" aria-hidden />
					<span className="cam-corner cam-br" aria-hidden />
					<span className="cam-focus" aria-hidden />
					{blink && <span className="absolute inset-0 bg-black" aria-hidden />}
					{t > 1 / 30 && <span className="cam-warn">Slow shutter: shake</span>}
					{set.i >= 4 && <span className="cam-warn cam-warn-r">High ISO: grain</span>}
				</div>
				<Meter stops={stops} />
				<div className="grid gap-1.5">
					<Dial label="Aperture" values={APERTURES} at={set.a} onChange={(a) => setSet((x) => ({ ...x, a }))} hint="Wider (smaller f-number) lets in more light" />
					<Dial label="Shutter" values={SHUTTERS} at={set.s} onChange={(s) => setSet((x) => ({ ...x, s }))} hint="Slower lets in more light but blurs if your hand shakes" />
					<Dial label="ISO" values={ISOS} at={set.i} onChange={(i) => setSet((x) => ({ ...x, i }))} hint="Higher is brighter but grainier" />
				</div>
				<div className="flex items-center justify-between gap-3">
					<p className="font-ui text-[11px] leading-snug">Bring the needle to 0. Wider aperture, slower shutter or higher ISO all brighten.</p>
					<button type="button" className="cam-release" onClick={(e) => take(e.currentTarget)} aria-label="Take photo">
						<span aria-hidden />
					</button>
				</div>
			</div>
		</Window>
	);
}
