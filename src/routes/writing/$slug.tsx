import { createFileRoute, notFound } from "@tanstack/react-router";
import { getPost } from "../../content/manifest";
import { createNotFoundHead, createPageHead } from "../../lib/seo";
import PostPage from "../../pages/PostPage";

export const Route = createFileRoute("/writing/$slug")({
	loader: ({ params }) => {
		const post = getPost(params.slug);
		if (!post) throw notFound();
		return post;
	},
	head: ({ params }) => {
		const post = getPost(params.slug);
		return post
			? createPageHead({
					title: post.ogTitle,
					description: post.description,
					path: post.canonicalPath,
					ogImage: post.ogImage,
				})
			: createNotFoundHead();
	},
	component: WritingPostRoute,
});

function WritingPostRoute() {
	const post = Route.useLoaderData();
	return <PostPage post={post} />;
}
