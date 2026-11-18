import { useCallback, useEffect, useRef, useState } from "react";
import { useAppFrame, Window } from "@/components/Window";
import {
	beep,
	GameCanvas,
	type GameCanvasHandle,
	noise,
	type Palette,
	readBest,
	saveBest,
	toggleFullscreen,
	touchHandlers,
	useGameLoop,
	useInput,
	usePalette,
	useSound,
} from "@/kit/game";

/*
 * Singletrack: ride an endless Ozark trail. The hills roll; hold pump on the
 * downslopes to gain speed and let go on the climbs. Hop the rocks. Stall out
 * or land badly and the run is over. Distance is the score.
 */

const W = 320;
const H = 180;
const G = 260; // gravity, game px/s²
const HOP = 125;
const RIDER_X = 92; // where the rider sits on screen
const PX_PER_M = 8;

type Rock = { x: number; w: number; h: number };
type Dust = { x: number; y: number; vx: number; vy: number; life: number };
type Phase = "ready" | "riding" | "over";

const hash = (n: number) => {
	const s = Math.sin(n * 127.1) * 43758.5453;
	return s - Math.floor(s);
};

/** Trail elevation (up is positive). Starts on a drop-in; hills grow taller the farther you ride. */
function ground(x: number) {
	const amp = 12 + Math.min(34, Math.max(0, x - 400) / 260);
	const dropIn = x < 320 ? (1 - Math.max(0, x) / 320) ** 2 * 80 : 0;
	return dropIn + Math.sin(x * 0.0105) * amp + Math.sin(x * 0.026 + 1.3) * amp * 0.42 + Math.sin(x * 0.0042 + 0.7) * amp * 1.3 + Math.sin(x * 0.061 + 4) * 1.6;
}
const slope = (x: number) => ground(x + 0.5) - ground(x - 0.5);
const farRidge = (x: number) => 52 + Math.sin(x * 0.012) * 9 + Math.sin(x * 0.031 + 2) * 4 + Math.sin(x * 0.005) * 12;
const midRidge = (x: number) => 78 + Math.sin(x * 0.017 + 1) * 10 + Math.sin(x * 0.043) * 4 + Math.sin(x * 0.007 + 3) * 9;

function freshRun() {
	return {
		x: 0,
		y: ground(0),
		v: 60,
		vx: 60,
		vy: 0,
		grounded: true,
		angle: 0,
		camY: ground(0),
		pump: false,
		slow: 0,
		air: 0,
		crank: 0,
		rocks: [] as Rock[],
		nextRock: 420,
		dust: [] as Dust[],
		message: "",
		shake: 0,
	};
}
type Run = ReturnType<typeof freshRun>;

/* ---------- drawing helpers (all integer pixels) ---------- */

function px(ctx: CanvasRenderingContext2D, x: number, y: number) {
	ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
}
function line(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number) {
	x0 = Math.round(x0);
	y0 = Math.round(y0);
	x1 = Math.round(x1);
	y1 = Math.round(y1);
	const dx = Math.abs(x1 - x0);
	const dy = -Math.abs(y1 - y0);
	const sx = x0 < x1 ? 1 : -1;
	const sy = y0 < y1 ? 1 : -1;
	let err = dx + dy;
	for (;;) {
		ctx.fillRect(x0, y0, 1, 1);
		if (x0 === x1 && y0 === y1) break;
		const e2 = 2 * err;
		if (e2 >= dy) {
			err += dy;
			x0 += sx;
		}
		if (e2 <= dx) {
			err += dx;
			y0 += sy;
		}
	}
}
function circle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
	let x = r;
	let y = 0;
	let err = 1 - r;
	while (x >= y) {
		for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) px(ctx, cx + a, cy + b);
		y++;
		if (err < 0) err += 2 * y + 1;
		else {
			x--;
			err += 2 * (y - x) + 1;
		}
	}
}

/** A 2-colour ordered-dither fill, for distant hills. */
function ditherPattern(ctx: CanvasRenderingContext2D, ink: string, paper: string, density: number) {
	const c = document.createElement("canvas");
	c.width = 4;
	c.height = 4;
	const p = c.getContext("2d");
	if (!p) return ink;
	const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
	for (let i = 0; i < 16; i++) {
		p.fillStyle = (bayer[i] + 0.5) / 16 < density ? ink : paper;
		p.fillRect(i % 4, Math.floor(i / 4), 1, 1);
	}
	return ctx.createPattern(c, "repeat") ?? ink;
}

/** Sky gradient and sun, drawn once per palette. */
function paintSky(pal: Palette) {
	const c = document.createElement("canvas");
	c.width = W;
	c.height = H;
	const ctx = c.getContext("2d");
	if (!ctx) return c;
	const img = ctx.createImageData(W, H);
	const bayer = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
	const { bg, sky, sun } = pal.rgb;
	const sunX = W * 0.78;
	const sunY = H * 0.24;
	for (let y = 0; y < H; y++)
		for (let x = 0; x < W; x++) {
			const t = (bayer[(y & 7) * 8 + (x & 7)] + 0.5) / 64;
			let col = bg;
			const d = Math.max(0, 0.62 - (y / H) * 1.1);
			if (d > t) col = sky;
			const r = Math.hypot(x - sunX, y - sunY);
			if (r < 11) col = r > 10 || 0.7 > t ? sun : bg;
			else if (r < 17 && 0.14 > t) col = sun;
			const i = (y * W + x) * 4;
			img.data[i] = col[0];
			img.data[i + 1] = col[1];
			img.data[i + 2] = col[2];
			img.data[i + 3] = 255;
		}
	ctx.putImageData(img, 0, 0);
	return c;
}

/** The bike and rider on a small sprite, so it can be rotated as one piece. */
function paintRider(s: CanvasRenderingContext2D, pal: Palette, run: Run) {
	s.clearRect(0, 0, 40, 32);
	const ox = 20;
	const oy = 28; // ground contact
	s.fillStyle = pal.fg;
	const rear = [ox - 7, oy - 5] as const;
	const front = [ox + 7, oy - 5] as const;
	circle(s, rear[0], rear[1], 4);
	circle(s, front[0], front[1], 4);
	// Spokes turn with the wheels.
	for (const [cx, cy] of [rear, front]) {
		const a = run.crank * 1.6;
		line(s, cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, cx - Math.cos(a) * 3, cy - Math.sin(a) * 3);
	}
	const bb = [ox - 1, oy - 5];
	const seat = [ox - 3, oy - 12];
	const head = [ox + 5, oy - 13];
	line(s, rear[0], rear[1], bb[0], bb[1]);
	line(s, rear[0], rear[1], seat[0], seat[1]);
	line(s, bb[0], bb[1], seat[0], seat[1]);
	line(s, bb[0], bb[1], head[0], head[1]);
	line(s, seat[0], seat[1], head[0], head[1]);
	line(s, head[0], head[1], front[0], front[1]);
	line(s, head[0], head[1] - 2, head[0] + 2, head[1] - 2);
	// Rider: lower when pumping.
	const low = run.pump ? 3 : 0;
	const hip = [ox - 3, oy - 14 + low];
	const shoulder = [ox + 2, oy - 21 + low * 1.4];
	const helmet = [ox + 4, oy - 24 + low * 1.5];
	const foot = [bb[0] + Math.cos(run.crank) * 2.5, bb[1] + Math.sin(run.crank) * 2.5];
	const foot2 = [bb[0] - Math.cos(run.crank) * 2.5, bb[1] - Math.sin(run.crank) * 2.5];
	const knee = [ox + 1, oy - 10 + low * 0.5];
	line(s, hip[0], hip[1], knee[0], knee[1]);
	line(s, knee[0], knee[1], foot[0], foot[1]);
	line(s, hip[0], hip[1], knee[0] - 1, knee[1] + 1);
	line(s, knee[0] - 1, knee[1] + 1, foot2[0], foot2[1]);
	line(s, head[0] + 1, head[1] - 2, shoulder[0], shoulder[1]);
	s.fillStyle = pal.accent;
	line(s, hip[0], hip[1], shoulder[0], shoulder[1]);
	line(s, hip[0] + 1, hip[1], shoulder[0] + 1, shoulder[1]);
	s.fillRect(helmet[0] - 1, helmet[1] - 1, 4, 3);
	s.fillStyle = pal.fg;
	px(s, helmet[0] + 3, helmet[1] + 1);
}

export default function Singletrack() {
	const frame = useAppFrame();
	const pal = usePalette();
	const stage = useRef<GameCanvasHandle>(null);
	const wrap = useRef<HTMLDivElement>(null);
	const [phase, setPhase] = useState<Phase>("ready");
	const [hud, setHud] = useState({ m: 0, best: 0, kmh: 0, msg: "" });
	const [focused, setFocused] = useState(false);
	const [sound, setSound] = useSound();
	const run = useRef<Run>(freshRun());
	const art = useRef<{ sky: HTMLCanvasElement; far: CanvasPattern | string; mid: CanvasPattern | string; rider: CanvasRenderingContext2D | null; riderCanvas: HTMLCanvasElement } | null>(null);
	const lastHud = useRef(0);

	const enabled = frame?.embedded ? focused : (frame?.active ?? true);
	const input = useInput({ hop: { keys: ["Space", "ArrowUp", "KeyW"], pad: [0] }, pump: { keys: ["ArrowDown", "KeyS", "ShiftLeft", "ShiftRight"], pad: [1, 7] } }, enabled);

	useEffect(() => setHud((h) => ({ ...h, best: readBest("singletrack") })), []);

	// Re-paint the scenery whenever the theme changes.
	useEffect(() => {
		const ctx = stage.current?.ctx;
		if (!pal || !ctx) return;
		const riderCanvas = document.createElement("canvas");
		riderCanvas.width = 40;
		riderCanvas.height = 32;
		art.current = {
			sky: paintSky(pal),
			far: ditherPattern(ctx, pal.sky, pal.bg, 0.75),
			mid: ditherPattern(ctx, pal.mix(pal.rgb.sky, pal.rgb.fg, 0.55), pal.sky, 0.55),
			rider: riderCanvas.getContext("2d"),
			riderCanvas,
		};
	}, [pal]);

	const start = useCallback(() => {
		run.current = freshRun();
		input.endFrame(); // the key that started the run is not also a hop
		setPhase("riding");
		beep(520, 50);
		setTimeout(() => beep(780, 70), 70);
	}, [input]);

	const end = useCallback((why: string) => {
		const r = run.current;
		r.message = why;
		r.shake = 6;
		noise(260, 0.08);
		const m = Math.floor(r.x / PX_PER_M);
		const best = saveBest("singletrack", m);
		setHud({ m, best, kmh: 0, msg: why });
		setPhase("over");
	}, []);

	const update = (dt: number) => {
		const r = run.current;
		if (r.message) return;
		r.pump = input.down("pump");
		const k = r.pump ? 1.75 : 1;
		if (r.grounded) {
			const th = Math.atan(slope(r.x));
			let a = -G * Math.sin(th) * k;
			// The rider pedals harder when slow, enough for gentle climbs but not the big ones.
			a += r.v < 55 ? 70 : r.v < 80 ? 30 : 0;
			a -= r.v * 0.06 + r.v * r.v * 0.0009;
			r.v = Math.max(0, r.v + a * dt);
			const nx = r.x + r.v * Math.cos(th) * dt;
			// Leave the ground when the trail drops away faster than gravity pulls.
			const vy = r.v * Math.sin(th);
			const ballistic = r.y + vy * dt - 0.5 * G * k * dt * dt;
			const gy = ground(nx);
			if (input.pressed("hop")) {
				r.grounded = false;
				r.vx = r.v * Math.cos(th) - Math.sin(th) * HOP * 0.3;
				r.vy = vy + HOP;
				r.x = nx;
				r.y = gy + 0.5;
				beep(660, 40, { slide: 240 });
			} else if (gy < ballistic - 0.6 && r.v > 40) {
				r.grounded = false;
				r.vx = r.v * Math.cos(th);
				r.vy = vy;
				r.x = nx;
				r.y = ballistic;
			} else {
				r.x = nx;
				r.y = gy;
			}
			r.angle += (th - r.angle) * Math.min(1, dt * 18);
			r.slow = r.v < 14 ? r.slow + dt : 0;
			if (r.slow > 1.4) end("Out of steam");
		} else {
			r.vy -= G * k * dt;
			r.x += r.vx * dt;
			r.y += r.vy * dt;
			r.air += dt;
			const target = Math.atan2(r.vy, Math.max(1, r.vx)) * 0.8;
			r.angle += (target - r.angle) * Math.min(1, dt * 6);
			const gy = ground(r.x);
			if (r.y <= gy) {
				const th = Math.atan(slope(r.x));
				const miss = Math.abs(r.angle - th);
				r.v = Math.max(0, r.vx * Math.cos(th) + r.vy * Math.sin(th));
				r.y = gy;
				r.grounded = true;
				for (let i = 0; i < 6; i++) r.dust.push({ x: r.x - 4 + i * 1.5, y: gy, vx: (Math.random() - 0.5) * 50 - 20, vy: 20 + Math.random() * 40, life: 0.4 });
				if (miss > 0.95 && r.air > 0.25) end("Wiped out");
				else if (miss > 0.5) {
					r.v *= 0.6;
					noise(90, 0.05);
				} else beep(220, 30, { type: "triangle", gain: 0.06 });
				r.air = 0;
			}
		}
		r.crank += (r.v / 4) * dt;

		// Rocks: placed ahead, closer together the farther you get.
		while (r.nextRock < r.x + W * 1.5) {
			const far = Math.min(1, r.x / 9000);
			r.rocks.push({ x: r.nextRock, w: 6 + Math.floor(hash(r.nextRock) * 5), h: 4 + Math.floor(hash(r.nextRock + 9) * 5) });
			r.nextRock += 150 + hash(r.nextRock * 3) * (330 - far * 160) - far * 40;
		}
		r.rocks = r.rocks.filter((k2) => k2.x > r.x - W);
		for (const rock of r.rocks) {
			if (r.x + 6 > rock.x && r.x - 6 < rock.x + rock.w && r.y - ground(rock.x + rock.w / 2) < rock.h - 1) {
				end("Clipped a rock");
				break;
			}
		}
		for (const d of r.dust) {
			d.x += d.vx * dt;
			d.y += d.vy * dt;
			d.vy -= G * 0.5 * dt;
			d.life -= dt;
		}
		r.dust = r.dust.filter((d) => d.life > 0);
		r.camY += (r.y - r.camY) * Math.min(1, dt * 4);
		if (r.shake > 0) r.shake -= dt * 30;
		input.endFrame();

		const now = performance.now();
		if (now - lastHud.current > 120) {
			lastHud.current = now;
			setHud((h) => ({ ...h, m: Math.floor(r.x / PX_PER_M), kmh: Math.round((r.grounded ? r.v : Math.hypot(r.vx, r.vy)) / PX_PER_M * 3.6) }));
		}
	};

	const render = () => {
		const ctx = stage.current?.ctx;
		const a = art.current;
		if (!ctx || !a || !pal) return;
		const r = run.current;
		const camX = r.x - RIDER_X;
		const horizon = H * 0.64;
		const sy = (elev: number) => Math.round(horizon - (elev - r.camY));
		const shake = r.shake > 0 ? Math.round((Math.random() - 0.5) * r.shake) : 0;
		ctx.save();
		ctx.translate(0, shake);
		ctx.drawImage(a.sky, 0, 0);
		// Two ridges of distant hills, slower than the trail.
		ctx.fillStyle = a.far;
		for (let x = 0; x < W; x++) {
			const y = Math.round(farRidge(camX * 0.2 + x) + (r.camY - ground(0)) * 0.1);
			ctx.fillRect(x, y, 1, H - y);
		}
		ctx.fillStyle = a.mid;
		for (let x = 0; x < W; x++) {
			const y = Math.round(midRidge(camX * 0.45 + x) + (r.camY - ground(0)) * 0.25);
			ctx.fillRect(x, y, 1, H - y);
		}
		// Pines along the near ridge.
		ctx.fillStyle = pal.mix(pal.rgb.sky, pal.rgb.fg, 0.85);
		const step = 9;
		const first = Math.floor((camX * 0.45) / step) * step;
		for (let wx = first; wx < camX * 0.45 + W + step; wx += step) {
			if (hash(wx) < 0.55) continue;
			const x = Math.round(wx - camX * 0.45);
			const base = Math.round(midRidge(wx) + (r.camY - ground(0)) * 0.25) + 1;
			const tall = 5 + Math.floor(hash(wx + 1) * 6);
			for (let i = 0; i < tall; i++) {
				const half = Math.floor((i / tall) * 3);
				ctx.fillRect(x - half, base - tall + i, half * 2 + 1, 1);
			}
		}
		// The trail and the hill under it.
		for (let x = 0; x < W; x++) {
			const y = sy(ground(camX + x));
			ctx.fillStyle = pal.fg;
			ctx.fillRect(x, y + 1, 1, H - y);
			ctx.fillStyle = pal.accent;
			ctx.fillRect(x, y, 1, 2);
		}
		// Rocks.
		for (const rock of r.rocks) {
			const x = Math.round(rock.x - camX);
			if (x < -12 || x > W) continue;
			const y = sy(ground(rock.x + rock.w / 2));
			ctx.fillStyle = pal.fg;
			ctx.fillRect(x, y - rock.h, rock.w, rock.h + 1);
			ctx.fillStyle = pal.mix(pal.rgb.bg, pal.rgb.fg, 0.3);
			ctx.fillRect(x + 1, y - rock.h + 1, rock.w - 2, rock.h - 1);
			ctx.fillStyle = pal.bg;
			ctx.fillRect(x + 1, y - rock.h + 1, Math.max(1, rock.w - 4), 1);
		}
		// Dust.
		ctx.fillStyle = pal.fg;
		for (const d of r.dust) px(ctx, d.x - camX, sy(d.y));
		// Rider.
		if (a.rider) {
			paintRider(a.rider, pal, r);
			ctx.save();
			ctx.translate(RIDER_X, sy(r.y));
			ctx.rotate(-r.angle);
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(a.riderCanvas, -20, -28);
			ctx.restore();
		}
		ctx.restore();
	};

	useGameLoop({ update, render, running: phase === "riding" && enabled });
	useEffect(() => {
		if (pal) render();
	});

	// Space or tap starts a run from the title or game-over card.
	useEffect(() => {
		if (!enabled || phase === "riding") return;
		const onKey = (e: KeyboardEvent) => {
			if (e.code === "Space" || e.code === "Enter") {
				e.preventDefault();
				start();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [enabled, phase, start]);

	const paused = phase === "riding" && !enabled;
	return (
		<Window
			footer={
				<div className="flex items-center gap-3 px-3 py-1.5 font-ui text-xs tabular-nums">
					<span>{hud.m} m</span>
					<span>{hud.kmh} km/h</span>
					<span className="ml-auto">Best {hud.best} m</span>
					<button type="button" className="btn py-0 text-xs" aria-pressed={sound} onClick={() => setSound(!sound)}>
						{sound ? "Sound on" : "Sound off"}
					</button>
					<button type="button" className="btn hidden py-0 text-xs sm:block" onClick={() => toggleFullscreen(wrap.current)}>
						Full screen
					</button>
				</div>
			}
		>
			{/* biome-ignore lint/a11y/noNoninteractiveTabindex: the stage takes focus so keys go to the game */}
			<div
				ref={wrap}
				tabIndex={0}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				className="game-wrap bg-white p-2 outline-none"
			>
				<GameCanvas
					ref={stage}
					width={W}
					height={H}
					label="Singletrack: a mountain biker rides rolling dithered hills"
					onPointerDown={() => {
						if (phase !== "riding") start();
					}}
				>
					{phase !== "riding" && (
						<div className="pop-in absolute inset-0 flex items-center justify-center p-3">
							<div className="win max-w-[30ch] p-3 text-center text-xs">
								{phase === "ready" ? (
									<>
										<p className="font-ui text-base">Singletrack</p>
										<p className="mt-1">Hold pump on the downhills, let go on the climbs. Hop the rocks.</p>
										<p className="mt-2 font-ui">Space / tap to ride</p>
									</>
								) : (
									<>
										<p className="font-ui text-base">{hud.msg}</p>
										<p className="mt-1 tabular-nums">
											{hud.m} m{hud.m >= hud.best && hud.m > 0 ? " · new best" : ` · best ${hud.best} m`}
										</p>
										<p className="mt-2 font-ui">Space / tap to ride again</p>
									</>
								)}
							</div>
						</div>
					)}
					{paused && (
						<div className="absolute inset-0 flex items-center justify-center">
							<span className="win px-3 py-1 font-ui text-xs">Paused · click to resume</span>
						</div>
					)}
				</GameCanvas>
				<p className="mt-2 hidden text-center font-ui text-[11px] pointer-fine:block">Space hop · hold ↓ pump</p>
				<div className="mt-2 grid grid-cols-2 gap-2 pointer-fine:hidden">
					<button type="button" className="btn py-3" {...touchHandlers(input, "hop")}>Hop</button>
					<button type="button" className="btn py-3" {...touchHandlers(input, "pump")}>Pump (hold)</button>
				</div>
			</div>
		</Window>
	);
}
