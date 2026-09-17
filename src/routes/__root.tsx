import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import Nav from "../components/Nav";
import Paperclip from "../components/Paperclip";
import PaperFilters from "../components/PaperFilters";
import PaperTexture from "../components/PaperTexture";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1.0" },
			{ property: "description", content: "enochlau.com" },
			{ property: "og:type", content: "website" },
			{ property: "og:description", content: "enochlau.com" },
			{ property: "og:url", content: "https://enochlau.com" },
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:description", content: "enochlau.com" },
			{ name: "twitter:image:width", content: "1200" },
			{ name: "twitter:image:height", content: "630" },
			{ name: "theme-color", content: "#01567E" },
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "icon", href: "/favicon.png", type: "image/png" },
		],
		scripts: [
			{
				src: "https://cloud.umami.is/script.js",
				defer: true,
				"data-website-id": "d41f775b-3a39-4ed9-b68a-5afe73974f01",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="flex flex-col p-2 before:fixed before:inset-0 before:-z-10">
				<style>{`::selection {
      background-color: var(--color-accent);
      color: var(--color-bg);
    }`}</style>
				<PaperFilters />
				<div className="relative isolate w-full max-w-lg">
					<div className="w-full paper-shadow">
						<div
							id="container"
							className="relative flex flex-col gap-0 w-full paper-surface bg-bg"
						>
							<PaperTexture />
							<Nav />
							<main className="relative z-10 pt-0 p-4 w-full">{children}</main>
							<footer className="p-4 flex-col gap-2 prose list-none flex *:w-fit items-end">
								<a href="https://github.com/enocla">GitHub</a>
								<span>
									Email: <code>tnixxc@gmail.com</code>
								</span>
								<span>
									Discord: <code>enocla</code>{" "}
								</span>
								<a href="https://www.linkedin.com/in/enoch-lau-enoch/">
									LinkedIn
								</a>
							</footer>
						</div>
					</div>
					<Paperclip />
				</div>
				<div className="flex-1 w-full" />
				<Scripts />
			</body>
		</html>
	);
}
