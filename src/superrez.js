/* eslint-env node */
(()=> {

	const fs = require("fs");
	const {execFile} = require("child_process");
	const path = require("path");
	const crypto = require("crypto");
	const request = require("request");
	const envPaths = require("env-paths");
	const sanitizeFilename = require("sanitize-filename");

	const paths = envPaths("Rezzy");

	const temp_dir = path.join(paths.temp, "original-rez-images");
	const cache_dir = path.join(paths.cache, "superrez-images");
	fs.mkdirSync(temp_dir, { recursive: true });
	fs.mkdirSync(cache_dir, { recursive: true });

	const converter_path = path.join(__dirname,
		process.platform === "win32" ? 
		"../waifu2x-DeadSix27-win64_v531/waifu2x-converter-cpp.exe" : 
		"../waifu2x-DeadSix27-linux64_v533/waifu2x-converter-cpp"
	);

	const scaling_factor = 2;

	function superrez(input_image_url, callback) {
		const origin = new URL(input_image_url).origin;
		const origin_folder = path.join(cache_dir, sanitizeFilename(origin.replace(/:\/\//, "_"), {replacement: "_"}));
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
		const input_image_path = path.join(temp_dir, `${id}-original-rez${extension}`);
		const output_image_path = path.join(origin_folder, `${id}-superrez-${scaling_factor}x${extension}`);

		// try cache first
		fs.exists(output_image_path, (exists_in_cache)=> {
			if (exists_in_cache) {
				console.log("superrez cache hit - reusing", output_image_path);
				callback(null, output_image_path);
			} else {
				console.log("superrez cache miss; do the conversion");
				console.log("temp file path:", input_image_path);

				var write_stream = fs.createWriteStream(input_image_path);
				var got_error = false;
				// TODO: detect non-200 status code?
				request
					.get(input_image_url)
					.on('error', (err)=> {
						got_error = true
						callback(err);
					})
					.pipe(write_stream);

				write_stream.on("finish", ()=> {
					if(got_error){
						console.warn("finish after error?"); // TODO: is it possible?
						return;
					}
					superrez_file(input_image_path, output_image_path, (err)=> {
						if(err){
							return callback(err);
						}
						callback(null, output_image_path);
					})
				});
				return;
			}
		});
	}

	function superrez_file(input_image_path, output_image_path, callback) {
		// TODO: do paths need quotes?
		console.log("[waifu2x-converter-cpp] processing", input_image_path);
		execFile(
			converter_path,
			["--input", input_image_path, "--output", output_image_path],
			{cwd: path.dirname(converter_path)},
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

	module.exports = superrez;
	module.exports.cache_dir = cache_dir;

})();
