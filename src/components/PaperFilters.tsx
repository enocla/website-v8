export default function PaperFilters() {
	return (
		<svg className="paper-filter-defs" aria-hidden="true" focusable="false">
			<defs>
				<filter id="roughpaper" x="0%" y="0%" width="100%" height="100%">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="0.024"
						result="noise"
						numOctaves={4}
					/>
					<feDiffuseLighting
						in="noise"
						surfaceScale={3.8}
						lightingColor="#ffffff"
						result="texture"
					>
						<feDistantLight azimuth={45} elevation={70} />
					</feDiffuseLighting>
					<feComponentTransfer in="texture" result="paperTexture">
						<feFuncR type="linear" slope={0.35} intercept={0.65} />
						<feFuncG type="linear" slope={0.35} intercept={0.65} />
						<feFuncB type="linear" slope={0.35} intercept={0.65} />
					</feComponentTransfer>
					<feBlend in="SourceGraphic" in2="paperTexture" mode="multiply" />
				</filter>
				<filter id="warp">
					<feTurbulence
						baseFrequency="0.01 0.02"
						numOctaves={3}
						result="noise"
						seed={1}
						type="fractalNoise"
					/>
					<feDisplacementMap in="SourceGraphic" in2="noise" scale={1.8} />
				</filter>
			</defs>
		</svg>
	);
}
