const browser = window.browser; // WebExtensions API, polyfilled by browser-polyfill.js

const toggle_site_button = document.getElementById("toggle-this-site");

const get_origin = ()=>
	browser.tabs.query({ active: true, currentWindow: true })
	.then(
		(tabs)=> new URL(tabs[0].url).origin,
		(error)=> { console.error(error); }
	);

const update_enabled_state = (enabled)=> {
	document.body.classList.toggle("off", !enabled);
	toggle_site_button.title = enabled ?
		"Click to disable Rezzy for this site." :
		"Click to enable Rezzy for this site.";
	get_origin().then((origin)=> {
		browser.storage.local.set({[origin]: enabled});
	});
};

get_origin().then((origin)=> {
	browser.storage.local.get(origin).then((storedInfo)=> {
		// console.log("storedInfo:", storedInfo);
		const enabled = storedInfo[origin];
		console.log("origin", origin, "enabled?", enabled);
		update_enabled_state(enabled);
	});
});

toggle_site_button.addEventListener("click", ()=> {
	const was_enabled = !document.body.classList.contains("off");
	update_enabled_state(!was_enabled);
});
