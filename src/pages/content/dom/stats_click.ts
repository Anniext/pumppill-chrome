import type { UserInfo } from "@/pages/content/type";
import { getLoadingHTML } from "@/pages/content/dom/loading";
import { ToQuery } from "@/pages/content/utils/query";
import { insertKOLFollowers } from "@/pages/content/tweet/followers";
import { statsModal } from "@/pages/content/data";

export function addStatsClickHandlers(analyticsBox: HTMLElement, userInfo: UserInfo): void {
	const items = analyticsBox.querySelectorAll(".analytics-item");
	(Array.from(items) as HTMLElement[]).forEach((item) => {
		const type = item.getAttribute("data-type");
		if (type === "toQuery") {
			item.style.cursor = "pointer";
			item.addEventListener("click", async () => {
				const userHeader = document.querySelector(
					'[data-testid="UserName"], [data-testid="UserNameDisplay"]'
				) as HTMLElement;

				if (userHeader) {
					analyticsBox.innerHTML = getLoadingHTML();
					const stats = await ToQuery(userHeader, userInfo);
					if (stats && stats.followed_kols) {
						await insertKOLFollowers(userInfo, stats);
					}
				}
			});
		}
	});

	const countItems = analyticsBox.querySelectorAll(".count-item");
	(Array.from(countItems) as HTMLElement[]).forEach((item) => {
		item.style.cursor = "pointer";
		item.addEventListener("click", async () => {
			const type = item.getAttribute("data-type");
			if (type) {
				await statsModal.show(type, userInfo.username, userInfo.userId);
			}
		});
	});
}

