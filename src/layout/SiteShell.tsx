import type { ReactNode } from "react";
import Paperclip from "../components/Paperclip";
import PaperFilters from "../components/PaperFilters";
import PaperTexture from "../components/PaperTexture";
import Footer from "./Footer";
import Nav from "./Nav";

export default function SiteShell({ children }: { children: ReactNode }) {
	return (
		<>
			<PaperFilters />
			<div className="relative isolate w-full max-w-lg">
				<div className="w-full paper-shadow">
					<div
						id="container"
						className="relative flex flex-col gap-0 w-full paper-surface bg-bg"
					>
						<PaperTexture />
						<Nav />
						<main className="relative z-10 pt-0 p-4 w-full">{children}</main>
						<Footer />
					</div>
				</div>
				<Paperclip />
			</div>
			<div className="flex-1 w-full" />
		</>
	);
}
