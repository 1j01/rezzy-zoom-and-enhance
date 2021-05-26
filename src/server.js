const fetch = require('node-fetch');
const express = require('express');
// const bodyParser = require('body-parser');
const Server = require('socket.io');
const superrez = require('./superrez');
const {spiderFromURL} = require("./spider");

const port = 4284;

const app = express();
app.use("/result", express.static(superrez.cache_dir, {
	setHeaders: function setHeaders(res/*, path, stat*/) {
		res.header('Access-Control-Allow-Origin', '*');
		res.header('Access-Control-Allow-Methods', 'GET');
		res.header('Access-Control-Allow-Headers', 'Content-Type');
	},
}));

const io = new Server(app.listen(port));

// using a Map instead of a plain object just because I don't want the page to be able to overwrite "prototype" and stuff like that
let jobs_by_url = new Map();

io.on("connection", (socket)=> {
	// Note: "jobs" event might be received after disconnect, because client may reconnect (right?)
	// (or is it a new "connection"/"socket" on the server when the client reconnects?)
	socket.on("jobs", (client_wanted_jobs)=> {
		// console.log("client_wanted_jobs", client_wanted_jobs);
		for (const client_wanted_job of client_wanted_jobs) {
			if (!jobs_by_url.has(client_wanted_job.url) || !jobs_by_url.get(client_wanted_job.url).wanted_directly_by_sockets.has(socket)) {
				add_job({
					url: client_wanted_job.url,
					scaling_factor: client_wanted_job.scaling_factor,
					wanted_directly_by_socket: socket,
					callback: (output_file_path)=> {
						const path_with_slashes = output_file_path.replace(/\\/g, "/");
						const match_after_path = "/superrez-images/";
						const result_url = `http://localhost:${port}/result/${
							path_with_slashes
							.slice(path_with_slashes.indexOf(match_after_path) + match_after_path.length)
						}`;
						socket.emit("superrez-result", {
							url: client_wanted_job.url,
							scaling_factor: client_wanted_job.scaling_factor,
							result_url,
						});
					},
				});
			}
			if (jobs_by_url.has(client_wanted_job.url)) {
				const job = jobs_by_url.get(client_wanted_job.url);
				job.wanted_directly_by_sockets.set(socket, client_wanted_job.priority);
				const priority_values = [...job.wanted_directly_by_sockets.values(), ...job.wanted_spidered_by_sockets.values()];
				// console.log("priority values:", priority_values, "for", client_wanted_job.url);
				job.priority = Math.max(...priority_values);
			}
		}
		for (const [url, job] of jobs_by_url.entries()) {
			let wanted_by_this_client = false;
			for (const client_wanted_job of client_wanted_jobs) {
				if (client_wanted_job.url === url) {
					wanted_by_this_client = true;
				}
			}
			if (!wanted_by_this_client) {
				job.wanted_directly_by_sockets.delete(socket);
				cancel_unwanted_jobs();
			}
		}
	});
	let stop_spider;
	let started_from_url;
	socket.on("spider-from-url", (starting_url)=> {
		if (started_from_url === starting_url) {
			return;
		}
		stop_spider && stop_spider();
		stop_spider = spiderFromURL(starting_url, {
			backwardPages: 1,
			forwardPages: 20,
			addJob: (url)=> {
				add_job({
					url,
					scaling_factor: 2,
					wanted_spidered_by_socket: socket,
				});
			},
		});
		started_from_url = starting_url;
	});
	socket.on("disconnect", ()=> {
		let formerly_wanted_directly = 0;
		let formerly_wanted_spidered = 0;
		for (const job of jobs_by_url.values()) {
			if (job.wanted_directly_by_sockets.has(socket)) {
				formerly_wanted_directly += 1;
			}
			if (job.wanted_spidered_by_sockets.has(socket)) {
				formerly_wanted_spidered += 1;
			}
			job.wanted_directly_by_sockets.delete(socket);
			job.wanted_spidered_by_sockets.delete(socket);
		}
		console.log("Page disconnected with", formerly_wanted_directly, "jobs requested, and", formerly_wanted_spidered, "jobs from spidering");
		cancel_unwanted_jobs();
		stop_spider && stop_spider();
		stop_spider = null;
	});
});

function cancel_unwanted_jobs() {
	for (const [url, job] of jobs_by_url.entries()) {
		if (job.wanted_directly_by_sockets.size === 0 && job.wanted_spidered_by_sockets.size === 0) {
			if (job.started) {
				if (job.is_current) {
					console.log("Current job no longer wanted by any active pages, will be finished up just for the cache:", url);
				}
			} else {
				console.log("Job no longer wanted by any active pages, will be canceled:", url);
			}
			jobs_by_url.delete(url);
		}
	}
}

const add_job = ({url, callback, wanted_directly_by_socket, wanted_spidered_by_socket, priority=0})=> {
	const job = jobs_by_url.get(url) || {
		url,
		scaling_factor: 2, // can't be changed for now
		// Note: a job could be start out from a spider and then the page is navigated to and it gets a directly-interested socket
		wanted_directly_by_sockets: new Map(), // socket to priority; sockets to send results to when finished, to display on an open page
		wanted_spidered_by_sockets: new Map(), // socket to priority; sockets that led to spidering of a page that has an image; don't need to send to these sockets
		callbacks: [],
		started: false,
		output_file_path: null,
		priority: 0,
	};
	if (wanted_directly_by_socket) {
		job.wanted_directly_by_sockets.set(wanted_directly_by_socket, priority);
	}
	if (wanted_spidered_by_socket) {
		job.wanted_spidered_by_sockets.set(wanted_spidered_by_socket, priority);
	}
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
		job.is_current = true;
		job.started = true;
		console.log(`next job: ${job.url} @ ${job.scaling_factor}x`);
		console.log("priority:", job.priority);
		console.log("wanted directly by:", job.wanted_directly_by_sockets.size);
		console.log("wanted spidered by:", job.wanted_spidered_by_sockets.size);
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
			} else {
				console.log(`ignoring image ${job.url} (content-length: ${content_length})`);
			}
		} catch(error) {
			console.error("Failed to superrez image", job.url, "because:", error, job);
		}
		// https://github.com/eslint/eslint/issues/11899
		// eslint-disable-next-line require-atomic-updates
		job.is_current = false;
	}
}

run_jobs().catch((error)=> {
	console.error(`\n\nSuperrez job loop crashed\n\n${error.stack}\n\n`);
});

console.log("Magic happens on port", port, "✨");

