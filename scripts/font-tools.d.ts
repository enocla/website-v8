// Types for the font-tool APIs used by the build and maintenance scripts.
declare module "wawoff2" {
	export function decompress(buffer: Uint8Array): Promise<Uint8Array>;
}

declare module "subset-font" {
	export default function subsetFont(
		buffer: Buffer,
		text: string,
		options: { targetFormat: "woff2" },
	): Promise<Buffer>;
}
