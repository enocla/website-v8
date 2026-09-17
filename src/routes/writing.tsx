import { createFileRoute, Link } from "@tanstack/react-router";
import { ogImageUrl } from "../lib/site";
import { posts } from "../posts";

export const Route = createFileRoute("/writing")({
	head: () => ({
		meta: [
			{ title: "writing" },
			{ property: "title", content: "writing" },
			{ property: "og:title", content: "writing" },
			{
				property: "og:image",
				content: ogImageUrl("writing.png"),
			},
			{ name: "twitter:title", content: "writing" },
			{
				name: "twitter:image",
				content: ogImageUrl("writing.png"),
			},
			{ name: "description", content: "writing" },
		],
	}),
	component: Writing,
});

function Writing() {
	return (
		<>
			<style>{`nav a:not([data-nav-current="writing"]) {
      opacity: 0.5;
      filter: grayscale(1);
    }`}</style>
			<div className="prose">
				<h1>Writing</h1>
				<p>I&apos;ll try to write more</p>
			</div>
			<style>{`.timeline::before {
      background: linear-gradient(
        to bottom,
        var(--color-accent-subtle),
        transparent
      );
    }`}</style>
			<div className="flex relative flex-col gap-0 pt-10 timeline before:absolute before:top-12 before:bottom-2 before:-left-4 before:w-px">
				{posts.map((post) => (
					<Link
						key={post.slug}
						to="/content/$slug"
						params={{ slug: post.slug }}
						className="block relative p-4 post group"
					>
						<div className="gap-3 sm:flex items-center-safe">
							<h1 className="text-xl lg:text-xl text-text-primary font-serif">
								{post.title}
							</h1>
							<hr className="inline flex-1 border-dashed border-border" />
							<p className="text-text-secondary">{post.date}</p>
						</div>
						<p className="text-text-tertiary">{post.description}</p>
					</Link>
				))}
			</div>
		</>
	);
}
