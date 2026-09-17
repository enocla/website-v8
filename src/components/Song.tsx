import { useEffect } from "react";

interface SongData {
	now_playing: boolean;
	image_url: string;
	name: string;
	artist: string;
}

async function updateSong() {
	if (document.hidden) {
		return;
	}
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), 8000);
	try {
		const res = await fetch("https://api.enochlau.com/api/current-song", {
			signal: controller.signal,
		});
		const data = (await res.json()) as SongData;
		const status = document.getElementById("song-status");
		const cover = document.getElementById("song-cover-art");
		const title = document.getElementById("song-title");
		const artist = document.getElementById("song-artist");
		const songInfo = document.getElementById("song-info");
		const notListening = document.getElementById("not-listening");
		if (!status || !cover || !title || !artist || !songInfo || !notListening) {
			return;
		}

		status.setAttribute("data-playing", String(data.now_playing));

		if (data.now_playing) {
			cover.style.backgroundImage = `url(${data.image_url})`;
			title.innerText = data.name;
			artist.innerText = data.artist;
			if (data.image_url.length > 2) {
				cover.classList.remove("hidden");
			} else {
				cover.classList.add("hidden");
			}
			songInfo.classList.remove("hidden");
			notListening.classList.add("hidden");
		} else {
			cover.classList.add("hidden");
			songInfo.classList.add("hidden");
			notListening.classList.remove("hidden");
		}
	} catch {
		// Silently ignore fetch errors (offline API, etc.)
	} finally {
		clearTimeout(timeout);
	}
}

export default function Song() {
	useEffect(() => {
		updateSong();
		const id = setInterval(updateSong, 10_000);
		return () => clearInterval(id);
	}, []);

	return (
		<>
			<style>{`#song-status[data-playing="true"] {
    background-color: #90b99f;
  }
  #song-status[data-playing="false"] {
    background-color: #ea83a5;
  }`}</style>
			<div className="mt-10">
				<div className="flex relative gap-2 items-center">
					<span
						id="song-status"
						className="h-8 w-1 data-[playing=true]:animate-pulse"
					/>
					<div
						id="song-cover-art"
						className="bg-center bg-no-repeat bg-contain min-w-8 min-h-8 outline-border -outline-offset-1 outline-1 bg-radial"
					/>
					<div className="pl-2 text-text-secondary">
						<div id="song-info">
							I&apos;m listening to{" "}
							<em className="text-text-primary" id="song-artist">
								Artist Name
							</em>{" "}
							—{" "}
							<em className="text-text-primary" id="song-title">
								Song Title
							</em>
						</div>
						<p id="not-listening" className="hidden">
							<code>(* ´ ｰ`) ZZzz</code> — not listening to anything
						</p>
					</div>
				</div>
			</div>
		</>
	);
}
