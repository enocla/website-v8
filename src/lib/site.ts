export const SITE_URL = "https://enochlau.com";

export function ogImageUrl(file: string): string {
	return `${SITE_URL}/og/${file}`;
}
