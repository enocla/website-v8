import {
	barY,
	defineChart,
	dot,
	linearRegressionY,
	lineY,
	rect,
	ruleY,
	text,
} from "@tanstack/charts";
import { Chart } from "@tanstack/charts/react";
import { scaleBand } from "@tanstack/charts/scales/band";
import { scaleLinear } from "@tanstack/charts/scales/linear";
import { tooltip } from "@tanstack/charts/tooltip";
import { useMemo } from "react";
import { sleep } from "../data/model";

const ACCENT = "#01567e";
const MUTED = "#a09a94";
const INK = "#1c1613";

/** Class hook for site tooltip chrome (see .sleep-tooltip in styles.css). */
const TOOLTIP_CLASS = "sleep-tooltip";

/** Noon-to-noon clock hours (12 = midnight) -> "12am"-style label. */
function fmtClock(h: number): string {
	const mins = ((Math.round(h * 60) % 1440) + 1440) % 1440;
	const h24 = (12 + Math.floor(mins / 60)) % 24;
	const m = mins % 60;
	const ap = h24 < 12 ? "am" : "pm";
	const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
	return m === 0 ? `${h12}${ap}` : `${h12}:${String(m).padStart(2, "0")}${ap}`;
}

const clockTicks = {
	values: [0, 4, 8, 12, 16, 20, 24],
	// biome-ignore lint/suspicious/noExplicitAny: scale tick value type varies
	format: (v: any) => fmtClock(Number(v)),
};

/**
 * Full noon-to-noon clock domain. The scatter points cluster at night, so the
 * inferred data domain is much narrower than the clock; without a pinned
 * domain the explicit tick values above extrapolate outside the plot and the
 * axis baselines hug only the data extent (tall narrow plot, floating axes).
 */
const CLOCK_DOMAIN: [number, number] = [0, 24];

type LoosePoint = { xValue: unknown; yValue: unknown; datum: unknown };

function looseDatum(point: LoosePoint): Record<string, unknown> {
	return (point.datum ?? {}) as Record<string, unknown>;
}

function asNum(v: unknown): number | null {
	const n = typeof v === "number" ? v : Number(v);
	return Number.isFinite(n) ? n : null;
}

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
];

/** "2023-04-20" -> "Apr 20, 2023" without Date timezone pitfalls. */
function fmtIsoDate(iso: unknown): string | null {
	if (typeof iso !== "string") return null;
	const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
	if (!m) return iso;
	return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${Number(m[3])}, ${m[1]}`;
}

function bedtimeText(point: LoosePoint): string | null {
	const x = asNum(point.xValue);
	return x != null ? fmtClock(x) : null;
}

/** Histogram bin range from datum x1/x2, falling back to the raw x value. */
function binRangeText(
	point: LoosePoint,
	format: (v: number) => string,
): string | null {
	const d = looseDatum(point);
	const a = asNum(d.x1);
	const b = asNum(d.x2);
	if (a != null && b != null) return `${format(a)}–${format(b)}`;
	const x = asNum(point.xValue);
	return x != null ? format(x) : null;
}

/** Bar count from datum, falling back to the rounded y value (fit lines). */
function countText(point: LoosePoint): string | null {
	const c = asNum(looseDatum(point).count);
	if (c != null) return `${Math.round(c)}`;
	const y = asNum(point.yValue);
	return y != null ? `~${Math.round(y)}` : null;
}

function Shell({
	definition,
	height,
	ariaLabel,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: definition type varies per chart
	definition: any;
	height: number;
	ariaLabel: string;
}) {
	return (
		<div className="sleep-chart-full">
			<Chart
				definition={definition}
				height={height}
				initialWidth={640}
				ariaLabel={ariaLabel}
			/>
		</div>
	);
}

export function SleepDurationHist() {
	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					rect(sleep.histAsleep, {
						x1: "x1",
						x2: "x2",
						y1: () => 0,
						y2: "count",
						fill: ACCENT,
						inset: 1,
					}),
					lineY(sleep.normCurve, {
						x: "x",
						y: "y",
						stroke: INK,
						strokeWidth: 2,
						strokeDasharray: "5 4",
					}),
				],
				scales: {
					x: { scale: scaleLinear, axis: { label: "Hours asleep" } },
					y: { scale: scaleLinear, grid: true, axis: { label: "Nights" } },
				},
				tooltip: {
					use: tooltip,
					className: TOOLTIP_CLASS,
					items: [
						{
							id: "range",
							label: "Hours asleep",
							text: (p) => binRangeText(p, (v) => `${v.toFixed(1)} h`),
						},
						{ id: "count", label: "Nights", text: countText },
					],
				},
			}),
		[],
	);
	return (
		<Shell
			definition={definition}
			height={300}
			ariaLabel="Histogram of nightly sleep duration with fitted normal curve"
		/>
	);
}

const DAY0 = Date.UTC(2023, 3, 20);
function dayOffset(iso: string): number {
	const [y, m, d] = iso.split("-").map(Number);
	return Math.round((Date.UTC(y, m - 1, d) - DAY0) / 86400000);
}
const YEAR_TICKS = ["2024-01-01", "2025-01-01", "2026-01-01"].map((d) => ({
	v: dayOffset(d),
	label: d.slice(0, 4),
}));

export function BedtimeLongitudinal() {
	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					dot(sleep.longitudinal, {
						x: "day",
						y: "bed",
						key: "i",
						r: 2.5,
						fill: ACCENT,
						fillOpacity: 0.5,
					}),
				],
				scales: {
					x: {
						scale: scaleLinear,
						axis: {
							label: "Date",
							ticks: {
								values: YEAR_TICKS.map((t) => t.v),
								// biome-ignore lint/suspicious/noExplicitAny: scale tick value type varies
								format: (v: any) =>
									YEAR_TICKS.find((t) => t.v === Number(v))?.label ?? "",
							},
						},
					},
					y: {
						scale: scaleLinear,
						grid: true,
						axis: { label: "Bedtime (noon-to-noon clock)", ticks: clockTicks },
					},
				},
				tooltip: {
					use: tooltip,
					className: TOOLTIP_CLASS,
					items: [
						{
							id: "date",
							label: "Night",
							text: (p) => fmtIsoDate(looseDatum(p).date),
						},
						{ id: "bed", label: "Bedtime", text: bedtimeText },
					],
				},
			}),
		[],
	);
	return (
		<Shell
			definition={definition}
			height={340}
			ariaLabel="Scatterplot of raw bedtime against date, showing midday travel clusters"
		/>
	);
}

export function BedtimeAdjHist() {
	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					rect(sleep.histBedAdj, {
						x1: "x1",
						x2: "x2",
						y1: () => 0,
						y2: "count",
						fill: ACCENT,
						inset: 1,
					}),
				],
				scales: {
					x: {
						scale: scaleLinear,
						axis: { label: "Bedtime (noon-to-noon clock)", ticks: clockTicks },
					},
					y: { scale: scaleLinear, grid: true, axis: { label: "Nights" } },
				},
				tooltip: {
					use: tooltip,
					className: TOOLTIP_CLASS,
					items: [
						{
							id: "range",
							label: "Bedtime",
							text: (p) => binRangeText(p, fmtClock),
						},
						{ id: "count", label: "Nights", text: countText },
					],
				},
			}),
		[],
	);
	return (
		<Shell
			definition={definition}
			height={300}
			ariaLabel="Histogram of travel-adjusted bedtimes, a single Gaussian curve"
		/>
	);
}

const fmtAsleepY = (v: number) => `${v.toFixed(2)} h`;
const fmtRemY = (v: number) => `${Math.round(v)} min`;
const fmtOverheadY = (v: number) => `${Math.round(v)} min`;

function Scatter({
	points,
	yLabel,
	formatY,
	yTicks,
	ariaLabel,
}: {
	points: { i: number; x: number; y: number }[];
	yLabel: string;
	formatY: (v: number) => string;
	yTicks?: { values: number[] };
	ariaLabel: string;
}) {
	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					dot(points, {
						x: "x",
						y: "y",
						key: "i",
						r: 3,
						fill: ACCENT,
						fillOpacity: 0.45,
					}),
					linearRegressionY(points, {
						x: "x",
						y: "y",
						stroke: INK,
						strokeWidth: 2,
					}),
				],
				scales: {
					x: {
						// A scale instance retains its configured domain; a
						// factory would infer the narrow data extent instead.
						scale: scaleLinear().domain(CLOCK_DOMAIN),
						grid: true,
						axis: { label: "Bedtime (noon-to-noon clock)", ticks: clockTicks },
					},
					y: {
						scale: scaleLinear,
						grid: true,
						axis: yTicks ? { label: yLabel, ticks: yTicks } : { label: yLabel },
					},
				},
				tooltip: {
					use: tooltip,
					className: TOOLTIP_CLASS,
					items: [
						{ id: "x", label: "Bedtime", text: bedtimeText },
						{
							id: "y",
							label: yLabel,
							text: (p) => {
								const y = asNum(p.yValue);
								return y != null ? formatY(y) : null;
							},
						},
					],
				},
			}),
		[points, yLabel, formatY, yTicks],
	);
	return <Shell definition={definition} height={480} ariaLabel={ariaLabel} />;
}

export function BedtimeVsAsleep() {
	return (
		<Scatter
			points={sleep.scatterAsleep}
			yLabel="Hours asleep"
			formatY={fmtAsleepY}
			ariaLabel="Scatterplot of bedtime versus hours asleep with regression line"
		/>
	);
}

const wakeTicks = {
	values: [12, 16, 20, 24, 28],
	// biome-ignore lint/suspicious/noExplicitAny: scale tick value type varies
	format: (v: any) => fmtClock(Number(v)),
};

export function BedtimeVsWake() {
	return (
		<Scatter
			points={sleep.scatterWake}
			yLabel="Wake time"
			formatY={fmtClock}
			yTicks={wakeTicks}
			ariaLabel="Scatterplot of bedtime versus wake time with regression line"
		/>
	);
}

export function BedtimeVsRem() {
	return (
		<Scatter
			points={sleep.scatterRem}
			yLabel="REM sleep (minutes)"
			formatY={fmtRemY}
			ariaLabel="Scatterplot of bedtime versus REM sleep minutes with regression line"
		/>
	);
}

export function BedtimeVsOverhead() {
	return (
		<Scatter
			points={sleep.scatterOverhead}
			yLabel="Time awake in bed (minutes)"
			formatY={fmtOverheadY}
			ariaLabel="Scatterplot of bedtime versus time awake in bed with regression line"
		/>
	);
}

export function WeekdayBars() {
	const definition = useMemo(
		() =>
			defineChart({
				marks: [
					barY(sleep.weekday, {
						x: "day",
						y: "mean",
						key: "day",
						fill: (d) => (d.day === "Fri" || d.day === "Sat" ? ACCENT : MUTED),
						inset: 2,
					}),
					text(sleep.weekday, {
						x: "day",
						y: "mean",
						key: "day",
						text: (d) => d.mean.toFixed(2),
						dy: -8,
						anchor: "middle",
						fontSize: 12,
						fill: INK,
					}),
				],
				scales: {
					x: {
						scale: () => scaleBand().padding(0.25),
						axis: { label: "Sleep night" },
					},
					y: {
						scale: scaleLinear,
						grid: true,
						axis: { label: "Mean hours asleep" },
					},
				},
				tooltip: {
					use: tooltip,
					className: TOOLTIP_CLASS,
					items: [
						{
							id: "day",
							label: "Night",
							text: (p) => {
								const v = p.xValue ?? looseDatum(p).day;
								return typeof v === "string" && v ? v : null;
							},
						},
						{
							id: "mean",
							label: "Mean asleep",
							text: (p) => {
								const y = asNum(p.yValue);
								return y != null ? `${y.toFixed(2)} h` : null;
							},
						},
						{
							id: "n",
							label: "Nights",
							text: (p) => {
								const n = asNum(looseDatum(p).n);
								return n != null ? `${Math.round(n)}` : null;
							},
						},
					],
				},
			}),
		[],
	);
	return (
		<Shell
			definition={definition}
			height={300}
			ariaLabel="Bar chart of mean sleep by weekday with weekend catch-up"
		/>
	);
}

export function AcfBars() {
	const definition = useMemo(() => {
		const rows = sleep.acf.map((d) => ({ ...d, lag: String(d.lag) }));
		return defineChart({
			marks: [
				barY(rows, {
					x: "lag",
					y: "r",
					key: "lag",
					fill: (d) => (["3", "7", "14"].includes(d.lag) ? ACCENT : MUTED),
					inset: 1,
				}),
				ruleY([{ v: 0 }], { y: "v", stroke: INK, strokeWidth: 1 }),
			],
			scales: {
				x: {
					scale: () => scaleBand().padding(0.25),
					axis: {
						label: "Lag (nights)",
						ticks: { values: ["1", "7", "14", "21"] },
					},
				},
				y: {
					scale: scaleLinear,
					grid: true,
					axis: { label: "Autocorrelation" },
				},
			},
			tooltip: {
				use: tooltip,
				className: TOOLTIP_CLASS,
				items: [
					{
						id: "lag",
						label: "Lag",
						text: (p) => {
							const n = asNum(p.xValue ?? looseDatum(p).lag);
							if (n == null) return null;
							const k = Math.round(n);
							return k === 1 ? "1 night" : `${k} nights`;
						},
					},
					{
						id: "r",
						label: "Autocorrelation",
						text: (p) => {
							const r = asNum(p.yValue);
							return r != null ? r.toFixed(2) : null;
						},
					},
				],
			},
		});
	}, []);
	return (
		<Shell
			definition={definition}
			height={300}
			ariaLabel="Bar chart of sleep autocorrelation by lag with weekly peaks"
		/>
	);
}

export const sleepStats = sleep.stats;
