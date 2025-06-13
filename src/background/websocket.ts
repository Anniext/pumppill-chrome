import { NotificationManager } from "@/background/notification";

export class WebSocketClient {
	private url: string;
	private ws: WebSocket | null;
	private reconnectAttempts: number;
	private reconnectDelay: number;
	private heartbeatInterval: number | null;
	private heartbeatTimeout: number;
	private notificationManager: NotificationManager;

	constructor(url: string) {
		this.url = url;
		this.ws = null;
		this.reconnectAttempts = 0;
		this.reconnectDelay = 3000; // 3秒
		this.heartbeatInterval = null;
		this.heartbeatTimeout = 30000; // 30秒发送一次心跳
		this.notificationManager = new NotificationManager();
		this.init();
	}

	async init(): Promise<void> {
		try {
			const code = await chrome.storage.sync.get("code");
			if (!code || !code.code) {
				this.reconnect();
				return;
			}

			this.ws = new WebSocket(`${this.url}?code=${code ? code.code : ""}`);

			this.setupEventListeners();
		} catch (error) {
			console.error("WebSocket 连接失败:", error);
			this.reconnect();
		}
	}

	private setupEventListeners(): void {
		if (!this.ws) return;

		this.ws.onopen = () => {
			this.reconnectAttempts = 0; // 重置重连次数
			this.startHeartbeat(); // 开始心跳
		};

		this.ws.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				this.handleMessage(data);
			} catch (error) {
				console.error("解析消息失败:", error);
			}
		};

		this.ws.onclose = (event) => {
			console.log("WebSocket 连接已关闭:", event.code, event.reason);
			this.stopHeartbeat(); // 停止心跳
			this.reconnect();
		};

		this.ws.onerror = (error) => {
			console.error("WebSocket 错误:", error);
		};
	}

	private handleMessage(data: any): void {
		switch (data.type) {
			case "tweet_deleted":
				this.notificationManager.showNotification(data.data);
				this.updateBadge(data.data.alert_count);
				break;
			case "update_alert_count":
				this.updateBadge(data.data.alert_count);
				break;
			case "pong":
				break;
			default:
				console.log("收到未知类型消息:", data);
		}
	}

	private updateBadge(count: number): void {
		if (count > 0) {
			chrome.action.setBadgeText({ text: count.toString() });
			chrome.action.setBadgeBackgroundColor({ color: "rgb(255, 149, 0)" });
		} else {
			chrome.action.setBadgeText({ text: "" });
		}
	}

	send(data: any): void {
		if (this.ws && this.ws.readyState === WebSocket.OPEN) {
			this.ws.send(JSON.stringify(data));
		} else {
			console.error("WebSocket 未连接，无法发送消息");
		}
	}

	reconnect(): void {
		if (this.ws) {
			this.reconnectAttempts++;
			console.log(
				`尝试重连 (${this.reconnectAttempts})...`
			);
		}

		setTimeout(() => {
			this.init();
		}, this.reconnectDelay);
	}

	close(): void {
		this.stopHeartbeat();
		if (this.ws) {
			this.ws.close();
		}
	}

	private startHeartbeat(): void {
		this.stopHeartbeat(); // 确保之前的心跳被清除
		this.heartbeatInterval = setInterval(() => {
			if (this.ws && this.ws.readyState === WebSocket.OPEN) {
				this.send({ type: "ping" });
			}
		}, this.heartbeatTimeout);
	}

	private stopHeartbeat(): void {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}
	}
}
