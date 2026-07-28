import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { signIn, signUp } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
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
		setMessage("Account created. Only the configured owner can enter.");
		await navigate({ to: "/private" });
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
			{message ? <p className="mt-4 text-sm">{message}</p> : null}
		</section>
	);
}
