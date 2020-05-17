const Server = require('./socket-io');
const superrez = require('./superrez');

const port = 4284;
const io = new Server(port);

io.on("job", ()=> {
	
})

// JOB LOOP or whatever
// ==============
let jobs_by_url = new Map();

const addJob = ({url, callback, from_spider=false})=> {
	const job = jobs_by_url.get(url) || {
		url,
		scaling_factor: 2,
		// elements: [],
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
	// job.elements = job.elements.concat(elements);
};

function filter_and_sort_jobs() {
	let jobs = [...jobs_by_url.values()];
	// jobs = jobs.filter((job)=> job.elements.some(isVisible) || job.from_spider);
	jobs.sort((a, b)=> b.priority - a.priority);
	return jobs;
}

function get_next_job() {
	return filter_and_sort_jobs().filter((job)=> !job.started)[0];
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

// ROUTES FOR OUR API
// =============================================================================
const router = express.Router();

// test route to make sure everything is working (accessed at GET http://localhost:4284/api)
router.get('/', function(req, res) {
	res.json({ message: 'hooray! welcome to our api!' });
});

router.get('/superrez', function(req, res) {
	const url = req.query.url;
	console.log("/superrez an image:", url);
	addJob({
		url,
		callback: (output_file_path)=> {
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.sendFile(output_file_path);
		},
	})
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /api
app.use('/api', router);

// nice to have something at the root (accessed at GET http://localhost:4284/)
app.get('/', function(req, res) {
	res.json({ message: 'API is at /api' });
});

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);

