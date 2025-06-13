// 缓存
import type { ApiResponse, NotificationData, NotificationLocales, UserStats } from "@/background/type";
import { WebSocketManager } from "@/background/manager";

const userStatsCache = new Map<string, UserStats>();
const detailsCache = new Map<string, ApiResponse>();
const postTweetCache = new Map<string, boolean>();

// API 配置
const API_BASE = "http://8.129.110.68:9000/api/business/tweet";
const API_ENDPOINTS = {
  stats: "/status",
  nameChanges: "/names",
  pumpCount: "/tweets",
  odinCount: "/odins",
  fourCount: "/fours",
  boopCount: "/boops",
  believeCount: "/believes",
  deletedTweets: "/tweets?only_deleted=true",
  odinDeletedCount: "/odins?only_deleted=true",
  fourDeletedCount: "/fours?only_deleted=true",
  postTweet: "/postTweet",
  DeleteTweetAlert: "/DeleteTweetAlert",
} as const;

// 通用的 API 请求函数
async function fetchFromApi(endpoint: string, params: { username: string; userId: string }, otherParams?: Record<string, any>): Promise<ApiResponse> {
  const code = await chrome.storage.sync.get("code");
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: params.username,
        userId: params.userId,
        ...otherParams,
      }),
    });

    return await response.json();
  } catch (error) {
    console.error("request error:", error);
    throw error;
  }
}

// 获取用户基础统计
async function fetchUserStats(username: string, userId: string): Promise<UserStats> {
  try {
    const data = await fetchFromApi(API_ENDPOINTS.stats, { username, userId });

    if (data.code === 200 && data.data) {
      return {
        fetchError: false,
        title: data.data.title || "",
        nameChanges: data.data.names_count || 0,
        pumpCount: data.data.pump_tweet_count || 0,
        odinCount: data.data.odin_tweet_count || 0,
        fourCount: data.data.four_tweet_count || 0,
        deletedTweets: data.data.deleted_pump_tweets_count || 0,
        deleted_odin_tweet_count: data.data.deleted_odin_tweet_count || 0,
        deleted_four_tweet_count: data.data.deleted_four_tweet_count || 0,
        followed_kol_count: data.data.friends_count || 0,
        boop_count: data.data.boop_count || 0,
        believeCount: data.data.believe_count || 0,
        followed_kols: data.data.followers_count || [],
      };
    }
    return {
      fetchError: true,
      title: "",
      nameChanges: 0,
      pumpCount: 0,
      odinCount: 0,
      fourCount: 0,
      deletedTweets: 0,
      deleted_odin_tweet_count: 0,
      deleted_four_tweet_count: 0,
      followed_kol_count: 0,
      boop_count: 0,
      believeCount: 0,
      followed_kols: [],
    };
  } catch (error) {
    console.error("fetchUserStats error:", error);
    return {
      fetchError: true,
      title: "",
      nameChanges: 0,
      pumpCount: 0,
      odinCount: 0,
      fourCount: 0,
      deletedTweets: 0,
      deleted_odin_tweet_count: 0,
      deleted_four_tweet_count: 0,
      followed_kol_count: 0,
      boop_count: 0,
      believeCount: 0,
      followed_kols: [],
    };
  }
}

async function active(): Promise<void> {
  const code = await chrome.storage.sync.get("code");

  const response = await fetch(`${API_BASE}/active`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Code": code ? code.code : "",
    },
    body: JSON.stringify({
      code: code ? code.code : "",
    }),
  });

  const data = await response.json();
  if (data.code === 1) {
    updateBadge(data.data.alert_tweets.length);
  } else {
    console.error("active error:", data);
  }
}

// 获取详细历史数据
async function fetchUserDetails(type: keyof typeof API_ENDPOINTS, username: string, userId: string): Promise<ApiResponse> {
  try {
    const endpoint = API_ENDPOINTS[type];
    if (!endpoint) {
      throw new Error("unknown type");
    }

    const data = await fetchFromApi(endpoint, { username, userId });
    return data;
  } catch (error) {
    console.error("fetchUserDetails error:", error);
    throw error;
  }
}

async function postTweet(username: string, userId: string, tweet: string): Promise<ApiResponse> {
  try {
    const data = await fetchFromApi(
      API_ENDPOINTS.postTweet,
      {
        username,
        userId,
      },
      {
        tweet,
      }
    );
    return data;
  } catch (error) {
    console.error("postTweet error:", error);
    throw error;
  }
}

async function deleteTweetAlert(username: string, userId: string): Promise<ApiResponse> {
  try {
    const data = await fetchFromApi(API_ENDPOINTS.DeleteTweetAlert, {
      username,
      userId,
    });
    if (data.code === 1) {
      const count = data.data;
      if (count > 0) {
        chrome.action.setBadgeText({ text: count.toString() });
        chrome.action.setBadgeBackgroundColor({ color: "rgb(255, 149, 0)" });
      } else {
        chrome.action.setBadgeText({ text: "" });
      }
    }

    return data;
  } catch (error) {
    console.error("deleteTweetAlert error:", error);
    throw error;
  }
}

// 添加睡眠函数
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 处理来自content script的消息
chrome.runtime.onMessage.addListener((request: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (request.action === "getUserStats") {
    // 异步获取数据
    (async () => {
      try {
        const stats = await fetchUserStats(request.username, request.userId);
        sendResponse({ stats });
      } catch (error) {
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
      }
    })();

    return true;
  } else if (request.action === "getUserDetails") {
    (async () => {
      try {
        const cacheKey = `${request.type}-${request.username}-${request.userId}`;
        let details = detailsCache.get(cacheKey);

        if (!details) {
          details = await fetchUserDetails(
            request.type,
            request.username,
            request.userId
          );
          detailsCache.set(cacheKey, details);
        }

        sendResponse({ details });
      } catch (error) {
        sendResponse({ error: error instanceof Error ? error.message : String(error) });
      }
    })();
    return true;
  } else if (request.action === "postTweet") {
    (async () => {
      const cacheKey = `${request.username}-${request.userId}`;
      const exist = postTweetCache.get(cacheKey);
      if (!exist) {
        await postTweet(request.username, request.userId, request.tweet);
        postTweetCache.set(cacheKey, true);
      }
    })();
    return true;
  } else if (request.action === "deleteTweetAlert") {
    (async () => {
      await deleteTweetAlert(request.username, request.userId);
    })();
    return true;
  }
});

// 在扩展关闭时清理连接
// chrome.runtime.onSuspend.addListener(() => {
// 	wsManager.closeWebSocket();
// });
//

chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

// 添加 updateBadge 函数
function updateBadge(count: number): void {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "rgb(255, 149, 0)" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// 定期清理缓存（每小时）
setInterval(() => {
  userStatsCache.clear();
  detailsCache.clear();
  postTweetCache.clear();
}, 3600000);

// // 创建单例
// const wsManager = WebSocketManager.getInstance();
//
// // 初始化 WebSocket
// wsManager.initWebSocket();
