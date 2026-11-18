/**
 * Small kit for desktop games: a fixed-step loop, input that only listens while
 * the window is in front, theme-aware palettes, crisp pixel canvases, beeps and
 * a personal best. See src/apps/singletrack for a game built on it.
 */
export { readBest, saveBest } from "./best";
export { GameCanvas, type GameCanvasHandle, toggleFullscreen } from "./GameCanvas";
export { type Bindings, type Input, touchHandlers, useInput } from "./input";
export { useGameLoop } from "./loop";
export { mixRGB, type Palette, parseColor, type RGB, readPalette, usePalette } from "./palette";
export { beep, noise, setSound, useSound } from "./sound";
