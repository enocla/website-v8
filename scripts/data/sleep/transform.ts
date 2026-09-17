const DURATION = /^(\d+):([0-5]\d):([0-5]\d)$/;
const DATE_TIME = /^(\d{4})-(\d{1,2})-(\d{1,2}) ((?:[01]?\d|2[0-3])):([0-5]\d):([0-5]\d)$/;

export function durationHours(value: string | null | undefined) {
	if (value === "" || value == null) return null;
	const match = DURATION.exec(value);
	if (!match) return Number.NaN;
	return Number(match[1]) + Number(match[2]) / 60 + Number(match[3]) / 3600;
}

export function dateTimeParts(value: string) {
	const match = DATE_TIME.exec(value);
	if (!match) return null;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
	return {
		y: year,
		mo: month,
		d: day,
		h: Number(match[4]) + Number(match[5]) / 60 + Number(match[6]) / 3600,
		date: `${match[1]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
	};
}

/** Eastern DST (second Sunday in March through the day before first Sunday in November). */
export function isEasternDaylightTime(year: number, month: number, day: number) {
	const secondSundayInMarch = 1 + ((7 - new Date(Date.UTC(year, 2, 1)).getUTCDay()) % 7) + 7;
	const firstSundayInNovember = 1 + ((7 - new Date(Date.UTC(year, 10, 1)).getUTCDay()) % 7);
	if (month < 3 || month > 11) return false;
	if (month > 3 && month < 11) return true;
	if (month === 3) return day >= secondSundayInMarch;
	return day < firstSundayInNovember;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function weekdayUTC(year: number, month: number, day: number) {
	return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

export function gate(value: number | null, minimum: number, maximum: number) {
	return value === null || Number.isNaN(value) || value < minimum || value > maximum ? null : value;
}
