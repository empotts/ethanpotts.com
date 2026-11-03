import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Window } from "@/components/Window";
import { signIn, signUp } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	head: () => ({ meta: [{ title: "Sign in · Ethan Potts" }, { name: "robots", content: "noindex" }] }),
	component: LoginPage,
});

const input = "border-2 border-black px-2 py-1.5 outline-none focus:bg-black focus:text-white";

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
		<Window id="post" title="Sign in" x={300} y={120} width={380} onClose={() => navigate({ to: "/" })}>
			<form className="flex flex-col gap-3 p-5 text-sm" onSubmit={handleSignIn}>
				<input className={input} placeholder="Name (first-time signup)" value={name} onChange={(e) => setName(e.target.value)} />
				<input className={input} placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
				<input className={input} placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
				<div className="mt-2 flex justify-end gap-3">
					<button type="button" disabled={isLoading || !name} onClick={handleSignUp} className="btn disabled:opacity-40">Create owner</button>
					<button type="submit" disabled={isLoading} className="btn btn-default">Sign in</button>
				</div>
				{message ? <p>{message}</p> : null}
			</form>
		</Window>
	);
}
