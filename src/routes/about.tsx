import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../content/manifest";
import { createPageHead } from "../lib/seo";
import AboutPage from "../pages/AboutPage";

export const Route = createFileRoute("/about")({
	head: () => createPageHead(pageMeta.about),
	component: AboutPage,
});
