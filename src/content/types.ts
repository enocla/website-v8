export type PostKind = "mdx" | "react";

export interface PageMeta {
	title: string;
	description: string;
	path: string;
	ogImage: string;
}

export interface PostEntry {
	slug: string;
	title: string;
	description: string;
	publishedAt: string;
	canonicalPath: string;
	ogTitle: string;
	ogImage: string;
	bodyModule: string;
	kind: PostKind;
}
