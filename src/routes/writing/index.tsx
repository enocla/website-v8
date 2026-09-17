import { createFileRoute } from "@tanstack/react-router";
import { pageMeta } from "../../content/manifest";
import { createPageHead } from "../../lib/seo";
import WritingIndexPage from "../../pages/WritingIndexPage";

export const Route = createFileRoute("/writing/")({
	head: () => createPageHead(pageMeta.writing),
	component: WritingIndexPage,
});
