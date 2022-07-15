/* eslint-env browser, webextensions */

async function updateIcon() {
	const tabs = await browser.tabs.query({active: true, currentWindow: true});
	if (tabs[0]) {
		const currentTab = tabs[0];
		console.log("current tab:", currentTab);
		let enabled = false;
		try {
			const origin = new URL(currentTab.url).origin;
			const storedInfo = await browser.storage.local.get(origin);
			enabled = Boolean(storedInfo[origin]);
			console.log("origin", origin, enabled ? "enabled" : "disabled");
		} catch (error) {
			console.log("page", currentTab.url, "disabled because:", error);
		}

		await browser.action.setIcon({
			path: enabled ? {
				38: "../icon-38x38.png"
			} : {
				38: "../icon-inactive-38x38.png",
			},
			tabId: currentTab.id,
		});
	}
}

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateIcon);

// listen to tab switching
browser.tabs.onActivated.addListener(updateIcon);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateIcon);

// listen for storage changes
browser.storage.onChanged.addListener(updateIcon);

// update when the extension loads initially
updateIcon();