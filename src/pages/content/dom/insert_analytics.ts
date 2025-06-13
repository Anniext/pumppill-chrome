import { getUserInfo } from "@/pages/content/tweet/user";
import { getLoadingHTML } from "@/pages/content/dom/loading";
import { addStatsClickHandlers } from "@/pages/content/dom/stats_click";
import { ToQuery } from "@/pages/content/utils/query";
import { insertKOLFollowers } from "@/pages/content/tweet/followers";
import { getMessage } from "@/pages/content/utils/message";
import { setHasDisplayedStats } from "@/pages/content/data";

export async function insertAnalytics(
	headerElement: HTMLElement,
	forceUpdate: boolean = false
): Promise<void> {
	let analyticsBox = headerElement.querySelector(".twitter-analytics-box") as HTMLElement | null;
	const userInfo = getUserInfo();
	if (!userInfo) return;

	if (analyticsBox) {
		if (
			!forceUpdate &&
			analyticsBox.getAttribute("data-username") === userInfo.username &&
			analyticsBox.getAttribute("data-user-id") === userInfo.userId
		) {
			return;
		}
		analyticsBox.remove();
	}

	analyticsBox = document.createElement("div");
	analyticsBox.className = "twitter-analytics-box";
	analyticsBox.setAttribute("data-username", userInfo.username);
	analyticsBox.setAttribute("data-user-id", userInfo.userId || "");
	analyticsBox.innerHTML = getLoadingHTML();
	headerElement.appendChild(analyticsBox);

	const autoQuery = await chrome.storage.sync.get({
		enableAutoQuery: true,
		code: ""
	});

	console.log(autoQuery)
	if (autoQuery.code) {
		const currentBox = headerElement.querySelector(".twitter-analytics-box") as HTMLElement | null;
		if (currentBox) {
			currentBox.innerHTML = `
        <span class="analytics-item" data-type="toQuery">${await getMessage(
				"activatePlugin"
			)}</span>
      `;
		}
		setHasDisplayedStats(true);
		return;
	}

	if (!autoQuery.enableAutoQuery) {
		const currentBox = headerElement.querySelector(".twitter-analytics-box") as HTMLElement | null;
		if (currentBox) {
			currentBox.innerHTML = `
        <span class="analytics-item" data-type="toQuery">${await getMessage("clickToQuery")}</span>
      `;
		}
		setHasDisplayedStats(true);
		addStatsClickHandlers(currentBox!, userInfo);
		return;
	}

	const stats = await ToQuery(headerElement, userInfo);

	if (stats && stats.followed_kols) {
		await insertKOLFollowers(userInfo, stats);
	}
}
