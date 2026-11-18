import { type ComponentType, lazy } from "react";
import type { AppDef, AppProps } from "./define";

/**
 * Every app on the desktop. Each lives in its own folder with an `app.tsx` that
 * default-exports `defineApp({...})`; dropping in a new folder is all it takes.
 */
const modules = import.meta.glob<AppDef>("./*/app.tsx", { eager: true, import: "default" });

export const apps: AppDef[] = Object.values(modules).sort((a, b) => (a.order ?? 50) - (b.order ?? 50) || a.title.localeCompare(b.title));
const byId = new Map(apps.map((a) => [a.id, a]));

export const getApp = (id: string) => byId.get(id);
export const appsIn = (place: AppDef["place"]) => apps.filter((a) => a.place === place);
/** Apps that open a window (rather than running an action). */
export const hasWindow = (a: AppDef) => Boolean(a.component || a.load);

const lazies = new Map<string, ComponentType<AppProps>>();
/** The app's window body; lazy apps get a React.lazy wrapper made once. */
export function appBody(a: AppDef): ComponentType<AppProps> | null {
	if (a.component) return a.component;
	if (!a.load) return null;
	let c = lazies.get(a.id);
	if (!c) {
		c = lazy(a.load);
		lazies.set(a.id, c);
	}
	return c;
}

/** The window an URL shows: an app's own route, or /apps/<id>. */
export function routeWin(pathname: string): string | null {
	if (pathname.startsWith("/blog/")) return "post";
	const m = pathname.match(/^\/apps\/([^/]+)\/?$/);
	if (m) {
		const app = getApp(decodeURIComponent(m[1]));
		return app && hasWindow(app) ? app.id : null;
	}
	const path = pathname.replace(/\/+$/, "") || "/";
	for (const a of apps) if (a.route && (path === a.route || path.startsWith(`${a.route}/`))) return a.id;
	return null;
}

/** Where opening this app should navigate, if anywhere. */
export const routeOf = (id: string) => getApp(id)?.route;
