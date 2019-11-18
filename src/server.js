const express = require('express');
const bodyParser = require('body-parser');
const superrez = require('./superrez');

const port = 4284;

const app = express();

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// JOB LOOP or whatever
// ==============

let jobs_by_url = new Map();

const addJob = ({url, elements, applyResultToPage, from_spider=false})=> {
	const job = jobs_by_url.get(url) || {
		url,
		scaling_factor: 2,
		elements: [],
		callbacks: [],
		from_spider,
		started: false,
		result: null,
	};
	if (applyResultToPage) {
		if (job.result) {
			applyResultToPage(job.result, job.scaling_factor);
		} else {
			job.callbacks.push(applyResultToPage);
		}
	}
	jobs_by_url.set(url, job);
	job.elements = job.elements.concat(elements);
};

function filter_and_sort_jobs() {
		
	// TODO: combine area and isVisible to look for most visible pixels
	// clamp bounding client rect to viewport and get area of that
	const area = (element)=> element.offsetWidth * element.offsetHeight;
	const isVisible = (element)=> {
		if (!element.parentElement) return false;
		if (element.offsetWidth === 0 || element.offsetHeight === 0) return false;
		const style = getComputedStyle(element);
		if (style.display === "none" || style.visibility === "hidden") return false;
		return true;
	};
	const isPartiallyInView = (element)=> {
		const bounds = element.getBoundingClientRect();
		return (
			bounds.top <= window.innerHeight &&
			bounds.left <= window.innerWidth &&
			bounds.bottom >= 0 &&
			bounds.right >= 0
		);
	};

	let jobs = [...jobs_by_url.values()];
	jobs = jobs.filter((job)=> job.elements.some(isVisible) || job.from_spider);
	jobs.sort((a, b)=> {
		// very WET...
		const a_is_in_view = a.elements.some(isPartiallyInView);
		const b_is_in_view = b.elements.some(isPartiallyInView);
		if (a_is_in_view && !b_is_in_view) return -1;
		if (b_is_in_view && !a_is_in_view) return +1;
		const a_max_area = Math.max(0, ...a.elements.map(area));
		const b_max_area = Math.max(0, ...b.elements.map(area));
		const a_is_large = a_max_area > 150000;
		const b_is_large = b_max_area > 150000;
		const a_is_img = a_is_large && a.elements[0] && a.elements[0].nodeName === "IMG";
		const b_is_img = b_is_large && b.elements[0] && b.elements[0].nodeName === "IMG";
		const a_is_main_content = a_is_large && a_is_img;
		const b_is_main_content = b_is_large && b_is_img;
		if (a_is_main_content && !b_is_main_content) return -1;
		if (b_is_main_content && !a_is_main_content) return +1;
		if (a_max_area > b_max_area) return -1;
		if (b_max_area > a_max_area) return +1;
		return 0;
	});
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
				// console.log(`loading image ${job.url} (content-length: ${content_length})`);
				// superrez_image_url(job.url, (err, superrezzed_blob_url)=> {
				// 	if (err) {
				// 		return reject(err);
				// 	}
				// 	job.result = superrezzed_blob_url;
				// 	job.callbacks.forEach((applyResultToPage)=> {
				// 		applyResultToPage(job.result, job.scaling_factor);
				// 	});
				// });
				job.result = superrez_image_url(job.url);
				job.callbacks.forEach((applyResultToPage)=> {
					applyResultToPage(job.result, job.scaling_factor);
				});
				console.log(`enhancing image ${job.url} (content-length: ${content_length}) by replacing with ${job.result}`);
			} else {
				console.log(`ignoring image ${job.url} (content-length: ${content_length})`);
			}
		} catch(error) {
			console.error("Failed to superrez image", job.url, "because:", error, job);
		}
	}
}

run_jobs().catch((error)=> {
	console.error(`Superrez job loop crashed\n\n${error}`);
	alert(`Superrez job loop crashed\n\n${error}`);
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
	superrez(url, (err, output_file_path)=> {
		if (err) {
			console.error("failed to superrez, got:", err);
			res.json({ message: `Failed to superrez ${url}, got: ${err}` });
			return;
		}
		res.sendFile(output_file_path);
	});
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

