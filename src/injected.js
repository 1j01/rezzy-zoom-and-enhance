// Code injected into the page

// TODO: make the job loop/queue actually meaningful again and move it into the server

// TODO: security: don't allow webpages to circumvent CORS restrictions for any images on the web

(()=> {
	console.log("injected");

	// const superrez_image_url = require("./superrez");
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

	function addJob() {
		post("job", {});
	}
	// let spider_started = false;

	function superrez_image_url(image_url) {
		const endpoint_url = `${api_base_url}/superrez?url=${encodeURIComponent(image_url)}`;
		// fetch(endpoint_url).then(()=> {
		// 	callback(null, superrez_url);
		// }, (err)=> {
		// 	callback(err);
		// })
		// callback(null, endpoint_url);
		return endpoint_url;
	}

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
				const url = backgroundImage.match(css_url_regex)[1];
				const job = {
					url: url,
					elements: [el],
				};
				job.applyResultToPage = (superrez_url, scaling_factor)=> {
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
							console.error("couldn't superrez", job, "failed to load image to get width/height");
						};
						new_image.src = superrez_url;
					} else {
						// TODO: parse one and two value syntax
						// el.style.backgroundSize = rescale(backgroundSize);
						// el.style.backgroundImage = newBackgroundImage;
						console.error("can't handle background-size: ", backgroundSize);
					}
				};
				addJob(job);
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
