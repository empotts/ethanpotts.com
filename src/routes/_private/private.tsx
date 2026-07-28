import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/_private/private")({
	component: PrivatePage,
});

function PrivatePage() {
	const navigate = useNavigate();
	const { session } = Route.useRouteContext();

	return (
		<section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
			<h1 className="text-3xl font-bold">Private</h1>
			<p className="mt-3 text-gray-600 dark:text-gray-300">
				Signed in as {session.user.email}. This route is ready for whatever you
				want to put behind auth later.
			</p>
			<button
				type="button"
				className="mt-6 rounded-md border border-gray-300 px-4 py-2 dark:border-gray-700"
				onClick={async () => {
					await signOut();
					await navigate({ to: "/login" });
				}}
			>
				Sign out
			</button>
		</section>
	);
}
