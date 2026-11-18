import { readPalette } from "@/kit/game/palette";
import { onPaletteChange } from "./theme";
import { DIPPER, localHour, wallpaperMode, wallpaperShot } from "./Wallpaper";

/*
 * WebGL 2 wallpaper. Every pixel picks two palette colours and a density, then an
 * 8×8 Bayer matrix decides which one shows, so gradients stay dithered at any
 * size. Runs at ~24 fps (hidden tabs skip frames) and is cheap enough to use
 * a finer pixel than the 2D renderer.
 */

const PIXEL = 2; // CSS pixels per dither pixel

const VERT = `#version 300 es
in vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uT;
uniform float uPan;
uniform vec2 uPar;
uniform vec3 uBg, uFg, uSky, uSun;
uniform float uColor;
uniform float uDay;
uniform vec3 uBody;
uniform vec2 uDip[7];
uniform vec4 uShot;
uniform float uShotK;
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
	vec2 p = vec2(floor(gl_FragCoord.x), floor(uRes.y - gl_FragCoord.y));
	float w = uRes.x; float h = uRes.y;
	float th = bayer(p);
	bool color = uColor > 0.5;
	bool day = uDay > 0.5;

	float base[4] = float[4](0.66, 0.74, 0.83, 0.93);
	float amp[4] = float[4](0.09, 0.09, 0.08, 0.06);
	float freq[4] = float[4](2.2, 3.2, 4.8, 7.0);
	float spd[4] = float[4](0.000002, 0.000005, 0.00001, 0.00002);
	float fill[4] = float[4](0.14, 0.28, 0.46, 0.68);
	float tint[4] = float[4](0.0, 0.3, 0.65, 1.0);
	float lift[4] = float[4](0.22, 0.14, 0.06, 0.0);

	int layer = -1; float ry = 0.0;
	for (int i = 3; i >= 0; i--) {
		float fi = float(i);
		float px = p.x + uPar.x * (fi + 1.0);
		float r = (base[i] - fbm1((px / w) * freq[i] + uT * spd[i] + uPan * (fi + 1.0) * 0.6 + fi * 31.0) * amp[i]) * h + uPar.y * (fi + 1.0);
		if (p.y >= r) { layer = i; ry = r; break; }
	}

	vec3 A = uBg; vec3 B = uFg; float d = 0.0;
	vec3 starInk = color ? uSun : uFg;
	if (layer >= 0) {
		float below = p.y - ry;
		B = color ? mix(uSky, uFg, tint[layer]) : uFg;
		d = below < 1.0 ? 1.0 : fill[layer] + (color ? lift[layer] : 0.0) + (below / h) * 0.5;
	} else {
		float sky = p.y / h;
		if (color) {
			B = day ? uSky : mix(uSky, uFg, 0.6);
			d = day ? 0.46 * (1.0 - sky * 1.5) : 0.62 * (1.0 - sky * 0.95);
		} else {
			d = day ? 0.05 * (1.0 - sky * 1.6) : 0.2 * (1.0 - sky * 1.2);
		}
		vec2 dd = p - uBody.xy; float r = length(dd); float R = uBody.z;
		if (day) {
			if (r < R) { B = color ? uSun : uFg; d = r > R - 1.0 ? 1.0 : (color ? 0.85 : 0.22); }
			else if (r < R * 1.9) {
				if (color) { if (th < 0.14) { B = uSun; d = 1.0; } }
				else d = max(d, 0.08);
			}
			if (sky < 0.6) {
				float drift = uT * 0.0006;
				float n = noise2(vec2(p.x / 26.0 + drift, p.y / 8.0)) * 0.65 + noise2(vec2(p.x / 9.0 + drift * 1.7, p.y / 4.0)) * 0.35;
				if (n > 0.6) {
					float un = noise2(vec2(p.x / 26.0 + drift, (p.y + 2.0) / 8.0)) * 0.65 + noise2(vec2(p.x / 9.0 + drift * 1.7, (p.y + 2.0) / 4.0)) * 0.35;
					if (color) { B = mix(uSky, uFg, 0.3); d = un > 0.6 ? 0.0 : 0.4; }
					else d = un > 0.6 ? 0.1 : 0.32;
				}
			}
		} else {
			float cut = length(dd - vec2(R * 0.45, -R * 0.15));
			if (r < R && cut > R * 0.85) d = 0.0;
			else if (r < R) { B = starInk; d = color ? 0.75 : max(d, 0.25); }
		}
	}
	vec3 c = d > th ? B : A;

	if (!day && layer < 0) {
		// Twinkling stars, the Big Dipper and the hourly shooting star.
		float s = hash(p.x * 12.9898 + p.y * 78.233);
		if (s > 0.9965 && p.y < h * 0.62) {
			bool on = sin(uT / 700.0 + p.x * 0.37) * 0.5 + 0.5 > 0.35 - (s - 0.9965) * 100.0;
			c = on ? starInk : A;
		}
		for (int k = 0; k < 7; k++) {
			vec2 q = abs(p - uDip[k]);
			if ((q.x < 0.5 && q.y < 1.5) || (q.y < 0.5 && q.x < 1.5)) c = starInk;
		}
		if (uShotK >= 0.0 && uShotK <= 1.0) {
			for (int j = 0; j < 14; j++) {
				float q = uShotK - float(j) * 0.012;
				if (q < 0.0) break;
				if (j > 8 && (j & 1) == 1) continue;
				vec2 sp = floor(mix(uShot.xy, uShot.zw, q));
				if (p == sp) c = starInk;
			}
		}
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

/** Starts the WebGL wallpaper on `canvas`; returns its cleanup, or null if WebGL 2 is unavailable. */
export function startGL(canvas: HTMLCanvasElement): (() => void) | null {
	const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, preserveDrawingBuffer: false });
	if (!gl) return null;
	const vs = compile(gl, gl.VERTEX_SHADER, VERT);
	const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
	const prog = gl.createProgram();
	if (!vs || !fs || !prog) return null;
	gl.attachShader(prog, vs);
	gl.attachShader(prog, fs);
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
	gl.useProgram(prog);
	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const loc = gl.getAttribLocation(prog, "a");
	gl.enableVertexAttribArray(loc);
	gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
	const u = (n: string) => gl.getUniformLocation(prog, n);
	const U = {
		res: u("uRes"), t: u("uT"), pan: u("uPan"), par: u("uPar"), bg: u("uBg"), fg: u("uFg"), sky: u("uSky"), sun: u("uSun"),
		color: u("uColor"), day: u("uDay"), body: u("uBody"), dip: u("uDip"), shot: u("uShot"), shotK: u("uShotK"),
	};

	const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	let w = 0;
	let h = 0;
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
		gl.uniform1f(U.color, document.documentElement.dataset.color === "off" ? 0 : 1);
	};
	const resize = () => {
		w = Math.max(1, Math.ceil(canvas.clientWidth / PIXEL));
		h = Math.max(1, Math.ceil(canvas.clientHeight / PIXEL));
		canvas.width = w;
		canvas.height = h;
		gl.viewport(0, 0, w, h);
		gl.uniform2f(U.res, w, h);
	};

	const draw = (t: number) => {
		const hour = localHour();
		if (wallpaperMode.saver) pan += Math.min(200, t - lastT) * 0.00025;
		lastT = t;
		const dayP = (hour - 6.5) / 13;
		const isDay = !wallpaperMode.night && dayP > 0 && dayP < 1;
		const p = isDay ? dayP : wallpaperMode.night && dayP > 0 && dayP < 1 ? 0.3 : ((hour - 19.5 + 24) % 24) / 11;
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
		gl.uniform3f(U.body, (0.12 + Math.min(1, p) * 0.76) * w, (0.5 - Math.sin(Math.min(1, p) * Math.PI) * 0.36) * h, Math.max(6, Math.min(w, h) * 0.05));
		const unit = Math.max(2, Math.min(w, h) / 45);
		gl.uniform2fv(U.dip, DIPPER.flatMap(([dx, dy]) => [Math.floor(w * 0.56 + dx * unit), Math.floor(h * 0.08 + dy * unit)]));
		gl.uniform4f(U.shot, w * 0.18, h * 0.06, w * 0.5, h * 0.3);
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
	wallpaperShot.take = () => {
		// Draw now and copy in the same task, then scale up without smoothing so the dither survives.
		draw(performance.now());
		const out = document.createElement("canvas");
		out.width = w * 3;
		out.height = h * 3;
		const o = out.getContext("2d");
		if (!o) return canvas.toDataURL("image/png");
		o.imageSmoothingEnabled = false;
		o.drawImage(canvas, 0, 0, out.width, out.height);
		return out.toDataURL("image/png");
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
		wallpaperShot.take = null;
		wallpaperMode.redraw = () => {};
		wallpaperMode.shoot = () => {};
		cancelAnimationFrame(raf);
		ro.disconnect();
		offPalette();
		window.removeEventListener("pointermove", onPointer);
		canvas.removeEventListener("webglcontextlost", onLost);
	};
}
