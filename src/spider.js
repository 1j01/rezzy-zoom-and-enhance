const cheerio = require('cheerio');

const spiderFromURL = (url, {backwardPages, forwardPages, addJob})=> {
	const direction = backwardPages > 0 ?
		(forwardPages > 0 ? "from start" : "backwards") :
		(forwardPages > 0 ? "forwards" : "on last page to scrape in this direction");
	let cancel_function;
	let stopped = false;
	require("request")(url, (error, response, body)=> {
		if (error) {
			console.error(`[spider] Failed to get ${url} - stopping scraping (${direction})`);
			return;
		}
		if (response.statusCode !== 200) {
			console.error(`[spider] Failed to get ${url} - recieved HTTP ${response.statusCode} - stopping scraping (${direction})`);
			return;
		}
		if (stopped) {
			return;
		}
		cancel_function = module.exports.spiderFromHTML(body, {backwardPages, forwardPages, addJob});
	});
	return ()=> {
		stopped = true;
		cancel_function && cancel_function();
	};
};

const spiderFromHTML = (html, {backwardPages, forwardPages, addJob})=> {
	let cancel_functions = [];
	let stopped = false;

	const $ = cheerio.load(html);

	const images = $("img").toArray();
	const links = $("a").toArray();

	// TODO: look for linked webcomic image, which could help with webcomics in different languages,
	// which might not say "back"/"forward" in English in any way
	const nextLinks = links.filter((a)=>
		!!$.html(a).match(/next(?![da])|forward|fr?wr?d/i)
	);
	const prevLinks = links.filter((a)=>
		!!$.html(a).match(/prev(?!iew|[eau])|backward|back([\b_-])|backwd|bc?k?wd(\b|[_-])/i)
	);
	const prioritizePageLinksFirst = (a, b)=> {
		const ch_regexp = /chapter|chapt?([\b_-])|([\b_-])ch([\b_-])/i;
		const pg_regexp = /page|([\b_-])(p[gp]|cc)([\b_-])/i;
		const comic_regexp = /comic/i;
		const a_is_ch = !!$.html(a).match(ch_regexp);
		const b_is_ch = !!$.html(b).match(ch_regexp);
		const a_is_pg = !!$.html(a).match(pg_regexp);
		const b_is_pg = !!$.html(b).match(pg_regexp);
		const a_is_comic = !!$.html(a).match(comic_regexp);
		const b_is_comic = !!$.html(b).match(comic_regexp);

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

	console.log("[spider] found elements:", {nextLinks, prevLinks, images});
	// console.log("[spider] next links, in order of priority:\n\n", nextLinks.map((a)=> $.html(a)).join("\n\n"));
	// console.log("[spider] prev links, in order of priority:\n\n", prevLinks.map((a)=> $.html(a)).join("\n\n"));
	
	// find jobs
	images.forEach((img)=> {
		const src = $(img).attr("src");
		if (!src.match(/^(https?):/)) {
			return;
		}
		require("request").head(src).on("response", (response)=> {
			const content_length = response.headers["content-length"];
			if (content_length > 20000) {
				// console.log(`[spider] preloading image ${src} (content-length: ${content_length})`);
				addJob(src);
			} else {
				// console.log(`[spider] ignoring image ${src} (content-length: ${content_length})`);
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
			const prev_url = $(prevLink).attr("href");
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
			const next_url = $(nextLink).attr("href");
			cancel_functions.push(
				spiderFromURL(next_url, {backwardPages: 0, forwardPages: forwardPages - 1, addJob})
			);
		} else {
			console.warn("[spider] No next page link found");
		}
	}

	return ()=> {
		stopped = true;
		cancel_functions.forEach(cancel_function=> cancel_function());
	};
};

module.exports = {spiderFromURL, spiderFromHTML};
