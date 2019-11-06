// Electron-specific code injected into the renderer process
// to provide integrations, for the desktop app

// TODO: security: don't expose filesystem access to webpages (or anything)

(()=> {

const superrez_image = require("./superrez");

window.superrez_image = superrez_image;
window.superrez_image_in_place = superrez_image_in_place;

function superrez_image_in_place(input_img) {
	superrez_image(input_img, (err, superrezzed_img)=> {
		if (err) {
			return show_error_message("Failed to superrez image", err);
		}
		input_img.parentElement.insertBefore(superrezzed_img, input_img);
		input_img.remove();
	});
}

function show_error_message(message, error) {
	alert(`${message}\n\n${error}`);
}

})();
