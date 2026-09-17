import rawManifest from "./manifest.json";
import type { PageMeta, PostEntry } from "./types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assertManifest(): void {
	const slugs = new Set<string>();
	const paths = new Set<string>();
	const images = new Set<string>();

	for (const post of rawManifest.posts) {
		if (!SLUG.test(post.slug)) {
			throw new Error(`Invalid post slug: ${post.slug}`);
		}
		if (slugs.has(post.slug)) {
			throw new Error(`Duplicate post slug: ${post.slug}`);
		}
		if (!ISO_DATE.test(post.publishedAt)) {
			throw new Error(`Invalid publication date for ${post.slug}`);
		}
		if (post.canonicalPath !== `/writing/${post.slug}`) {
			throw new Error(`Invalid canonical path for ${post.slug}`);
		}
		if (images.has(post.ogImage)) {
			throw new Error(`Duplicate OG image: ${post.ogImage}`);
		}
		slugs.add(post.slug);
		paths.add(post.canonicalPath);
		images.add(post.ogImage);
	}

	for (const page of Object.values(rawManifest.pages)) {
		if (paths.has(page.path)) {
			throw new Error(`Duplicate page path: ${page.path}`);
		}
		if (images.has(page.ogImage)) {
			throw new Error(`Duplicate OG image: ${page.ogImage}`);
		}
		paths.add(page.path);
		images.add(page.ogImage);
	}
}

assertManifest();

export const pageMeta = rawManifest.pages satisfies Record<string, PageMeta>;
export const posts = [...rawManifest.posts]
	.map((post) => ({ ...post, kind: post.kind as PostEntry["kind"] }))
	.sort((a, b) =>
		b.publishedAt.localeCompare(a.publishedAt),
	) satisfies readonly PostEntry[];

const postsBySlug = new Map(posts.map((post) => [post.slug, post]));

export function getPost(slug: string): PostEntry | undefined {
	return postsBySlug.get(slug);
}

export function getPosts(): readonly PostEntry[] {
	return posts;
}
