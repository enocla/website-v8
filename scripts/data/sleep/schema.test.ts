import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { validateSleepData } from "./schema.ts";

test("generated sleep data has the checked-in schema contract", () => {
	const data = JSON.parse(fs.readFileSync("src/features/sleep/data/sleep.json", "utf8"));
	assert.equal(validateSleepData(data), data);
	assert.equal(data.schemaVersion, 1);
	assert.equal(data.meta.n, data.longitudinal.length);
});

test("generated sleep data rejects non-finite values", () => {
	assert.throws(() => validateSleepData({ schemaVersion: 1, meta: { n: 1, sourceHash: "0".repeat(64), generatedBy: "test" }, histAsleep: [{ count: Number.NaN }] }), /must be finite/);
});
