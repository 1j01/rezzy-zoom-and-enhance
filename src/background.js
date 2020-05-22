/* global browser */

function updateIcon() {
	browser.tabs.query({active: true, currentWindow: true})
	.then((tabs)=> {
		if (tabs[0]) {
			const currentTab = tabs[0];
			const origin = new URL(currentTab.url).origin;
			browser.storage.local.get(origin).then((storedInfo)=> {
				const enabled = storedInfo[origin];
				console.log("origin", origin, "enabled?", enabled);
				browser.browserAction.setIcon({
					path: enabled ? {
						38: "../icon-38x38.png"
					} : {
						38: "../icon-inactive-38x38.png",
					},
					tabId: currentTab.id,
				});
			});
		}
	});
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