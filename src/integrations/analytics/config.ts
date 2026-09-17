export const umamiConfig = {
	src: "https://cloud.umami.is/script.js",
	websiteId: "d41f775b-3a39-4ed9-b68a-5afe73974f01",
} as const;

export const umamiScript = {
	src: umamiConfig.src,
	defer: true,
	"data-website-id": umamiConfig.websiteId,
} as const;
