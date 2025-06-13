import type { NotificationData, NotificationLocales } from "@/background/type";

const notificationLocales: NotificationLocales = {
	zh: {
		deleteAlert: "删推提醒",
		userDeletedTweet: "用户 {username} 删除了推文",
		viewDetails: "查看详情",
		ignore: "忽略",
	},
	en: {
		deleteAlert: "Tweet Deleted",
		userDeletedTweet: "User {username} deleted a tweet",
		viewDetails: "View Details",
		ignore: "Ignore",
	},
};

export class NotificationManager {
	private notificationQueue: Array<{ id: string; data: NotificationData }>;
	private hasOffscreenDocument: boolean;

	constructor() {
		this.notificationQueue = [];
		this.hasOffscreenDocument = false;

		// 监听通知点击
		chrome.notifications.onClicked.addListener((notificationId) => {
			this.handleNotificationClick(notificationId);
		});
	}

	async createOffscreenDocument(): Promise<void> {
		if (this.hasOffscreenDocument) return;

		// 检查是否已存在 offscreen document
		const existingContexts = await chrome.runtime.getContexts({
			contextTypes: ["OFFSCREEN_DOCUMENT" as chrome.runtime.ContextType],
		});

		if (existingContexts && existingContexts.length > 0) {
			this.hasOffscreenDocument = true;
			return;
		}

		// 创建新的 offscreen document
		await chrome.offscreen.createDocument({
			url: "audio.html",
			reasons: ["AUDIO_PLAYBACK" as chrome.offscreen.Reason],
			justification: "Playing notification sound",
		});

		this.hasOffscreenDocument = true;
	}

	async playNotificationSound(): Promise<void> {
		try {
			await this.createOffscreenDocument();
			await chrome.runtime.sendMessage({ action: "playSound" });
		} catch (error) {
			console.error("播放提示音失败:", error);
		}
	}

	async showNotification(data: NotificationData): Promise<void> {
		try {
			const { language, notificationSound } = await chrome.storage.sync.get({
				language: "zh",
				notificationSound: true,
			});

			if (notificationSound) {
				await this.playNotificationSound();
			}

			const locale = notificationLocales[language as keyof NotificationLocales] || notificationLocales.zh;

			// 创建通知
			const notificationId = `notification-${Date.now()}`;

			const notificationOptions = {
				type: "basic" as const,
				iconUrl: "icons/icon128.png",
				title: locale.deleteAlert,
				message: locale.userDeletedTweet.replace(
					"{username}",
					data.screen_name
				),
				priority: 2,
				requireInteraction: true,
				buttons: [
					{
						title: locale.viewDetails,
					},
					{
						title: locale.ignore,
					},
				],
			};

			chrome.notifications.create(notificationId, notificationOptions);

			// 存储通知数据以供后续使用
			this.notificationQueue.push({
				id: notificationId,
				data: data,
			});

			// 限制队列长度
			if (this.notificationQueue.length > 10) {
				const oldNotification = this.notificationQueue.shift();
				if (oldNotification) {
					chrome.notifications.clear(oldNotification.id);
				}
			}
		} catch (error) {
			console.error("显示通知失败:", error);
		}
	}

	handleNotificationClick(notificationId: string): void {
		// 查找对应的通知数据
		const notification = this.notificationQueue.find(
			(n) => n.id === notificationId
		);
		if (!notification) return;

		// 构建推文 URL
		const tweetUrl = `https://x.com/${notification.data.screen_name}/status/${notification.data.tweet_id}`;

		// 打开相关页面
		chrome.tabs.create({ url: tweetUrl });

		// 清除通知
		chrome.notifications.clear(notificationId);
		this.notificationQueue = this.notificationQueue.filter(
			(n) => n.id !== notificationId
		);
	}
}
