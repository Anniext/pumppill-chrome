import { setHasDisplayedStats } from "@/pages/content/data";

export function clearAnalytics(): void {
	const analyticsBox = document.querySelector(".twitter-analytics-box");
	if (analyticsBox) analyticsBox.remove();
	const kolBox = document.querySelector(".twitter-kol-followers-box");
	if (kolBox) kolBox.remove();
	const btnBox = document.querySelector(".custom-twitter-button");
	setHasDisplayedStats(false);
}

