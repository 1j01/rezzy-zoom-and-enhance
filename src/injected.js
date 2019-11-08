// Code injected into the webview

// TODO: security: don't expose filesystem access (or anything else dangerous) to webpages

(()=> {
	console.log("injected");

	const superrez_image_url = require("./superrez");
	
	let jobs = []; // (sorted before items are pulled)

	function show_error_message(message, error) {
		console.error(`${message}\n\n${error}`);
		// alert(`${message}\n\n${error}`);
	}

	function filter_and_sort_jobs() {
		
		const area = (img)=> img.width * img.height; // TODO: naturalWidth/naturalHeight?
		// const inDOM = (element)=> element.parentElement != null;
		const isVisible = (element)=> {
			if (!element.parentElement) return false;
			if (element.offsetWidth === 0 || element.offsetHeight === 0) return false;
			const style = getComputedStyle(element);
			if (style.display === "none" || style.visibility === "hidden") return false;
			return true;
		}
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

		jobs = jobs.filter(isVisible);
		jobs.sort((a, b)=> {
			// const a_belongs_to_current_page = belongsToCurrentPage(a);
			// const b_belongs_to_current_page = belongsToCurrentPage(b);
			// if (a_belongs_to_current_page && !b_belongs_to_current_page) return -1;
			// if (b_belongs_to_current_page && !a_belongs_to_current_page) return +1;
			const a_is_in_view = isPartiallyInView(a);
			const b_is_in_view = isPartiallyInView(b);
			if (a_is_in_view && !b_is_in_view) return -1;
			if (b_is_in_view && !a_is_in_view) return +1;
			if (area(a) > area(b)) return -1;
			if (area(b) > area(a)) return +1;
			return 0;
		});
	}

	async function enhance_page() {
		console.log("enhance page");

		// TODO: apply to background-images as well
		// getComputedStyle(element).background.match(/url\((.*)\)/)

		const imgs = Array.from(document.querySelectorAll("img"));

		// TODO: allow multiple `img.src`s or `style.backgroundImage`s to be included in a job
		// deduplicate jobs based on URL, and then partially parallelize jobs
		jobs = jobs.concat(imgs.map((img)=> {
			return {
				url: img.src,
				element: img,
				elements: [img],
				replaceOnPage: (superrezzed_blob_url)=> {
					img.style.width = getComputedStyle(img).width;
					img.style.height = getComputedStyle(img).height;
					img.src = superrezzed_blob_url;
				},
			};
		}));
		console.log(jobs);

		while (jobs.length > 0) {
			filter_and_sort_jobs();
			// jobs = jobs.slice(0, 50);
			console.log(jobs);
			const job = jobs.shift();
			if (!job) break;
			console.log("next job:", job);
			try {
				await new Promise((resolve, reject)=> {
					superrez_image_url(job.url, (err, superrezzed_blob_url)=> {
						if (err) {
							return reject(err);
						}
						job.replaceOnPage(superrezzed_blob_url);
						resolve();
					});
				})
			} catch(error) {
				console.log("Failed to superrez image", job.url, "because:", error, job);
				show_error_message("Failed to superrez image", error);
			}
		}
	}
	
	window.addEventListener("load", enhance_page);

	// TODO: listen for url change and wait for images to load and then re-enhance
	// in case of history.pushState or hash change?
	// Could just poll location.href
	// Could just periodically poll for images that are large and loaded
})();
