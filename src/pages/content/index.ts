export { };
import type { UserStats, BackendMessageInf } from '@/background/type'

declare global {
  interface Window {
    contentLocales: Map<string, Map<string, string>>;
  }
};

window.contentLocales = new Map(
  [
    ["zh-CN", new Map([
      ["nameChanges", "改名"],
      ["pumpCount", "发盘({0})"],
      ["deletedTweets", "删推({0})"],
      ["boopCount", "Boop({0})"],
      ["believeCount", "Believe({0})"],
      ["loadingFailed", "加载失败"],
      ["activatePlugin", "请先激活插件"],
      ["clickToQuery", "点击查询"],
      ["collectTweet", "收录推文"],
      ["deleteTweetAlert", "删推提醒"],
      ["modalTitle.nameChanges", "改名历史"],
      ["modalTitle.pumpCount", "Pump记录"],
      ["modalTitle.deletedTweets", "删推记录"],
      ["modalTitle.boopCount", "Boop记录"],
      ["modalTitle.believeCount", "Believe记录"],
      ["followedKOL", "关注ta的KOL({0}个):"]
    ])],
    ["en-US", new Map([
      ["nameChanges", "Renamed"],
      ["pumpCount", "Pumped:({0})"],
      ["deletedTweets", "Deleted:({0})"],
      ["boopCount", "Boop:({0})"],
      ["believeCount", "Believe:({0})"],
      ["loadingFailed", "Loading Failed"],
      ["activatePlugin", "Please Activate Plugin"],
      ["clickToQuery", "Click to Query"],
      ["collectTweet", "Collect Tweet"],
      ["deleteTweetAlert", "Delete Alert"],
      ["modalTitle.nameChanges", "Renamed History"],
      ["modalTitle.pumpCount", "Pumped History"],
      ["modalTitle.boopCount", "Boop History"],
      ["modalTitle.believeCount", "Believe History"],
      ["modalTitle.deletedTweets", "Deleted Tweets History"],
      ["followedKOL", "Followed KOLs({0}):"]
    ])]
  ]
);

interface UserInfo {
  username: string,
  userId: string
}


let hasDisplayedStats = false;
let currentTweetID: string | null = null;
let currentBtnTweetID = null;

const LocalLanguageCode = navigator.language;

// 获取本地化消息

function getMessage(key: string): string {
  let languagedict = window.contentLocales.get(LocalLanguageCode);
  if (languagedict == undefined)
    languagedict = window.contentLocales.get("en-US") as Map<string, string>;
  return languagedict.get(key) ?? "Failed Get Locale String";
}


function getUserInfo(): UserInfo | null {
  try {
    // Extract username from URL
    const { pathname } = new URL(location.href);
    const [_, hrefUsername] = pathname.split('/');
    if (!hrefUsername) throw Error("Extract username from URL Failed");

    // Get displayed username
    const usernameSpan = document.querySelector(
      '[data-testid="UserName"] div[tabindex] div[dir] > span'
    ) as HTMLSpanElement;
    const username = usernameSpan?.textContent?.replace('@', '');
    if (!username || hrefUsername.toLowerCase() !== username.toLowerCase()) {
      throw Error("Get display username Failed");
    }

    // Try to get userId from follow button first
    const followBtn = document.querySelector('[data-testid="placementTracking"] > div > button');
    if (followBtn) {
      const followId = followBtn.getAttribute('data-testid')?.split('-')[0];
      if (followId) return { username: username, userId: followId };
    }

    // Fallback to getting userId from more link
    const moreLink = document.querySelector('aside > a') as HTMLAnchorElement;
    if (moreLink) {
      const userId = new URL(moreLink.href).searchParams.get('user_id');
      if (!userId) throw Error("Get UserID Failed");
      return { username: username, userId: userId };
    }
    else throw Error("Get moreLink Failed");
  } catch (error) {
    console.error('getUserInfo error:', error);
    return null;
  }
}

// function getUserInfo(): { username: string, userId: string } | null {
//   try {
//     const url = new URL(location.href);
//     const paths = url.pathname.split("/");
//     if (paths.length < 2) {
//       return null;
//     }
//     const hrefUsername = paths[1];
//     const span = document.querySelector(
//       '[data-testid="UserName"] div[tabindex] div[dir] > span'
//     ) as HTMLSpanElement;
//     if (!span) {
//       return null;
//     }
//
//     const username = span.textContent?.replace("@", "");
//     if (username == null || hrefUsername.toLowerCase() !== username.toLowerCase()) {
//       return null;
//     }
//
//     let userId = null;
//     const followBtn = document.querySelector(
//       '[data-testid="placementTracking"] > div > button'
//     );
//     if (followBtn) {
//       const followIDStr = followBtn.getAttribute("data-testid");
//       if (
//         !followIDStr ||
//         (!followIDStr.includes("-follow") && !followIDStr.includes("-unfollow"))
//       ) {
//         return null;
//       }
//
//       const fllowIDArr = followIDStr.split("-");
//       if (fllowIDArr.length === 2) {
//         userId = fllowIDArr[0];
//       }
//     } else {
//       let moreA = document.querySelector("aside > a") as HTMLAnchorElement;
//       if (moreA) {
//         const moreUrl = new URL(moreA.href);
//         userId = moreUrl.searchParams.get("user_id");
//       }
//     }
//
//     if (!userId) {
//       return null;
//     }
//     return { username, userId };
//   } catch (error) {
//     console.log("getUserInfo err:", error);
//     return null;
//   }
// }

async function getUserStats(userInfo: UserInfo) {
  return new Promise((resolve: (stats: UserStats) => void, reject: (err: Error) => void) => {
    chrome.runtime.sendMessage(
      {
        action: "getUserStats",
        username: userInfo.username,
        userId: userInfo.userId,
      },
      (response) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.stats);
        }
      }
    );
  });
}

async function insertAnalytics(headerElement: HTMLElement, forceUpdate = false) {
  const userInfo = getUserInfo();
  if (!userInfo) return;

  let currentBox: null | HTMLElement = null;
  {
    const exist_analyticsBox = headerElement.querySelector(".twitter-analytics-box");
    if (exist_analyticsBox instanceof HTMLElement &&
      !forceUpdate &&
      exist_analyticsBox.dataset.username === userInfo.username &&
      exist_analyticsBox.dataset.userId === userInfo.userId
    ) {
      currentBox = exist_analyticsBox;
    } else {
      // exist_analyticsBox.remove();
      if (exist_analyticsBox != null)
        headerElement.removeChild(exist_analyticsBox);
      const new_analyticsBox = document.createElement("div") as HTMLDivElement;
      new_analyticsBox.className = "twitter-analytics-box";
      new_analyticsBox.dataset.username = userInfo.username;
      new_analyticsBox.dataset.userId = userInfo.userId;
      new_analyticsBox.innerHTML = getLoadingHTML();
      headerElement.appendChild(new_analyticsBox);
      currentBox = new_analyticsBox;
    }
  }

  if (currentBox == null) throw Error("CurrentBox Create Failed Or HeaderElement is not exists");

  const autoQuery = await chrome.storage.sync.get({
    enableAutoQuery: true,
    code: "",
  });

  if (autoQuery.code) {
    currentBox.innerHTML = `
			<span class="analytics-item" data-type="toQuery">
        ${getMessage("activatePlugin")}
      </span>
		`;
    hasDisplayedStats = true;
    return;
  } else if (!autoQuery.enableAutoQuery) {
    // const currentBox = headerElement.querySelector(".twitter-analytics-box");
    currentBox.innerHTML = `
		  <span class="analytics-item" data-type="toQuery">
        ${getMessage("clickToQuery")}
      </span>
		`;
    hasDisplayedStats = true;
    addStatsClickHandlers(currentBox, userInfo);
    return;
  }

  ToQuery(currentBox, userInfo).then(stats => {
    // 添加KOL关注者信息
    if (stats && stats.followed_kols) {
      return insertKOLFollowers(userInfo, stats);
    }
  }).then(val => {

  });
}

async function ToQuery(currentBox: HTMLElement, userInfo: UserInfo) {
  try {
    const stats = await getUserStats(userInfo);
    if (
      currentBox &&
      currentBox.dataset.username === userInfo.username &&
      currentBox.dataset.userId === userInfo.userId
    ) {
      if (!stats || stats.fetchError) {
        console.log("stats", stats);
        console.log("stats.fetchError", stats.fetchError);
        currentBox.innerHTML = `
					<span class="analytics-item">${getMessage("loadingFailed")}</span>
				`;
        hasDisplayedStats = true;
      } else {
        currentBox.innerHTML = `
          <div class="twitter-analytics-box" style='display: flex;'>
            <button class="twitter-analytics-item" data-type="toQuery" style='display: flex; padding-top: 0.25rem;padding-bottom: 0.25rem; padding-left: 0.5rem;padding-right: 0.5rem; margin: 0.5rem; border-radius: 9999px; border-width: 2px; border-color: #000000; background-color: #ffffff; '>
              <span style='margin-left: 0.25rem; margin-right: 0.25rem;'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                  <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                </svg>
              </span>
              <span class="mx-1">
                ${stats.nameChanges > 0 ? "count-red" : ""}
              </span>
            </button>
            <button class="twitter-analytics-item" data-type="toQuery" style='display: flex; padding-top: 0.25rem;padding-bottom: 0.25rem; padding-left: 0.5rem;padding-right: 0.5rem; margin: 0.5rem; border-radius: 9999px; border-width: 2px; border-color: #000000; background-color: #ffffff; '>
              <span style='margin-left: 0.25rem; margin-right: 0.25rem;'>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
                  <path fill-rule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z" clip-rule="evenodd" />
                  <path d="M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z" />
                </svg>
              </span>
              <span style='margin-left: 0.25rem; margin-right: 0.25rem;'>
                ${stats.pumpCount}
              </span>
            </button>
          </div>
        `;
        console.log("currentBox")
        const analytics_items = currentBox.getElementsByClassName("twitter-analytics-item");
        for (let i = 0; i < analytics_items.length; i++) {
          const obj = analytics_items.item(i) as HTMLElement;
          obj.addEventListener("click", DisplayKOLPopWindow);
        }
        hasDisplayedStats = true;
        return stats;
      }
    }
  } catch (error) {
    console.error("getUserStats err:", error);
    if (
      currentBox &&
      currentBox.dataset.username === userInfo.username &&
      currentBox.dataset.userId === userInfo.userId
    )
      currentBox.innerHTML = `<span class="analytics-item">${getMessage("loadingFailed")}</span>`;
  }
}

function DisplayKOLPopWindow() {
  //TODO:显示弹窗
  console.log("DisplayKOLPopWindow");
}

function getLoadingHTML() {
  return `
		<div class="analytics-loading">
			<div class="dot"></div>
			<div class="dot"></div>
			<div class="dot"></div>
		</div>
	`;
}

let isUpdating = false;
let isInitialLoad = true;


// 清除统计框
function clearAnalytics() {
  const analyticsBox = document.querySelector(".twitter-analytics-box");
  if (analyticsBox) {
    analyticsBox.remove();
  }
  const kolBox = document.querySelector(".twitter-kol-followers-box");
  if (kolBox) {
    kolBox.remove();
  }
  const btnBox = document.querySelector(".custom-twitter-button");
  if (btnBox) {
    btnBox.remove();
  }
  hasDisplayedStats = false;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 检查并更新用户信息
async function checkAndUpdate() {
  await delay(500);
  try {
    isUpdating = true;
    const userHeader = document.querySelector(
      '[data-testid="UserName"], [data-testid="UserNameDisplay"]'
    );
    if (userHeader && userHeader instanceof HTMLElement) {
      insertAnalytics(userHeader, true);
    } else {
      // console.log("userHeader not found");
    }
  } finally {
    await delay(500);
    isUpdating = false;
    if (isInitialLoad) {
      isInitialLoad = false;
    }
  }
}
// const checkAndUpdate = debounce(async () => {
//   if (isUpdating) {
//     // console.log("isUpdating,continue");
//     return;
//   }
//
//   try {
//     isUpdating = true;
//     const userHeader = document.querySelector(
//       '[data-testid="UserName"], [data-testid="UserNameDisplay"]'
//     );
//     if (userHeader) {
//       await insertAnalytics(userHeader, true);
//     } else {
//       // console.log("userHeader not found");
//     }
//   } finally {
//     setTimeout(() => {
//       isUpdating = false;
//       if (isInitialLoad) {
//         isInitialLoad = false;
//       }
//     }, 500);
//   }
// }, 100);

// 检查并更新用户信息
async function checkAndUpdateTweetTime() {
  await delay(100);
  try {
    const tweetAs = document.querySelectorAll('article[data-testid="tweet"]');
    if (!tweetAs) return;

    const currentUrl = window.location.href;
    const currentUrlMatch = currentUrl.match(
      /x\.com\/([^/]+)\/status\/(\d+)/
    );
    if (!currentUrlMatch) return;

    const [, currentUsername, currentTweetId] = currentUrlMatch;

    for (const article of tweetAs) {
      const tweetA = article.querySelector('a[href*="/status/"]');
      if (!tweetA || !(tweetA instanceof HTMLAnchorElement)) continue;

      const tweetUrlMatch = tweetA.href.match(
        /x\.com\/([^/]+)\/status\/(\d+)/
      );
      if (!tweetUrlMatch) continue;

      const [, tweetUsername, tweetId] = tweetUrlMatch;

      if (
        tweetUsername.toLowerCase() !== currentUsername.toLowerCase() ||
        tweetId !== currentTweetId
      ) {
        continue;
      }

      const timeElement = article.querySelector("time");
      if (!timeElement) continue;

      const tweetID = tweetA.href
        .split("/status/")[1]
        .split("?")[0]
        .split("/")[0];
      if (currentTweetID === tweetID) continue;

      currentTweetID = tweetID;

      const datetime = timeElement.getAttribute("datetime");
      if (datetime) {
        const date = new Date(datetime);
        const seconds = date.getSeconds();
        const text = timeElement.textContent;

        const minuteMatch: RegExpMatchArray | null | undefined = text?.match(/\d+:\d+/);
        if (minuteMatch != null && minuteMatch != undefined && minuteMatch.index != undefined) {
          const minuteIndex = minuteMatch.index + minuteMatch[0].length;
          const newText = `${text?.slice(0, minuteIndex)}:${seconds
            .toString()
            .padStart(2, "0")}${text?.slice(minuteIndex)}`;
          timeElement.textContent = newText;
        }
      }
    }
  } catch (error) {
    console.error("更新时间出错:", error);
  } finally {
    await delay(500);
    isUpdating = false;
    if (isInitialLoad) {
      isInitialLoad = false;
    }
  }
}
// const checkAndUpdateTweetTime = debounce(async () => {
//   try {
//     try {
//       const tweetAs = document.querySelectorAll('article[data-testid="tweet"]');
//       if (!tweetAs) return;
//
//       const currentUrl = window.location.href;
//       const currentUrlMatch = currentUrl.match(
//         /x\.com\/([^/]+)\/status\/(\d+)/
//       );
//       if (!currentUrlMatch) return;
//
//       const [, currentUsername, currentTweetId] = currentUrlMatch;
//
//       for (const article of tweetAs) {
//         const tweetA = article.querySelector('a[href*="/status/"]');
//         if (!tweetA || !(tweetA instanceof HTMLAnchorElement)) continue;
//
//         const tweetUrlMatch = tweetA.href.match(
//           /x\.com\/([^/]+)\/status\/(\d+)/
//         );
//         if (!tweetUrlMatch) continue;
//
//         const [, tweetUsername, tweetId] = tweetUrlMatch;
//
//         if (
//           tweetUsername.toLowerCase() !== currentUsername.toLowerCase() ||
//           tweetId !== currentTweetId
//         ) {
//           continue;
//         }
//
//         const timeElement = article.querySelector("time");
//         if (!timeElement) continue;
//
//         const tweetID = tweetA.href
//           .split("/status/")[1]
//           .split("?")[0]
//           .split("/")[0];
//         if (currentTweetID === tweetID) continue;
//
//         currentTweetID = tweetID;
//
//         const datetime = timeElement.getAttribute("datetime");
//         if (datetime) {
//           const date = new Date(datetime);
//           const seconds = date.getSeconds();
//           const text = timeElement.textContent;
//
//           const minuteMatch = text.match(/\d+:\d+/);
//           if (minuteMatch) {
//             const minuteIndex = minuteMatch.index + minuteMatch[0].length;
//             const newText = `${text.slice(0, minuteIndex)}:${seconds
//               .toString()
//               .padStart(2, "0")}${text.slice(minuteIndex)}`;
//             timeElement.textContent = newText;
//           }
//         }
//       }
//     } catch (error) {
//       console.error("更新时间出错:", error);
//     }
//   } finally {
//     setTimeout(() => {
//       isUpdating = false;
//       if (isInitialLoad) {
//         isInitialLoad = false;
//       }
//     }, 500);
//   }
// }, 100);

function loadScript(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载脚本失败: ${url}`));

    document.head.appendChild(script);
  });
}

// 使用
// loadScript('https://cdn.tailwindcss.com')
//   .then(() => {
//     // 假设模块已经挂载到window上
//     (window as any).externalModule.someFunction();
//   })
//   .catch(console.error);
//
// 初始化观察器
export function initializeObservers() {
  if (!document.body) {
    window.addEventListener("load", initializeObservers);
    return;
  }

  let lastUrl = location.href;

  // 合并 URL 和 DOM 变化的处理
  const observer = new MutationObserver(() => {
    const currentUrl = location.href;

    checkAndUpdateTweetTime();
    insertButtons();

    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;

      clearAnalytics();
      checkAndUpdate();
    } else if (!isUpdating && !isInitialLoad) {
      const userHeader = document.querySelector(
        '[data-testid="UserName"], [data-testid="UserNameDisplay"]'
      );
      if (userHeader && !hasDisplayedStats) {
        checkAndUpdate();
      }
    }
  });

  try {
    observer.observe(document.body, {
      subtree: true,
      childList: true,
    });
  } catch (error) {
    console.error("observer err:", error);
  }

  // 执行初始检查
  if (isInitialLoad) {
    checkAndUpdate();
  }
}

// 开始初始化
//initializeObservers();

// 添加弹窗相关代码
class StatsModal {
  container: HTMLDivElement = document.createElement("div");
  modal: HTMLDivElement = new HTMLDivElement;
  modalBackdrop: HTMLDivElement = new HTMLDivElement;
  btnClose: HTMLButtonElement = new HTMLButtonElement;
  currentUsername = "";
  currentUserId = "";

  constructor() {
    this.container.innerHTML = `
      <div
        id="modalBackdrop"
        style="
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 40;
          display: none;
          animation: fadeIn 0.3s ease;
        "
      ></div>

      <div
        id="modal"
        style="
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background-color: white;
          border-radius: 0.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          padding: 1.5rem;
          z-index: 50;
          width: 91.666667%;
          max-width: 28rem;
          display: none;
          animation: slideIn 0.3s ease;
        "
      >
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="font-size: 1.25rem; font-weight: 700; color: #1f2937;">弹窗标题</h3>
          <button
            id="closeModal"
            style="
              color: #6b7280;
              transition: color 0.2s ease;
              background: none;
              border: none;
              cursor: pointer;
            "
            onmouseover="this.style.color='#374151'"
            onmouseout="this.style.color='#6b7280'"
          >
            <svg xmlns="http://www.w3.org/2000/svg" style="height: 1.5rem; width: 1.5rem;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div style="margin-bottom: 1.5rem;">

        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button
            id="cancelBtn"
            style="
              padding: 0.5rem 1rem;
              color: #374151;
              border-radius: 0.25rem;
              transition: background-color 0.2s ease;
              background: none;
              border: none;
              cursor: pointer;
            "
            onmouseover="this.style.backgroundColor='#f3f4f6'"
            onmouseout="this.style.backgroundColor='transparent'"
          >
            取消
          </button>
          <button
            style="
              padding: 0.5rem 1rem;
              background-color: #2563eb;
              color: white;
              border-radius: 0.25rem;
              transition: background-color 0.2s ease;
              border: none;
              cursor: pointer;
            "
            onmouseover="this.style.backgroundColor='#1d4ed8'"
            onmouseout="this.style.backgroundColor='#2563eb'"
          >
            确认
          </button>
        </div>
      </div>
    `
    this.btnClose = this.container.querySelector("#closeModal") as HTMLButtonElement;
    this.modal = this.container.querySelector("#modal") as HTMLDivElement;
    this.modalBackdrop = this.container.querySelector("#modalBackdrop") as HTMLDivElement;

    this.modalBackdrop.addEventListener("click", event => {
      if (event.target == this.modalBackdrop)
        this.close();
    });
    this.btnClose.addEventListener("click", event => {
      this.close();
    });

    document.body.appendChild(this.modal);
  }

  async create() {
  }

  async show(type: string, username: string, userId: string) {
    this.currentUsername = username;
    this.currentUserId = userId;

    if (!this.modal) {
      await this.create();
    }

    // 设置标题
    const modal_title_ui = this.modal.querySelector(".modal-title");
    if (modal_title_ui instanceof HTMLElement)
      modal_title_ui.textContent = getMessage("modalTitle");

    try {
      // 显示加载中
      const modal_content_ui = this.modal.querySelector(".modal-content");
      if (modal_content_ui instanceof HTMLElement)
        modal_content_ui.innerHTML = `
			  	<div class="modal-loading">
			  		${getLoadingHTML()}
			  	</div>
			  `;

      // 根据类型调用不同的 API
      const data = await this.fetchData(type);

      // 更新内容
      await this.updateContent(type, username, data);
    } catch (error) {
      console.error("获取详情失败:", error);
      const modal_content_ui = this.modal.querySelector(".modal-content");
      if (modal_content_ui instanceof HTMLElement)
        modal_content_ui.innerHTML = getMessage("loadingFailed");
    }
  }

  fetchData(type: string) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(
        {
          action: "getUserDetails",
          type,
          username: this.currentUsername,
          userId: this.currentUserId,
        },
        (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response.details);
          }
        }
      );
    });
  }

  async updateContent(type: string, username: string, data: any) {
    // 根据不同类型展示不同的内容
    let content = "";

    if (data.code === 1 && data.data) {
      setTimeout(() => {
        const addresses = this.modal.querySelectorAll(".token-address");
        addresses.forEach((div) => {
          div.addEventListener("click", () => {
            if (div instanceof HTMLElement)
              navigator.clipboard.writeText(div.dataset.address ?? "");
          });
        });
      }, 0);

      switch (type) {
        case "nameChanges":
          content = this.renderNameChanges(username, data.data);
          break;
        case "pumpCount":
          content = await this.renderPumpHistory(username, data.data);
          break;
        case "deletedTweets":
          content = await this.renderDeletedTweets(username, data.data);
          break;
        case "odinCount":
          content = await this.renderOdinCount(username, data.data);
          break;
        case "fourCount":
          content = await this.renderFourCount(username, data.data);
          break;
        case "odinDeletedCount":
          content = await this.renderOdinDeletedCount(username, data.data);
          break;
        case "fourDeletedCount":
          content = await this.renderFourDeletedCount(username, data.data);
          break;
        case "boopCount":
          content = await this.renderBoopCount(data.data);
          break;
        case "believeCount":
          content = await this.renderBelieveCount(username, data.data);
          break;
      }
    } else {
      content = "暂无数据";
    }

    const modal_content_ui = this.modal.querySelector(".modal-content");
    if (modal_content_ui instanceof HTMLElement)
      modal_content_ui.innerHTML = content;
  }

  renderNameChanges(username: string, data: any) {
    // 渲染改名历史
    if (typeof (data) == "object")
      return `
		  	<div class="name-history">
		  		${data
          .map((item: any) => `
		  			<div class="history-item">
              <div class="token-address" data-address="${item.token_address}">
                ${item.token_address} 📋
              </div>
              <div class="change">
                <a href="https://x.com/${item.twitter_screen_name}" target="_blank">https://x.com/${item.twitter_screen_name}</a>
              </div>
		  			</div>
		  		`)
          .join("")}
		  	</div>
		  `;
    else
      return "RenderNameChanges Error";
  }

  async renderPumpHistory(username: string, data: any) {
    const prefix = await chrome.storage.sync.get({
      contractPrefix: "https://gmgn.ai/sol/token/",
    });
    // 渲染发盘记录
    return `
			<div class="pump-history">
				${data.tweets
        .map(
          (item: any) => `
					<div class="history-item">
						<div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
						<a class="content" href="https://x.com/${username}/status/${item.tweet_id
            }" target="_blank">${item.text}</a>
                         <a href="${prefix.contractPrefix}${item.token_address
            }" target="_blank"><div class="token-address" data-address="${item.token_address
            }">
                            ${item.token_address} 📋
                        </div></a>
					</div>
				`
        )
        .join("")}
			</div>
		`;
  }

  async renderDeletedTweets(username: string, data: any) {
    const prefix = await chrome.storage.sync.get({
      contractPrefix: "https://gmgn.ai/sol/token/",
    });
    // 渲染删推记录
    return `
			<div class="delete-history">
				${data.tweets
        .map(
          (item: any) => `
					<div class="history-item">
						<div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
						<a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">
              ${item.text}
            </a>
            <a href="${prefix.contractPrefix}${item.token_address}" target="_blank">
            <div class="token-address" data-address="${item.token_address}">
              ${item.token_address} 📋
            </div></a>
					</div>
				`
        )
        .join("")}
			</div>
		`;
  }

  async renderOdinDeletedCount(username: string, data: any) {
    // 渲染删推记录
    return `
        <div class="delete-history">
          ${data.tweets.map(
      (item: any) => `
            <div class="history-item">
              <div class="time">${new Date(
        item.publish_time * 1000
      ).toLocaleString()}</div>
              <a class="content" href="https://x.com/${username}/status/${item.tweet_id
        }" target="_blank">${item.text}</a>
                           <a href="${item.token_address
        }" target="_blank"><div class="token-address" data-address="${item.token_address
        }">
                              ${item.token_address} 📋
                          </div></a>
            </div>
          `
    )
        .join("")}
        </div>
      `;
  }

  async renderFourDeletedCount(username: string, data: any) {
    const prefix = "https://gmgn.ai/bsc/token/Dagj4qLJ_";
    return `
			<div class="delete-history">
				${data.tweets
        .map(
          (item: any) => `
					<div class="history-item">
						<div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
						<a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">${item.text}</a>
            <a href="${prefix}${item.token_address}" target="_blank"><div class="token-address" data-address="${item.token_address}">
                            ${item.token_address} 📋
            </a>
					</div>
				`
        )
        .join("")}
			</div>
		`;
  }

  async renderOdinCount(username: string, data: any) {
    return `
			<div class="delete-history">
				${data.tweets
        .map(
          (item: any) => `
					<div class="history-item">
						<div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
						<a class="content" href="https://x.com/${username}/status/${item.tweet_id
            }" target="_blank">${item.text}</a>
                         <a href="${item.token_address
            }" target="_blank"><div class="token-address" data-address="${item.token_address
            }">
                            ${item.token_address} 📋
                        </div></a>
					</div>
				`
        )
        .join("")}
			</div>
		`;
  }

  async renderFourCount(username: string, data: any) {
    const prefix = "https://gmgn.ai/bsc/token/Dagj4qLJ_";
    return `
			<div class="delete-history">
				${data.tweets
        .map((item: any) => `
					<div class="history-item">
						<div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
						<a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">
              ${item.text}
            </a>
            <a href="${prefix}${item.token_address}" target="_blank">
              <div class="token-address" data-address="${item.token_address}">
                ${item.token_address} 📋
              </div>
            </a>
					</div>
				`).join("")}
			</div>
		`;
  }

  async renderBoopCount(data: any) {
    const prefix = "https://believe.app/coin/";
    return `
			<div class="delete-history">
				${data.tweets
        .map((item: any) => `
					<div class="history-item">
						<div class="time">${new Date(item.publish_time * 1000).toLocaleString()}</div>
              <a href="${prefix}${item.token_address}" target="_blank">
              <div class="token-address" data-address="${item.token_address}">
                ${item.token_address} 📋
              </div>
              </a>
            </div>
					</div>
				`).join("")}
			</div>
		`;
  }

  async renderBelieveCount(username: string, data: any) {
    const prefix = "https://believe.app/coin/";
    return `
			<div class="delete-history">
				${data.tweets
        .map(
          (item: any) => `
					<div class="history-item">
						<div class="time">
              ${new Date(item.publish_time * 1000).toLocaleString()}
            </div>
						<a class="content" href="https://x.com/${username}/status/${item.tweet_id}" target="_blank">
              ${item.text}
            </a>
            <a href="${prefix}${item.token_address}" target="_blank">
              <div class="token-address" data-address="${item.token_address}">
                ${item.token_address} 📋
              </div>
            </a>
					</div>`).join("")}
			</div>
		`;
  }

  open() {
    this.modal.style.display = 'block';
    this.modalBackdrop.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modal.style.display = 'none';
    this.modalBackdrop.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// 创建全局弹窗实例
const statsModal = new StatsModal();

// 在 insertAnalytics 函数中更新统计框内容时添加点击事件
function addStatsClickHandlers(analyticsBox: HTMLElement, userInfo: UserInfo) {
  const items = analyticsBox.querySelectorAll(".analytics-item");
  items.forEach((item) => {
    if (!(item instanceof HTMLElement))
      throw Error("addStatsClickHandlers is error");
    const type = item.dataset.type;
    if (type === "toQuery") {
      item.style.cursor = "pointer";
      item.addEventListener("click", async () => {
        const userHeader = document.querySelector(
          '[data-testid="UserName"], [data-testid="UserNameDisplay"]'
        );
        analyticsBox.innerHTML = getLoadingHTML();
        if (userHeader == null || !(userHeader instanceof HTMLElement))
          throw Error("userHeader is null");
        const stats = await ToQuery(userHeader, userInfo);
        if (stats && stats.followed_kols) {
          await insertKOLFollowers(userInfo, stats);
        }
      });
    }
  });

  const countItems = analyticsBox.querySelectorAll(".count-item");
  countItems.forEach((item) => {
    if (item instanceof HTMLElement) {
      item.style.cursor = "pointer";
      item.addEventListener("click", async () => {
        const type = item.dataset.type ?? "";
        statsModal.show(type, userInfo.username, userInfo.userId);
      });
    }
  });
}

async function insertKOLFollowers(userInfo: UserInfo, stats: any) {
  const settings = await chrome.storage.sync.get({
    enableKOLFollowers: true, // 默认开启
  });
  if (!settings.enableKOLFollowers) return;

  // 查找个人资料时间线导航栏
  const timelineNav = document.querySelector('nav[aria-live="polite"]');
  if (!timelineNav) return;

  // 检查是否已存在KOL信息框
  const existingKolBox = document.querySelector(".twitter-kol-followers-box");
  if (existingKolBox) {
    existingKolBox.remove();
  }

  // 创建KOL信息容器
  const kolBox = document.createElement("div");
  kolBox.className = "twitter-kol-followers-box";
  kolBox.dataset.username = userInfo.username;
  kolBox.dataset.userId = userInfo.userId || "";

  const colorScheme = getComputedStyle(document.documentElement)
    .getPropertyValue("color-scheme")
    .trim();

  // 构建HTML内容
  if (!Array.isArray(stats.followed_kols))
    throw Error("stats.followed_kols is not array");

  kolBox.innerHTML = `
	  <div class="kol-followers-title">
		${getMessage("followedKOL") + stats.followed_kol_count}
	  </div>
	  <div class="kol-followers-list">
		  ${stats.followed_kols
      .map(
        (kol: any): string => `
		          <div class="kol-follower-item" data-screen-name="${kol.screen_name}">
		        	<img class="kol-follower-avatar" src="${kol.profile_image_url_https}" alt="${kol.name}">
		        	<span class="kol-follower-name">${kol.title || kol.name}</span>
		          </div>
		      `).join("")}
    </div>`;

  const existingKolBox2 = document.querySelector(".twitter-kol-followers-box");
  if (existingKolBox2) {
    existingKolBox2.remove();
  }
  // 在导航栏之前插入KOL信息框
  if (timelineNav.parentNode != null)
    timelineNav.parentNode.insertBefore(kolBox, timelineNav);

  // 添加点击事件处理
  const followerItems = kolBox.querySelectorAll(".kol-follower-item");
  followerItems.forEach((item) => {
    item.addEventListener("click", () => {
      if (item instanceof HTMLElement)
        window.location.href = `https://x.com/${item.dataset.screenName}`;
    });
  });
}



const insertButtons = async () => {
  await delay(100);
  // 查找标题容器
  try {
    const tweets = document.querySelectorAll('[data-testid="tweet"]');
    if (!tweets) return;

    const currentUrl = window.location.href;
    const currentUrlMatch = currentUrl.match(/x\.com\/([^/]+)\/status\/(\d+)/);
    if (!currentUrlMatch) return;
    const [, currentUsername, currentTweetId] = currentUrlMatch;

    for (const tweet of tweets) {
      const titleContainer = tweet.querySelector('[data-testid="User-Name"]');
      if (!titleContainer) continue;

      const p1 = titleContainer.parentElement;
      if (!p1) return;

      const userNameContainer = p1.parentElement;
      if (!userNameContainer) return;

      const tweetAs = tweet.querySelectorAll('a[href*="/status/"]');
      if (!tweetAs) continue;
      let tweetID = "";
      for (const tweetA of tweetAs) {
        const timeElement = tweetA.querySelector("time");
        if (!timeElement) continue;
        if (tweetA instanceof HTMLAnchorElement)
          tweetID = tweetA.href.split("/status/")[1].split("?")[0].split("/")[0];
      }

      if (currentTweetId !== tweetID) continue;

      currentBtnTweetID = tweetID;
      // if (screenName !== currentUsername) return;

      const existingButtonContainer = tweet.querySelector(
        ".twitter-custom-buttons-container"
      );
      if (existingButtonContainer) {
        return;
      }

      const buttonContainer = document.createElement("div");
      buttonContainer.className = "twitter-custom-buttons-container";

      // 创建按钮
      const button1 = document.createElement("button");
      button1.textContent = getMessage("collectTweet");
      button1.className = "custom-twitter-button";
      button1.onclick = async () => {
        await postTweet(currentUsername, tweetID, "");
        button1.remove();
      };

      const button2 = document.createElement("button");
      button2.className = "custom-twitter-button warning";
      button2.innerHTML = `
        <span style="display: flex; align-items: center; gap: 4px;">
    	    ${getMessage("deleteTweetAlert")}
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M11.996 2c-4.062 0-7.49 3.021-7.999 7.051L2.866 18H7.1c.463 2.282 2.481 4 4.9 4s4.437-1.718 4.9-4h4.236l-1.143-8.958C19.48 5.017 16.054 2 11.996 2zM9.171 18h5.658c-.412 1.165-1.523 2-2.829 2s-2.417-.835-2.829-2z"/>
          </svg>
        </span>
      `;
      button2.onclick = async () => {
        await deleteTweetAlert(currentUsername, tweetID);
        button2.remove();
      };

      // 添加按钮样式
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
    		  background: rgb(255, 149, 0);  /* Twitter的红色 */
    	  }
    	  .custom-twitter-button.warning:hover {
    		  background: rgb(230, 134, 0);  /* 稍深的橙色 */
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
};

// 修改 postTweet 函数
async function postTweet(username: string, userId: string, tweet: string) {
  chrome.runtime.sendMessage({
    action: "postTweet",
    username,
    userId,
    tweet,
  });
}

// 修改 deleteTweetAlert 函数
async function deleteTweetAlert(username: string, userId: string) {
  chrome.runtime.sendMessage({
    action: "deleteTweetAlert",
    username,
    userId,
  });
}
