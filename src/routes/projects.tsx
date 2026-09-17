import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../content/manifest";
import { createPageHead } from "../lib/seo";
import ProjectsPage from "../pages/ProjectsPage";

export const Route = createFileRoute("/projects")({
	head: () => createPageHead(pageMeta.projects),
	component: ProjectsPage,
});
