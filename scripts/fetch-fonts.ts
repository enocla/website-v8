// Regenerate the derived font files actually used by the repo:
//
// - assets/fonts/Sentient-{400,500,700}.subset.woff2 (legacy OG inputs,
//   retained but no longer consumed; scripts/generate-og.ts now reads the
//   Libertinus files below)
// - public/fonts/Sentient-variable.subset.woff2 (legacy site @font-face,
//   retained but no longer referenced by src/styles.css)
// - public/fonts/LibertinusSerif-{400,600,700}.subset.woff2 and
//   public/fonts/LibertinusSerif-{400,600,700}Italic.subset.woff2 (previous
//   site @font-face and OG image inputs, retained but no longer referenced)
// - public/fonts/Supreme-{400,500,700}.subset.woff2 and
//   public/fonts/Supreme-{400,500,700}Italic.subset.woff2 (previous site
//   @font-face, retained but no longer referenced)
// - public/fonts/WorkSans-{400,500,700}.subset.woff2 and
//   public/fonts/WorkSans-{400,500,700}Italic.subset.woff2 (previous site
//   @font-face, retained but no longer referenced)
// - public/fonts/Archivo-{400,500,700}.subset.woff2 and
//   public/fonts/Archivo-{400,500,700}Italic.subset.woff2 (previous site
//   @font-face, retained but no longer referenced)
// - public/fonts/Yrsa-Variable.subset.woff2 and
//   public/fonts/Yrsa-VariableItalic.subset.woff2 (previous site @font-face,
//   wght 300-700, retained but no longer referenced)
// - public/fonts/Newsreader-Variable.subset.woff2 and
//   public/fonts/Newsreader-VariableItalic.subset.woff2 (previous site
//   @font-face, opsz + wght, retained but no longer referenced)
// - public/fonts/DepartureMono-Regular.woff2 (previous headings @font-face
//   and OG title input, retained but no longer referenced): the official
//   release woff2, copied verbatim — at 22 KB full coverage it needs no
//   subsetting
// - public/fonts/NewSpirit-{400,500,600,700}.woff2 (current site @font-face
//   and OG title input): vendored static uprights (400/500/600/700, no
//   italics), copied verbatim from ./woff2 — no fetch step, keep the files
//   in place
//
// Full Sentient TTFs are fetched from the Fontshare CDN into a temp dir
// (URLs below; if they rot, re-discover them via
// https://api.fontshare.com/v2/fonts). Full Libertinus Serif TTFs are
// fetched from Google Fonts (gstatic); the css2 API without a browser
// User-Agent returns full TTF URLs. Full Supreme TTFs are fetched from the
// Fontshare CDN (discoverable via https://api.fontshare.com/v2/fonts).
// Everything is subsetted, and only the derived files are kept. Run with:
// node scripts/fetch-fonts.ts

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import subsetFont from "subset-font";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CDN = "https://cdn.fontshare.com/wf";
const SOURCES = {
	"Sentient-variable.ttf": `${CDN}/NY2ZL3ZVCWEGOL6C3UVCNGYW5UU4EWVZ/E62VQS3OCYTBL5HEKIEGN3RTBX7KFK6F/NZPIPWPM74OTNMX6CKNACLBKCGJLJEBU.ttf`,
	"Sentient-400.ttf": `${CDN}/RVTZPYAA57KV4AMXRX7ZIPJXSTYCRP7A/36OUS5CBIXRKI2QU7G7OUHOK7HHA53Y2/SIH66VPT4WS2HIF5PEJNDU4INNUF54LG.ttf`,
	"Sentient-500.ttf": `${CDN}/XVVLA67EPQTZD7YHR3MQPW2IQXXDTGPX/IHGNDJMSP2Y53DG23KZTPBH753PUEUB2/RNUZPHMIVMPXFHVACRGCAJ32E6WUEDVU.ttf`,
	"Sentient-700.ttf": `${CDN}/XC4UYXMVQINJJ47RSKB74CCAWSP5BUGZ/TGOWV4725NO3KHVKMWHG47SRPLMNHMOO/433XP6QWDVL6KQ5K7ZCOP524TX4LE4RJ.ttf`,
};

// Full-coverage Libertinus Serif sources (Google Fonts gstatic TTFs).
const LIBERTINUS_SOURCES = {
	"LibertinusSerif-400.subset.woff2":
		"https://fonts.gstatic.com/s/libertinusserif/v1/RLpkK4bw7KinajYBg0RTTwCLF5Ben6k.ttf",
	"LibertinusSerif-400Italic.subset.woff2":
		"https://fonts.gstatic.com/s/libertinusserif/v1/RLpiK4bw7KinajYBg0RTTwCLF5Ber6sPVA.ttf",
	"LibertinusSerif-600.subset.woff2":
		"https://fonts.gstatic.com/s/libertinusserif/v1/RLpjK4bw7KinajYBg0RTTwCLF5Bep3ErdHs.ttf",
	"LibertinusSerif-600Italic.subset.woff2":
		"https://fonts.gstatic.com/s/libertinusserif/v1/RLphK4bw7KinajYBg0RTTwCLF5Ber6s3jH_pDQ.ttf",
	"LibertinusSerif-700.subset.woff2":
		"https://fonts.gstatic.com/s/libertinusserif/v1/RLpjK4bw7KinajYBg0RTTwCLF5BepxUqdHs.ttf",
	"LibertinusSerif-700Italic.subset.woff2":
		"https://fonts.gstatic.com/s/libertinusserif/v1/RLphK4bw7KinajYBg0RTTwCLF5Ber6s36H7pDQ.ttf",
};

// Broad coverage for titles and site copy: Basic Latin, Latin-1, Latin
// Extended A/B, general punctuation, currency, arrows, misc symbols (✦).
function corpusFor(ranges: readonly (readonly [number, number])[]) {
	let s = "";
	for (const [from, to] of ranges) {
		for (let cp = from; cp <= to; cp++) {
			if (cp >= 0xd800 && cp <= 0xdfff) continue;
			s += String.fromCodePoint(cp);
		}
	}
	return s;
}

const corpus = corpusFor([
	[0x20, 0x7e],
	[0xa0, 0xff],
	[0x100, 0x24f],
	[0x2000, 0x206f],
	[0x20a0, 0x20cf],
	[0x2190, 0x21ff],
	[0x2600, 0x26ff],
]);

const tmp = await fs.promises.mkdtemp(path.join(os.tmpdir(), "fonts-"));

async function fetchSource(name: keyof typeof SOURCES) {
	const res = await fetch(SOURCES[name]);
	if (!res.ok) throw new Error(`download failed for ${name}: ${res.status}`);
	const dest = path.join(tmp, name);
	await fs.promises.writeFile(dest, Buffer.from(await res.arrayBuffer()));
	return dest;
}

async function subsetToDest(src: string, dest: string) {
	const ttf = await fs.promises.readFile(src);
	const subset = await subsetFont(ttf, corpus, { targetFormat: "woff2" });
	await fs.promises.writeFile(dest, Buffer.from(subset));
	console.log(
		`${path.basename(dest)}: ttf ${ttf.length} -> subset woff2 ${subset.length}`,
	);
}

for (const weight of [400, 500, 700] as const) {
	const src = await fetchSource(`Sentient-${weight}.ttf`);
	await subsetToDest(
		src,
		path.join(root, "assets/fonts", `Sentient-${weight}.subset.woff2`),
	);
}

await subsetToDest(
	await fetchSource("Sentient-variable.ttf"),
	path.join(root, "public/fonts", "Sentient-variable.subset.woff2"),
);

for (const [dest, url] of Object.entries(LIBERTINUS_SOURCES)) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`download failed for ${dest}: ${res.status}`);
	const src = path.join(tmp, dest.replace(".subset.woff2", ".ttf"));
	await fs.promises.writeFile(src, Buffer.from(await res.arrayBuffer()));
	await subsetToDest(src, path.join(root, "public/fonts", dest));
}

// Full-coverage Supreme sources (Fontshare CDN TTFs).
const SUPREME_SOURCES = {
	"Supreme-400.subset.woff2":
		"https://cdn.fontshare.com/wf/UDGUA26XVGIV6IQWMQNGGAL7FQZFY227/E6HQU6YVWTGYX3KW3DF66KAAJ224ZDU6/5ZZU4JM62PS7KOJ7BOKLPL3AEO2G76TS.ttf",
	"Supreme-400Italic.subset.woff2":
		"https://cdn.fontshare.com/wf/Y4QRUUZINRRA6MAVHWOR3TW2GODCD5RZ/R3R2UQSXQOB32GYUQ6U742TO6KF4EHU6/F6KK3SHJZ5IAQWFJ26LASNWIU5ZCMCOF.ttf",
	"Supreme-500.subset.woff2":
		"https://cdn.fontshare.com/wf/OTYYUXNCZZI6EV6RSCAQFTGEGQ7JTD6B/45FLQUBI6DWIP6NYFVBTMKS6YPU3VYPT/GHZ524YD2KXKRX4PZ2S7DE3HKNPE2EKH.ttf",
	"Supreme-500Italic.subset.woff2":
		"https://cdn.fontshare.com/wf/3CFPIHZMSNOIGBGL5MWR7YPPUZXV2E36/JLQ2QTXODGFFFT2NQAWVNP3FJ2KBUKV2/QDQ4GE7GXJOFSMNLOAAL7EH2TTUIOKM5.ttf",
	"Supreme-700.subset.woff2":
		"https://cdn.fontshare.com/wf/5T6APCD6XXAHAFTHDATQKT4RFVWRY3KR/VM6PC4PLGZYYJIHGMT63IIGYLTQKGSH6/TN7F4YNDQ3FJ6JRJV2XDS3CGMFKQRLXV.ttf",
	"Supreme-700Italic.subset.woff2":
		"https://cdn.fontshare.com/wf/CMVFVNUF7QWL7YP45D3VMM5S3TR7UETH/FMPD7RZEPLQMABBCRWTSKAVYELCFFGNA/WSOULU7BZA6ZWBLKBF4DDD6R2AYE2F5X.ttf",
};

for (const [dest, url] of Object.entries(SUPREME_SOURCES)) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`download failed for ${dest}: ${res.status}`);
	const src = path.join(tmp, dest.replace(".subset.woff2", ".ttf"));
	await fs.promises.writeFile(src, Buffer.from(await res.arrayBuffer()));
	await subsetToDest(src, path.join(root, "public/fonts", dest));
}

// Full-coverage Work Sans sources (Fontshare CDN TTFs, discovered via
// https://api.fontshare.com/v2/fonts -> work-sans -> styles).
const WORK_SANS_SOURCES = {
	"WorkSans-400.subset.woff2":
		"https://cdn.fontshare.com/wf/G463L6WWJWSX4R6VTEVFCTIXPE3AUDEF/V4JHHUSZMHBPK3DFEHLGTZVXVBHVLZ7P/ND3FIMQYFEQ2VM2WWNXCGGBFYRPR7FMH.ttf",
	"WorkSans-400Italic.subset.woff2":
		"https://cdn.fontshare.com/wf/VFWWGUTNL437C3QWVLC54JOVJ24GGKIH/6OQK23X3DSJXVGNYTE36QFJ6LWMS7Y5F/3OAWBZES3QMLRBWJMVYZ2WT7DYVPWLYG.ttf",
	"WorkSans-500.subset.woff2":
		"https://cdn.fontshare.com/wf/MBOJEUZXMXZXHAW3KKWUFI6R7OIPIRYU/FBJ6H6I7LKZ2WGOVP25FDJOOUIMXMY2Z/THXRGVPNH45VMHCGWEEJATJ2RCOHTNBI.ttf",
	"WorkSans-500Italic.subset.woff2":
		"https://cdn.fontshare.com/wf/L2RFI5NTELDLWWGFIXXRCJFRMUAU4BD6/P3JDB7I7L2IP3N3IUAWFHSV5PXQQYUXX/NYV4ZQMHP7NXL6VB4VFS7ZGRB4HZ263N.ttf",
	"WorkSans-700.subset.woff2":
		"https://cdn.fontshare.com/wf/FE5DMCVO7676XBZO76R6BBLVYNJTAGNN/ZSUXML62VYR72Y4ABFYVQUJXTHDK7YJ2/LIFXYPK76URT3NB4B4JNO3Y23DJLOWJ3.ttf",
	"WorkSans-700Italic.subset.woff2":
		"https://cdn.fontshare.com/wf/4IOO6HE2KP5VJDPCI2J2DVDL6ZKR7GOP/UTF7AFH75PMBFZU74BYTKFURR2UL3DCD/LXEOV3VUZC34RH6VVI7IJSPR3H2TTV7E.ttf",
};

for (const [dest, url] of Object.entries(WORK_SANS_SOURCES)) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`download failed for ${dest}: ${res.status}`);
	const src = path.join(tmp, dest.replace(".subset.woff2", ".ttf"));
	await fs.promises.writeFile(src, Buffer.from(await res.arrayBuffer()));
	await subsetToDest(src, path.join(root, "public/fonts", dest));
}

// Full-coverage Archivo sources (Fontshare CDN TTFs, discovered via
// https://api.fontshare.com/v2/fonts -> archivo -> styles; normal width
// only, not the Expanded family).
const ARCHIVO_SOURCES = {
	"Archivo-400.subset.woff2":
		"https://cdn.fontshare.com/wf/YSKLU24545WP65XCD7ZVOFPD6AKR3JSM/SPF276V6UKGPA6W5ZNFTEWBJXRSQNXCR/7BTLO3ZVFMNDGT63YATXTEALTKTYZUZG.ttf",
	"Archivo-400Italic.subset.woff2":
		"https://cdn.fontshare.com/wf/CAPUNOGRVOEFSVSVS2JLPSFY7X2SDN6Y/NBTUZADGJJK244MWHOCUJ4UOQCHXR3OZ/M4ILLQ6F2CHZIYSTJIVDF4ND4SCO5IEF.ttf",
	"Archivo-500.subset.woff2":
		"https://cdn.fontshare.com/wf/5ISYWGR43XD57J2U5VEYATNUZO57OCPH/UIED7ZBTCD42AJ7GJT5NWKWHCOVDRNAP/EPHSF4UBJRLGUILEFJVCMY7ET4W5HPUF.ttf",
	"Archivo-500Italic.subset.woff2":
		"https://cdn.fontshare.com/wf/LI7A4SRW3BDRDSU6O6XU25VZ4OLHFNPS/NYVLAUHN4U2SSDS6DXNULP3ABEKGCHY4/T7LX6PNCPANWSGBNSTIYL3B4LD7QGPID.ttf",
	"Archivo-700.subset.woff2":
		"https://cdn.fontshare.com/wf/RJX4LSNI55LNZ6QWGQALARVRCFUYJDBE/HQPW4MP6HXPYZKXF6CFWGJ6ZOJBHKM3X/UHPKREF72UMVMQSKHPDQ42AVOZPICLOJ.ttf",
	"Archivo-700Italic.subset.woff2":
		"https://cdn.fontshare.com/wf/KQRPW26V7MQVOVIROFMASPZA32ATHS6D/IXS7QF2ZEPITRFFHZVK6DY26UIO5JY5W/3N3HRVZHDNQLKFXB3E335N7AXAKKO7QL.ttf",
};

for (const [dest, url] of Object.entries(ARCHIVO_SOURCES)) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`download failed for ${dest}: ${res.status}`);
	const src = path.join(tmp, dest.replace(".subset.woff2", ".ttf"));
	await fs.promises.writeFile(src, Buffer.from(await res.arrayBuffer()));
	await subsetToDest(src, path.join(root, "public/fonts", dest));
}

// Full-coverage Yrsa variable sources (google/fonts GitHub TTFs, wght
// 300-700 for both styles). subset-font preserves the variation axis, so a
// single file per style covers every weight and the @font-face declares the
// range instead of static weights.
const YRSA_SOURCES = {
	"Yrsa-Variable.subset.woff2":
		"https://github.com/google/fonts/raw/main/ofl/yrsa/Yrsa%5Bwght%5D.ttf",
	"Yrsa-VariableItalic.subset.woff2":
		"https://github.com/google/fonts/raw/main/ofl/yrsa/Yrsa-Italic%5Bwght%5D.ttf",
};

for (const [dest, url] of Object.entries(YRSA_SOURCES)) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`download failed for ${dest}: ${res.status}`);
	const src = path.join(tmp, dest.replace(".subset.woff2", ".ttf"));
	await fs.promises.writeFile(src, Buffer.from(await res.arrayBuffer()));
	await subsetToDest(src, path.join(root, "public/fonts", dest));
}

// Full-coverage Newsreader variable sources (google/fonts GitHub TTFs,
// opsz + wght axes). subset-font preserves both axes; the @font-face
// declares the wght range and browsers apply the optical axis automatically.
const NEWSREADER_SOURCES = {
	"Newsreader-Variable.subset.woff2":
		"https://github.com/google/fonts/raw/main/ofl/newsreader/Newsreader%5Bopsz%2Cwght%5D.ttf",
	"Newsreader-VariableItalic.subset.woff2":
		"https://github.com/google/fonts/raw/main/ofl/newsreader/Newsreader-Italic%5Bopsz%2Cwght%5D.ttf",
};

for (const [dest, url] of Object.entries(NEWSREADER_SOURCES)) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`download failed for ${dest}: ${res.status}`);
	const src = path.join(tmp, dest.replace(".subset.woff2", ".ttf"));
	await fs.promises.writeFile(src, Buffer.from(await res.arrayBuffer()));
	await subsetToDest(src, path.join(root, "public/fonts", dest));
}

// Departure Mono ships its own woff2 in the GitHub release zip; extract it
// verbatim via the zip central directory (local headers use streaming
// descriptors, so sizes come from the central directory).
const DEPARTURE_ZIP_URL =
	"https://github.com/rektdeckard/departure-mono/releases/download/v1.500/DepartureMono-1.500.zip";
{
	const res = await fetch(DEPARTURE_ZIP_URL);
	if (!res.ok)
		throw new Error(`download failed for DepartureMono: ${res.status}`);
	const zip = Buffer.from(await res.arrayBuffer());
	let eocd = -1;
	for (let i = zip.length - 22; i >= 0; i--) {
		if (zip.readUInt32LE(i) === 0x06054b50) {
			eocd = i;
			break;
		}
	}
	if (eocd < 0)
		throw new Error("DepartureMono zip has no end-of-central-directory");
	let entry = zip.readUInt32LE(eocd + 16);
	while (zip.readUInt32LE(entry) === 0x02014b50) {
		const compSize = zip.readUInt32LE(entry + 20);
		const nameLength = zip.readUInt16LE(entry + 28);
		const extraLength = zip.readUInt16LE(entry + 30);
		const commentLength = zip.readUInt16LE(entry + 32);
		const name = zip.subarray(entry + 46, entry + 46 + nameLength).toString();
		const headerOffset = zip.readUInt32LE(entry + 42);
		const method = zip.readUInt16LE(entry + 10);
		if (name.endsWith("DepartureMono-Regular.woff2")) {
			const headerName = zip.readUInt16LE(headerOffset + 26);
			const headerExtra = zip.readUInt16LE(headerOffset + 28);
			const data = zip.subarray(
				headerOffset + 30 + headerName + headerExtra,
				headerOffset + 30 + headerName + headerExtra + compSize,
			);
			const woff2 = method === 8 ? zlib.inflateRawSync(data) : data;
			await fs.promises.writeFile(
				path.join(root, "public/fonts", "DepartureMono-Regular.woff2"),
				woff2,
			);
			console.log(
				`DepartureMono-Regular.woff2: zip ${zip.length} -> woff2 ${woff2.length}`,
			);
			break;
		}
		entry += 46 + nameLength + extraLength + commentLength;
	}
}

await fs.promises.rm(tmp, { recursive: true, force: true });
