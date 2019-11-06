(()=> {

	// const is_dev = require("electron-is-dev");
	const fs = require("fs");
	const {execFile} = require("child_process");
	const path = require("path");
	// const argv = require("electron").remote.process.argv;

	const temp_dir = require('electron').remote.app.getPath("temp");
	// const cacheDir = require('electron').remote.app.getPath("cache"); // TODO: is this a good dir to use?
	const cache_dir = require("path").join(require('electron').remote.app.getPath("appData"), "superrez-cache");
	const converter_path = "C:\\Users\\Isaiah\\Downloads\\waifu2x-DeadSix27-win64_v531\\waifu2x-converter-cpp.exe"; // TODO

	function superrez_image(input_image, callback) {
		// TODO: cache images
		const id = crypto.randomBytes(10).toString('hex');
		const input_image_path = require("path").join(temp_dir, `${id}-normal-rez.png`);
		const output_image_path = require("path").join(cache_dir, `${id}-superrez.png`);

		write_image_to_file(input_image, input_image_path, (err)=> {
			if(err){
				return callback(err);
			}
			superrez_file(input_image_path, output_image_path, (err)=> {
				if(err){
					return callback(err);
				}
				read_image_from_file(output_image_path, (err, output_image)=> {
					if(err){
						return callback(err);
					}
					callback(null, output_image);
				});
			})
		});
	}

	function superrez_file(input_image_path, output_image_path, callback) {
		// TODO: do paths need quotes?
		execFile(converter_path, ["--input", input_image_path, "--output", output_image_path]);
	}

	function read_image_from_file(file_path, callback) {
		read_file(file_path, (err, blob)=> {
			if(err){
				return callback(err);
			}
			const img = new Image();
			img.onload = ()=> {
				if (!img.complete || typeof img.naturalWidth == "undefined" || img.naturalWidth === 0) {
					return callback(new Error(`Image failed to load; naturalWidth == ${img.naturalWidth}`));
				}
				callback(null, img);
			};
			img.onerror = e => {
				callback(new Error("Image failed to load"));
			};
			img.src = window.URL.createObjectURL(blob);
		});
	};

	function write_image_to_file(image, file_path, callback) {
		const canvas = image_to_canvas(image);
		write_canvas_to_file(canvas, file_path, callback);
	};

	function image_to_canvas(image) {
		const canvas = document.createElement("canvas");
		canvas.width = image.width; // TODO: naturalWidth?
		canvas.height = image.height; // TODO: naturalHeight?
		const ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0);
		return canvas;
	};

	function write_canvas_to_file(canvas, file_path, callback) {
		const mime_type = "image/png";
		canvas.toBlob(blob => {
			if(blob.type !== mime_type){
				return callback(new Error(`Failed to save image as ${mime_type} (got "${blob.type}" instead)`));
			}
			blob_to_buffer(blob, (err, buffer) => {
				if(err){
					return callback(err);
				}
				fs.writeFile(file_path, buffer, err => {
					if(err){
						return callback(err);
					}
					callback();
				});
			});
		}, mime_type);
	};

	function read_file(file_path, callback) {
		fs.readFile(file_path, (err, buffer) => {
			if(err){
				return callback(err);
			}
			const file = new File([new Uint8Array(buffer)], path.basename(file_path));
			// can't set file.path directly, but we can do this:
			// Object.defineProperty(file, 'path', {
			// 	value: file_path,
			// });
			// we don't want that tho, for security (don't expose username etc.)
			// or at least it probably doesn't matter in this case

			callback(null, file);
		});
	};

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

	module.exports = superrez_image;

})();
