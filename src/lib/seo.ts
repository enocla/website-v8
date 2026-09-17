import type { PageMeta } from "../content/types";
import { canonicalUrl, ogImageUrl } from "./site";

export function createPageHead(meta: PageMeta) {
	const canonical = canonicalUrl(meta.path);
	const image = ogImageUrl(meta.ogImage);
	return {
		meta: [
			{ title: meta.title },
			{ name: "description", content: meta.description },
			{ property: "og:title", content: meta.title },
			{ property: "og:description", content: meta.description },
			{ property: "og:url", content: canonical },
			{ property: "og:image", content: image },
			{ name: "twitter:title", content: meta.title },
			{ name: "twitter:description", content: meta.description },
			{ name: "twitter:image", content: image },
		],
		links: [{ rel: "canonical", href: canonical }],
	};
}

export function createNotFoundHead() {
	return createPageHead({
		title: "not found",
		description: "The requested page could not be found.",
		path: "/404",
		ogImage: "writing.png",
	});
}
