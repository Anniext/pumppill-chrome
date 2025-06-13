import { debounce } from "@/pages/content/utils/debounce";
import { getMessage } from "@/pages/content/utils/message";
import { deleteTweetAlert, postTweet } from "@/pages/content/tweet/tweet";


// 在 Twitter 页面上动态插入自定义按钮
export const insertButtons = debounce(async () => {
	try {
		// 获取所有推文
		const tweets = document.querySelectorAll('[data-testid="tweet"]');
		if (!tweets) return;

		const currentUrl = window.location.href;
		const currentUrlMatch = currentUrl.match(/x\.com\/([^/]+)\/status\/(\d+)/);
		if (!currentUrlMatch) return;
		// username and tweet id
		const [, currentUsername, currentTweetId] = currentUrlMatch;

		for (const tweet of Array.from(tweets)) {
			// 跳过不匹配的推文
			const titleContainer = tweet.querySelector('[data-testid="User-Name"]');
			if (!titleContainer) continue;
			const p1 = titleContainer.parentElement;
			if (!p1) return;
			const userNameContainer = p1.parentElement;
			if (!userNameContainer) return;

			// 获取tweet发布推文ID
			const tweetAs = tweet.querySelectorAll('a[href*="/status/"]');
			if (!tweetAs) continue;
			let tweetID = "";
			for (const tweetA of Array.from(tweetAs)) {
				const anchor = tweetA as HTMLAnchorElement;
				const timeElement = anchor.querySelector("time");
				if (!timeElement) continue;
				tweetID = anchor.href.split("/status/")[1].split("?")[0].split("/")[0];
			}
			if (currentTweetId !== tweetID) continue;
			const existingButtonContainer = tweet.querySelector(
				".twitter-custom-buttons-container"
			);
			if (existingButtonContainer) {
				return;
			}
			const buttonContainer = document.createElement("div");
			buttonContainer.className = "twitter-custom-buttons-container";
			const button1 = document.createElement("button");
			button1.textContent = await getMessage("collectTweet");
			button1.className = "custom-twitter-button";
			button1.onclick = async () => {
				await postTweet(currentUsername, tweetID, "");
				button1.remove();
			};
			const button2 = document.createElement("button");
			button2.className = "custom-twitter-button warning";
			button2.innerHTML = `
        <span style="display: flex; align-items: center; gap: 4px;">
          ${await getMessage("deleteTweetAlert")}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M11.996 2c-4.062 0-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958C19.48 5.017 16.054 2 11.996 2zM9.171 18h5.658c-.412 1.165-1.523 2-2.829 2s-2.417-.835-2.829-2z"/>
          </svg>
        </span>
      `;
			button2.onclick = async () => {
				await deleteTweetAlert(currentUsername, tweetID);
				button2.remove();
			};
			const style = document.createElement("style");
			style.textContent = `
        .custom-twitter-button {
          background: rgb(0, 186, 124);
          border: none;
          color: rgb(255, 255, 255);
          padding: 6px 12px;
          border-radius: 16px;
          cursor: pointer;
          margin: 0 4px;
          font-size: 14px;
          font-weight: 500;
        }
        .custom-twitter-button:hover {
          background: rgb(0, 166, 104);
        }
        .custom-twitter-button.warning {
          background: rgb(255, 149, 0);
        }
        .custom-twitter-button.warning:hover {
          background: rgb(230, 134, 0);
        }
      `;
			document.head.appendChild(style);
			buttonContainer.appendChild(button1);
			buttonContainer.appendChild(button2);
			const existingButtonContainer2 = tweet.querySelector(
				".twitter-custom-buttons-container"
			);
			if (existingButtonContainer2) {
				return;
			}
			userNameContainer.appendChild(buttonContainer);
		}
	} catch (error) {
		console.error("insertButtons err:", error);
	}
}, 100);

