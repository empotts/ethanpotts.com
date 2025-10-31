import {
	createRootRoute,
	HeadContent,
	Scripts,
	useNavigate,
} from "@tanstack/react-router";
import { BookOpen, FileText, Folder, Home } from "lucide-react";
import Dock from "@/components/Dock";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import EP from "../EP.svg";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Ethan Potts",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "EP.ico" },
		],
	}),

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const navigate = useNavigate();
	const dockItems = [
		{
			icon: <Home size={18} />,
			label: "Home",
			onClick: () => {
				navigate({ to: "/" });
			},
		},
		{
			icon: <BookOpen size={18} />,
			label: "Blog",
			onClick: () => {
				navigate({ to: "/blog" });
			},
		},
		{
			icon: <Folder size={18} />,
			label: "Projects",
			onClick: () => {
				navigate({ to: "/projects" });
			},
		},
		{
			icon: <FileText size={18} />,
			label: "Resume",
			onClick: () => {
				navigate({ to: "/resume" });
			},
		},
	];

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50">
				<ThemeProvider>
					<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50">
						<main>
							<header className="fixed top-4 left-4 right-4 z-50 h-12 flex items-center justify-between px-2">
								<a href="/" aria-label="Home" className="inline-block">
									<img
										src={EP}
										alt="EP"
										className={
											"h-12 w-auto transition-filter duration-150 filter dark:invert dark:brightness-200 hover:brightness-90 select-none"
										}
									/>
								</a>

								<div className="flex items-center">
									<ThemeToggle />
								</div>
							</header>
							{children}

							{/* Dock */}
							<div
								aria-hidden={false}
								className="text-gray-900 dark:text-white fixed bottom-4 left-1/2  "
							>
								<Dock
									items={dockItems}
									panelHeight={68}
									baseItemSize={50}
									magnification={70}
								/>
							</div>
						</main>
					</div>
				</ThemeProvider>

				{/* <TanStackDevtools
		  config={{
			position: 'bottom-right',
		  }}
		  plugins={[
			{
			  name: 'Tanstack Router',
			  render: <TanStackRouterDevtoolsPanel />,
			},
		  ]}
		/> */}
				<Scripts />
			</body>
		</html>
	);
}
