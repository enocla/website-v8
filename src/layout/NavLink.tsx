import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";

const baseClass =
	"hover:underline text-accent underline-offset-[6px] w-fit h-fit decoration-2 decoration-accent-subtle transition-[filter,opacity]";

type NavTarget = "/" | "/about" | "/projects" | "/writing";

function isCurrent(pathname: string, target: NavTarget): boolean {
	if (target === "/") return pathname === "/";
	return pathname === target || pathname.startsWith(`${target}/`);
}

export default function NavLink({
	to,
	children,
}: {
	to: NavTarget;
	children: ReactNode;
}) {
	const pathname = useRouterState({
		select: (state) => state.location.pathname,
	});
	const active = isCurrent(pathname, to);
	const stateClass = active
		? "opacity-100 grayscale-0"
		: "opacity-50 grayscale";
	return (
		<Link
			to={to}
			className={`${baseClass} ${stateClass}`}
			aria-current={active ? "page" : undefined}
		>
			{children}
		</Link>
	);
}
