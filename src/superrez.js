(()=> {

	const fs = require("fs");
	const {execFile} = require("child_process");
	const path = require("path");
	const crypto = require("crypto");
	const sanitizeFilename = require("sanitize-filename");

	const app_data_dir = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share");
	const data_dir_for_this_program = require("path").join(app_data_dir, "rezzy");
	const temp_dir = require("path").join(data_dir_for_this_program, "original-rez-temp");
	const cache_dir = require("path").join(data_dir_for_this_program, "superrez-cache");
	fs.mkdirSync(temp_dir, { recursive: true });
	fs.mkdirSync(cache_dir, { recursive: true });

	const converter_path = require("path").join(__dirname, "../waifu2x-DeadSix27-win64_v531/waifu2x-converter-cpp.exe");

	const scaling_factor = 2;

	function superrez_image_url(input_image_url, callback) {
		const origin = new URL(input_image_url).origin;
		const origin_folder = require("path").join(cache_dir, sanitizeFilename(origin.replace(/:\/\//, "_"), {replacement: "_"}));
		fs.mkdirSync(origin_folder, { recursive: true });
		const id = crypto.createHash('md5').update(input_image_url).digest('hex');
		// TODO: get file extension from mime type returned from server (make HEAD request or move logic later into GET request)
		let extension =
			(input_image_url.match(/\.(jpe?g|jp2|png)$/i) || [])[0] ||
			(input_image_url.match(/\.(jpe?g|jp2|png)/i) || [])[0] ||
			(input_image_url.match(/(jpe?g|jp2|png)/i) || [])[0];
		if (!extension) {
			return callback(new Error(`Unsupported file extension. URL must contain jpeg, jpg, jp2, or png`));
		}
		extension = extension.toLowerCase();
		if (!extension[0] === ".") {
			extension = `.${extension}`;
		}
		if (extension === ".jp2" || extension === ".jpg") {
			extension = ".jpeg";
		}
		const input_image_path = require("path").join(temp_dir, `${id}-original-rez${extension}`);
		const output_image_path = require("path").join(origin_folder, `${id}-superrez-${scaling_factor}x${extension}`);

		// try cache first
		read_file_as_blob_url(output_image_path, (err, output_blob_url)=> {
			if(err && err.code === "ENOENT"){
				console.log("superrez cache miss; do the conversion");
				console.log("temp file path:", input_image_path);

				var write_stream = fs.createWriteStream(input_image_path);
				var errored = false;
				// TODO: detect non-200 status code?
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
		console.log("[waifu2x-converter-cpp] processing", input_image_path);
		execFile(
			converter_path,
			["--input", input_image_path, "--output", output_image_path],
			{cwd: require("path").dirname(converter_path)},
			(err, stdout, stderr) => {
				console.log("[waifu2x-converter-cpp] results for", input_image_path);
				console.log("[waifu2x-converter-cpp] stdout:\n", stdout);
				console.log("[waifu2x-converter-cpp] stderr:\n", stderr);
				if(err){
					return callback(err);
				}
				stderr = stderr.replace("libpng warning: iCCP: known incorrect sRGB profile", "");
				if (stderr.trim().length > 1) {
					return callback(new Error(`Received error output: ${stderr}`));
				}
				if (stdout.match(/cv::imwrite.*failed/)) {
					return callback(new Error(`waifu2x-converter-cpp failed to write image. See console for output.`));
				}
				if (stdout.match(/Unsupported output extension./)) {
					return callback(new Error(`waifu2x-converter-cpp failed to read image. Unsupported output extension. See console for output.`));
				}
				console.log("[waifu2x-converter-cpp] output", output_image_path);
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
		});
	}

	function read_file(file_path, callback) {
		fs.readFile(file_path, (err, buffer) => {
			if(err){
				return callback(err);
			}
			const file = new File([new Uint8Array(buffer)], path.basename(file_path));
			callback(null, file);
		});
	}

	module.exports = superrez_image_url;

})();
