import { createContext, useContext } from "react";
import type { DesktopData } from "@/apps/define";

/** Site data the desktop loads once (posts today) and hands to any app that asks. */
export const DesktopDataContext = createContext<DesktopData>({ posts: [] });
export const useDesktopData = () => useContext(DesktopDataContext);

/** Hooks the desktop fills in for apps that act on it rather than open a window. */
export const desktopActions = {
	startScreensaver: () => {},
};
