import { EventName, chromeMessage } from "@/utils/chrome-message";

let btnOpenSidePanel = document.getElementById("btnOpenSidePanel") as HTMLButtonElement;
let btnSendMessageToSidePanel = document.getElementById("btnSendMessageToSidePanel") as HTMLButtonElement;
let btnOpen404Page = document.getElementById("btnOpen404Page") as HTMLButtonElement;

btnOpenSidePanel.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length > 0) {
      const tab = tabs[0];
      // 打开侧边栏
      chrome.sidePanel.open({
        tabId: tab.id,
        windowId: tab.windowId
      });
    }
  });
})

btnSendMessageToSidePanel.addEventListener("click", () => {
  chromeMessage.emit(EventName.EXAMPLE_EVENT, "示例消息");
})

btnOpen404Page.addEventListener("click", () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL("src/pages/404/index.html")
  });
})


