// Build-time: render static OG images to public/og/.
//
// Runs in plain Node before `vite build`, so native/wasm dependencies load
// normally with no bundler workarounds. Run after changing page titles or
// the image design with: node scripts/generate-og.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";
import React from "react";
import satori, { type Font } from "satori";
import manifest from "../src/content/manifest.json" with { type: "json" };
import sharp from "sharp";
import { decompress } from "wawoff2";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const WIDTH = 1200;
const HEIGHT = 630;

const BG = "#f1f0e8";
const INK = "#1c1613";
const SECONDARY = "#5e5956";
const ACCENT = "#01567e";
const BORDER = "rgba(94, 89, 86, 0.52)";

// Resvg can't decode WebP, so convert the site's overlay before embedding it.
const overlay = await sharp(path.join(root, "public/bg.webp"))
	.resize(WIDTH, HEIGHT, { fit: "cover", position: "left top" })
	.png()
	.toBuffer();
const overlayUrl = `data:image/png;base64,${overlay.toString("base64")}`;

// Match the site's rough paper background in src/components/PaperFilters.tsx
// and layer bg.webp over it at 50% opacity, beneath all text and borders.
// Rasterize once: Satori doesn't support SVG filters in its layout tree.
const background = new Resvg(`
	<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
		<defs>
			<filter id="roughpaper" x="0%" y="0%" width="100%" height="100%">
				<feTurbulence type="fractalNoise" baseFrequency="0.024" result="noise" numOctaves="4" />
				<feDiffuseLighting in="noise" surfaceScale="3.8" lightingColor="#ffffff" result="texture">
					<feDistantLight azimuth="45" elevation="70" />
				</feDiffuseLighting>
				<feComponentTransfer in="texture" result="paperTexture">
					<feFuncR type="linear" slope="0.35" intercept="0.65" />
					<feFuncG type="linear" slope="0.35" intercept="0.65" />
					<feFuncB type="linear" slope="0.35" intercept="0.65" />
				</feComponentTransfer>
				<feBlend in="SourceGraphic" in2="paperTexture" mode="multiply" />
			</filter>
		</defs>
		<rect width="100%" height="100%" fill="${BG}" filter="url(#roughpaper)" />
		<image href="${overlayUrl}" width="${WIDTH}" height="${HEIGHT}" opacity="0.5" />
	</svg>
`)
	.render()
	.asPng();
const backgroundUrl = `data:image/png;base64,${background.toString("base64")}`;

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

async function loadWoff2(relativePath: string) {
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

function titleFontSize(title: string) {
	// New Spirit is proportional and narrower than the previous Departure
	// Mono (0.636em advance); the content box is ~1068px wide, so 44px
	// stays well inside a single line for current titles (max 35 chars).
	if (title.length > 80) return 28;
	if (title.length > 40) return 36;
	return 44;
}

const el = React.createElement;

function template(title: string) {
	return el(
		"div",
		{
			style: {
				display: "flex",
				width: "100%",
				height: "100%",
				backgroundColor: BG,
				backgroundImage: `url(${backgroundUrl})`,
				backgroundSize: "100% 100%",
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

const fonts: (Pick<Font, "name" | "weight"> & { file: string })[] = [
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

const loaded: Font[] = [];
for (const { file, ...font } of fonts) {
	loaded.push({ ...font, data: await loadWoff2(file), style: "normal" });
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
	const rendered = new Resvg(svg, { fitTo: { mode: "width", value: WIDTH } })
		.render()
		.asPng();
	// The photo overlay compresses poorly through Resvg's default PNG encoder.
	const png = await sharp(rendered)
		.png({ compressionLevel: 9, effort: 10 })
		.toBuffer();
	const dest = path.join(root, "public/og", page.file);
	await fs.promises.writeFile(dest, png);
	console.log(
		`[og] ${page.title} -> public/og/${page.file} (${png.length} bytes)`,
	);
}
