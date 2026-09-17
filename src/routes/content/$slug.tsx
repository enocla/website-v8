import { createFileRoute, notFound } from "@tanstack/react-router";
import { ogImageUrl } from "../../lib/site";
import { PostContent, posts } from "../../posts";

function findPost(slug: string) {
	return posts.find((p) => p.slug === slug);
}

export const Route = createFileRoute("/content/$slug")({
	loader: ({ params }) => {
		if (!findPost(params.slug)) {
			throw notFound();
		}
	},
	head: ({ params }) => {
		const post = findPost(params.slug);
		const title = post ? `writing - ${post.title}` : "writing";
		return {
			meta: [
				{ title },
				{ property: "title", content: title },
				{ property: "og:title", content: title },
				{
					property: "og:image",
					content: ogImageUrl(`${params.slug}.png`),
				},
				{ name: "twitter:title", content: title },
				{
					name: "twitter:image",
					content: ogImageUrl(`${params.slug}.png`),
				},
				{ name: "description", content: title },
			],
		};
	},
	component: PostPage,
});

function PostPage() {
	const { slug } = Route.useParams();
	const post = findPost(slug);
	if (!post) {
		throw notFound();
	}
	return (
		<>
			<style>{`nav :not([data-nav-current='writing']) {
      opacity: 0.5;
      filter: grayscale(1);
    }`}</style>
			<h1 className="pt-3 text-xl font-serif text-text-primary">
				{post.title}
			</h1>
			<p className="pt-2 text-text-secondary">Published {post.date}</p>
			<p className="pt-1 text-text-tertiary">{post.description}</p>
			<div className="py-8">
				<hr className="border-px border-border" />
			</div>
			<article className="pb-16 prose">
				<PostContent slug={slug} />
			</article>
			<div className="opacity-90 min-h-96 sepia-20">
				<script
					src="https://giscus.app/client.js"
					data-repo="enocla/website-v6"
					data-repo-id="R_kgDOMX_hYA"
					data-category="Blog Posts"
					data-category-id="DIC_kwDOMX_hYM4Cie6Y"
					data-mapping="specific"
					data-term={post.title}
					data-strict="0"
					data-reactions-enabled="1"
					data-emit-metadata="0"
					data-input-position="top"
					data-theme="light_protanopia"
					data-lang="en"
					crossOrigin="anonymous"
					async
				/>
			</div>
		</>
	);
}
