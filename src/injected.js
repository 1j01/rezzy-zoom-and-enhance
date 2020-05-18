// Code injected into the page

// security: be mindful about what data access the extension gives pages
// - regarding CORS, sites can already request any URL using a proxy like CORS Anywhere 
// - if the extension were to request resources with cookies it could expose private information

(()=> {
	console.log("Rezzy injected");

	const socket = window.io("http://localhost:4284");

	let jobs_by_url = {};

	function update_jobs_list() {
		collect_new_jobs();
		for (const job of Object.values(jobs_by_url)) {
			// job.elements.forEach(element=> {
			// 	element.style.outline = `${visible_pixels(element)/50000}px solid red`;
			// });
			job.priority = get_priority(job);
			// console.log("priority", job.priority, "for", job.elements);
		}
		const jobs =
			[...Object.values(jobs_by_url)]
			.map(({url, scaling_factor, priority})=> ({url, scaling_factor, priority}));
		socket.emit("jobs", jobs);
		socket.emit("spider-from-url", location.href);
	}

	function get_priority(job) {
		const pixels = job.elements.map(visible_pixels).reduce((a, b) => a + b, 0);
		return pixels;
	}

	function visible_pixels(element) {
		if (!element.parentElement) return 0;
		if (element.offsetWidth === 0 || element.offsetHeight === 0) return 0;
		const style = getComputedStyle(element);
		if (style.display === "none" || style.visibility === "hidden") return 0;
		const bounds = element.getBoundingClientRect();
		const visibleWidth = Math.max(0, Math.min(window.innerWidth, bounds.right) - Math.max(0, bounds.left));
		const visibleHeight = Math.max(0, Math.min(window.innerHeight, bounds.bottom) - Math.max(0, bounds.top));
		return visibleWidth * visibleHeight;
	}

	function add_job({url, elements, apply_result_to_page}) {
		// TODO: handle multiple elements with the same image resource
		// i.e. allow for multiple callbacks, not just one (apply_result_to_page)
		const job = jobs_by_url[url] || {
			url,
			scaling_factor: 2, // can't be changed for now
			elements: [], // added with concat below
			priority: 0, // calculated below
			apply_result_to_page,
		};
		jobs_by_url[url] = job;
		job.elements = job.elements.concat(elements);
		job.priority = get_priority(job);
	}

	socket.on("superrez-result", ({url, scaling_factor, result_array_buffer})=> {
		const job = jobs_by_url[url];
		if (!job) return;
		const blob = new Blob([result_array_buffer]);
		const blob_url = URL.createObjectURL(blob);
		job.apply_result_to_page(blob_url, scaling_factor);
	});

	function collect_new_jobs() {
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
				add_job({
					url: img.src,
					elements: [img],
					apply_result_to_page: (superrez_url)=> {
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
				add_job({
					url: original_url,
					elements: [el],
					apply_result_to_page: (superrez_url, scaling_factor)=> {
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
	}

	window.addEventListener("load", update_jobs_list);
	setInterval(update_jobs_list, 500);
	// setTimeout(update_jobs_list, 20);
})();
