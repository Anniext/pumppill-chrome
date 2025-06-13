import { debounce } from "@/pages/content/utils/debounce";
import type { UserInfo } from "@/pages/content/type";
import { insertAnalytics } from "@/pages/content/dom/insert_analytics";
import type { UserStats } from "@/background/type";

export const checkAndUpdate = debounce(async () => {
	if ((window as any).isUpdating) return;
	try {
		(window as any).isUpdating = true;
		const userHeader = document.querySelector(
			'[data-testid="UserName"], [data-testid="UserNameDisplay"]'
		) as HTMLElement | null;
		if (userHeader) {
			await insertAnalytics(userHeader, true);
		}
	} finally {
		setTimeout(() => {
			(window as any).isUpdating = false;
			if ((window as any).isInitialLoad) {
				(window as any).isInitialLoad = false;
			}
		}, 500);
	}
}, 100);

export function getUserInfo(): UserInfo | null {
	try {
		const url = new URL(location.href);
		const paths = url.pathname.split("/");
		if (paths.length < 2) {
			return null;
		}
		const hrefUsername = paths[1];
		const span = document.querySelector('[data-testid="UserName"] div[tabindex] div[dir] > span');
		if (!span) {
			return null;
		}

		const username = span.textContent?.replace("@", "") || "";
		if (hrefUsername.toLowerCase() !== username.toLowerCase()) {
			return null;
		}

		let userId: string | null = null;
		const followBtn = document.querySelector('[data-testid="placementTracking"] > div > button');
		if (followBtn) {
			const followIDStr = followBtn.getAttribute("data-testid");
			if (
				!followIDStr ||
				(!followIDStr.includes("-follow") && !followIDStr.includes("-unfollow"))
			) {
				return null;
			}

			const fllowIDArr = followIDStr.split("-");
			if (fllowIDArr.length === 2) {
				userId = fllowIDArr[0];
			}
		} else {
			const moreA = document.querySelector("aside > a");
			if (moreA) {
				const moreUrl = new URL(moreA.getAttribute("href") || "");
				userId = moreUrl.searchParams.get("user_id");
			}
		}

		if (!userId) {
			return null;
		}
		return { username, userId };
	} catch (error) {
		console.log("getUserInfo err:", error);
		return null;
	}
}

export async function getUserStats(userInfo: UserInfo): Promise<UserStats> {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(
			{
				action: "getUserStats",
				username: userInfo.username,
				userId: userInfo.userId
			},
			(response?: { error?: string; stats?: UserStats }) => {
				if (!response) {
					reject(new Error("No response from background script"));
					return;
				}
				if (response.error) {
					reject(new Error(response.error));
				} else if (response.stats) {
					resolve(response.stats);
				} else {
					reject(new Error("No stats data received"));
				}
			}
		);
	});
}
