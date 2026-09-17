import rawSleep from "./sleep.json";

export interface HistogramBin {
	x1: number;
	x2: number;
	count: number;
}

export interface Point {
	i: number;
	x: number;
	y: number;
}

export interface SleepStats {
	asleepMean: number;
	asleepMedian: number;
	asleepSkew: number;
	asleepKurt: number;
	bedRawStd: number;
	bedAdjStd: number;
	bedAdjMedian: number;
	bedAdjQ1: number;
	bedAdjQ3: number;
	regAsleep: { r: number; p: number; slopeHrsPerHr: number };
	regWake: { r: number; p: number; slopeHrsPerHr: number };
	regOverhead: { r: number; p: number; slopeHrsPerHr: number };
	overheadMeanMin: number;
	regDeep: { r: number; p: number; slopeHrsPerHr: number };
	regRem: { r: number; p: number; slopeHrsPerHr: number };
	deepMeanMin: number;
	remEarlyMin: number;
	remLateMin: number;
	anovaF: number;
	anovaP: number;
	acfLag1: number;
	acfLag7: number;
	acfLag14: number;
	tert1: number;
	tert2: number;
	streakN: number;
	streakShort3: number;
	streakLong: number;
}

export interface SleepData {
	schemaVersion: 1;
	meta: {
		n: number;
		sourceHash: string;
		generatedBy: string;
		travelRule: string;
		efficiencyRecomputed: number;
		vitalsNulled: Record<string, number>;
		flaggedRows: number;
	};
	stats: SleepStats;
	histAsleep: HistogramBin[];
	normCurve: { x: number; y: number }[];
	histBedRaw: HistogramBin[];
	histBedAdj: HistogramBin[];
	longitudinal: { i: number; day: number; bed: number; date: string }[];
	scatterAsleep: Point[];
	scatterWake: Point[];
	scatterOverhead: Point[];
	scatterDeep: Point[];
	scatterRem: Point[];
	weekday: { day: string; mean: number; n: number }[];
	acf: { lag: number; r: number }[];
}

export const sleep = rawSleep as unknown as SleepData;
export const sleepStats = sleep.stats;
