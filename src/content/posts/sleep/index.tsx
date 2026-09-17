import {
	AcfBars,
	BedtimeAdjHist,
	BedtimeLongitudinal,
	BedtimeVsAsleep,
	BedtimeVsRem,
	BedtimeVsWake,
	SleepDurationHist,
	WeekdayBars,
} from "../../../features/sleep/charts/SleepCharts";
import { sleepStats } from "../../../features/sleep/data/model";

export default function SleepPost() {
	const s = sleepStats;
	return (
		<>
			<h2>Sleep duration</h2>
			<SleepDurationHist />
			<ul>
				<li>Mean {s.asleepMean.toFixed(2)} hours</li>
				<li>Median {s.asleepMedian.toFixed(2)} hours</li>
				<li>Skew {s.asleepSkew.toFixed(2)}</li>
				<li>Kurtosis {s.asleepKurt.toFixed(2)}</li>
			</ul>
			<h2>Bedtimes, 2023–2026</h2>
			<BedtimeLongitudinal />
			<ul>
				<li>Raw std dev {s.bedRawStd.toFixed(2)} hours</li>
			</ul>
			<BedtimeAdjHist />
			<ul>
				<li>Adjusted std dev {s.bedAdjStd.toFixed(2)} hours</li>
				<li>Median 12:15am</li>
				<li>IQR 11:13pm – 1:19am</li>
			</ul>
			<h2>Bedtime vs sleep duration</h2>
			<BedtimeVsAsleep />
			<ul>
				<li>r = {s.regAsleep.r.toFixed(2)}</li>
				<li>p = 4.3 × 10⁻²¹</li>
				<li>Slope {(60 * s.regAsleep.slopeHrsPerHr).toFixed(1)} min/hour</li>
			</ul>
			<h2>Bedtime vs wake time</h2>
			<BedtimeVsWake />
			<ul>
				<li>r = {s.regWake.r.toFixed(2)}</li>
				<li>p = 6.7 × 10⁻⁵⁹</li>
				<li>Slope +{(60 * s.regWake.slopeHrsPerHr).toFixed(1)} min/hour</li>
			</ul>
			<h2>Bedtime vs REM sleep</h2>
			<BedtimeVsRem />
			<ul>
				<li>r = {s.regRem.r.toFixed(2)}</li>
				<li>p = 2.8 × 10⁻¹⁵</li>
				<li>Slope {(60 * s.regRem.slopeHrsPerHr).toFixed(1)} min/hour</li>
				<li>
					Early (&lt;11:15pm) {s.remEarlyMin.toFixed(1)} min vs late
					(&gt;1:20am) {s.remLateMin.toFixed(1)} min
				</li>
			</ul>
			<h2>Weekly rhythm</h2>
			<WeekdayBars />
			<ul>
				<li>Friday 7.50 hours, Saturday 7.39 hours</li>
				<li>Mon–Thu 6.81–6.95 hours</li>
				<li>ANOVA p = 2.6 × 10⁻⁴</li>
			</ul>
			<AcfBars />
			<ul>
				<li>Lag 1: {s.acfLag1.toFixed(2)}</li>
				<li>Lag 7: {s.acfLag7.toFixed(2)}</li>
				<li>Lag 14: {s.acfLag14.toFixed(2)}</li>
				<li>Short-night threshold {s.tert1.toFixed(2)} hours</li>
				<li>
					Third short night {(s.streakShort3 * 100).toFixed(1)}%, catch-up{" "}
					{(s.streakLong * 100).toFixed(1)}%
				</li>
			</ul>
		</>
	);
}
