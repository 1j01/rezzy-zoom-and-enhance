const fs = require('fs');
const Server = require('socket.io');
const superrez = require('./superrez');

const port = 4284;
const io = new Server(port);

// using a Map instead of a plain object just because I don't want the page to be able to overwrite "prototype" and stuff like that
let jobs_by_url = new Map();

io.on("connection", (socket)=> {
	socket.on("jobs", (client_wanted_jobs)=> {
		for (const client_wanted_job of client_wanted_jobs) {
			const job = jobs_by_url.get(client_wanted_job.url);
			if (!job || !job.wanted_by_sockets.has(socket)) {
				add_job({
					url: job.url,
					scaling_factor: job.scaling_factor,
					callback: (output_file_path)=> {
						fs.readFile(output_file_path, (error, data)=> {
							if (error) {
								console.error(error);
								return;
							}
							const result_array_buffer = data.buffer;
							socket.emit("superrez-result", {
								url: job.url,
								scaling_factor: job.scaling_factor,
								result_array_buffer,
							});
						});
					},
				});
			}
		}
		for (const [url, job] of jobs_by_url.entries()) {
			let wanted_by_this_client = false;
			for (const client_wanted_job of client_wanted_jobs) {
				if (client_wanted_job.url === url) {
					wanted_by_this_client = true;
				}
			}
			if (wanted_by_this_client) {
				job.wanted_by_sockets.add(socket);
			} else {
				job.wanted_by_sockets.delete(socket);
				cancel_unwanted_jobs();
			}
		}
	});
	socket.on("disconnect", ()=> {
		for (const job of jobs_by_url.values()) {
			job.wanted_by_sockets.delete(socket);
		}
		cancel_unwanted_jobs();
	});
});

function cancel_unwanted_jobs() {
	for (const [url, job] of jobs_by_url.entries()) {
		if (job.wanted_by_sockets.size === 0) {
			console.log("Job no longer wanted by any active clients: ", url);
			jobs_by_url.delete(url);
		}
	}
}

const add_job = ({url, callback, from_spider=false})=> {
	const job = jobs_by_url.get(url) || {
		url,
		wanted_by_sockets: new Set(),
		scaling_factor: 2,
		callbacks: [],
		from_spider,
		started: false,
		output_file_path: null,
	};
	if (callback) {
		if (job.output_file_path) {
			callback(job.output_file_path, job.scaling_factor);
		} else {
			job.callbacks.push(callback);
		}
	}
	jobs_by_url.set(url, job);
};

// JOB LOOP
// ========

function get_sorted_jobs() {
	let jobs = [...jobs_by_url.values()];
	jobs.sort((a, b)=> b.priority - a.priority);
	return jobs;
}

function get_next_job() {
	return get_sorted_jobs().filter((job)=> !job.started)[0];
}

async function run_jobs() {
	// TODO: try parallelizing jobs in a limited way?
	// It seems to already use a lot of processing power tho, so maybe it's not a good idea.
	// I mean maybe it's even parallelizing itself, with the tiles of the image, idk!

	// eslint-disable-next-line no-constant-condition
	while (true) {
		const job = get_next_job();
		if (!job) {
			await new Promise((resolve)=> { setTimeout(resolve, 100); });
			continue;
		}
		job.started = true;
		console.log("next job:", job);
		try {
			const head_response = await fetch(job.url, {method: "HEAD"});
			const content_length = head_response.headers.get("content-length");
			// TODO: content-length is not necessarily given; handle that?
			// e.g. on http://www.aibq.com/
			if (content_length > 20 * 20) { // very small
				console.log(`original image ${job.url} (content-length: ${content_length})`);
				await new Promise((resolve, reject)=> {
					superrez(job.url, (err, output_file_path)=> {
						if (err) {
							console.error("failed to superrez, got:", err);
							reject(err);
							return;
						}
						job.output_file_path = output_file_path;
						job.callbacks.forEach((callback)=> {
							callback(job.output_file_path, job.scaling_factor);
						});
						resolve();
					});
				});
				// job.result = superrez_image_url(job.url);
				// job.callbacks.forEach((applyResultToPage)=> {
				// 	applyResultToPage(job.result, job.scaling_factor);
				// });
				// console.log(`enhancing image ${job.url} (content-length: ${content_length}) by replacing with ${job.result}`);
			} else {
				console.log(`ignoring image ${job.url} (content-length: ${content_length})`);
			}
		} catch(error) {
			console.error("Failed to superrez image", job.url, "because:", error, job);
		}
	}
}

run_jobs().catch((error)=> {
	console.error(`\n\nSuperrez job loop crashed\n\n${error.stack}\n\n`);
});

console.log('Magic happens on port ' + port);

