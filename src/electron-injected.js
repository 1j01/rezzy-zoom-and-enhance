// Electron-specific code injected into the renderer process
// to provide integrations, for the desktop app

(()=> {

// so libraries don't get confused and export to `module` instead of the `window`
global.module = undefined;

const is_dev = require("electron-is-dev");
const fs = require("fs");
const path = require("path");
const argv = require("electron").remote.process.argv;

window.read_file = (file_path, callback) => {
	fs.readFile(file_path, (err, buffer) => {
		if(err){
			return callback(err);
		}
		const file = new File([new Uint8Array(buffer)], path.basename(file_path));
		// can't set file.path directly, but we can do this:
		Object.defineProperty(file, 'path', {
			value: file_path,
		});

		callback(null, file);
	});
};

window.write_canvas_to_file = (file_path, callback) => {
	canvas.toBlob(blob => {
		if(blob.type !== mimeType){
			return show_error_message(`Failed to save as ${mimeType} (got "${blob.type}" instead)`);
		}
		blob_to_buffer(blob, (err, buffer) => {
			if(err){
				return show_error_message("Failed to save! (Technically, failed to convert a Blob to a Buffer.)", err);
			}
			fs.writeFile(file_path, buffer, err => {
				if(err){
					return show_error_message("Failed to save file!", err);
				}
				callback();
			});
		});
	}, mimeType);
};


const tempDir = require('electron').remote.app.getPath("temp");
// const cacheDir = require('electron').remote.app.getPath("cache"); // TODO: is this a good dir to use?
const cacheDir = require("path").join(require('electron').remote.app.getPath("appData"), "superrez-cache");

const imgId = Math.random(); // TODO!
const inputImgPath = require("path").join(tempDir, `${imgId}-normal-rez.png`);
const outputImgPath = require("path").join(cacheDir, `${imgId}-superrez.png`);


function blob_to_buffer(blob, callback) {
	const file_reader = new FileReader()

	file_reader.addEventListener("loadend", event => {
		if (file_reader.error) {
			callback(file_reader.error)
		} else {
			callback(null, new Buffer(file_reader.result))
		}
	}, false)

	// Read the blob as a typed array.
	file_reader.readAsArrayBuffer(blob)

	return file_reader
}

function show_error_message(message, error) {
	alert(`${message}\n\n${error}`);
}

})();
