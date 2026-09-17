import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { getPost } from "../../content/manifest";

export const Route = createFileRoute("/content/$slug")({
	loader: ({ params }) => {
		const post = getPost(params.slug);
		if (!post) throw notFound();
		throw redirect({ to: "/writing/$slug", params: { slug: post.slug } });
	},
	component: () => null,
});
