import { Link } from "@tanstack/react-router";
import PaperTexture from "./PaperTexture";

const linkClass =
	"hover:underline text-accent underline-offset-[6px] w-fit h-fit decoration-2 decoration-accent-subtle";

export default function Nav() {
	return (
		<nav className="flex relative gap-5 p-4 w-fit">
			<PaperTexture />
			<Link to="/" data-nav-current="index" className={linkClass}>
				home
			</Link>
			<Link to="/about" data-nav-current="about" className={linkClass}>
				about
			</Link>
			<Link to="/projects" data-nav-current="projects" className={linkClass}>
				projects
			</Link>
			<Link to="/writing" data-nav-current="writing" className={linkClass}>
				writing
			</Link>
		</nav>
	);
}
