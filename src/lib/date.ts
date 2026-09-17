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

export function formatPublishedAt(isoDate: string): string {
	const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
	if (!match) throw new Error(`Invalid ISO date: ${isoDate}`);
	return `${MONTHS[Number(match[2]) - 1]} ${Number(match[3])} ${match[1]}`;
}
