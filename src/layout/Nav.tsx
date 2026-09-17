import PaperTexture from "../components/PaperTexture";
import NavLink from "./NavLink";

const items = [
	{ to: "/" as const, label: "home" },
	{ to: "/about" as const, label: "about" },
	{ to: "/projects" as const, label: "projects" },
	{ to: "/writing" as const, label: "writing" },
];

export default function Nav() {
	return (
		<nav className="flex relative gap-5 p-4 w-fit">
			<PaperTexture />
			{items.map((item) => (
				<NavLink key={item.to} to={item.to}>
					{item.label}
				</NavLink>
			))}
		</nav>
	);
}
