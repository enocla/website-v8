import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { validateGeneratedSleepData } from "./data/sleep/validate.ts";

// Deployments use the checked-in aggregate; the private CSV is never required.
const input = fileURLToPath(new URL("../data/sleep/raw/sleep.csv", import.meta.url));
if (fs.existsSync(input)) {
	await import("./data/sleep/preprocess.ts");
} else {
	console.log("[data] Private CSV absent; using the checked-in sleep aggregate");
}
validateGeneratedSleepData();
