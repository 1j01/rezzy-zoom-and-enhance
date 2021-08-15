const cheerio = require('cheerio');
const { find_next_prev_links } = require("./find-nav-links");

// slowing down the spider makes the server more responsive
// so superrez images can load faster
const crawl_delay_ms = 500;

const spiderFromURL = (url, {backwardPages, forwardPages, addJob})=> {
	const description = backwardPages > 0 ?
		(forwardPages > 0 ? "starting point URL" : "crawling backwards") :
		(forwardPages > 0 ? "crawling forwards" : "reached limit of number of pages to scrape in this direction");
	let cancel_function;
	let stopped = false;
	console.error(`[spider] crawling ${url} (${description})`);
	setTimeout(()=> {
		require("request")(url, (error, response, body)=> {
			if (error) {
				console.error(`[spider] Failed to get ${url} - stopping scraping (${description})`);
				return;
			}
			if (response.statusCode !== 200) {
				console.error(`[spider] Failed to get ${url} - received HTTP ${response.statusCode} - stopping scraping (${description})`);
				return;
			}
			if (stopped) {
				return;
			}
			cancel_function = spiderFromHTML(body, url, {backwardPages, forwardPages, addJob});
		});
	}, crawl_delay_ms);
	return ()=> {
		// console.log("[spider] stopped");
		stopped = true;
		cancel_function && cancel_function();
	};
};

const spiderFromHTML = (html, url, {backwardPages, forwardPages, addJob})=> {
	let cancel_functions = [];
	let stopped = false;

	const $ = cheerio.load(html);

	const images = $("img").toArray();
	const links = $("a").toArray();

	const { nextLinks, prevLinks } = find_next_prev_links(links);

	console.log(`[spider] found ${images.length} images, ${nextLinks.length} next link(s), ${prevLinks.length} prev link(s)`);
	// console.log("[spider] found elements:", {nextLinks, prevLinks, images});
	// console.log("[spider] next links, in order of priority:\n\n", nextLinks.map((a)=> $.html(a)).join("\n\n"));
	// console.log("[spider] prev links, in order of priority:\n\n", prevLinks.map((a)=> $.html(a)).join("\n\n"));
	
	// find jobs
	images.forEach((img)=> {
		const image_url = new URL($(img).attr("src"), url).href;
		console.log("[spider] found image:", image_url);
		if (!image_url.match(/^(https?):/)) {
			return;
		}
		require("request")
		.head(image_url)
		// this error handling doesn't seem to cover invalid URLs
		.on("error", (error)=> {
			console.error("[spider] error doing HEAD request for", image_url, error);
		})
		.on("response", (response)=> {
			const content_length = response.headers["content-length"];
			if (content_length > 20000) {
				// console.log(`[spider] preloading image ${image_url} (content-length: ${content_length})`);
				addJob(image_url);
			} else {
				// console.log(`[spider] ignoring image ${image_url} (content-length: ${content_length})`);
			}
		});
	});

	if (stopped) {
		return;
	}

	// recurse going backwards
	// TODO: prioritize this maybe at like after loading 5 next pages? or something?
	if (backwardPages > 0) {
		const prevLink = prevLinks[0];
		if (prevLink) {
			const prev_url = new URL($(prevLink).attr("href"), url).href;
			cancel_functions.push(
				spiderFromURL(prev_url, {backwardPages: backwardPages - 1, forwardPages: 0, addJob})
			);
		} else {
			console.warn("[spider] No previous page link found");
		}
	}

	// recurse going forwards
	if (forwardPages > 0) {
		const nextLink = nextLinks[0];
		if (nextLink) {
			const next_url = new URL($(nextLink).attr("href"), url).href;
			cancel_functions.push(
				spiderFromURL(next_url, {backwardPages: 0, forwardPages: forwardPages - 1, addJob})
			);
		} else {
			console.warn("[spider] No next page link found");
		}
	}

	return ()=> {
		// console.log("[spider] stopped");
		stopped = true;
		cancel_functions.forEach(cancel_function=> cancel_function());
	};
};

module.exports = {spiderFromURL};
