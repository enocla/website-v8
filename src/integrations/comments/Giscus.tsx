import { giscusConfig } from "./config";

export default function Giscus({ slug }: { slug: string }) {
	return (
		<div className="opacity-90 min-h-96 sepia-20">
			<script
				src="https://giscus.app/client.js"
				data-repo={giscusConfig.repo}
				data-repo-id={giscusConfig.repoId}
				data-category={giscusConfig.category}
				data-category-id={giscusConfig.categoryId}
				data-mapping="specific"
				data-term={slug}
				data-strict="0"
				data-reactions-enabled="1"
				data-emit-metadata="0"
				data-input-position="top"
				data-theme={giscusConfig.theme}
				data-lang={giscusConfig.language}
				crossOrigin="anonymous"
				async
			/>
		</div>
	);
}
