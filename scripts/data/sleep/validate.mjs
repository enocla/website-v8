import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateSleepData } from "./schema.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const artifactPath = path.join(root, "src/features/sleep/data/sleep.json");

export function validateGeneratedSleepData(filePath = artifactPath) {
	const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
	validateSleepData(data);
	return data;
}

if (import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
	const data = validateGeneratedSleepData();
	console.log(`[data] valid sleep schema v${data.schemaVersion}, ${data.meta.n} nights`);
}
