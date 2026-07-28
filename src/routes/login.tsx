import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { authClient, signIn, signUp, useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const { data: session, refetch } = useSession();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [message, setMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	async function handleSignIn(event: FormEvent) {
		event.preventDefault();
		setIsLoading(true);
		setMessage("");
		const result = await signIn.email({ email, password });
		setIsLoading(false);
		if (result.error) {
			setMessage(result.error.message ?? "Sign in failed");
			return;
		}
		await refetch();
		await navigate({ to: "/private" });
	}

	async function handleSignUp() {
		setIsLoading(true);
		setMessage("");
		const result = await signUp.email({ name, email, password });
		setIsLoading(false);
		if (result.error) {
			setMessage(result.error.message ?? "Sign up failed");
			return;
		}
		await refetch();
		setMessage("Owner account created. You can add a passkey now.");
	}

	async function handlePasskeySignIn() {
		setIsLoading(true);
		setMessage("");
		const result = await authClient.signIn.passkey();
		setIsLoading(false);
		if (result?.error) {
			setMessage(result.error.message ?? "Passkey sign in failed");
			return;
		}
		await refetch();
		await navigate({ to: "/private" });
	}

	async function handleAddPasskey() {
		setIsLoading(true);
		setMessage("");
		const result = await authClient.passkey.addPasskey({
			name: "Primary passkey",
		});
		setIsLoading(false);
		setMessage(
			result?.error
				? (result.error.message ?? "Could not add passkey")
				: "Passkey added. You can use it the next time you sign in.",
		);
	}

	return (
		<section className="mx-auto max-w-md px-4 sm:px-6">
			<h1 className="text-3xl font-bold">Private sign in</h1>
			<form className="mt-6 flex flex-col gap-4" onSubmit={handleSignIn}>
				<label className="flex flex-col gap-1">
					<span>Name (for first-time signup)</span>
					<input
						className="rounded-md border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
						value={name}
						onChange={(event) => setName(event.target.value)}
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span>Email</span>
					<input
						className="rounded-md border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
						type="email"
						autoComplete="username webauthn"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						required
					/>
				</label>
				<label className="flex flex-col gap-1">
					<span>Password</span>
					<input
						className="rounded-md border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700"
						type="password"
						autoComplete="current-password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						required
					/>
				</label>
				<div className="flex gap-3">
					<button
						type="submit"
						className="rounded-md border border-gray-300 px-4 py-2 dark:border-gray-700"
						disabled={isLoading}
					>
						Sign in
					</button>
					<button
						type="button"
						className="rounded-md border border-gray-300 px-4 py-2 dark:border-gray-700"
						disabled={isLoading || !name}
						onClick={handleSignUp}
					>
						Create owner account
					</button>
				</div>
			</form>
			<div className="mt-4 flex flex-wrap gap-3">
				<button
					type="button"
					className="rounded-md border border-gray-300 px-4 py-2 dark:border-gray-700"
					disabled={isLoading}
					onClick={handlePasskeySignIn}
				>
					Sign in with a passkey
				</button>
				{session ? (
					<button
						type="button"
						className="rounded-md border border-gray-300 px-4 py-2 dark:border-gray-700"
						disabled={isLoading}
						onClick={handleAddPasskey}
					>
						Add a passkey
					</button>
				) : null}
			</div>
			{message ? <p className="mt-4 text-sm">{message}</p> : null}
		</section>
	);
}
