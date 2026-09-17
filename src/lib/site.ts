export const SITE_URL = "https://enochlau.com";

export function canonicalUrl(path: string): string {
	return new URL(path, SITE_URL).toString();
}

export function ogImageUrl(file: string): string {
	return canonicalUrl(`/og/${file}`);
}
