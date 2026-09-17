import assert from "node:assert/strict";
import test from "node:test";
import manifest from "../../src/content/manifest.json" with { type: "json" };
import { validateManifest } from "./validate.ts";

test("content manifest has unique canonical post paths and OG owners", () => {
	const entries = validateManifest(manifest, {
		ogFiles: new Set([
			"about-me.png",
			"about.png",
			"projects.png",
			"writing.png",
			"sleep.png",
			"history.png",
		]),
	});
	assert.equal(entries.filter((entry) => entry.kind === "post").length, 2);
	assert.deepEqual(
		manifest.posts.map((post) => post.canonicalPath),
		["/writing/sleep", "/writing/history"],
	);
});
