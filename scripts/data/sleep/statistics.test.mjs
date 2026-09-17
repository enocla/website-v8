import assert from "node:assert/strict";
import test from "node:test";
import { acf, median, ols, popStd, quantileFloor } from "./statistics.mjs";

test("statistics handle small deterministic samples", () => {
	assert.equal(median([1, 4, 2]), 2);
	assert.equal(median([1, 4, 2, 8]), 3);
	assert.equal(popStd([2, 2, 2]), 0);
	assert.equal(quantileFloor([1, 2, 3, 4, 5, 6], 0.5), 4);
	assert.deepEqual(acf([1, 2, 3, 4], 2).map((value) => Number(value.toFixed(6))), [0.25, -0.3]);
});

test("ordinary least squares exposes slope, correlation, and p-value", () => {
	const result = ols([1, 2, 3, 4], [2, 4, 6, 8]);
	assert.equal(result.slope, 2);
	assert.equal(result.intercept, 0);
	assert.equal(result.r, 1);
	assert.ok(result.p >= 0 && result.p <= 1);
});
