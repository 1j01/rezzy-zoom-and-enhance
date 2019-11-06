// Electron-specific code injected into the renderer process
// to provide integrations, for the desktop app

// so libraries don't get confused and export to `module` instead of the `window`
global.module = undefined;

const is_dev = require("electron-is-dev");
const dialog = require("electron").remote.dialog;
const fs = require("fs");
const path = require("path");
const argv = require("electron").remote.process.argv;

window.open_from_file_path = (file_path, callback, canceled) => {
	fs.readFile(file_path, (err, buffer) => {
		if(err){
			return callback(err);
		}
		const file = new File([new Uint8Array(buffer)], path.basename(file_path));
		// can't set file.path directly, but we can do this:
		Object.defineProperty(file, 'path', {
			value: file_path,
		});

		open_from_File(file, callback, canceled);
	});
};

window.save_to_file_path = (filePath, formatName, savedCallback) => {
	const mimeType = {
		"JPEG": "image/jpeg",
		"PNG": "image/png",
		"GIF": "image/gif",
		"WebP": "image/webp",
		// "Monochrome Bitmap": "image/bitmap",
		// "16 Color Bitmap": "image/bitmap",
		// "256 Color Bitmap": "image/bitmap",
		// "24-bit Bitmap": "image/bitmap",
	}[formatName];
	if(!mimeType){
		return show_error_message(`Can't save as ${formatName}. Format is not supported.`);
	}
	// if(mimeType === "image/gif"){
	// 	new GIF();
	// }
	canvas.toBlob(blob => {
		if(blob.type !== mimeType){
			return show_error_message(`Failed to save as ${formatName} (your browser doesn't support exporting a canvas as "${mimeType}")`);
		}
		sanity_check_blob(blob, () => {
			blob_to_buffer(blob, (err, buffer) => {
				if(err){
					return show_error_message("Failed to save! (Technically, failed to convert a Blob to a Buffer.)", err);
				}
				fs.writeFile(filePath, buffer, err => {
					if(err){
						return show_error_message("Failed to save file!", err);
					}
					const fileName = path.basename(filePath);
					savedCallback(filePath, fileName);
				});
			});
		});
	}, mimeType);
};


	const dataPath = require('electron').remote.app.getPath("userData");

	const imgPath = require("path").join(dataPath, "bg.png");
	const fs = require("fs");
	const wallpaper = require("wallpaper");

	// TODO: implement centered option for Windows and Linux in https://www.npmjs.com/package/wallpaper
	// currently it's only supported on macOS
	let wallpaperCanvas;
	if(process.platform === "darwin"){
		wallpaperCanvas = c;
	}else{
		wallpaperCanvas = make_canvas(screen.width, screen.height);
		const x = (screen.width - c.width) / 2;
		const y = (screen.height - c.height) / 2;
		wallpaperCanvas.ctx.drawImage(c, ~~x, ~~y);
	}

	get_array_buffer_from_canvas(wallpaperCanvas).then(array_buffer => {
		const buffer = new Buffer(array_buffer);
		fs.writeFile(imgPath, buffer, err => {
			if(err){
				return show_error_message("Failed to set as desktop background: couldn't write temporary image file.", err);
			}
		});
	});
};

function show_error_message(message, error) {
	alert(`${message}\n\n${error}`);
}
