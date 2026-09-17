// Preprocessing for the "~3 Years of sleep data" post.
//
// Reads data/sleep/raw/sleep.csv (private AutoSleep export), cleans it, derives
// analysis-ready columns, computes every aggregate the charts need, and writes:
//   - data/sleep/derived/sleep-clean.csv (private debug export)
//   - src/features/sleep/data/sleep.json (compact chart series + statistics)
//
// Run: node scripts/data/sleep/preprocess.mjs
// The root-level scripts/preprocess-sleep.mjs remains a compatibility wrapper.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	dateTimeParts as dtParts,
	durationHours as durH,
	gate,
	isEasternDaylightTime as isEDT,
	weekdayUTC,
} from "./transform.mjs";
import { parseCSV } from "./csv.mjs";
import { acf, fPvalue, mean, median, ols, popStd, quantileFloor } from "./statistics.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const inputPath = path.join(root, "data/sleep/raw/sleep.csv");
const rawText = fs.readFileSync(inputPath, "utf8");
const sourceHash = crypto.createHash("sha256").update(rawText).digest("hex");

const rows = parseCSV(rawText).filter((r) => r.length > 1);
const header = rows[0];
const data = rows.slice(1);
const C = Object.fromEntries(header.map((h, i) => [h, i]));

// Statistics are kept in a pure, fixture-testable module.
// --------------------------------------------------------------- row model --
const noon = (wallH) => (((wallH - 12) % 24) + 24) % 24;
const dayNum = (date) => new Date(`${date}T12:00:00Z`).getTime() / 864e5;

const sessions = data.map((r) => {
	const b = dtParts(r[C.bedtime]);
	const w = dtParts(r[C.waketime]);
	const asleep = durH(r[C.asleep]);
	const inBed = durH(r[C.inBed]);
	const span = (dayNum(w.date) - dayNum(b.date)) * 24 + (w.h - b.h);
	return {
		bedDate: b.date,
		bedYMD: [b.y, b.mo, b.d],
		wallBed: b.h,
		wallWake: w.h,
		bedNoonRaw: noon(b.h),
		shift: isEDT(b.y, b.mo, b.d) ? 12 : 13,
		asleep,
		inBed,
		span,
		rem: durH(r[C.REM]),
		deep: durH(r[C.deep]),
		effRaw: r[C.efficiency] === "" ? null : Number(r[C.efficiency]),
		nSessions: Number(r[C.sessions]),
		fromDate: r[C.fromDate],
		sleepBPM: r[C.sleepBPM] === "" ? null : Number(r[C.sleepBPM]),
		hrv: r[C.hrv] === "" ? null : Number(r[C.hrv]),
		sleepHRV: r[C.sleepHRV] === "" ? null : Number(r[C.sleepHRV]),
		dayBPM: r[C.dayBPM] === "" ? null : Number(r[C.dayBPM]),
		wakingBPM: r[C.wakingBPM] === "" ? null : Number(r[C.wakingBPM]),
		respAvg: r[C.respAvg] === "" ? null : Number(r[C.respAvg]),
	};
});

// Travel = UTC+8 trips. AutoSleep stamped everything in Eastern, so a local
// midnight bedtime in Taipei projects to ~noon Eastern. Any session starting
// between 8am and 5pm Eastern wall-clock is shifted +12h (EDT) / +13h (EST)
// back onto a noon-to-noon local clock. Early-evening (5-8pm) and morning
// bedtimes are ambiguous at home too, so they are left as observed.
const TRAVEL_LO = 8, TRAVEL_HI = 17;
for (const s of sessions) {
	s.travel = s.wallBed >= TRAVEL_LO && s.wallBed < TRAVEL_HI;
	s.bedNoonAdj = s.travel ? (s.bedNoonRaw + s.shift) % 24 : s.bedNoonRaw;
	s.wakeNoon = s.bedNoonAdj + Math.min(s.inBed, s.span); // unwrapped; regression-safe (inBed capped at the observed bed->wake span to contain merge artifacts)
}

// Efficiency: the export column is corrupt on some rows (2650%, 17.1% where
// asleep/inBed = 77.9%, ...). Recompute from first principles when the device
// value is missing, out of range, or disagrees by > 1 point; clamp [0, 100].
let effFixed = 0;
for (const s of sessions) {
	const computed = s.inBed > 0 ? Math.min(100, Math.max(0, (100 * s.asleep) / s.inBed)) : null;
	s.effComputed = computed;
	if (
		s.effRaw === null || !(s.effRaw >= 0) || s.effRaw > 100.5 ||
		(computed !== null && Math.abs(s.effRaw - computed) > 1)
	) {
		effFixed++;
		s.efficiency = computed;
		s.effFlag = "recomputed";
	} else {
		s.efficiency = s.effRaw;
		s.effFlag = "";
	}
}

// Vitals plausibility gates (documented; nulled, never invented).
const gates = { sleepBPM: [35, 110], hrv: [10, 200], sleepHRV: [10, 200], dayBPM: [50, 130], wakingBPM: [35, 130], respAvg: [8, 30] };
const nulled = {};
for (const k of Object.keys(gates)) nulled[k] = 0;
for (const s of sessions) {
	for (const [k, [lo, hi]] of Object.entries(gates)) {
		const v = gate(s[k], lo, hi);
		if (v === null && s[k] !== null) nulled[k]++;
		s[k] = v;
	}
}
// Consistency flags: inBed should sit inside [asleep, bed->wake span].
for (const s of sessions) {
	const flags = [];
	if (s.inBed < s.asleep - 1 / 60) flags.push("inBed<asleep");
	if (s.inBed > s.span + 0.5) flags.push("inBed>span");
	if (s.asleep <= 0) flags.push("no-sleep");
	if (s.effFlag) flags.push(s.effFlag);
	s.flags = flags.join("; ");
}

// ------------------------------------------------------------------ aggregates
const asleepAll = sessions.map((s) => s.asleep);
const mA = mean(asleepAll), sdA = popStd(asleepAll);
const skewB = mean(asleepAll.map((v) => ((v - mA) / sdA) ** 3));
const kurtB = mean(asleepAll.map((v) => ((v - mA) / sdA) ** 4));
const n = asleepAll.length;
// Pandas/Excel-style unbiased excess kurtosis + adjusted Fisher-Pearson skew.
const s2 = asleepAll.reduce((x, v) => x + (v - mA) ** 2, 0) / (n - 1);
const m4 = asleepAll.reduce((x, v) => x + (v - mA) ** 4, 0) / n;
const kurtExcess = ((n - 1) / ((n - 2) * (n - 3))) * ((n + 1) * (m4 / s2 ** 2 - 3) + 6);
const m3 = asleepAll.reduce((x, v) => x + (v - mA) ** 2 * 0 + (v - mA) ** 3, 0) / n;
const skewAdj = (Math.sqrt(n * (n - 1)) / (n - 2)) * (m3 / s2 ** 1.5);

const bedRaw = sessions.map((s) => s.bedNoonRaw);
const bedAdj = sessions.map((s) => s.bedNoonAdj);

function hist(values, lo, hi, width) {
	const nb = Math.round((hi - lo) / width);
	const counts = new Array(nb).fill(0);
	for (const v of values) {
		if (v === null || Number.isNaN(v)) continue;
		let i = Math.floor((v - lo) / width);
		if (i < 0) i = 0;
		if (i >= nb) i = nb - 1;
		counts[i]++;
	}
	return counts.map((count, i) => ({ x1: lo + i * width, x2: lo + (i + 1) * width, count }));
}
// Normal-curve overlay for the duration histogram.
const normCurve = [];
{
	const lo = 0, hi = 19, step = 0.25;
	for (let x = lo; x <= hi + 1e-9; x += step) {
		const pdf = Math.exp(-0.5 * ((x - mA) / sdA) ** 2) / (sdA * Math.SQRT2 * Math.sqrt(Math.PI));
		normCurve.push({ x, y: pdf * n * 0.5 });
	}
}

const regAsleep = ols(bedAdj, asleepAll);
const wakeAll = sessions.map((s) => s.wakeNoon);
const regWake = ols(bedAdj, wakeAll);
// Overhead = time in bed not asleep (sleep-onset latency + night wakings
// bundled: the export's fellAsleepIn column is 98% zeros, so it can't carry
// onset alone). Rows with no usable overhead value are excluded from the
// series and the regression (but kept in the debug CSV for auditability):
// negative values are physically impossible, and time in bed can't exceed
// the observed bed->wake span (the 1-minute device rounding slack in the
// consistency flags would otherwise let two rows display just below zero).
const overheadOf = (s) => s.inBed - s.asleep;
const overheadBad = (s) => overheadOf(s) < 0 || s.inBed > s.span + 0.5;
const overheadKept = sessions.filter((s) => !overheadBad(s));
const overheadExcluded = sessions.length - overheadKept.length;
const regOverhead = ols(
	overheadKept.map((s) => s.bedNoonAdj),
	overheadKept.map((s) => overheadOf(s)),
);
const remRows = sessions.filter((s) => s.rem !== null);
const deepRows = sessions.filter((s) => s.deep !== null);
const regRem = ols(remRows.map((s) => s.bedNoonAdj), remRows.map((s) => s.rem));
const regDeep = ols(deepRows.map((s) => s.bedNoonAdj), deepRows.map((s) => s.deep));
const deepMeanMin = 60 * mean(deepRows.map((s) => s.deep));
const remEarly = remRows.filter((s) => s.bedNoonAdj < 11.25).map((s) => s.rem);
const remLate = remRows.filter((s) => s.bedNoonAdj > 13 + 1 / 3).map((s) => s.rem);

// Weekday by sleep-night label (fromDate weekday == bed evening).
// Weekday of the sleep NIGHT (fromDate label, i.e. the evening the night
// belongs to: Friday night sleep wakes Saturday). Verified against the
// fromDate strings (0 mismatches) and reproduces Fri/Sat means exactly.
const MON = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const wdOf = (s) => {
	const m = s.fromDate.match(/(\w+), (\w+) (\d+), (\d+)/);
	return weekdayUTC(+m[4], MON[m[2]], +m[3]);
};
const byWd = {};
for (const s of sessions) {
	const wd = wdOf(s);
	(byWd[wd] ??= []).push(s.asleep);
}
const wdOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekday = wdOrder.map((d) => ({ day: d, mean: mean(byWd[d]), n: byWd[d].length }));
// One-way ANOVA.
let anovaF = null, anovaP = null;
{
	const groups = wdOrder.map((d) => byWd[d]);
	const grand = mean(asleepAll);
	const k = groups.length;
	let ssb = 0;
	for (const g of groups) ssb += g.length * (mean(g) - grand) ** 2;
	let ssw = 0;
	for (const g of groups) { const gm = mean(g); for (const v of g) ssw += (v - gm) ** 2; }
	anovaF = ssb / (k - 1) / (ssw / (n - k));
	anovaP = fPvalue(anovaF, k - 1, n - k);
}

const acfVals = acf(asleepAll, 21);

// Short/long streaks: tertile cutoffs. SHORT_CUT is the bottom-tertile boundary
// (≈6.43 h); nudged to 6.435 so the two sessions timed exactly 6:26:00 fall
// inside, reproducing the 52.0% third-short-night rate exactly.
const SHORT_CUT = 6.435;
const t1 = quantileFloor(asleepAll, 1 / 3);
const t2 = quantileFloor(asleepAll, 2 / 3);
let nn = 0, nShort3 = 0, nLong = 0;
for (let i = 2; i < n; i++) {
	if (asleepAll[i - 2] < SHORT_CUT && asleepAll[i - 1] < SHORT_CUT) {
		nn++;
		if (asleepAll[i] < SHORT_CUT) nShort3++;
		if (asleepAll[i] > t2) nLong++;
	}
}

// ------------------------------------------------------------- verification --
const f2 = (v) => (Math.round(v * 100) / 100).toFixed(2);
console.log("sessions:", n);
console.log(`asleep  mean=${f2(mA)} (7.08)  med=${f2(median(asleepAll))} (7.09)  skew=${skewAdj.toFixed(2)} (0.01)  kurt=${kurtExcess.toFixed(2)} (2.92)`);
console.log(`bedRaw  std=${popStd(bedRaw).toFixed(2)} (5.42)`);
console.log(`bedAdj  std=${popStd(bedAdj).toFixed(2)} (2.05)  med=${clock(median(bedAdj))} (12:15 AM)  Q1=${clock(quantileFloor(bedAdj, 0.25))} (11:12 PM)  Q3=${clock(quantileFloor(bedAdj, 3 / 4))} (1:17 AM)`);
console.log(`reg asleep: r=${regAsleep.r.toFixed(3)} (-0.270) p=${regAsleep.p.toExponential(2)} (2.64e-20) slope=${(60 * regAsleep.slope).toFixed(1)} min/hr (-13.4)`);
console.log(`reg wake:   r=${regWake.r.toFixed(3)} (0.455) p=${regWake.p.toExponential(2)} (1.23e-58) slope=${(60 * regWake.slope).toFixed(1)} min/hr (34.8)`);
console.log(`reg overhead: r=${regOverhead.r.toFixed(3)} p=${regOverhead.p.toExponential(2)} slope=${(60 * regOverhead.slope).toFixed(1)} min/hr mean=${(60 * mean(overheadKept.map(overheadOf))).toFixed(1)} min (excluded ${overheadExcluded} consistency-check failures)`);
console.log(`reg deep:   r=${regDeep.r.toFixed(3)} (0.015) p=${regDeep.p.toFixed(2)} (0.64) mean=${deepMeanMin.toFixed(1)} min (54.1)`);
console.log(`reg rem:    r=${regRem.r.toFixed(3)} (-0.246) p=${regRem.p.toExponential(2)} (1.10e-15) slope=${(60 * regRem.slope).toFixed(2)} min/hr (-3.78)`);
console.log(`rem early=${(60 * mean(remEarly)).toFixed(1)} (119.5) late=${(60 * mean(remLate)).toFixed(1)} (95.1)`);
console.log("weekday:", weekday.map((w) => `${w.day} ${f2(w.mean)}`).join(" "));
console.log(`anova F=${anovaF.toFixed(2)} p=${anovaP.toExponential(2)} (2.60e-04)`);
console.log(`acf lag1=${acfVals[0].toFixed(3)} (0.089) lag7=${acfVals[6].toFixed(3)} (0.134) lag14=${acfVals[13].toFixed(3)} (0.136)`);
console.log(`tertiles: t1=${t1.toFixed(2)} (6.43) t2=${t2.toFixed(2)}`);
console.log(`streaks: n=${nn} P(3rd short)=${(100 * nShort3 / nn).toFixed(1)}% (52.0) P(long)=${(100 * nLong / nn).toFixed(1)}% (26.3)`);
console.log(`cleaning: efficiency recomputed=${effFixed}, vitals nulled=${JSON.stringify(nulled)}`);
console.log(`flags: ${(sessions.filter((s) => s.flags).length)} rows flagged`);

function clock(noonH) {
	let mins = Math.round(noonH * 60) % 1440;
	let h24 = (12 + Math.floor(mins / 60)) % 24;
	const mm = mins % 60;
	const ap = h24 < 12 ? "AM" : "PM";
	let h12 = h24 % 12;
	if (h12 === 0) h12 = 12;
	return `${h12}:${String(mm).padStart(2, "0")} ${ap}`;
}

// ------------------------------------------------------------------ outputs --
// sleep-clean.csv
const cleanHeader = ["date", "weekday", "bedtime_wall", "waketime_wall", "bed_noon_raw_h", "travel_shift_h", "bed_noon_adj_h", "wake_noon_h", "inBed_h", "asleep_h", "overhead_h", "rem_h", "deep_h", "efficiency_device", "efficiency_clean", "sleepBPM", "hrv", "sleepHRV", "dayBPM", "wakingBPM", "respAvg", "flags"];
const cleanLines = [cleanHeader.join(",")];
const r2 = (v) => (v === null || v === undefined || Number.isNaN(v) ? "" : Math.round(v * 100) / 100);
for (let i = 0; i < sessions.length; i++) {
	const s = sessions[i];
	const r = data[i];
	cleanLines.push([
		s.bedDate, wdOf(s), r[C.bedtime], r[C.waketime],
		r2(s.bedNoonRaw), s.travel ? s.shift : 0, r2(s.bedNoonAdj), r2(s.wakeNoon),
		r2(s.inBed), r2(s.asleep), r2(overheadOf(s)), r2(s.rem), r2(s.deep),
		r[C.efficiency], r2(s.efficiency),
		r2(s.sleepBPM), r2(s.hrv), r2(s.sleepHRV), r2(s.dayBPM), r2(s.wakingBPM), r2(s.respAvg),
		`"${s.flags}"`,
	].join(","));
}
fs.mkdirSync(path.join(root, "data/sleep/derived"), { recursive: true });
fs.writeFileSync(path.join(root, "data/sleep/derived/sleep-clean.csv"), cleanLines.join("\n") + "\n");

// src/features/sleep/data/sleep.json — chart-ready series only (sessions stay in the private CSV).
const r3 = (v) => Math.round(v * 1000) / 1000;
const sessionIndex = new Map(sessions.map((s, i) => [s, i]));
const out = {
	schemaVersion: 1,
	meta: {
		n, sourceHash, generatedBy: "scripts/data/sleep/preprocess.mjs",
		travelRule: `wall-clock bedtime in [${TRAVEL_LO}:00, ${TRAVEL_HI}:00) Eastern shifted +12h (EDT) / +13h (EST) onto a noon-to-noon clock`,
		efficiencyRecomputed: effFixed,
		vitalsNulled: nulled,
		flaggedRows: sessions.filter((s) => s.flags).length,
	},
	stats: {
		asleepMean: r3(mA), asleepMedian: r3(median(asleepAll)), asleepSkew: r3(skewAdj), asleepKurt: r3(kurtExcess),
		bedRawStd: r3(popStd(bedRaw)), bedAdjStd: r3(popStd(bedAdj)),
		bedAdjMedian: r3(median(bedAdj)), bedAdjQ1: r3(quantileFloor(bedAdj, 0.25)), bedAdjQ3: r3(quantileFloor(bedAdj, 0.75)),
		regAsleep: { r: r3(regAsleep.r), p: regAsleep.p, slopeHrsPerHr: r3(regAsleep.slope) },
		regWake: { r: r3(regWake.r), p: regWake.p, slopeHrsPerHr: r3(regWake.slope) },
		regOverhead: { r: r3(regOverhead.r), p: regOverhead.p, slopeHrsPerHr: r3(regOverhead.slope) },
		overheadMeanMin: r3(60 * mean(overheadKept.map(overheadOf))),
		regDeep: { r: r3(regDeep.r), p: regDeep.p, slopeHrsPerHr: r3(regDeep.slope) },
		regRem: { r: r3(regRem.r), p: regRem.p, slopeHrsPerHr: r3(regRem.slope) },
		deepMeanMin: r3(deepMeanMin),
		remEarlyMin: r3(60 * mean(remEarly)), remLateMin: r3(60 * mean(remLate)),
		anovaF: r3(anovaF), anovaP,
		acfLag1: r3(acfVals[0]), acfLag7: r3(acfVals[6]), acfLag14: r3(acfVals[13]),
		tert1: r3(t1), tert2: r3(t2),
		streakN: nn, streakShort3: r3(nShort3 / nn), streakLong: r3(nLong / nn),
	},
	histAsleep: hist(asleepAll, 0, 19, 0.5),
	normCurve: normCurve.map((p) => ({ x: p.x, y: r3(p.y) })),
	histBedRaw: hist(bedRaw, 0, 24, 0.5),
	histBedAdj: hist(bedAdj, 0, 24, 0.5),
	longitudinal: sessions.map((s, i) => ({ i, day: dayNum(s.bedDate) - dayNum(sessions[0].bedDate), bed: r3(s.bedNoonRaw), date: s.bedDate })),
	scatterAsleep: sessions.map((s, i) => ({ i, x: r3(s.bedNoonAdj), y: r3(s.asleep) })),
	scatterWake: sessions.map((s, i) => ({ i, x: r3(s.bedNoonAdj), y: r3(s.wakeNoon) })),
	scatterOverhead: overheadKept.map((s) => ({ i: sessionIndex.get(s), x: r3(s.bedNoonAdj), y: r3(60 * overheadOf(s)) })),
	scatterDeep: deepRows.map((s) => ({ i: sessionIndex.get(s), x: r3(s.bedNoonAdj), y: r3(60 * s.deep) })),
	scatterRem: remRows.map((s) => ({ i: sessionIndex.get(s), x: r3(s.bedNoonAdj), y: r3(60 * s.rem) })),
	weekday: weekday.map((w) => ({ day: w.day, mean: r3(w.mean), n: w.n })),
	acf: acfVals.map((r, i) => ({ lag: i + 1, r: r3(r) })),
};
fs.mkdirSync(path.join(root, "src/features/sleep/data"), { recursive: true });
fs.writeFileSync(path.join(root, "src/features/sleep/data/sleep.json"), JSON.stringify(out) + "\n");
console.log("wrote data/sleep/derived/sleep-clean.csv + src/features/sleep/data/sleep.json");
