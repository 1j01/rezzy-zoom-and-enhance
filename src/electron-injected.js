// Electron-specific code injected into the renderer process
// to provide integrations, for the desktop app

// TODO: security: don't expose filesystem access to webpages (or anything)

(()=> {

const superrez_image = require("./superrez");

function show_error_message(message, error) {
	alert(`${message}\n\n${error}`);
}

})();
