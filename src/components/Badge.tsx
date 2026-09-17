export default function Badge({ src, link }: { src: string; link: string }) {
	return (
		<a href={link} className="badge">
			<img src={src} alt={link} width={88} height={31} />
		</a>
	);
}
