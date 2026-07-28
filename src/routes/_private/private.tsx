import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authClient, signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/_private/private")({
	component: PrivatePage,
});

function PrivatePage() {
	const navigate = useNavigate();
	const { session } = Route.useRouteContext();
	const [passkeyMessage, setPasskeyMessage] = useState("");
	const [isAddingPasskey, setIsAddingPasskey] = useState(false);

	async function handleAddPasskey() {
		setIsAddingPasskey(true);
		setPasskeyMessage("");
		const result = await authClient.passkey.addPasskey({
			name: "Primary passkey",
		});
		setIsAddingPasskey(false);
		setPasskeyMessage(
			result?.error
				? (result.error.message ?? "Could not add passkey")
				: "Passkey added. You can use it the next time you sign in.",
		);
	}

	return (
		<section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
			<h1 className="text-3xl font-bold">Private</h1>
			<p className="mt-3 text-gray-600 dark:text-gray-300">
				Signed in as {session.user.email}. This route is ready for whatever you
				want to put behind auth later.
			</p>
			<div className="mt-6 flex flex-wrap gap-3">
				<button
					type="button"
					className="rounded-md border border-gray-300 px-4 py-2 dark:border-gray-700"
					disabled={isAddingPasskey}
					onClick={handleAddPasskey}
				>
					Add a passkey
				</button>
				<button
					type="button"
					className="rounded-md border border-gray-300 px-4 py-2 dark:border-gray-700"
					onClick={async () => {
						await signOut();
						await navigate({ to: "/login" });
					}}
				>
					Sign out
				</button>
			</div>
			{passkeyMessage ? <p className="mt-4 text-sm">{passkeyMessage}</p> : null}
		</section>
	);
}
