/** Structural mirror of the browser-facing artifact in src/features/sleep/data/model.ts. */
interface SleepArtifact {
	schemaVersion: number;
	meta: { n: number; sourceHash: string; generatedBy: string; [key: string]: unknown };
	stats: Record<string, unknown>;
	[key: string]: unknown;
}

export const SLEEP_SCHEMA_VERSION = 1;

const REQUIRED_ARRAYS = [
	"histAsleep",
	"normCurve",
	"histBedRaw",
	"histBedAdj",
	"longitudinal",
	"scatterAsleep",
	"scatterWake",
	"scatterOverhead",
	"scatterDeep",
	"scatterRem",
	"weekday",
	"acf",
] as const satisfies readonly (keyof SleepArtifact)[];

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function visitNumbers(value: unknown, path: string, errors: string[]) {
	if (typeof value === "number" && !Number.isFinite(value)) {
		errors.push(`${path} must be finite`);
		return;
	}
	if (Array.isArray(value)) {
		value.forEach((item, index) => visitNumbers(item, `${path}[${index}]`, errors));
		return;
	}
	if (isRecord(value)) {
		for (const [key, item] of Object.entries(value)) visitNumbers(item, `${path}.${key}`, errors);
	}
}

/** Validates an untrusted parsed-JSON payload against the sleep artifact contract. */
export function validateSleepData(input: unknown): SleepArtifact {
	const errors: string[] = [];
	if (!isRecord(input)) throw new Error("Invalid sleep data:\n- artifact must be an object");
	const data = input;
	const meta = isRecord(data.meta) ? data.meta : {};
	if (data.schemaVersion !== SLEEP_SCHEMA_VERSION) errors.push(`schemaVersion must be ${SLEEP_SCHEMA_VERSION}`);
	if (typeof meta.n !== "number" || !Number.isInteger(meta.n) || meta.n <= 0) errors.push("meta.n must be a positive integer");
	if (typeof meta.sourceHash !== "string" || !/^[a-f0-9]{64}$/.test(meta.sourceHash)) errors.push("meta.sourceHash must be a SHA-256 hex digest");
	if (typeof meta.generatedBy !== "string" || meta.generatedBy.length === 0) errors.push("meta.generatedBy is required");
	for (const key of REQUIRED_ARRAYS) {
		const value = data[key];
		if (!Array.isArray(value) || value.length === 0) errors.push(`${key} must be a non-empty array`);
	}
	if (Array.isArray(data.longitudinal) && data.longitudinal.length !== meta.n) errors.push("longitudinal row count must equal meta.n");
	if (Array.isArray(data.scatterAsleep) && data.scatterAsleep.length !== meta.n) errors.push("scatterAsleep row count must equal meta.n");
	visitNumbers(data, "data", errors);
	if (errors.length > 0) throw new Error(`Invalid sleep data:\n- ${errors.join("\n- ")}`);
	return input as SleepArtifact;
}
