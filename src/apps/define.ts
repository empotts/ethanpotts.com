import type { ComponentType } from "react";
import type { IconName } from "@/components/icons";
import type { PostSummary } from "@/posts/worker";

export type InfoRow = [string, string];

/** What a Get Info row builder can read. */
export type DesktopData = { posts: PostSummary[] };

export type AppProps<P = unknown> = {
	/** Data the app was opened with: `openWin(id, { payload })`. */
	payload: P | undefined;
};

export type AppDef = {
	/** Also the URL slug: every window app opens at /apps/<id>. */
	id: string;
	title: string;
	icon: IconName | "logo";
	/** Where its icon lives. `hidden` apps open only from code, links or typed words. */
	place: "main" | "extras" | "games" | "hidden";
	/** Sort order within its place. */
	order?: number;
	/** One sentence for share cards, Get Info and the markdown view. */
	description?: string;
	/** Desktop position and size on wide screens. */
	window?: {
		x: number;
		y: number;
		width: number;
		/** Fixed body height; omit to size to content. */
		height?: number;
		/** Shows a grow box in the corner. */
		resizable?: boolean;
		minWidth?: number;
		minHeight?: number;
	};
	/** A page path this app owns; opening the app navigates there. */
	route?: string;
	/** Runs instead of opening a window (Camera, Screensaver). */
	launch?: () => void;
	/** Rows for Get Info (Alt + double-click). */
	info?: (data: DesktopData) => InfoRow[];
	/** The window body, bundled with the desktop. Small apps use this. */
	component?: ComponentType<AppProps>;
	/** The window body, downloaded when first opened. Games and big apps use this. */
	load?: () => Promise<{ default: ComponentType<AppProps> }>;
};

/** Identity helper so each app file gets type checking. */
export const defineApp = <P = unknown>(def: Omit<AppDef, "component"> & { component?: ComponentType<AppProps<P>> }): AppDef =>
	def as AppDef;
