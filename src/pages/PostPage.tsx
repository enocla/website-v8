import { notFound } from "@tanstack/react-router";
import { lazy, Suspense, useMemo } from "react";
import { loadPostBody } from "../content/loadPost";
import type { PostEntry } from "../content/types";
// import Giscus from "../integrations/comments/Giscus";
import { formatPublishedAt } from "../lib/date";

export default function PostPage({ post }: { post: PostEntry }) {
	if (!post) throw notFound();
	const Body = useMemo(
		() =>
			lazy(() =>
				loadPostBody(post).then((module) => ({ default: module.default })),
			),
		[post],
	);
	return (
		<>
			<h1 className="pt-3 text-2xl font-display text-text-primary">
				{post.title}
			</h1>
			<p className="pt-2 text-text-secondary">
				Published {formatPublishedAt(post.publishedAt)}
			</p>
			<p className="pt-1 text-text-tertiary">{post.description}</p>
			<div className="py-8">
				<hr className="border-px border-border" />
			</div>
			<article className="prose">
				<Suspense fallback={<p>Loading article…</p>}>
					<Body />
				</Suspense>
			</article>
			{/* <Giscus slug={post.slug} /> */}
		</>
	);
}
