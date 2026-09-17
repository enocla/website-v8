export default function PaperTexture() {
	return (
		<svg
			className="absolute inset-0 z-0 w-full h-full pointer-events-none paper-texture"
			aria-hidden="true"
			focusable="false"
		>
			<rect
				width="100%"
				height="100%"
				fill="var(--color-bg)"
				filter="url(#roughpaper)"
			/>
		</svg>
	);
}
