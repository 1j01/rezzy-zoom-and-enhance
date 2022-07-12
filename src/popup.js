/* eslint-env browser, webextensions */
/* global io */

const toggle_site_button = document.getElementById("toggle-this-site");

const socket = io("http://localhost:4284", {transports: ["websocket"]});

socket.on("disconnect", ()=> { document.body.classList.remove("connected"); });
socket.on("connect", ()=> { document.body.classList.add("connected"); });

const get_origin = async ()=> {
	const tabs = await browser.tabs.query({active: true, currentWindow: true});
	return new URL(tabs[0].url).origin;
}

const update_enabled_state = (enabled)=> {
	document.body.classList.toggle("off", !enabled);
	toggle_site_button.title = enabled ?
		"Click to disable Rezzy for this site." :
		"Click to enable Rezzy for this site.";
};

(async function() {
	const origin = await get_origin();
	const storedInfo = await browser.storage.local.get(origin);
	const enabled = storedInfo[origin];
	console.log("origin", origin, "enabled?", enabled);
	update_enabled_state(enabled);
})();

toggle_site_button.addEventListener("click", async ()=> {
	const was_enabled = !document.body.classList.contains("off");
	update_enabled_state(!was_enabled);
	const origin = await get_origin();
	await browser.storage.local.set({[origin]: !was_enabled});
});
