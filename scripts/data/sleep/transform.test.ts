import assert from "node:assert/strict";
import test from "node:test";
import { dateTimeParts, durationHours, gate, isEasternDaylightTime } from "./transform.ts";

test("time parsing rejects malformed durations and dates", () => {
	assert.equal(durationHours(""), null);
	assert.equal(durationHours("07:30:00"), 7.5);
	assert.ok(Number.isNaN(durationHours("07:99:00")));
	assert.equal(dateTimeParts("not a date"), null);
	assert.equal(dateTimeParts("2024-02-30 23:00:00"), null);
});

test("DST boundaries and travel-hour inputs are deterministic", () => {
	assert.equal(isEasternDaylightTime(2024, 3, 9), false);
	assert.equal(isEasternDaylightTime(2024, 3, 10), true);
	assert.equal(isEasternDaylightTime(2024, 11, 2), true);
	assert.equal(isEasternDaylightTime(2024, 11, 3), false);
	assert.equal(dateTimeParts("2024-03-10 08:00:00")?.h, 8);
});

test("vital gates retain valid values and null invalid inputs", () => {
	assert.equal(gate(60, 35, 110), 60);
	assert.equal(gate(20, 35, 110), null);
	assert.equal(gate(Number.NaN, 35, 110), null);
	assert.equal(gate(null, 35, 110), null);
});
