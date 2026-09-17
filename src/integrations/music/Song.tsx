import { useEffect, useState } from "react";
import { type CurrentSong, fetchCurrentSong } from "./client";

type SongState = {
	kind: "idle" | "loading" | "ready" | "error";
	song: CurrentSong | null;
};

export default function Song() {
	const [state, setState] = useState<SongState>({ kind: "idle", song: null });

	useEffect(() => {
		let active = true;
		let controller: AbortController | undefined;

		const update = async () => {
			if (document.hidden) return;
			controller?.abort();
			const request = new AbortController();
			controller = request;
			setState((current) => ({ kind: "loading", song: current.song }));
			try {
				const song = await fetchCurrentSong(request.signal);
				if (active) setState({ kind: "ready", song });
			} catch {
				if (active && !request.signal.aborted)
					setState({ kind: "error", song: null });
			}
		};

		const onVisibilityChange = () => {
			if (!document.hidden) void update();
		};
		void update();
		const interval = window.setInterval(() => void update(), 10_000);
		document.addEventListener("visibilitychange", onVisibilityChange);
		return () => {
			active = false;
			controller?.abort();
			window.clearInterval(interval);
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	const song = state.song;
	const isPlaying = song?.nowPlaying === true;
	return (
		<div className="mt-10" aria-live="polite">
			<div className="flex relative gap-2 items-center">
				<span
					className="song-status h-8 w-1 data-[playing=true]:animate-pulse"
					data-playing={String(isPlaying)}
				/>
				{isPlaying && song.imageUrl.length > 2 ? (
					<img className="song-cover" alt="" src={song.imageUrl} />
				) : null}
				<div className="pl-2 text-text-secondary">
					{isPlaying && song ? (
						<div>
							I&apos;m listening to{" "}
							<em className="text-text-primary">{song.artist}</em> —{" "}
							<em className="text-text-primary">{song.name}</em>
						</div>
					) : (
						<p>
							<code>(* ´ ｰ`) ZZzz</code> — not listening to anything
						</p>
					)}
				</div>
			</div>
		</div>
	);
}
