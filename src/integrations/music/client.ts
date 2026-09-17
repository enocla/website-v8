export interface CurrentSong {
	nowPlaying: boolean;
	imageUrl: string;
	name: string;
	artist: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object";
}

export async function fetchCurrentSong(
	signal: AbortSignal,
): Promise<CurrentSong> {
	const response = await fetch("https://api.enochlau.com/api/current-song", {
		signal,
	});
	if (!response.ok) throw new Error(`Music API returned ${response.status}`);
	const value: unknown = await response.json();
	if (
		!isRecord(value) ||
		typeof value.now_playing !== "boolean" ||
		typeof value.image_url !== "string" ||
		typeof value.name !== "string" ||
		typeof value.artist !== "string"
	) {
		throw new Error("Music API returned an invalid payload");
	}
	return {
		nowPlaying: value.now_playing,
		imageUrl: value.image_url,
		name: value.name,
		artist: value.artist,
	};
}
