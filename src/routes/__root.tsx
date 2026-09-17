import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { umamiScript } from "../integrations/analytics";
import SiteShell from "../layout/SiteShell";
import { SITE_URL } from "../lib/site";
import NotFoundPage from "../pages/NotFoundPage";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1.0" },
			{ title: "enochlau.com" },
			{ name: "description", content: "enochlau.com" },
			{ property: "og:type", content: "website" },
			{ property: "og:description", content: "enochlau.com" },
			{ property: "og:url", content: SITE_URL },
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
		scripts: [umamiScript],
	}),
	shellComponent: RootDocument,
	notFoundComponent: NotFoundPage,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body className="flex flex-col p-2 before:fixed before:inset-0">
				<SiteShell>{children}</SiteShell>
				<Scripts />
			</body>
		</html>
	);
}
