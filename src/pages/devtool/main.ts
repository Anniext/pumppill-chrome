/** 创建panel入口 */
chrome.devtools.panels.create(
	"自定义devtool",
	"images/icons/icon-16.png",
	"src/pages/devtool-panel/index.html",
	() => {
		console.log("打开了自定义devtool");
	}
);

/** 给elements开发工具添加侧边栏 */
chrome.devtools.panels.elements.createSidebarPane("自定义DOM侧边栏", function (sidebar) {
	sidebar.setObject({ name: "巴拉巴拉" });
});
