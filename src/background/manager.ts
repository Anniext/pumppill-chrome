import { WebSocketClient } from "@/background/websocket";

export class WebSocketManager {
	private static instance: WebSocketManager;
	private wsClient: WebSocketClient | null;

	private constructor() {
		this.wsClient = null;
	}

	static getInstance(): WebSocketManager {
		if (!this.instance) {
			this.instance = new WebSocketManager();
		}
		return this.instance;
	}

	getClient(): WebSocketClient | null {
		return this.wsClient;
	}

	async initWebSocket(): Promise<WebSocketClient> {
		if (this.wsClient) {
			console.log("WebSocket 已存在，无需重复连接");
			return this.wsClient;
		}

		this.wsClient = new WebSocketClient("wss://pumpscam.com/api/pumpPill/ws");
		return this.wsClient;
	}

	closeWebSocket(): void {
		if (this.wsClient) {
			this.wsClient.close();
			this.wsClient = null;
		}
	}
}
