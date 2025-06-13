export interface DetailResponse {
  code: number;
  data: {
    tweets: TweetData[];
  };
}

export interface TweetData {
  publish_time: number;
  tweet_id: string;
  text: string;
  token_address: string;
}

export interface DetailResponse {
  code: number;
  data: {
    tweets: TweetData[];
  };
}

export interface UserInfo {
  username: string;
  userId: string;
}

export interface BackendData {
  code: number;
  data?: any;
}

// 定义本地化字符串接口
export interface Locales {
  zh: {
    nameChanges: string;
    pumpCount: string;
    deletedTweets: string;
    boopCount: string;
    believeCount: string;
    loadingFailed: string;
    activatePlugin: string;
    clickToQuery: string;
    collectTweet: string;
    deleteTweetAlert: string;
    modalTitle: {
      nameChanges: string;
      pumpCount: string;
      deletedTweets: string;
      boopCount: string;
      believeCount: string;
    };
    followedKOL: string;
  };
  en: {
    nameChanges: string;
    pumpCount: string;
    deletedTweets: string;
    boopCount: string;
    believeCount: string;
    loadingFailed: string;
    activatePlugin: string;
    clickToQuery: string;
    collectTweet: string;
    deleteTweetAlert: string;
    modalTitle: {
      nameChanges: string;
      pumpCount: string;
      deletedTweets: string;
      boopCount: string;
      believeCount: string;
    };
    followedKOL: string;
  };
}

