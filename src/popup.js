
const toggle_site_button = document.getElementById("toggle-this-site");

toggle_site_button.addEventListener("click", ()=> {
	if (document.body.classList.toggle("off")) {
		toggle_site_button.title = "Click to enable Rezzy for this site.";
	} else {
		toggle_site_button.title = "Click to disable Rezzy for this site.";
	}
});
