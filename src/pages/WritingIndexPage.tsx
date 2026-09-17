import { Link } from "@tanstack/react-router";
import { posts } from "../content/manifest";
import { formatPublishedAt } from "../lib/date";

export default function WritingIndexPage() {
	return (
		<>
			<div className="prose">
				<h1>Writing</h1>
				<p>I&apos;ll try to write more</p>
			</div>
			<div className="flex relative flex-col gap-0 pt-10 timeline before:absolute before:top-12 before:bottom-2 before:-left-4 before:w-px">
				{posts.map((post) => (
					<Link
						key={post.slug}
						to="/writing/$slug"
						params={{ slug: post.slug }}
						className="block relative p-4 post group"
					>
						<div className="gap-3 sm:flex items-center-safe">
							<h1 className="text-xl lg:text-xl text-text-primary font-serif">
								{post.title}
							</h1>
							<hr className="inline flex-1 border-dashed border-border" />
							<p className="text-text-secondary">
								{formatPublishedAt(post.publishedAt)}
							</p>
						</div>
						<p className="text-text-tertiary">{post.description}</p>
					</Link>
				))}
			</div>
		</>
	);
}
