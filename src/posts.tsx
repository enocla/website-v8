import type { ReactNode } from "react";

export interface Post {
	slug: string;
	title: string;
	description: string;
	date: string;
}

export const posts: Post[] = [
	{
		slug: "history",
		title: "The History of this Site",
		description: "it's changed a lot, but it's not the end.",
		date: "Apr 30 2025",
	},
];

export function PostContent({ slug }: { slug: string }): ReactNode {
	switch (slug) {
		case "history":
			return <HistoryContent />;
		default:
			return null;
	}
}

function HistoryContent() {
	return (
		<>
			<p>
				I launched the first edition of enochlau.com just 10 months ago! Feels
				like a lifetime ago already. Each iteration of the site has reflected my
				growth and learning at the time.
			</p>
			<h2>v1</h2>
			<p>
				The first version was a simple Vue SPA. It wasn&apos;t accessible or
				performant, but you can still check it out at{" "}
				<a href="https://v1.enochlau.com">v1.enochlau.com</a>. The repo is{" "}
				<code>enocla/website</code>.
			</p>
			<img
				alt="v1"
				height={1056}
				width={1673}
				src="https://raw.githubusercontent.com/enocla/3db-service/main/v1.webp"
			/>
			<h2>v2</h2>
			<p>
				Two months later, I started on v2. Looking back, it feels like a step
				back from v1. I experimented with lots of fancy effects like{" "}
				<code>backdrop-filter</code>, scroll capturing, and motion, which made
				the site very slow. This was also the first version with a blog. I
				created the background image myself in Blender. Check it out at{" "}
				<a href="https://v2.enochlau.com">v2.enochlau.com</a>.
			</p>
			<img
				alt="v2"
				height={1056}
				width={1775}
				src="https://raw.githubusercontent.com/enocla/3db-service/main/v2.webp"
			/>
			<h2>v3</h2>
			<p>
				Just one month later, v3 was underway. My design sense improved
				significantly at this point, and the look of this site still holds up
				today. This was my first time using Nuxt, and it got a perfect
				Lighthouse score, the versions from this point on all do, because I
				actually started caring. See it at{" "}
				<a href="https://v3.enochlau.com">v3.enochlau.com</a>.
			</p>
			<img
				alt="v3"
				height={1056}
				width={1775}
				src="https://raw.githubusercontent.com/enocla/3db-service/main/v3.webp"
			/>
			<h2>v4</h2>
			<p>
				After being satisfied with v3, it took three months before starting v4.
				This version embraced a CRT aesthetic with scan lines, bloom, fisheye,
				and other effects. Making these effects performant and compatible with
				webkit was challenging. It was also my first time using Astro, and it
				was a great experience. Visit{" "}
				<a href="https://v4.enochlau.com">v4.enochlau.com</a> to see it.
			</p>
			<img
				alt="v4"
				height={1056}
				width={1775}
				src="https://raw.githubusercontent.com/enocla/3db-service/main/v4.webp"
			/>
			<h2>v5</h2>
			<p>
				Two months later, I began v5. This version featured a significant design
				change with a light mode and minimal animations. It was my first time
				using Svelte and SvelteKit, and I enjoyed the process. The hacky
				projects window animation and the shadow aesthetics turned out well.
				Some design elements here are similar to v6. Check out{" "}
				<a href="https://v5.enochlau.com">v5.enochlau.com</a>.
			</p>
			<img
				alt="v5"
				height={1056}
				width={1775}
				src="https://raw.githubusercontent.com/enocla/3db-service/main/v5.webp"
			/>
			<h2>v6</h2>
			<p>
				I started this just 2 months later. I really like it. It&apos;s really
				quite similar to the current version.
			</p>
			<img
				alt="v6"
				width={1775}
				src="https://raw.githubusercontent.com/enocla/3db-service/main/v6.webp"
			/>
			<hr />
			<p>
				I would call the current site v6.1, as it&apos;s basically the same
				under the hood. Overall, I&apos;m happy with how the recent editions
				have turned out. This isn&apos;t the end—there will definitely be more
				iterations in the future, and maybe this version will appear in a blog
				post in a few months.
			</p>
		</>
	);
}
