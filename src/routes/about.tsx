import { createFileRoute } from "@tanstack/react-router";
import Badge from "../components/Badge";
import { ogImageUrl } from "../lib/site";

export const Route = createFileRoute("/about")({
	head: () => ({
		meta: [
			{ title: "about" },
			{ property: "title", content: "about" },
			{ property: "og:title", content: "about" },
			{
				property: "og:image",
				content: ogImageUrl("about.png"),
			},
			{ name: "twitter:title", content: "about" },
			{
				name: "twitter:image",
				content: ogImageUrl("about.png"),
			},
			{ name: "description", content: "about" },
		],
	}),
	component: About,
});

function About() {
	return (
		<>
			<style>{`nav a:not([data-nav-current='about']) {
      opacity: 0.5;
      filter: grayscale(1);
    }`}</style>

			<article className="prose">
				<h1>About</h1>
				<p>Hi, I&apos;m Enoch.</p>
				<p>
					While a lot of my time is spent studying/working, I also enjoy{" "}
					<a href="https://last.fm/user/Tnixc">listening to music</a>, watching
					anime with friends, and <mark>reading</mark> manga/webnovels/actual
					books. I spend a lot of my free time <mark>programming</mark> as well.
				</p>
				<p>
					Although I don&apos;t read a lot of nonfiction books, I do read a lot
					of blog posts on various topics, usually it&apos;s whatever comes up
					on HN but I use follow a few blogs with RSS as well.
				</p>
				<p>
					I also do <mark>rock climbing</mark>, as is sterotypical of someone
					like myself.
				</p>
				<hr />
				<h4>Programming</h4>
				<p>
					I now mostly work with <mark>Rust</mark>. I love compilers, language
					design, developer tooling, type theory, and performance engineering.
					Most recently I&apos;ve been working on{" "}
					<a href="https://github.com/enocla/volette">volette</a>, my language
					and compiler. It&apos;s a long term project I hope to pick up from
					time to time.
				</p>
				<p>
					I&apos;ve also worked with <mark>C</mark>,{" "}
					<mark>JavaScript &amp; TypeScript</mark>, Java, Python and other web
					development languages with frameworks such as Vue, Svelte, and Solid.
					I also really enjoyed solving Advent of Code problems in{" "}
					<mark>OCaml</mark>.
				</p>
				<p>
					I configure my system with <mark>Nix</mark>. I think it&apos;s quite a
					waste of time, it&apos;s a cool concept though.
				</p>
				<hr />
				<h4>some recommendations</h4>
				<ul>
					<li>
						Land of the Lustrous / 宝石の国 / Hōseki no Kuni — (anime &amp;
						manga)
					</li>
					<li>Lord of the Mysteries — (novel)</li>
					<li>Omniscient Readers Viewpoint — (novel)</li>
				</ul>
				<h6>
					<em>
						please dm me if you have any recommendations to read/watch, novels,
						blogs, etc.
					</em>
				</h6>
				<hr />
			</article>
			<div className="flex flex-wrap gap-1 pt-4">
				<Badge src="/88x31.webp" link="https://enochlau.com" />
				<p className="w-[88] h-[31] grid place-items-center bg-accent/10 italic">
					friends:
				</p>
				<Badge
					src="https://aprl.pet/assets/badges/april.png"
					link="https://aprl.pet"
				/>
				<Badge
					src="https://isabelroses.com/badges/me.gif"
					link="https://isabelroses.com"
				/>
				<Badge
					src="https://fiftysix.dev/friends/badges/56.webp"
					link="https://fiftysix.dev"
				/>
				<Badge
					src="https://tired.moe/assets/badges/tired.moe.gif"
					link="https://tired.moe"
				/>
			</div>
		</>
	);
}
