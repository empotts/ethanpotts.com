import { readPalette } from "@/kit/game/palette";
import { onPaletteChange } from "./theme";
import { DIPPER, localHour, wallpaperMode, wallpaperShot } from "./Wallpaper";

/*
 * WebGL 2 wallpaper. Every pixel picks two palette colours and a density, then an
 * 8×8 Bayer matrix decides which one shows, so gradients stay dithered at any
 * size. Runs at ~24 fps (hidden tabs skip frames).
 *
 * The dither runs at one CSS pixel; the scene (hills, sun, clouds, stars) is laid
 * out in units of SCENE pixels, so a finer dither doesn't shrink the picture.
 */

const SCENE = 2; // CSS pixels per scene unit
/** CSS pixels per dither pixel: 1, or 2 on very large screens so the shader stays cheap. */
const pixelFor = (cw: number, ch: number) => (cw * ch > 3_000_000 ? 2 : 1);

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uK; // dither pixels per scene unit
uniform float uT;
uniform float uPan;
uniform vec2 uPar;
uniform vec3 uBg, uFg, uSky, uSun, uDusk, uRose;
uniform float uDay;
uniform vec3 uBody;
uniform vec2 uDip[7];
uniform vec4 uShot;
uniform float uShotK;
uniform int uMode; // 0 live · 1 sunrise · 2 golden hour · 3 night · 4 rain · 5 snow · 6 fog
uniform float uGlow; // warm horizon at sunrise and golden hour
uniform vec3 uLight; // the lighter of ink and paper, for snowflakes
out vec4 o;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float noise1(float x) { float i = floor(x); float f = x - i; float u = f * f * (3.0 - 2.0 * f); return mix(hash(i), hash(i + 1.0), u); }
float fbm1(float x) { return noise1(x) * 0.6 + noise1(x * 2.1 + 7.0) * 0.28 + noise1(x * 4.3 + 19.0) * 0.12; }
float h2(vec2 p) { return hash(p.x * 57.0 + p.y * 131.0); }
float noise2(vec2 p) {
	vec2 i = floor(p); vec2 f = p - i; vec2 u = f * f * (3.0 - 2.0 * f);
	return mix(mix(h2(i), h2(i + vec2(1.0, 0.0)), u.x), mix(h2(i + vec2(0.0, 1.0)), h2(i + vec2(1.0, 1.0)), u.x), u.y);
}
float bayer(vec2 p) {
	int x = int(mod(p.x, 8.0)); int y = int(mod(p.y, 8.0)); int z = x ^ y;
	int v = ((z & 1) << 5) | ((y & 1) << 4) | ((z & 2) << 2) | ((y & 2) << 1) | ((z & 4) >> 1) | ((y & 4) >> 2);
	return (float(v) + 0.5) / 64.0;
}

void main() {
	// f: the dither pixel. p: where it falls in the scene. ps: the scene cell, for things drawn as whole cells.
	vec2 f = vec2(floor(gl_FragCoord.x), floor(uRes.y - gl_FragCoord.y));
	vec2 p = (f + 0.5) / uK;
	vec2 ps = floor(p);
	float w = uRes.x / uK; float h = uRes.y / uK;
	float th = bayer(f);
	bool day = uDay > 0.5;
	bool rain = uMode == 4;
	bool snow = uMode == 5;
	bool fog = uMode == 6;
	bool overcast = rain || snow;

	float base[4] = float[4](0.66, 0.74, 0.83, 0.93);
	float amp[4] = float[4](0.09, 0.09, 0.08, 0.06);
	float freq[4] = float[4](2.2, 3.2, 4.8, 7.0);
	float spd[4] = float[4](0.000002, 0.000005, 0.00001, 0.00002);
	float fill[4] = float[4](0.14, 0.28, 0.46, 0.68);
	float lift[4] = float[4](0.22, 0.14, 0.06, 0.0);
	float haze[4] = float[4](0.22, 0.38, 0.6, 0.85);

	int layer = -1; float ry = 0.0;
	for (int i = 3; i >= 0; i--) {
		float fi = float(i);
		float px = p.x + uPar.x * (fi + 1.0);
		float r = (base[i] - fbm1((px / w) * freq[i] + uT * spd[i] + uPan * (fi + 1.0) * 0.6 + fi * 31.0) * amp[i]) * h + uPar.y * (fi + 1.0);
		if (p.y >= r) { layer = i; ry = r; break; }
	}

	vec3 A = uBg; vec3 B = uFg; float d = 0.0;
	vec3 starInk = uSun;
	if (layer >= 0) {
		float below = p.y - ry;
		// Far ridges are sky-lilac, deepening through purple to ink in front.
		vec3 hill[4] = vec3[4](mix(uSky, uDusk, 0.45), mix(uDusk, uSky, 0.15), mix(uDusk, uFg, 0.4), mix(uDusk, uFg, 0.78));
		B = hill[layer];
		d = below < 0.75 ? 1.0 : fill[layer] + lift[layer] + (below / h) * 0.5;
		// Snow whitens the slopes but keeps the ridge lines.
		if (snow && below >= 1.0) d *= 0.4;
		// Fog swallows the far ridges first.
		if (fog) d *= haze[layer];
	} else {
		float sky = p.y / h;
		B = day ? uSky : mix(uSky, uDusk, 0.3);
		d = day ? 0.46 * (1.0 - sky * 1.5) : 0.62 * (1.0 - sky * 0.95);
		// A coral glow low in a clear sky: the hue dithers from sky to coral toward the
		// hills. Softer on dark themes and at night, where full coral is too loud.
		if (!rain && !snow && !fog && sky > 0.24) {
			float k = smoothstep(0.24, 0.64, sky);
			bool darkBg = dot(uBg, vec3(0.2126, 0.7152, 0.0722)) < 0.5;
			vec3 glow = mix(uRose, uDusk, min(0.85, (darkBg ? 0.6 : 0.0) + (day ? 0.0 : 0.3)));
			if (bayer(f + vec2(5.0, 2.0)) < k * (darkBg ? 0.6 : 0.8)) B = glow;
			d = max(d, k * (darkBg ? 0.12 : day ? 0.2 : 0.3));
		}
		if (rain) { B = mix(uSky, uFg, 0.45); d = 0.5 * (1.0 - sky * 0.8); }
		if (snow) { B = mix(uSky, uFg, 0.35); d = 0.86 - sky * 0.3; }
		if (fog) d *= 0.35;
		vec2 dd = p - uBody.xy; float r = length(dd); float R = uBody.z;
		if (day) {
			if (!overcast) {
				if (r < R) { B = uSun; d = r > R - 0.75 ? 1.0 : 0.85; if (fog) d *= 0.5; }
				else if (r < R * 1.9 && th < 0.14) { B = uSun; d = 1.0; }
			}
			float cover = rain ? 0.36 : snow ? 0.5 : 0.6;
			if (sky < (overcast ? 0.75 : 0.6) && !fog) {
				float drift = uT * (rain ? 0.0016 : 0.0006);
				float n = noise2(vec2(p.x / 26.0 + drift, p.y / 8.0)) * 0.65 + noise2(vec2(p.x / 9.0 + drift * 1.7, p.y / 4.0)) * 0.35;
				if (n > cover) {
					float un = noise2(vec2(p.x / 26.0 + drift, (p.y + 2.0) / 8.0)) * 0.65 + noise2(vec2(p.x / 9.0 + drift * 1.7, (p.y + 2.0) / 4.0)) * 0.35;
					B = rain || snow ? mix(uSky, uFg, rain ? 0.65 : 0.5) : mix(uDusk, uFg, 0.2);
					d = un > cover ? (rain ? 0.45 : snow ? 0.7 : 0.0) : (rain ? 0.7 : snow ? 0.9 : 0.4);
				}
			}
		} else {
			float cut = length(dd - vec2(R * 0.45, -R * 0.15));
			if (r < R && cut > R * 0.85) d = 0.0;
			else if (r < R) { B = starInk; d = 0.75; }
		}
		// Sunrise and golden hour: the low sky warms toward the sun colour.
		if (uGlow > 0.0 && sky > 0.2 && !(r < R * 1.9)) {
			float g = uGlow * (sky - 0.2) * 1.5;
			if (g > bayer(f + vec2(3.0, 5.0))) { B = sky > 0.45 ? uRose : uSun; d = 1.0; }
		}
	}
	vec3 c = d > th ? B : A;

	if (!day && layer < 0) {
		// Twinkling stars, the Big Dipper and the hourly shooting star.
		float s = hash(ps.x * 12.9898 + ps.y * 78.233);
		if (s > 0.9965 && p.y < h * 0.62) {
			bool on = sin(uT / 700.0 + ps.x * 0.37) * 0.5 + 0.5 > 0.35 - (s - 0.9965) * 100.0;
			c = on ? starInk : A;
		}
		for (int k = 0; k < 7; k++) {
			vec2 q = abs(ps - uDip[k]);
			if ((q.x < 0.5 && q.y < 1.5) || (q.y < 0.5 && q.x < 1.5)) c = starInk;
		}
		if (uShotK >= 0.0 && uShotK <= 1.0) {
			for (int j = 0; j < 14; j++) {
				float q = uShotK - float(j) * 0.012;
				if (q < 0.0) break;
				if (j > 8 && (j & 1) == 1) continue;
				vec2 sp = floor(mix(uShot.xy, uShot.zw, q));
				if (ps == sp) c = starInk;
			}
		}
	}

	if (rain) {
		// Slanted streaks falling across everything.
		float col = ps.x + floor(ps.y * 0.4);
		float hs = hash(col * 1.37);
		if (hs > 0.93) {
			float fr = fract((p.y - uT * 0.22 + hs * 500.0) / 38.0);
			if (fr < 0.16) c = mix(uSky, uFg, 0.75);
		}
	}
	if (snow) {
		// Flakes drifting down on a wobble.
		vec2 q = vec2(p.x + sin(uT * 0.0007 + p.y * 0.04) * 3.0, p.y - uT * 0.012);
		vec2 cell = floor(q / 11.0);
		float hs = hash(cell.x * 7.13 + cell.y * 91.7);
		vec2 ctr = cell * 11.0 + vec2(floor(hash(cell.x + cell.y * 3.1) * 7.0) + 2.0, floor(hs * 7.0) + 2.0);
		vec2 dq = abs(floor(q) - ctr);
		// Plus-shaped flakes, a few chunkier squares: big enough to read against the dither.
		if (hs > 0.35 && (dq.x + dq.y < 1.5 || (hs > 0.8 && max(dq.x, dq.y) < 1.5))) c = uLight;
	}
	o = vec4(c, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
	const sh = gl.createShader(type);
	if (!sh) return null;
	gl.shaderSource(sh, src);
	gl.compileShader(sh);
	if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
		console.warn(gl.getShaderInfoLog(sh));
		return null;
	}
	return sh;
}

function build(gl: WebGL2RenderingContext) {
	const vs = compile(gl, gl.VERTEX_SHADER, VERT);
	const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
	const prog = gl.createProgram();
	if (!vs || !fs || !prog) return null;
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	return gl.getProgramParameter(prog, gl.LINK_STATUS) ? prog : null;
}

/**
 * Whether the shader builds here, tried on a throwaway canvas: once a canvas has
 * a WebGL context it can never give a 2D one, so the fallback needs a clean canvas.
 */
let supported: boolean | null = null;
function glWorks() {
	if (supported === null) {
		const gl = document.createElement("canvas").getContext("webgl2");
		supported = Boolean(gl && build(gl));
		gl?.getExtension("WEBGL_lose_context")?.loseContext();
	}
	return supported;
}

/** Starts the WebGL wallpaper on `canvas`; returns its cleanup, or null if WebGL 2 is unavailable. */
export function startGL(canvas: HTMLCanvasElement): (() => void) | null {
	if (!glWorks()) return null;
	const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false });
	if (!gl) return null;
	const prog = build(gl);
	if (!prog) return null;
	gl.useProgram(prog);
	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const loc = gl.getAttribLocation(prog, "a");
	gl.enableVertexAttribArray(loc);
	gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
	const u = (n: string) => gl.getUniformLocation(prog, n);
	const U = {
		res: u("uRes"), k: u("uK"), t: u("uT"), pan: u("uPan"), par: u("uPar"), bg: u("uBg"), fg: u("uFg"), sky: u("uSky"), sun: u("uSun"), dusk: u("uDusk"), rose: u("uRose"),
		day: u("uDay"), body: u("uBody"), dip: u("uDip"), shot: u("uShot"), shotK: u("uShotK"),
		mode: u("uMode"), glow: u("uGlow"), light: u("uLight"),
	};

	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let w = 0;
	let h = 0;
	let px = 1;
	let pan = 0;
	let lastT = 0;
	let shotAt = -1e9;
	let shotHour = -1;
	const par = { x: 0, y: 0, tx: 0, ty: 0 };

	const readColors = () => {
		const p = readPalette().rgb;
		const f = (c: [number, number, number]) => [c[0] / 255, c[1] / 255, c[2] / 255] as const;
		gl.uniform3fv(U.bg, f(p.bg));
		gl.uniform3fv(U.fg, f(p.fg));
		gl.uniform3fv(U.sky, f(p.sky));
		gl.uniform3fv(U.sun, f(p.sun));
		gl.uniform3fv(U.dusk, f(p.dusk));
		gl.uniform3fv(U.rose, f(p.rose));
		const lum = (c: [number, number, number]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
		gl.uniform3fv(U.light, f(lum(p.bg) >= lum(p.fg) ? p.bg : p.fg));
	};
	const resize = () => {
		px = pixelFor(canvas.clientWidth, canvas.clientHeight);
		w = Math.max(1, Math.ceil(canvas.clientWidth / px));
		h = Math.max(1, Math.ceil(canvas.clientHeight / px));
		canvas.width = w;
		canvas.height = h;
		gl.viewport(0, 0, w, h);
		gl.uniform2f(U.res, w, h);
		gl.uniform1f(U.k, SCENE / px);
	};

	const draw = (t: number) => {
		const hour = localHour();
		if (wallpaperMode.saver) pan += Math.min(200, t - lastT) * 0.00025;
		lastT = t;
		const dayP = (hour - 6.5) / 13;
		const scene = wallpaperMode.scene;
		const live = scene === "live";
		// Where the sun or moon sits (0–1 across the sky) for each Forecast scene.
		const isDay = live ? dayP > 0 && dayP < 1 : scene !== "night";
		const p = live
			? isDay
				? dayP
				: ((hour - 19.5 + 24) % 24) / 11
			: scene === "sunrise"
				? 0.05
				: scene === "golden"
					? 0.94
					: scene === "night"
						? 0.3
						: 0.42;
		const MODES = { live: 0, sunrise: 1, golden: 2, night: 3, rain: 4, snow: 5, fog: 6 } as const;
		gl.uniform1i(U.mode, MODES[scene]);
		gl.uniform1f(U.glow, scene === "sunrise" || scene === "golden" ? 1 : 0);
		const hr = Math.floor(hour);
		if (!isDay && hour - hr < 1 / 60 && shotHour !== hr) {
			shotHour = hr;
			shotAt = t;
		}
		// Ease the parallax toward the pointer and the reading position.
		par.x += (par.tx - par.x) * 0.15;
		par.y += (par.ty - wallpaperMode.scroll * 6 - par.y) * 0.15;
		gl.uniform1f(U.t, t);
		gl.uniform1f(U.pan, pan);
		gl.uniform2f(U.par, Math.round(par.x * 2) / 2, Math.round(par.y * 2) / 2);
		gl.uniform1f(U.day, isDay ? 1 : 0);
		// Positions below are in scene units.
		const sw = (w * px) / SCENE;
		const sh = (h * px) / SCENE;
		gl.uniform3f(U.body, (0.12 + Math.min(1, p) * 0.76) * sw, (0.5 - Math.sin(Math.min(1, p) * Math.PI) * 0.36) * sh, Math.max(6, Math.min(sw, sh) * 0.05));
		const unit = Math.max(2, Math.min(sw, sh) / 45);
		gl.uniform2fv(U.dip, DIPPER.flatMap(([dx, dy]) => [Math.floor(sw * 0.56 + dx * unit), Math.floor(sh * 0.08 + dy * unit)]));
		gl.uniform4f(U.shot, sw * 0.18, sh * 0.06, sw * 0.5, sh * 0.3);
		gl.uniform1f(U.shotK, (t - shotAt) / 900);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};

	readColors();
	resize();
	draw(performance.now());
	canvas.dataset.ready = "";

	wallpaperMode.redraw = () => draw(performance.now());
	wallpaperMode.shoot = () => {
		shotAt = performance.now();
	};
	wallpaperShot.grab = (target) => {
		// Draw and copy in the same task: WebGL clears the canvas once the frame is shown.
		draw(performance.now());
		target.width = w;
		target.height = h;
		const o = target.getContext("2d");
		if (!o) return false;
		o.drawImage(canvas, 0, 0);
		return true;
	};

	const onPointer = (e: PointerEvent) => {
		if (reduce) return;
		par.tx = (e.clientX / window.innerWidth - 0.5) * -6;
		par.ty = (e.clientY / window.innerHeight - 0.5) * -3;
	};
	window.addEventListener("pointermove", onPointer, { passive: true });

	let raf = 0;
	let last = 0;
	const loop = (t: number) => {
		raf = requestAnimationFrame(loop);
		if (document.hidden || t - last < 42) return;
		last = t;
		draw(t);
	};
	if (!reduce) raf = requestAnimationFrame(loop);

	const ro = new ResizeObserver(() => {
		resize();
		draw(performance.now());
	});
	ro.observe(canvas);
	const offPalette = onPaletteChange(() => {
		readColors();
		draw(performance.now());
	});
	const onLost = (e: Event) => e.preventDefault();
	canvas.addEventListener("webglcontextlost", onLost);

	return () => {
		wallpaperShot.grab = null;
		wallpaperMode.redraw = () => {};
		wallpaperMode.shoot = () => {};
		cancelAnimationFrame(raf);
		ro.disconnect();
		offPalette();
		window.removeEventListener("pointermove", onPointer);
		canvas.removeEventListener("webglcontextlost", onLost);
	};
}
