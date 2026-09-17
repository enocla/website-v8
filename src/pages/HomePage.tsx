import { Link } from "@tanstack/react-router";
import Song from "../integrations/music/Song";

export default function HomePage() {
	return (
		<>
			<article className="prose">
				<h1>Enoch Lau</h1>
				<hr />
				<h5>Waterloo, ON</h5>
				<p>
					I&apos;m a 17 year old undergraduate student studying cs at the{" "}
					<mark>
						<strong>University of Waterloo</strong>
					</mark>{" "}
					from <strong>Hong Kong</strong> studying in <strong>Canada</strong>.
				</p>
				<p>
					I love math, tinkering with software, programming, and design. Maybe
					you would like to learn more <Link to="/about">about me</Link>?
				</p>
				<h2>Work</h2>
				<p>
					During Summer 2026 I&apos;ll be working at Kindred Credit Union as a
					developer.
				</p>
				<p>
					You can view <Link to="/projects">my projects</Link> on my{" "}
					<a href="https://github.com/enocla">GitHub</a>. I&apos;m also a part
					of the <a href="https://ctp-webr.ing/enocla/previous">←</a>{" "}
					<a className="translate-x-1" href="https://ctp-webr.ing/">
						ctp webring
					</a>{" "}
					<a href="https://ctp-webr.ing/enocla/next">→</a>.
				</p>
				<hr />
				<p>
					If you&apos;re in Waterloo lets meet up. I also go to{" "}
					<a href="https://www.socratica.info/">socratica</a> every week.
				</p>
				<hr />
				<p>I&apos;m always welcome to cold emails! So please email me.</p>
				<h6>
					<em>Thanks for reading!</em>
				</h6>
			</article>
			<Song />
		</>
	);
}
