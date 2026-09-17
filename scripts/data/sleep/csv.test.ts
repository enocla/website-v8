import assert from "node:assert/strict";
import test from "node:test";
import { parseCSV } from "./csv.ts";

test("CSV parser handles quoted commas, escaped quotes, and a final row without newline", () => {
	assert.deepEqual(parseCSV('name,note\nAda,"hello, ""world"""\nGrace,last'), [
		["name", "note"],
		["Ada", 'hello, "world"'],
		["Grace", "last"],
	]);
});

test("CSV parser rejects unterminated quoted fields", () => {
	assert.throws(() => parseCSV("name,note\nAda,\"unfinished"), /quoted field/);
});
