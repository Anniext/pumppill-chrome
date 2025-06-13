// 定义接口
export interface UserStats {
  fetchError: boolean;
  title: string;
  nameChanges: number;
  pumpCount: number;
  odinCount: number;
  fourCount: number;
  deletedTweets: number;
  deleted_odin_tweet_count: number;
  deleted_four_tweet_count: number;
  followed_kol_count: number;
  boop_count: number;
  believeCount: number;
  followed_kols: KOLInfo[];
}

export interface KOLInfo {
  screen_name: string;
  name: string;
  title?: string;
  profile_image_url_https: string;
}

export interface ApiResponse {
  code: number;
  data: any;
}

export interface NotificationData {
  screen_name: string;
  tweet_id: string;
  alert_count: number;
}

export interface NotificationLocale {
  deleteAlert: string;
  userDeletedTweet: string;
  viewDetails: string;
  ignore: string;
}

export interface NotificationLocales {
  zh: NotificationLocale;
  en: NotificationLocale;
}

export interface BackendMessageInf {
  action: string;
  username: string;
  userId: string;
  data?: Map<string, any>;
}
