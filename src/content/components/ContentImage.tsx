interface ContentImageProps {
	alt: string;
	height?: number;
	width: number;
	src: string;
}

export default function ContentImage({
	alt,
	height,
	width,
	src,
}: ContentImageProps) {
	return (
		<img
			alt={alt}
			height={height}
			width={width}
			src={src}
			loading="lazy"
			decoding="async"
		/>
	);
}
