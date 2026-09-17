import type { ComponentType } from "react";
import type { PostEntry } from "./types";

type PostBodyModule = { default: ComponentType };
type PostBodyLoader = () => Promise<PostBodyModule>;

const postBodyLoaders = import.meta.glob<PostBodyModule>(
	"./posts/**/index.{tsx,mdx}",
);

export function loadPostBody(post: PostEntry): Promise<PostBodyModule> {
	const loader = postBodyLoaders[post.bodyModule] as PostBodyLoader | undefined;
	if (!loader) {
		throw new Error(`No body module registered for post: ${post.slug}`);
	}
	return loader();
}
