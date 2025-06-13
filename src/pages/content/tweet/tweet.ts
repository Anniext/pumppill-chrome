// 修改 postTweet 函数
export async function postTweet(username: string, userId: string, tweet: string): Promise<void> {
	await chrome.runtime.sendMessage({
		action: "postTweet",
		username,
		userId,
		tweet
	});
}

export async function deleteTweetAlert(username: string, userId: string): Promise<void> {
	await chrome.runtime.sendMessage({
		action: "deleteTweetAlert",
		username,
		userId
	});
}
