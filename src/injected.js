// Code injected into the webview

// TODO: security: don't expose filesystem access (or anything else dangerous) to webpages

(()=> {
	console.log("injected");

	const superrez_image_url = require("./superrez");
	
	let jobs = []; // (sorted before items are pulled)

	function filter_and_sort_jobs() {
		
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
		// const belongsToCurrentPage = (element)=> {
		// 	element.ownerDocument === document; // erm, we're in the code injected in the page currently
		// };

		jobs = jobs.filter((job)=> job.elements.some(isVisible));
		jobs.sort((a, b)=> {
			// const a_belongs_to_current_page = belongsToCurrentPage(a);
			// const b_belongs_to_current_page = belongsToCurrentPage(b);
			// if (a_belongs_to_current_page && !b_belongs_to_current_page) return -1;
			// if (b_belongs_to_current_page && !a_belongs_to_current_page) return +1;
			const a_is_in_view = a.elements.some(isPartiallyInView);
			const b_is_in_view = b.elements.some(isPartiallyInView);
			if (a_is_in_view && !b_is_in_view) return -1;
			if (b_is_in_view && !a_is_in_view) return +1;
			const a_max_area = Math.max(...a.elements.map(area));
			const b_max_area = Math.max(...b.elements.map(area));
			if (a_max_area > b_max_area) return -1;
			if (b_max_area > a_max_area) return +1;
			return 0;
		});
	}
	function collect_jobs() {
		// console.log("collect jobs");

		// TODO: apply to background-images as well
		// getComputedStyle(element).background.match(/url\((.*)\)/)

		const imgs = Array.from(document.querySelectorAll("img"));
		const allElements = Array.from(document.querySelectorAll("*"));

		// TODO: allow multiple `img.src`s or `style.backgroundImage`s to be included in a job
		// deduplicate jobs based on URL, and then partially parallelize jobs
		jobs = jobs.concat(imgs.filter((img)=> !img.superrezQueued).map((img)=> {
			img.superrezQueued = true;
			img.replaceWithSuperrez = (superrezzed_blob_url)=> {
				img.style.width = getComputedStyle(img).width;
				img.style.height = getComputedStyle(img).height;
				img.src = superrezzed_blob_url;
				img.superrezzed = true;
			};
			return {
				url: img.src,
				elements: [img],
			};
		}));
		// TODO: robust css background-image parsing
		const css_url_regex = /url\(["']?([^'"]*)["']?\)/;
		jobs = jobs.concat(allElements
			.filter((el)=> !el.superrezQueued)
			.filter((el)=> getComputedStyle(el).backgroundImage.match(css_url_regex))
			.map((el)=> {
				el.superrezQueued = true;
				const {backgroundImage, backgroundSize} = getComputedStyle(el);
				const url = backgroundImage.match(css_url_regex)[1];
				console.log(url);
				el.replaceWithSuperrez = (superrezzed_blob_url, scaling_factor)=> {
					// TODO: what about :hover?
					// TODO: what about multiple backgrounds?

					// TODO: instead of parsing background-size,
					// try generating an SVG that just contains an <image>
					// at a higher resolution than the SVG's intrinsic size

					const newBackgroundImage = backgroundImage.replace(css_url_regex, `url("${superrezzed_blob_url}")`);

					if (backgroundSize === "contain" || backgroundSize === "cover") {
						el.style.backgroundImage = newBackgroundImage;
						el.superrezzed = true;
					} else if (!backgroundSize || backgroundSize === "auto") {
						const new_image = new Image();
						new_image.onload = ()=> {
							el.style.backgroundSize = `${new_image.width/scaling_factor}px ${new_image.height/scaling_factor}px`;
							el.style.backgroundImage = newBackgroundImage;
							el.superrezzed = true;
						};
						new_image.onerror = ()=> {
							console.error("couldn't superrez", job, "failed to load image to get width/height");
						};
						new_image.src = superrezzed_blob_url;
					} else {
						// TODO: parse one and two value syntax
						// el.style.backgroundSize = rescale(backgroundSize);
						// el.style.backgroundImage = newBackgroundImage;
						// el.superrezzed = true;
						console.error("can't handle background-size: ", backgroundSize);
					}
				};
				return {
					url: url,
					elements: [el],
				};
			}
		));
		// console.log(jobs);
	}

	async function run_jobs() {
		// console.log("run jobs");

		// eslint-disable-next-line no-constant-condition
		while (true) {
			filter_and_sort_jobs();
			// jobs = jobs.slice(0, 50);
			// console.log(jobs);
			const job = jobs.shift();
			if (!job) {
				await new Promise((resolve)=> { setTimeout(resolve, 100); });
				continue;
			}
			console.log("next job:", job);
			try {
				await new Promise((resolve, reject)=> {
					superrez_image_url(job.url, (err, superrezzed_blob_url)=> {
						if (err) {
							return reject(err);
						}
						job.elements.forEach((element)=> {
							element.replaceWithSuperrez(superrezzed_blob_url, 2);
						});
						resolve();
					});
				})
			} catch(error) {
				console.error("Failed to superrez image", job.url, "because:", error, job);
			}
		}
	}

	run_jobs().catch((error)=> {
		console.error(`Superrez job loop crashed\n\n${error}`);
		alert(`Superrez job loop crashed\n\n${error}`);
	});
	window.addEventListener("load", collect_jobs);
	setInterval(collect_jobs, 500)
})();
