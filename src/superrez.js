(()=> {

	const fs = require("fs");
	const {execFile} = require("child_process");
	const path = require("path");
	const crypto = require("crypto");
	const sanitizeFilename = require("sanitize-filename");

	const temp_dir = require('electron').remote.app.getPath("temp");
	// const cacheDir = require('electron').remote.app.getPath("cache"); // TODO: is this a good dir to use?
	const cache_dir = require("path").join(require('electron').remote.app.getPath("appData"), "superrez-cache");
	fs.mkdirSync(temp_dir, { recursive: true });
	fs.mkdirSync(cache_dir, { recursive: true });

	const converter_path = require("path").join(__dirname, "../waifu2x-DeadSix27-win64_v531/waifu2x-converter-cpp.exe");

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
		read_file_as_blob_url(output_image_path, (err, output_blob_url)=> {
			if(err && err.code === "ENOENT"){
				console.log("superrez cache miss; do the conversion");
				console.log("temp file path:", input_image_path);

				var write_stream = fs.createWriteStream(input_image_path);
				var errored = false;
				require("request")
					.get(input_image_url)
					.on('error', (err)=> {
						errored = true
						callback(err);
					})
					.pipe(write_stream);

				write_stream.on("finish", ()=> {
					if(errored){
						console.warn("finish after error?"); // TODO: is it possible?
						return;
					}
					superrez_file(input_image_path, output_image_path, (err)=> {
						if(err){
							return callback(err);
						}
						console.log("output file path:", input_image_path);
						read_file_as_blob_url(output_image_path, (err, output_blob_url)=> {
							if(err){
								return callback(err);
							}
							callback(null, output_blob_url);
						});
					})
				});
				return;
			}
			if (err) {
				return callback(err);
			}
			console.log("superrez cache hit - reusing", output_image_path);
			callback(null, output_blob_url);
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
					return callback(new Error(`Received error output: ${stderr}`));
				}
				if (stdout.match(/cv::imwrite.*failed/)) {
					return callback(new Error(`waifu2x-converter-cpp failed to write image. See console for output.`));
				}
				callback();
			}
		);
	}

	function read_file_as_blob_url(file_path, callback) {
		read_file(file_path, (err, blob)=> {
			if(err){
				return callback(err);
			}
			return callback(null, window.URL.createObjectURL(blob));
			// const img = new Image();
			// img.onload = ()=> {
			// 	if (!img.complete || typeof img.naturalWidth == "undefined" || img.naturalWidth === 0) {
			// 		return callback(new Error(`Image failed to load; naturalWidth == ${img.naturalWidth}`));
			// 	}
			// 	callback(null, img);
			// };
			// img.onerror = ()=> {
			// 	callback(new Error("Image failed to load"));
			// };
			// img.src = window.URL.createObjectURL(blob);
		});
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
