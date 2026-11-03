import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Window } from "@/components/Window";
import { signOut } from "@/lib/auth-client";

export const Route = createFileRoute("/_private/private")({
	component: PrivatePage,
});

function PrivatePage() {
	const navigate = useNavigate();
	const { session } = Route.useRouteContext();
	return (
		<Window id="post" title="Private" x={300} y={120} width={380} onClose={() => navigate({ to: "/" })}>
			<div className="p-5 text-sm">
				<p>Signed in as {session.user.email}.</p>
				<div className="mt-5 text-right">
					<button
						type="button"
						className="btn btn-default"
						onClick={async () => {
							await signOut();
							await navigate({ to: "/login" });
						}}
					>
						Sign out
					</button>
				</div>
			</div>
		</Window>
	);
}
