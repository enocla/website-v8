// Build-time: render static OG images to public/og/.
//
// Runs in plain Node before `vite build`, so native/wasm dependencies load
// normally with no bundler workarounds. The images only change when page
// titles change. Run with: node scripts/generate-og.mjs

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import React from "react";
import satori from "satori";
import { decompress } from "wawoff2";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const WIDTH = 1200;
const HEIGHT = 630;

const BG = "#f1f0e8";
const INK = "#1c1613";
const SECONDARY = "#5e5956";
const ACCENT = "#01567e";
const BORDER = "rgba(94, 89, 86, 0.52)";

const manifest = JSON.parse(
	await fs.promises.readFile(
		path.join(root, "src/content/manifest.json"),
		"utf8",
	),
);
const entries = [
	...Object.values(manifest.pages).map((page) => ({
		title: page.title,
		file: page.ogImage,
	})),
	...manifest.posts.map((post) => ({
		title: post.ogTitle,
		file: post.ogImage,
	})),
];

async function loadWoff2(relativePath) {
	const raw = await fs.promises.readFile(path.join(root, relativePath));
	const ttf = await decompress(
		new Uint8Array(raw.buffer, raw.byteOffset, raw.byteLength),
	);
	const bytes = new Uint8Array(ttf);
	return bytes.buffer.slice(
		bytes.byteOffset,
		bytes.byteOffset + bytes.byteLength,
	);
}

function titleFontSize(title) {
	// New Spirit is proportional and narrower than the previous Departure
	// Mono (0.636em advance); the content box is ~1068px wide, so 44px
	// stays well inside a single line for current titles (max 35 chars).
	if (title.length > 80) return 28;
	if (title.length > 40) return 36;
	return 44;
}

const el = React.createElement;

function template(title) {
	return el(
		"div",
		{
			style: {
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				padding: 36,
			},
		},
		el(
			"div",
			{
				style: {
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					width: "100%",
					height: "100%",
					border: `2px solid ${BORDER}`,
					padding: "56px 64px",
				},
			},
			el(
				"div",
				{
					style: {
						fontFamily: "Maple Mono",
						fontSize: 30,
						letterSpacing: 2,
						color: SECONDARY,
					},
				},
				"enochlau.com",
			),
			el(
				"div",
				{
					style: {
						fontFamily: "New Spirit",
						fontSize: titleFontSize(title),
						lineHeight: 1.08,
						color: INK,
					},
				},
				title,
			),
			el("div", {
				style: {
					display: "flex",
					width: 96,
					height: 8,
					backgroundColor: ACCENT,
				},
			}),
		),
	);
}

const fonts = [
	{
		name: "New Spirit",
		file: "public/fonts/NewSpirit-400.woff2",
		weight: 400,
	},
	{
		name: "New Spirit",
		file: "public/fonts/NewSpirit-500.woff2",
		weight: 500,
	},
	{
		name: "New Spirit",
		file: "public/fonts/NewSpirit-600.woff2",
		weight: 600,
	},
	{
		name: "New Spirit",
		file: "public/fonts/NewSpirit-700.woff2",
		weight: 700,
	},
	{
		name: "Maple Mono",
		file: "public/fonts/MapleMono-Regular.woff2",
		weight: 400,
	},
];

const loaded = [];
for (const font of fonts) {
	loaded.push({ ...font, data: await loadWoff2(font.file), style: "normal" });
	delete loaded[loaded.length - 1].file;
}

const ogDirectory = path.join(root, "public/og");
await fs.promises.mkdir(ogDirectory, { recursive: true });
for (const file of await fs.promises.readdir(ogDirectory)) {
	if (file.endsWith(".png"))
		await fs.promises.unlink(path.join(ogDirectory, file));
}

for (const page of entries) {
	const svg = await satori(template(page.title), {
		width: WIDTH,
		height: HEIGHT,
		fonts: loaded,
	});
	const png = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } })
		.render()
		.asPng();
	const dest = path.join(root, "public/og", page.file);
	await fs.promises.writeFile(dest, png);
	console.log(
		`[og] ${page.title} -> public/og/${page.file} (${png.length} bytes)`,
	);
}
