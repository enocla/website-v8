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
];

function visitNumbers(value, path, errors) {
	if (typeof value === "number" && !Number.isFinite(value)) {
		errors.push(`${path} must be finite`);
		return;
	}
	if (Array.isArray(value)) {
		value.forEach((item, index) => visitNumbers(item, `${path}[${index}]`, errors));
		return;
	}
	if (value && typeof value === "object") {
		for (const [key, item] of Object.entries(value)) visitNumbers(item, `${path}.${key}`, errors);
	}
}

export function validateSleepData(data) {
	const errors = [];
	if (!data || typeof data !== "object") errors.push("artifact must be an object");
	if (data?.schemaVersion !== SLEEP_SCHEMA_VERSION) errors.push(`schemaVersion must be ${SLEEP_SCHEMA_VERSION}`);
	if (!Number.isInteger(data?.meta?.n) || data.meta.n <= 0) errors.push("meta.n must be a positive integer");
	if (typeof data?.meta?.sourceHash !== "string" || !/^[a-f0-9]{64}$/.test(data.meta.sourceHash)) errors.push("meta.sourceHash must be a SHA-256 hex digest");
	if (typeof data?.meta?.generatedBy !== "string" || data.meta.generatedBy.length === 0) errors.push("meta.generatedBy is required");
	for (const key of REQUIRED_ARRAYS) {
		if (!Array.isArray(data?.[key]) || data[key].length === 0) errors.push(`${key} must be a non-empty array`);
	}
	if (Array.isArray(data?.longitudinal) && data.longitudinal.length !== data.meta.n) errors.push("longitudinal row count must equal meta.n");
	if (Array.isArray(data?.scatterAsleep) && data.scatterAsleep.length !== data.meta.n) errors.push("scatterAsleep row count must equal meta.n");
	visitNumbers(data, "data", errors);
	if (errors.length > 0) throw new Error(`Invalid sleep data:\n- ${errors.join("\n- ")}`);
	return data;
}
