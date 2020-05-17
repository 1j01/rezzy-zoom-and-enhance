// Code injected into the page

// TODO: make the job loop/queue actually meaningful again and move it into the server

// security: be mindful about what data access the extension gives pages
// - regarding CORS, sites can already request any URL using a proxy like CORS Anywhere 
// - if the extension were to request resources with cookies it could expose private information

(()=> {
	console.log("injected");

	// const {spiderFromURL} = require("./spider");

	const api_base_url = "http://localhost:4284/api";
	
	function post(endpoint, data) {
		const endpoint_url = `${api_base_url}/${endpoint}`;
		fetch(endpoint_url, {
			method: "POST",
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data) // body data type must match "Content-Type" header
		})
	}
	
	let jobs_by_url = new Map();

	function addJob({url, elements, applyResultToPage, from_spider}) {
		const job = jobs_by_url.get(url) || {
			url,
			superrez_url: `${api_base_url}/superrez?url=${encodeURIComponent(url)}`,
			scaling_factor: 2,
			elements: [],
			from_spider,
		};
		jobs_by_url.set(url, job);
		job.elements = job.elements.concat(elements);
		post(`job?url=${encodeURIComponent(url)}`, job);
		applyResultToPage(job.superrez_url, job.scaling_factor);
	}
	// let spider_started = false;

	function collect_jobs() {
		// console.log("collect jobs");

		const imgs = Array.from(document.getElementsByTagName("img"));
		const allElements = Array.from(document.querySelectorAll("*"));

		// TODO: what about pseudo elements (::before and ::after) (w/ background[-image]: or content:)?
		// Would have to parse and generate CSS to support that.

		// What about :hover and :active?
		// Hover effects that use CSS sprites work already! (e.g. next/prev buttons in Unsounded)
		// It wouldn't work with :hover { background-image: url(hover.png); } but that's not a good pattern

		imgs
			.filter((img)=> !img.superrezQueued)
			.forEach((img)=> {
				img.superrezQueued = true;
				addJob({
					url: img.src,
					elements: [img],
					applyResultToPage: (superrez_url)=> {
						img.style.width = getComputedStyle(img).width;
						img.style.height = getComputedStyle(img).height;
						img.src = superrez_url;
					}
				});
			});
		// TODO: robust css background-image parsing
		const css_url_regex = /url\(["']?([^'"]*)["']?\)/;
		allElements
			.filter((el)=> !el.superrezQueued)
			.filter((el)=> getComputedStyle(el).backgroundImage.match(css_url_regex))
			.forEach((el)=> {
				el.superrezQueued = true;
				const {backgroundImage, backgroundSize} = getComputedStyle(el);
				const original_url = backgroundImage.match(css_url_regex)[1];
				addJob({
					url: original_url,
					elements: [el],
					applyResultToPage: (superrez_url, scaling_factor)=> {
						// TODO: what about multiple backgrounds?

						// TODO: instead of parsing background-size,
						// try generating an SVG that just contains an <image>
						// at a higher resolution than the SVG's intrinsic size

						const newBackgroundImage = backgroundImage.replace(css_url_regex, `url("${superrez_url}")`);

						if (backgroundSize === "contain" || backgroundSize === "cover") {
							el.style.backgroundImage = newBackgroundImage;
						} else if (!backgroundSize || backgroundSize === "auto") {
							const new_image = new Image();
							new_image.onload = ()=> {
								el.style.backgroundSize = `${new_image.width/scaling_factor}px ${new_image.height/scaling_factor}px`;
								el.style.backgroundImage = newBackgroundImage;
							};
							new_image.onerror = ()=> {
								console.error("couldn't superrez background-image for", el, "failed to load image to get width/height");
							};
							new_image.src = superrez_url;
						} else {
							// TODO: parse one and two value syntax
							// el.style.backgroundSize = rescale(backgroundSize);
							// el.style.backgroundImage = newBackgroundImage;
							console.error("can't handle background-size: ", backgroundSize);
						}
					},
				});
			});

		// only start spidering when other jobs have an opportunity to be added
		// so they can be prioritized initially
		// ...actually, if it's starting on the *current* URL, it should be fine, right?
		/*
		if (!spider_started) {
			spider_started = true;
			console.log("starting spider");

			spiderFromURL(location.href, {
				backwardPages: 1,
				forwardPages: 20,
				addJob: (url)=> {
					addJob({url, elements: [], from_spider: true});
				},
			});
		}
		*/
	}

	window.addEventListener("load", collect_jobs);
	setInterval(collect_jobs, 500);
})();
