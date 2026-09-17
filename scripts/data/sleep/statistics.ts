export const mean = (values: readonly number[]) => {
	if (values.length === 0) throw new Error("mean requires at least one value");
	return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const popStd = (values: readonly number[]) => {
	const average = mean(values);
	return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};

export const sorted = (values: readonly number[]) => [...values].sort((a, b) => a - b);

export const median = (values: readonly number[]) => {
	const ordered = sorted(values);
	const middle = ordered.length / 2;
	return ordered.length % 2
		? ordered[Math.floor(middle)]
		: (ordered[middle - 1] + ordered[middle]) / 2;
};

export const quantileFloor = (values: readonly number[], probability: number) => {
	const ordered = sorted(values);
	return ordered[Math.min(ordered.length - 1, Math.floor(probability * ordered.length))];
};

function betacf(a: number, b: number, x: number) {
	const MAX_ITERATIONS = 200;
	const EPSILON = 3e-12;
	const FLOATING_POINT_MIN = 1e-300;
	const qab = a + b;
	const qap = a + 1;
	const qam = a - 1;
	let c = 1;
	let d = 1 - (qab * x) / qap;
	if (Math.abs(d) < FLOATING_POINT_MIN) d = FLOATING_POINT_MIN;
	d = 1 / d;
	let h = d;
	for (let m = 1; m <= MAX_ITERATIONS; m++) {
		const m2 = 2 * m;
		let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
		d = 1 + aa * d;
		if (Math.abs(d) < FLOATING_POINT_MIN) d = FLOATING_POINT_MIN;
		c = 1 + aa / c;
		if (Math.abs(c) < FLOATING_POINT_MIN) c = FLOATING_POINT_MIN;
		d = 1 / d;
		h *= d * c;
		aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
		d = 1 + aa * d;
		if (Math.abs(d) < FLOATING_POINT_MIN) d = FLOATING_POINT_MIN;
		c = 1 + aa / c;
		if (Math.abs(c) < FLOATING_POINT_MIN) c = FLOATING_POINT_MIN;
		d = 1 / d;
		const delta = d * c;
		h *= delta;
		if (Math.abs(delta - 1) < EPSILON) break;
	}
	return h;
}

function logGamma(value: number): number {
	const coefficients = [
		0.9999999999998099,
		676.5203681218851,
		-1259.1392167224028,
		771.3234287776531,
		-176.6150291621406,
		12.507343278686905,
		-0.13857109526572012,
		9.984369578019572e-6,
		1.5056327351493116e-7,
	];
	if (value < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * value)) - logGamma(1 - value);
	const z = value - 1;
	let x = coefficients[0];
	for (let i = 1; i < coefficients.length; i++) x += coefficients[i] / (z + i);
	const t = z + 7 + 0.5;
	return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function betai(a: number, b: number, x: number) {
	if (x <= 0) return 0;
	if (x >= 1) return 1;
	const beta = Math.exp(
		logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
	);
	if (x < (a + 1) / (a + b + 2)) return (beta * betacf(a, b, x)) / a;
	return 1 - (beta * betacf(b, a, 1 - x)) / b;
}

function tPvalue(t: number, degreesOfFreedom: number) {
	return betai(degreesOfFreedom / 2, 0.5, degreesOfFreedom / (degreesOfFreedom + t * t));
}

export function fPvalue(f: number, numeratorDf: number, denominatorDf: number) {
	const x = (numeratorDf * f) / (numeratorDf * f + denominatorDf);
	return 1 - betai(numeratorDf / 2, denominatorDf / 2, x);
}

export function ols(xs: readonly number[], ys: readonly number[]) {
	if (xs.length !== ys.length || xs.length < 3) {
		throw new Error("ols requires equal arrays with at least three values");
	}
	const n = xs.length;
	const mx = mean(xs);
	const my = mean(ys);
	let sxy = 0;
	let sxx = 0;
	let syy = 0;
	for (let i = 0; i < n; i++) {
		sxy += (xs[i] - mx) * (ys[i] - my);
		sxx += (xs[i] - mx) ** 2;
		syy += (ys[i] - my) ** 2;
	}
	const slope = sxy / sxx;
	const intercept = my - slope * mx;
	const r = sxy / Math.sqrt(sxx * syy);
	const t = (r * Math.sqrt(n - 2)) / Math.sqrt(1 - r * r);
	return { n, slope, intercept, r, p: tPvalue(Math.abs(t), n - 2) };
}

export function acf(series: readonly number[], maxLag: number) {
	const average = mean(series);
	const denominator = series.reduce((sum, value) => sum + (value - average) ** 2, 0);
	const values = [];
	for (let lag = 1; lag <= maxLag; lag++) {
		let numerator = 0;
		for (let i = lag; i < series.length; i++) {
			numerator += (series[i] - average) * (series[i - lag] - average);
		}
		values.push(numerator / denominator);
	}
	return values;
}
