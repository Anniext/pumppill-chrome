import { debounce } from "@/pages/content/utils/debounce";

let currentTweetID: string | null = null;

// 定时tweet检查时间
export const checkAndUpdateTweetTime = debounce(async () => {
	try {
		const tweetAs = document.querySelectorAll('article[data-testid="tweet"]');
		if (!tweetAs) return;
		const currentUrl = window.location.href;
		const currentUrlMatch = currentUrl.match(/x\.com\/([^/]+)\/status\/(\d+)/);
		if (!currentUrlMatch) return;
		const [, currentUsername, currentTweetId] = currentUrlMatch;
		for (const article of Array.from(tweetAs)) {
			const tweetA = article.querySelector('a[href*="/status/"]') as HTMLAnchorElement | null;
			if (!tweetA) continue;
			const tweetUrlMatch = tweetA.href.match(/x\.com\/([^/]+)\/status\/(\d+)/);
			if (!tweetUrlMatch) continue;
			const [, tweetUsername, tweetId] = tweetUrlMatch;
			if (tweetUsername.toLowerCase() !== currentUsername.toLowerCase() || tweetId !== currentTweetId) continue;
			const timeElement = article.querySelector("time");
			if (!timeElement) continue;
			const tweetID = tweetA.href.split("/status/")[1].split("?")[0].split("/")[0];
			if (currentTweetID === tweetID) continue;
			currentTweetID = tweetID;
			const datetime = timeElement.getAttribute("datetime");
			if (datetime) {
				const date = new Date(datetime);
				const seconds = date.getSeconds();
				const text = timeElement.textContent || "";
				const minuteMatch = text.match(/\d+:\d+/);
				if (minuteMatch && minuteMatch.index !== undefined) {
					const minuteIndex = minuteMatch.index + minuteMatch[0].length;
					timeElement.textContent = `${text.slice(0, minuteIndex)}:${seconds.toString().padStart(2, "0")}${text.slice(minuteIndex)}`;
				}
			}
		}
	} catch (error) {
		console.error("更新时间出错:", error);
	} finally {
		setTimeout(() => {
			(window as any).isUpdating = false;
			if ((window as any).isInitialLoad) {
				(window as any).isInitialLoad = false;
			}
		}, 500);
	}
}, 100);
