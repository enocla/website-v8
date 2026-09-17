import { Link } from "@tanstack/react-router";

export default function ProjectsPage() {
	return (
		<article className="prose">
			<h1>Projects</h1>
			<p>
				You can find all of my projects on my{" "}
				<a href="https://github.com/enocla">github</a>.
			</p>
			<hr />
			<p>Here&apos;s a list of notable projects:</p>
			<p>
				<a href="https://github.com/enocla/volette">✦ Volette</a> - A work in
				progress compiler for an expression oriented language I designed,
				written in rust.
			</p>
			<p>
				<a href="https://github.com/enocla/simple">Simple</a> - A static site
				generator/component based html inliner written in rust. It has cool
				features like bi-directional editing.
			</p>
			<p>
				<a href="https://github.com/enocla/cazal">Cazal</a> - Tiny stack based
				interpreted programming language in C.
			</p>
			<p>
				<a href="https://github.com/enocla/replacer">Replacer</a> - A cli to
				replace text recursively in files or from stdin to stdout. Written in
				rust.
			</p>
			<p>
				<a href="https://github.com/enocla/3db">3db</a> - A UI for using GitHub
				repositories as a CDN/file store. Pretty flaky, but works. Uses supabase
				and sveltekit.
			</p>
			<p>
				<a href="https://github.com/enocla/website-v6">This website</a> - This
				is v6, and was built with Simple. You can read more about the history of
				this site{" "}
				<Link to="/writing/$slug" params={{ slug: "history" }}>
					here
				</Link>
				.
			</p>
			<p>
				<a href="https://github.com/enocla/nix-config">nix-config</a> - My
				nix-darwin configuration. I spend way too much time on this.
			</p>
			<hr />
			<p>
				I&apos;ve also worked on a terminal emulator I use day-to-day, a PDF
				organization app in swift, and other chrome extensions or small tools
				for myself.
			</p>
		</article>
	);
}
