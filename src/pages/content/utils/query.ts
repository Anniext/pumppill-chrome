import type { UserInfo } from "@/pages/content/type";
import { getUserStats } from "@/pages/content/tweet/user";
import { addStatsClickHandlers } from "@/pages/content/dom/stats_click";
import { getMessage } from "@/pages/content/utils/message";
import { setHasDisplayedStats } from "@/pages/content/data";
import type { UserStats } from "@/background/type";

export async function ToQuery(
  headerElement: HTMLElement,
  userInfo: UserInfo
): Promise<UserStats | undefined> {
  try {
    const stats = await getUserStats(userInfo);
    const currentBox = headerElement.querySelector(".twitter-analytics-box") as HTMLElement | null;
    if (
      currentBox &&
      currentBox.getAttribute("data-username") === userInfo.username &&
      currentBox.getAttribute("data-user-id") === userInfo.userId
    ) {
      if (!stats || stats.fetchError) {
        console.log("stats", stats);
        console.log("stats.fetchError", stats.fetchError);
        currentBox.innerHTML = `
          <span class="analytics-item">${await getMessage("loadingFailed")}</span>
        `;
        setHasDisplayedStats(true);
      } else {
        const nameChanges = await getMessage("nameChanges", [stats.nameChanges.toString()]);
        const deletedTweets = await getMessage("deletedTweets", [stats.deletedTweets.toString()]);

        currentBox.innerHTML = `
          <div class='twitter-analytics-box' style='display: flex;'>
            <button class='analytics-item' style='display: flex; padding-top: 0.25rem;padding-bottom: 0.25rem; padding-left: 0.5rem;padding-right: 0.5rem; margin: 0.5rem; border-radius: 9999px; border-width: 2px; border-color: #000000; background-color: #ffffff;'>
              <span style='margin-left: 0.25rem; margin-right: 0.25rem; color: black; width:20px;'>
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' class='size-6'>
                  <path fill='#000000' d='m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z' />
                </svg>
              </span>
              <span id='spanNameChanges' style='margin-left: 0.25rem; margin-right: 0.25rem; width: 20px;color: black;'>
                ${stats.nameChanges}
              </span>
            </button>
            <button class='analytics-item' style='display: flex; padding-top: 0.25rem;padding-bottom: 0.25rem; padding-left: 0.5rem;padding-right: 0.5rem; margin: 0.5rem; border-radius: 9999px; border-width: 2px; border-color: #000000; background-color: #ffffff; '>
              <span style='margin-left: 0.25rem; margin-right: 0.25rem; color: black; width:20px;'>
                <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='currentColor' class='size-6'>
                  <path fill-rule='evenodd' d='M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 0 1 .75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 0 1 9.75 22.5a.75.75 0 0 1-.75-.75v-4.131A15.838 15.838 0 0 1 6.382 15H2.25a.75.75 0 0 1-.75-.75 6.75 6.75 0 0 1 7.815-6.666ZM15 6.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5Z' clip-rule='evenodd' />
                  <path fill='#000000' d='M5.26 17.242a.75.75 0 1 0-.897-1.203 5.243 5.243 0 0 0-2.05 5.022.75.75 0 0 0 .625.627 5.243 5.243 0 0 0 5.022-2.051.75.75 0 1 0-1.202-.897 3.744 3.744 0 0 1-3.008 1.51c0-1.23.592-2.323 1.51-3.008Z' />
                </svg>
              </span>
              <span id='spanPumpCount' style='margin-left: 0.25rem; margin-right: 0.25rem; width: 20px;color: black;'>
                ${stats.pumpCount}
              </span>
            </button>
          </div>
        `;
        addStatsClickHandlers(currentBox, userInfo);
        setHasDisplayedStats(true);
        return stats;
      }
    }
  } catch (error) {
    console.error("getUserStats err:", error);
    const currentBox = headerElement.querySelector(".twitter-analytics-box") as HTMLElement | null;
    if (
      currentBox &&
      currentBox.getAttribute("data-username") === userInfo.username &&
      currentBox.getAttribute("data-user-id") === userInfo.userId
    ) {
      currentBox.innerHTML = `
        <span class="analytics-item">${await getMessage("loadingFailed")}</span>
      `;
    }
  }
}


