import { Link } from "@tanstack/react-router";

export default function NotFoundPage() {
	return (
		<article className="prose">
			<h1>Not found</h1>
			<p>The page you requested does not exist.</p>
			<p>
				Return to <Link to="/">home</Link> or browse my{" "}
				<Link to="/writing">writing</Link>.
			</p>
		</article>
	);
}
