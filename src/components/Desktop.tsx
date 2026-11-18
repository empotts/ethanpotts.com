import { useNavigate, useRouterState } from "@tanstack/react-router";
import { Suspense, useEffect, useRef, useState } from "react";
import type { AppDef } from "@/apps/define";
import { appBody, apps, appsIn, getApp, hasWindow, routeWin } from "@/apps/index";
import type { Info } from "@/apps/info/app";
import type { PostSummary } from "@/posts/worker";
import { DesktopDataContext, desktopActions } from "./desktop/data";
import { greet, moveIconFocus, useArmAnimations, useScreensaver, useTypedWords } from "./desktop/hooks";
import { type DesktopApp, MenuBar } from "./desktop/MenuBar";
import { type IconName, PixelIcon } from "./icons";
import { Logo } from "./Logo";
import { Wallpaper } from "./Wallpaper";
import { AppFrameContext, DeskRef, Window } from "./Window";
import { closeWin, emptyTrash, openWin, trashTarget, useWindows } from "./windows";

/** A desktop icon. Option/Alt + double-click (or Alt+Enter) opens Get Info instead. */
function DeskIcon({ id, icon, label, onOpen, info }: DesktopApp) {
	const [sel, setSel] = useState(false);
	const act = (alt: boolean, el: Element) =>
		alt && info.length ? openWin("info", { payload: { icon, label, rows: info } satisfies Info, from: el }) : onOpen(el);
	return (
		<button
			type="button"
			data-desk-icon
			data-app-icon={id}
			onClick={() => setSel(true)}
			onDoubleClick={(e) => act(e.altKey, e.currentTarget)}
			onKeyDown={(e) => e.key === "Enter" && act(e.altKey, e.currentTarget)}
			onFocus={() => setSel(true)}
			onBlur={() => setSel(false)}
			className="desk-icon flex h-20 w-20 shrink-0 flex-col items-center gap-1 outline-none"
		>
			{icon === "logo" ? (
				<span className={`flex size-10 items-center justify-center ${sel ? "bg-black" : ""}`}>
					<Logo size={36} className={sel ? "!bg-white" : ""} />
				</span>
			) : (
				<PixelIcon name={icon} size={40} inverted={sel} />
			)}
			<span className={`px-1 text-center font-ui text-[13px] leading-tight ${sel ? "bg-black text-white" : "bg-white"}`}>{label}</span>
		</button>
	);
}

/** One app's window: its body inside the frame context, loaded on demand. */
function AppWindow({ app, active, payload, onClose }: { app: AppDef; active: boolean; payload: unknown; onClose: () => void }) {
	const Body = appBody(app);
	if (!Body) return null;
	return (
		<AppFrameContext.Provider value={{ app, active, embedded: false, close: onClose }}>
			<Suspense
				fallback={
					<Window>
						<p className="p-5 font-ui text-sm">Opening {app.title}…</p>
					</Window>
				}
			>
				<Body payload={payload} />
			</Suspense>
		</AppFrameContext.Provider>
	);
}

export function Desktop({ posts, children }: { posts: PostSummary[]; children: React.ReactNode }) {
	const desk = useRef<HTMLDivElement>(null);
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const current = routeWin(pathname);
	const { open, order, gen, trashed, opened, payload, seq } = useWindows();
	const [trash, setTrash] = useState(false);

	useTypedWords({ hogs: () => openWin("pregame"), band: () => openWin("pregame"), ride: () => openWin("singletrack") });
	useEffect(greet, []);
	useArmAnimations();

	// Never start the screensaver while someone is reading a post.
	desktopActions.startScreensaver = useScreensaver(current !== "post");

	useEffect(() => {
		if (current && current !== "post") openWin(current);
	}, [current]);

	// Opening a window from the menu bar while reading leaves the article for the desktop.
	const openedAt = useRef(opened);
	useEffect(() => {
		if (opened === openedAt.current) return;
		openedAt.current = opened;
		if (current === "post") navigate({ to: "/" });
	}, [opened, current, navigate]);

	const visible = new Set(open);
	if (current && current !== "post") visible.add(current);

	const closeApp = (id: string) => () => {
		closeWin(id);
		if (current === id) navigate({ to: "/" });
	};
	const launch = (app: AppDef) => (from?: Element) => {
		if (app.launch) app.launch();
		else if (app.route) navigate({ to: app.route });
		else if (app.place === "games") navigate({ to: "/apps/$id", params: { id: app.id } });
		else openWin(app.id, { from });
	};
	const toDesktop = (app: AppDef): DesktopApp => ({
		id: app.id,
		icon: app.icon,
		label: app.title,
		onOpen: launch(app),
		info: app.info?.({ posts }) ?? [],
	});
	const mainApps = appsIn("main").map(toDesktop);
	const extras = appsIn("extras").map(toDesktop);
	const trashApp: DesktopApp = {
		id: "trash",
		icon: (trashed.length ? "trashFull" : "trash") satisfies IconName,
		label: "Trash",
		onOpen: () => setTrash(true),
		info: [["Kind", "Trash"], ["Items", String(trashed.length)]],
	};
	const active = order[order.length - 1];

	return (
		<DesktopDataContext.Provider value={{ posts }}>
			<DeskRef.Provider value={desk}>
				<MenuBar apps={[...mainApps, ...extras, trashApp]} />
				{/* biome-ignore lint/a11y/noStaticElementInteractions: arrow keys only move focus between the icon buttons inside */}
				<div ref={desk} onKeyDown={moveIconFocus} className="desktop-surface dither relative min-h-screen overflow-hidden pt-16 min-[721px]:pt-12 max-[720px]:overflow-visible max-[720px]:pb-8">
					<Wallpaper />
					<div className="saver-fade absolute top-12 right-4 z-[5] hidden flex-col min-[721px]:flex">
						{mainApps.map((app) => <DeskIcon key={app.id} {...app} />)}
					</div>
					<div className="saver-fade absolute top-12 right-28 z-[5] hidden flex-col min-[721px]:flex">
						{extras.map((app) => <DeskIcon key={app.id} {...app} />)}
					</div>
					<div
						ref={(el) => {
							trashTarget.el = el;
						}}
						className="saver-fade absolute right-4 bottom-4 z-[5] hidden min-[721px]:block"
					>
						<DeskIcon {...trashApp} />
					</div>
					<div key={gen} className="saver-fade max-[720px]:flex max-[720px]:flex-col-reverse">
						{apps
							.filter((a) => hasWindow(a) && visible.has(a.id))
							.map((a) => (
								<AppWindow key={`${a.id}:${seq[a.id] ?? 0}`} app={a} active={active === a.id} payload={payload[a.id]} onClose={closeApp(a.id)} />
							))}
					</div>
					{children}
					{trash && (
						<div className="fixed inset-0 z-[200] flex items-center justify-center bg-white/50">
							<div className="win pop-in w-80 p-5" role="alertdialog" aria-label="Trash">
								<div className="flex gap-4">
									<PixelIcon name={trashed.length ? "trashFull" : "trash"} size={40} />
									{trashed.length ? (
										<p className="text-sm">In the Trash: {trashed.map((id) => getApp(id)?.title ?? id).join(", ")}.</p>
									) : (
										<p className="text-sm">The Trash is empty. Everything here was worth keeping.</p>
									)}
								</div>
								<div className="mt-5 flex justify-end gap-3">
									{trashed.length > 0 && (
										<button
											type="button"
											className="btn"
											onClick={() => {
												emptyTrash();
												setTrash(false);
											}}
										>
											Empty Trash
										</button>
									)}
									<button type="button" className="btn btn-default" onClick={() => setTrash(false)}>
										OK
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			</DeskRef.Provider>
		</DesktopDataContext.Provider>
	);
}
