/* global browser */

var currentTab;
var currentBookmark;

/*
 * Updates the browser action icon to reflect whether the extension is active on the page.
 */
function updateIcon(active) {
	browser.browserAction.setIcon({
		path: active ? {
			38: "../icon-38x38.png"
		} : {
			38: "../icon-inactive-38x38.png",
		},
		tabId: currentTab.id
	});
	// browser.browserAction.setTitle({
	// 	// Screen readers can see the title
	// 	title: currentBookmark ? 'Unbookmark it!' : 'Bookmark it!',
	// 	tabId: currentTab.id
	// });
}

/*
 * Switches currentTab and currentBookmark to reflect the currently active tab
 */
function updateActiveTab(tabs) {
	function updateTab(tabs) {
		if (tabs[0]) {
			currentTab = tabs[0];
			const origin = new URL(currentTab.url).origin;
			browser.storage.local.get(origin).then((storedInfo)=> {
				// console.log("storedInfo:", storedInfo);
				const enabled = storedInfo[origin];
				console.log("origin", origin, "enabled?", enabled);
				updateIcon(enabled);
			});
		}
	}

	var gettingActiveTab = browser.tabs.query({active: true, currentWindow: true});
	gettingActiveTab.then(updateTab);
}

// listen to tab URL changes
browser.tabs.onUpdated.addListener(updateActiveTab);

// listen to tab switching
browser.tabs.onActivated.addListener(updateActiveTab);

// listen for window switching
browser.windows.onFocusChanged.addListener(updateActiveTab);

// listen for storage changes
browser.storage.onChanged.addListener((changes)=> {
	// if (current_tab_origin in changes) {
		
	// }
	updateActiveTab();
});

// update when the extension loads initially
updateActiveTab();