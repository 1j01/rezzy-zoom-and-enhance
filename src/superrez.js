(()=> {

	const fs = require("fs");
	const {execFile} = require("child_process");
	const path = require("path");
	const crypto = require("crypto");
	const sanitizeFilename = require("sanitize-filename");

	const temp_dir = require('electron').remote.app.getPath("temp");
	// const cacheDir = require('electron').remote.app.getPath("cache"); // TODO: is this a good dir to use?
	const cache_dir = require("path").join(require('electron').remote.app.getPath("appData"), "superrez-cache");
	fs.mkdirSync(cache_dir, { recursive: true });

	const converter_path = "./waifu2x-DeadSix27-win64_v531/waifu2x-converter-cpp.exe";

	function superrez_image(input_image, callback) {
		const input_image_url = input_image.src;
		// Hash src so that differences in only sanitized-away characters still are counted.
		const src_digest = crypto.createHash('md5').update(input_image_url).digest('hex');
		// TODO: Do we need to truncate this further if adding text to the filename?
		// Could simplify and just use the hash as ID.
		const id = sanitizeFilename(`${src_digest}-${input_image.src}`);
		const input_image_path = require("path").join(temp_dir, `${id}-normal-rez.png`);
		const output_image_path = require("path").join(cache_dir, `${id}-superrez.png`);

		// try cache first
		read_image_from_file(output_image_path, (err, output_image)=> {
			if(err){
				console.log("superrez cache miss; do the conversion");
				console.log("temp file path:", input_image_path);

				write_image_to_file(input_image.src, input_image_path, (err)=> {
					if(err){
						return callback(err);
					}
					superrez_file(input_image_path, output_image_path, (err)=> {
						if(err){
							return callback(err);
						}
						console.log("output file path:", input_image_path);
						read_image_from_file(output_image_path, (err, output_image)=> {
							if(err){
								return callback(err);
							}
							callback(null, output_image);
						});
					})
				});
				return;
			}
			console.log("superrez cache hit - reusing", output_image_path);
			callback(null, output_image);
		});
	}

	function superrez_file(input_image_path, output_image_path, callback) {
		// TODO: do paths need quotes?
		execFile(
			converter_path,
			["--input", input_image_path, "--output", output_image_path],
			{cwd: require("path").dirname(converter_path)},
			(err, stdout, stderr) => {
				if(err){
					return callback(err);
				}
				console.log("waifu2x-converter-cpp stdout:\n\n", stdout);
				if (stderr.length > 1) {
					return callback(new Error(`Recieved error output: ${stderr}`));
				}
				if (stdout.match(/cv::imwrite.*failed/)) {
					return callback(new Error(`waifu2x-converter-cpp failed to write image. See console for output.`));
				}
				callback();
			}
		);
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
			img.onerror = ()=> {
				callback(new Error("Image failed to load"));
			};
			img.src = window.URL.createObjectURL(blob);
		});
	}

	function write_image_to_file(image_src, file_path, callback) {
		const cors_image = new Image();
		cors_image.crossOrigin = "anonymous";
		cors_image.onload = ()=> {
			if (!cors_image.complete || typeof cors_image.naturalWidth == "undefined" || cors_image.naturalWidth === 0) {
				return callback(new Error(`Image failed to load; naturalWidth == ${cors_image.naturalWidth}`));
			}
			const canvas = image_to_canvas(cors_image);
			write_canvas_to_file(canvas, file_path, callback);
		};
		cors_image.onerror = ()=> {
			callback(new Error("Image failed to load"));
		};
		cors_image.src = image_src;
		const canvas = image_to_canvas(cors_image);
		write_canvas_to_file(canvas, file_path, callback);
	}

	function image_to_canvas(image) {
		const canvas = document.createElement("canvas");
		canvas.width = image.width; // TODO: naturalWidth?
		canvas.height = image.height; // TODO: naturalHeight?
		const ctx = canvas.getContext("2d");
		ctx.drawImage(image, 0, 0);
		return canvas;
	}

	function write_canvas_to_file(canvas, file_path, callback) {
		const mime_type = "image/png";
		try {
			canvas.toBlob(blob => {
				if(!blob){
					return callback(new Error(`Failed to save image as ${mime_type} (got ${blob} instead of a Blob)`));
				}
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
		} catch(error) {
			callback(error);
		}
	}

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
	}

	function blob_to_buffer(blob, callback) {
		const file_reader = new FileReader();

		file_reader.addEventListener("loadend", ()=> {
			if (file_reader.error) {
				callback(file_reader.error);
			} else {
				callback(null, Buffer.from(file_reader.result));
			}
		}, false);

		// Read the blob as a typed array.
		file_reader.readAsArrayBuffer(blob);

		return file_reader;
	}

	module.exports = superrez_image;

})();
