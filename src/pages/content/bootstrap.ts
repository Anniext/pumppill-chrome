import { checkAndUpdateTweetTime } from "@/pages/content/tweet/time";
import { insertButtons } from "@/pages/content/dom/insert_button";
import { clearAnalytics } from "@/pages/content/dom/box";
import { checkAndUpdate } from "./tweet/user";
import { getHasDisplayedStats } from "@/pages/content/data";
export function initializeObservers(): void {
	// 初始等待DOM监听器
	if (!document.body) {
		window.addEventListener("DOMContentLoaded", initializeObservers);
		return;
	}

	let lastUrl = location.href;
	const callback = (): void => {
		const currentUrl = location.href;
		checkAndUpdateTweetTime();
		insertButtons();
		if (currentUrl !== lastUrl) {
			lastUrl = currentUrl;
			clearAnalytics();
			checkAndUpdate();
		} else if (!(window as any).isUpdating && !(window as any).isInitialLoad) {
			const userHeader = document.querySelector(
				'[data-testid="UserName"], [data-testid="UserNameDisplay"]'
			);
			if (userHeader && !getHasDisplayedStats()) {
				checkAndUpdate();
			}
		}
	};

	const observer = new MutationObserver(callback);

	try {
		observer.observe(document.body, { subtree: true, childList: true });
	} catch (error) {
		console.error("observer err:", error);
	}
	if ((window as any).isInitialLoad) {
		checkAndUpdate();
	}
}
