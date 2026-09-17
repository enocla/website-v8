import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import manifest from "../../src/content/manifest.json" with { type: "json" };

type Manifest = typeof manifest;

const root = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"../..",
);
const ogDirectory = path.join(root, "public/og");

function entriesFromManifest(manifest: Manifest) {
	const pages = Object.values(manifest.pages).map((page) => ({
		...page,
		kind: "page" as const,
	}));
	const posts = manifest.posts.map((post) => ({
		...post,
		path: post.canonicalPath,
		title: post.ogTitle,
		kind: "post" as const,
	}));
	return [...pages, ...posts];
}

export function validateManifest(
	manifest: Manifest,
	{ ogFiles }: { ogFiles?: ReadonlySet<string> } = {},
) {
	const errors = [];
	const entries = entriesFromManifest(manifest);
	const paths = new Set();
	const images = new Set();
	const slugs = new Set();

	if (manifest.version !== 1) errors.push("manifest version must be 1");
	for (const entry of entries) {
		if (paths.has(entry.path)) errors.push(`duplicate path: ${entry.path}`);
		if (images.has(entry.ogImage))
			errors.push(`duplicate OG image: ${entry.ogImage}`);
		if (!/^\/.+|^\/$/.test(entry.path))
			errors.push(`path must be absolute: ${entry.path}`);
		if (!/^[^/]+\.png$/.test(entry.ogImage))
			errors.push(`OG image must be a PNG filename: ${entry.ogImage}`);
		paths.add(entry.path);
		images.add(entry.ogImage);
		if (entry.kind === "post") {
			if (slugs.has(entry.slug)) errors.push(`duplicate slug: ${entry.slug}`);
			if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.publishedAt))
				errors.push(`invalid date: ${entry.slug}`);
			if (entry.path !== `/writing/${entry.slug}`)
				errors.push(`post path mismatch: ${entry.slug}`);
			if (!entry.bodyModule.startsWith("./posts/"))
				errors.push(`body module must be content-local: ${entry.slug}`);
			slugs.add(entry.slug);
		}
	}

	if (ogFiles) {
		const expected = new Set(entries.map((entry) => entry.ogImage));
		for (const image of expected)
			if (!ogFiles.has(image))
				errors.push(`missing generated OG asset: ${image}`);
		for (const image of ogFiles)
			if (!expected.has(image))
				errors.push(`stale generated OG asset: ${image}`);
	}
	if (errors.length > 0)
		throw new Error(`Invalid content manifest:\n- ${errors.join("\n- ")}`);
	return entries;
}

export function validateContent({ checkAssets = true } = {}) {
	let ogFiles: ReadonlySet<string> | undefined;
	if (checkAssets) {
		if (!fs.existsSync(ogDirectory))
			throw new Error("public/og does not exist; run pnpm generate:og first");
		ogFiles = new Set(
			fs.readdirSync(ogDirectory).filter((file) => file.endsWith(".png")),
		);
	}
	return validateManifest(manifest, { ogFiles });
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	const entries = validateContent();
	console.log(
		`[content] valid manifest: ${entries.length} pages/posts, ${entries.length} OG owners`,
	);
}
