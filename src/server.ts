import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { agentResponse, linkHeader, pageParam, wantsMarkdown } from "@/lib/agents";
import { isTerminalClient, terminalPage } from "@/lib/terminal";

export default createServerEntry({
	async fetch(request, ...rest) {
		const agent = agentResponse(request);
		if (agent) return agent;

		// `curl ethanpotts.com`: styled text instead of a wall of HTML.
		if ((request.method === "GET" || request.method === "HEAD") && isTerminalClient(request)) {
			const url = new URL(request.url);
			const text = terminalPage(url.pathname, url.searchParams.get("color") !== "0", pageParam(request));
			if (text) {
				return new Response(request.method === "HEAD" ? null : text, {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						vary: "Accept, User-Agent",
						"cache-control": "public, max-age=300",
					},
				});
			}
			if (url.pathname.replace(/\/+$/, "") === "/blog") {
				return new Response("\n  No such page. Try: curl ethanpotts.com/blog\n\n", {
					status: 404,
					headers: { "content-type": "text/plain; charset=utf-8" },
				});
			}
		}

		// A markdown request for a page without a markdown view still gets the HTML page, not a 406.
		let req = request;
		if (wantsMarkdown(request)) {
			const headers = new Headers(request.headers);
			headers.set("accept", "text/html");
			req = new Request(request, { headers });
		}
		const response = await handler.fetch(req, ...rest);

		if (!response.headers.get("content-type")?.startsWith("text/html")) return response;
		const headers = new Headers(response.headers);
		headers.append("link", linkHeader(new URL(request.url).pathname));
		headers.append("vary", "Accept, User-Agent");
		return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
	},
});
