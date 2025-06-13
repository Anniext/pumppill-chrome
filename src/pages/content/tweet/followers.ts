import type { UserInfo } from "@/pages/content/type";
import { getMessage } from "@/pages/content/utils/message";
import type { UserStats } from "@/background/type";
export async function insertKOLFollowers(userInfo: UserInfo, stats: UserStats): Promise<void> {
  const settings = await chrome.storage.sync.get({
    enableKOLFollowers: true
  });
  if (!settings.enableKOLFollowers) return;

  const timelineNav = document.querySelector('nav[aria-live="polite"]');
  if (!timelineNav) return;

  const existingKolBox = document.querySelector(".twitter-kol-followers-box");
  if (existingKolBox) {
    existingKolBox.remove();
  }

  const kolBox = document.createElement("div");
  kolBox.className = "twitter-kol-followers-box";
  kolBox.setAttribute("data-username", userInfo.username);
  kolBox.setAttribute("data-user-id", userInfo.userId || "");

  const colorScheme = getComputedStyle(document.documentElement)
    .getPropertyValue("color-scheme")
    .trim();

  const themeStyles = {
    light: {
      color: "#536471",
      borderColor: "#EFF3F4",
      itemBg: "rgba(0, 0, 0, 0.05)",
      itemHoverBg: "rgba(0, 0, 0, 0.1)"
    },
    dark: {
      color: "#E7E9EA",
      borderColor: "#2F3336",
      itemBg: "rgba(255, 255, 255, 0.1)",
      itemHoverBg: "rgba(255, 255, 255, 0.2)"
    },
    dim: {
      color: "#F7F9F9",
      borderColor: "#38444D",
      itemBg: "rgba(255, 255, 255, 0.08)",
      itemHoverBg: "rgba(255, 255, 255, 0.15)"
    }
  };
  const currentTheme = themeStyles[colorScheme as keyof typeof themeStyles] || themeStyles.dark;

  const style = document.createElement("style");
  style.textContent = `
    .twitter-kol-followers-box {
      padding: 4px 16px;
      margin-top: 4px;
      border-bottom: 1px solid ${currentTheme.borderColor};
      color: ${currentTheme.color};
      font-size: 15px;
      line-height: 20px;
    }
    .kol-followers-container {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .kol-followers-title {
      white-space: nowrap;
      margin-bottom: 4px;
      color: ${currentTheme.color};
    }
    .kol-followers-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .kol-follower-item {
      display: flex;
      align-items: center;
      background: ${currentTheme.itemBg};
      padding: 4px 8px;
      border-radius: 16px;
      cursor: pointer;
      transition: background-color 0.2s;
      color: ${currentTheme.color};
    }
    .kol-follower-item:hover {
      background: ${currentTheme.itemHoverBg};
    }
    .kol-follower-avatar {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      margin-right: 4px;
    }
    .kol-follower-name {
      font-size: 13px;
      color: ${currentTheme.color};
    }
  `;
  document.head.appendChild(style);

  kolBox.innerHTML = `
    <div class="kol-followers-title">
      ${await getMessage("followedKOL", [stats.followed_kol_count?.toString() || "0"])}
    </div>
    <div class="kol-followers-list">
      ${"Error"
    //stats.followed_kols
    //	?.map(
    //		(kol) => `
    //      <div class="kol-follower-item" data-screen-name="${kol.screen_name}">
    //        <img class="kol-follower-avatar" src="${kol.profile_image_url_https}" alt="${kol.name}">
    //        <span class="kol-follower-name">${kol.title || kol.name}</span>
    //      </div>
    //    `).join("") || ""
    }
    </div>
  `;

  const existingKolBox2 = document.querySelector(".twitter-kol-followers-box");
  if (existingKolBox2) {
    existingKolBox2.remove();
  }

  timelineNav.parentNode?.insertBefore(kolBox, timelineNav);

  const followerItems = kolBox.querySelectorAll(".kol-follower-item");
  followerItems.forEach((item) => {
    item.addEventListener("click", () => {
      const screenName = item.getAttribute("data-screen-name");
      if (screenName) {
        window.location.href = `https://x.com/${screenName}`;
      }
    });
  });
}

