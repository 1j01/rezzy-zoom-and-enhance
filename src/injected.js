// Code injected into the page

// security: be mindful about what data access the extension gives pages
// - regarding CORS, sites can already request any URL using a proxy like CORS Anywhere 
// - if the extension were to request resources with cookies it could expose private information

(()=> {
	console.log("Rezzy injected");

	function find_next_prev_links() {
		// WET: logic should match spider.js
		
		const links = [...document.querySelectorAll("a")];

		// TODO: look for linked webcomic image, which could help with webcomics in different languages,
		// which might not say "back"/"forward" in English in any way
		const nextLinks = links.filter((a)=>
			!!a.outerHTML.match(/next(?![da])|forward|fr?wr?d/i)
		);
		const prevLinks = links.filter((a)=>
			!!a.outerHTML.match(/prev(?!iew|[eau])|backward|back(\b|[_-])|backwd|bc?k?wd(\b|[_-])/i)
		);
		const prioritizePageLinksFirst = (a, b)=> {
			const ch_regexp = /chapter|chapt?(\b|[_-])|(\b|[_-])ch(\b|[_-])/i;
			const pg_regexp = /page|(\b|[_-])(p[gp]|cc)(\b|[_-])/i;
			const comic_regexp = /comic/i;
			const a_is_ch = !!a.outerHTML.match(ch_regexp);
			const b_is_ch = !!b.outerHTML.match(ch_regexp);
			const a_is_pg = !!a.outerHTML.match(pg_regexp);
			const b_is_pg = !!b.outerHTML.match(pg_regexp);
			const a_is_comic = !!a.outerHTML.match(comic_regexp);
			const b_is_comic = !!b.outerHTML.match(comic_regexp);

			// deprioritize, but don't exclude chapter buttons;
			// a webcomic could have entire chapters on a page
			if (a_is_ch && !b_is_ch) return +1;
			if (b_is_ch && !a_is_ch) return -1;

			// prioritize "page" links
			if (a_is_pg && !b_is_pg) return -1;
			if (b_is_pg && !a_is_pg) return +1;

			// prioritize "comic" links, which is hopefully synonymous with page,
			// and not refering to a web ring https://en.wikipedia.org/wiki/Webring
			// TODO: deprioritize/exclude external links
			// and simplify to /page|comic/i
			if (a_is_comic && !b_is_comic) return -1;
			if (b_is_comic && !a_is_comic) return +1;

			return 0;
		};
		nextLinks.sort(prioritizePageLinksFirst);
		prevLinks.sort(prioritizePageLinksFirst);

		return {
			next: nextLinks[0],
			prev: prevLinks[0],
		};
	}

	window.addEventListener("keydown", (event)=> {
		const starting_url = location.href;
		const starting_scroll_x = window.scrollX;
		setTimeout(()=> {
			// if the page scrolled, do nothing
			// this might warrant a setting, or be more annoying than it's worth
			if (starting_scroll_x !== window.scrollX) {
				return;
			}
			// in case the site already handles arrow keys, and does history.pushState
			if (starting_url !== location.href) {
				return;
			}

			if (event.key === "ArrowRight") {
				find_next_prev_links().next.click();
			}
			if (event.key === "ArrowLeft") {
				find_next_prev_links().prev.click();
			}
		}, 100);
	});

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
		let priority = pixels;
		// TODO: find good values for these priority modifiers
		if (!job.elements.every((element)=> element.tagName === "IMG")) {
			priority /= 10;
		}
		if (document.visibilityState !== "visible") {
			priority /= 2;
		}
		if (!document.hasFocus()) {
			priority /= 2;
		}
		return priority;
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
		if (!url.match(/^https?:/)) {
			console.warn("Tried to add a job for a non-HTTP(S) URL:", url, elements);
			return;
		}
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

	window.addEventListener("load", ()=> {
		// TODO: filter on sites the user chooses with some UI
		const {next, prev} = find_next_prev_links();
		// checking for one or the other here in case a site hides the buttons
		// rather than disabling them when they don't apply
		if (next || prev) {
			update_jobs_list();
			setInterval(update_jobs_list, 500);
		}
	});
	
})();
