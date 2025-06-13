// 定义默认的本地化字符串
import type { Locales, UserInfo } from "@/pages/content/type";
import { StatsModal } from "@/pages/content/dom/stats_modal";

export const defaultLocales: Locales = {
	zh: {
		nameChanges: "名称变更",
		pumpCount: "发盘次数",
		deletedTweets: "删除推文",
		boopCount: "BOOP次数",
		believeCount: "BELIEVE次数",
		loadingFailed: "加载失败",
		activatePlugin: "请激活插件",
		clickToQuery: "点击查询",
		collectTweet: "收藏推文",
		deleteTweetAlert: "删除推文提醒",
		modalTitle: {
			nameChanges: "名称变更历史",
			pumpCount: "发盘历史",
			deletedTweets: "删除推文历史",
			boopCount: "BOOP历史",
			believeCount: "BELIEVE历史"
		},
		followedKOL: "关注的KOL"
	},
	en: {
		nameChanges: "Name Changes",
		pumpCount: "Pump Count",
		deletedTweets: "Deleted Tweets",
		boopCount: "BOOP Count",
		believeCount: "BELIEVE Count",
		loadingFailed: "Loading Failed",
		activatePlugin: "Please Activate Plugin",
		clickToQuery: "Click to Query",
		collectTweet: "Collect Tweet",
		deleteTweetAlert: "Delete Tweet Alert",
		modalTitle: {
			nameChanges: "Name Change History",
			pumpCount: "Pump History",
			deletedTweets: "Deleted Tweets History",
			boopCount: "BOOP History",
			believeCount: "BELIEVE History"
		},
		followedKOL: "Followed KOLs"
	}
};

export const contentLocales: Locales = defaultLocales;
export const statsModal: StatsModal = new StatsModal();

let hasDisplayedStats: boolean = false;
export function setHasDisplayedStats(stats: boolean){
	hasDisplayedStats = stats;
}

export function getHasDisplayedStats(): boolean{
	return hasDisplayedStats;
}

export const userInfo = ref<UserInfo>();

export function setUserInfo(info: UserInfo){
	userInfo.value = info;
}
