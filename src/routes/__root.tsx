import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import appCss from "../styles.css?url";
import EP from "../EP.svg";

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
		links: [{ rel: "stylesheet", href: appCss }, { rel: "icon", href: "EP.ico" }],
	}),

	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider>
					<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-50">
						<main>
							  <header className="fixed top-4 left-4 z-50 h-12 flex items-center">
                                <a href="/" aria-label="Home" className="inline-block">
                                    <img
                                        src={EP}
                                        alt="EP"
                                        className="h-12 w-auto transition-filter duration-150 dark:invert"
                                    />
                                </a>
                            </header>
							<div className="fixed top-4 right-4 z-50 h-12">
								<ThemeToggle />
							</div>
							{children}
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
