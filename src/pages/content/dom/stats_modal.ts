import { getLoadingHTML } from "@/pages/content/dom/loading";
import { getMessage } from "@/pages/content/utils/message";
import type { DetailResponse, TweetData } from "@/pages/content/type";

export class StatsModal {
	private modal: HTMLElement | null = null;
	private overlay: HTMLElement | null = null;
	private currentUsername: string | null = null;
	private currentUserId: string | null = null;

	async create(): Promise<void> {
		this.overlay = document.createElement("div");
		this.overlay.className = "modal-overlay";

		this.modal = document.createElement("div");
		this.modal.className = "twitter-stats-modal";

		this.modal.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">加载中...</div>
        <div class="modal-close">✕</div>
      </div>
      <div class="modal-content">
        <div class="modal-loading">
          ${getLoadingHTML()}
        </div>
      </div>
    `;

		this.modal.querySelector(".modal-close")?.addEventListener("click", () => {
			this.close();
		});

		this.overlay.addEventListener("click", (e) => {
			if (e.target === this.overlay) {
				this.close();
			}
		});

		document.body.appendChild(this.overlay);
		document.body.appendChild(this.modal);

		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && this.modal) {
				this.close();
			}
		});
	}

	async show(type: string, username: string, userId: string): Promise<void> {
		this.currentUsername = username;
		this.currentUserId = userId;

		if (!this.modal) {
			await this.create();
		}

		const titles = await getMessage("modalTitle");
		const modalTitle = this.modal?.querySelector(".modal-title");
		if (modalTitle) {
			modalTitle.textContent = String((titles as any)[type]) || "详情";
		}

		try {
			const modalContent = this.modal?.querySelector(".modal-content");
			if (modalContent) {
				modalContent.innerHTML = `
          <div class="modal-loading">
            ${getLoadingHTML()}
          </div>
        `;
			}

			const data = await this.fetchData(type);
			await this.updateContent(type, username, data);
		} catch (error) {
			console.error("获取详情失败:", error);
			const modalContent = this.modal?.querySelector(".modal-content");
			if (modalContent) {
				modalContent.innerHTML = await getMessage("loadingFailed");
			}
		}
	}

	private async fetchData(type: string): Promise<DetailResponse> {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage(
				{
					action: "getUserDetails",
					type,
					username: this.currentUsername,
					userId: this.currentUserId
				},
				(response: { error?: string; details?: DetailResponse }) => {
					if (response.error) {
						reject(new Error(response.error));
					} else {
						resolve(response.details!);
					}
				}
			);
		});
	}

	private async updateContent(type: string, username: string, data: DetailResponse): Promise<void> {
		const modalContent = this.modal?.querySelector(".modal-content");
		if (!modalContent) return;

		let content = "";

		if (data.code === 1 && data.data) {
			setTimeout(() => {
				const addresses = this.modal?.querySelectorAll(".token-address");
				(Array.from(addresses || []) as HTMLElement[]).forEach((div) => {
					div.addEventListener("click", () => {
						const address = div.getAttribute("data-address");
						if (address) {
							navigator.clipboard.writeText(address);
						}
					});
				});
			}, 0);

			switch (type) {
				case "nameChanges":
					content = this.renderNameChanges(username, data.data.tweets);
					break;
				case "pumpCount":
					content = await this.renderPumpHistory(username, data.data.tweets);
					break;
				case "deletedTweets":
					content = await this.renderDeletedTweets(username, data.data.tweets);
					break;
				case "odinCount":
					content = await this.renderOdinCount(username, data.data.tweets);
					break;
				case "fourCount":
					content = await this.renderFourCount(username, data.data.tweets);
					break;
				case "odinDeletedCount":
					content = await this.renderOdinDeletedCount(username, data.data.tweets);
					break;
				case "fourDeletedCount":
					content = await this.renderFourDeletedCount(username, data.data.tweets);
					break;
				case "boopCount":
					content = await this.renderBoopCount(username, data.data.tweets);
					break;
				case "believeCount":
					content = await this.renderBelieveCount(username, data.data.tweets);
					break;
			}
		} else {
			content = "暂无数据";
		}

		modalContent.innerHTML = content;
	}

	private renderNameChanges(username: string, data: TweetData[]): string {
		return `
      <div class="name-history">
        ${data
			.map(
				(item) => `
          <div class="history-item">
            <div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div>
            <div class="change"><a href="https://x.com/${(item as any).twitter_screen_name || username}" target="_blank">https://x.com/${(item as any).twitter_screen_name || username}</a></div>
          </div>
        `
			)
			.join("")}
      </div>
    `;
	}

	private async renderPumpHistory(username: string, data: TweetData[]): Promise<string> {
		const prefix = await chrome.storage.sync.get({
			contractPrefix: "https://gmgn.ai/sol/token/"
		});
		return `
      <div class="pump-history">
        ${data
			.map(
				(item) => `
          <div class="history-item">
            <div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
            <a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">${item.text}</a>
            <a href="${prefix.contractPrefix}${item.token_address}" target="_blank"><div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div></a>
          </div>
        `
			)
			.join("")}
      </div>
    `;
	}

	private async renderDeletedTweets(username: string, data: TweetData[]): Promise<string> {
		const prefix = await chrome.storage.sync.get({
			contractPrefix: "https://gmgn.ai/sol/token/"
		});
		return `
      <div class="delete-history">
        ${data
			.map(
				(item) => `
          <div class="history-item">
            <div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
            <a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">${item.text}</a>
            <a href="${prefix.contractPrefix}${item.token_address}" target="_blank"><div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div></a>
          </div>
        `
			)
			.join("")}
      </div>
    `;
	}

	private async renderOdinDeletedCount(username: string, data: TweetData[]): Promise<string> {
		return `
      <div class="delete-history">
        ${data
			.map(
				(item) => `
          <div class="history-item">
            <div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
            <a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">${item.text}</a>
            <a href="${item.token_address}" target="_blank"><div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div></a>
          </div>
        `
			)
			.join("")}
      </div>
    `;
	}

	private async renderFourDeletedCount(username: string, data: TweetData[]): Promise<string> {
		const prefix = "https://gmgn.ai/bsc/token/Dagj4qLJ_";
		return `
      <div class="delete-history">
        ${data
			.map(
				(item) => `
          <div class="history-item">
            <div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
            <a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">${item.text}</a>
            <a href="${prefix}${item.token_address}" target="_blank"><div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div></a>
          </div>
        `
			)
			.join("")}
      </div>
    `;
	}

	private async renderOdinCount(username: string, data: TweetData[]): Promise<string> {
		return `
      <div class="delete-history">
        ${data
			.map(
				(item) => `
          <div class="history-item">
            <div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
            <a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">${item.text}</a>
            <a href="${item.token_address}" target="_blank"><div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div></a>
          </div>
        `
			)
			.join("")}
      </div>
    `;
	}

	private async renderFourCount(username: string, data: TweetData[]): Promise<string> {
		const prefix = "https://gmgn.ai/bsc/token/Dagj4qLJ_";
		return `
      <div class="delete-history">
        ${data
			.map(
				(item) => `
          <div class="history-item">
            <div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
            <a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">${item.text}</a>
            <a href="${prefix}${item.token_address}" target="_blank"><div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div></a>
          </div>
        `
			)
			.join("")}
      </div>
    `;
	}

	private async renderBoopCount(username: string, data: TweetData[]): Promise<string> {
		const prefix = "https://believe.app/coin/";
		return `
      <div class="delete-history">
        ${data
			.map(
				(item) => `
          <div class="history-item">
            <div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
            <a href="${prefix}${item.token_address}" target="_blank"><div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div></a>
          </div>
        `
			)
			.join("")}
      </div>
    `;
	}

	private async renderBelieveCount(username: string, data: TweetData[]): Promise<string> {
		const prefix = "https://believe.app/coin/";
		return `
      <div class="delete-history">
        ${data
			.map(
				(item) => `
          <div class="history-item">
            <div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
            <a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">${item.text}</a>
            <a href="${prefix}${item.token_address}" target="_blank"><div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div></a>
          </div>
        `
			)
			.join("")}
      </div>
    `;
	}

	close(): void {
		if (this.modal) {
			this.modal.remove();
			this.modal = null;
		}
		if (this.overlay) {
			this.overlay.remove();
			this.overlay = null;
		}
	}
}
