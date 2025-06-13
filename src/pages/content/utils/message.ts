// 修改 getMessage 函数
import type { Locales } from "@/pages/content/type";
import { contentLocales } from "@/pages/content/data";

export async function getMessage(
	key: string,
	substitutions?: string[] | string | Record<string, string>
): Promise<string> {
	return new Promise((resolve) => {
		chrome.storage.sync.get({ language: "zh" }, function (items: { language: string }) {
			const currentLang = items.language as keyof Locales;
			const langObj = contentLocales[currentLang];
			let message = (langObj && (langObj as any)[key]) || key;

			if (substitutions) {
				if (Array.isArray(substitutions)) {
					substitutions.forEach((value, index) => {
						message = message.replace(`{${index}}`, value);
					});
				} else if (typeof substitutions === "object") {
					Object.entries(substitutions).forEach(([key, value]) => {
						message = message.replace(`{${key}}`, value);
					});
				} else {
					message = message.replace("{count}", substitutions);
				}
			}

			resolve(message);
		});
	});
}
