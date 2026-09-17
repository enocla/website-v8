import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../content/manifest";
import { createPageHead } from "../lib/seo";
import HomePage from "../pages/HomePage";

export const Route = createFileRoute("/")({
	head: () => createPageHead(pageMeta.home),
	component: HomePage,
});
