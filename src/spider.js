module.exports.spiderFromHTML = (html, {backwardPages, forwardPages, addJob})=> {
	var dummy_element = document.createElement( 'html' );
	dummy_element.innerHTML = html;

	const images = Array.from(dummy_element.getElementsByTagName("img"));
	const links = Array.from(dummy_element.getElementsByTagName("a"));

	// TODO: look for main image link
	const nextLinks = links.filter((a)=>
		a.outerHTML.match(/next(?![da])|forward|fr?wr?d/)
	);
	const prevLinks = links.filter((a)=>
		a.outerHTML.match(/prev(?!iew|[eau])|backward|back(\b|[_-])|backwd|bckwd/)
	);
	const prioritizePageLinksFirst = (a, b)=> {
		const ch_regexp = /chapter|chap(\b|[_-])|(\b|[_-])ch(\b|[_-])/;
		const pg_regexp = /page|comic/;
		const a_is_ch = a.outerHTML.match(ch_regexp);
		const b_is_ch = b.outerHTML.match(ch_regexp);
		const a_is_pg = a.outerHTML.match(pg_regexp);
		const b_is_pg = b.outerHTML.match(pg_regexp);

		// deprioritize, but don't exclude chapter buttons;
		// a webcomic could have entire chapters on a page
		if (a_is_ch && !b_is_ch) return +1;
		if (b_is_ch && !a_is_ch) return -1;

		if (a_is_pg && !b_is_pg) return -1;
		if (b_is_pg && !a_is_pg) return +1;

		return 0;
	};
	nextLinks.sort(prioritizePageLinksFirst);
	prevLinks.sort(prioritizePageLinksFirst);

	console.log("[spider] links:", {nextLinks, prevLinks});
	
	// find jobs
	images.forEach((img)=> {
		addJob(img.src);
	});

	// recurse backwards
	// TODO: prioritize this maybe at like after loading 5 next pages? or something?
	if (backwardPages > 0) {
		const prevLink = prevLinks[0];
		if (prevLink) {
			const url = prevLink.href;
			require("request")(url, (error, response, body)=> {
				if (error) {
					console.error(`[spider] Failed to get ${url} - stopping scraping (backwards)`);
					return;
				}
				if (response.statusCode !== 200) {
					console.error(`[spider] Failed to get ${url} - recieved HTTP ${response.statusCode} - stopping scraping (forwards)`);
					return;
				}
				module.exports.spiderFromHTML(body, {backwardPages: backwardPages - 1, forwardPages: 0, addJob});
			});
		} else {
			console.warn("No previous page link found");
		}
	}

	// recurse forwards
	if (forwardPages > 0) {
		const nextLink = nextLinks[0];
		if (nextLink) {
			const url = nextLink.href;
			require("request")(url, (error, response, body)=> {
				if (error) {
					console.error(`[spider] Failed to get ${url} - stopping scraping (forwards)`);
					return;
				}
				if (response.statusCode !== 200) {
					console.error(`[spider] Failed to get ${url} - recieved HTTP ${response.statusCode} - stopping scraping (forwards)`);
					return;
				}
				module.exports.spiderFromHTML(body, {backwardPages: 0, forwardPages: forwardPages - 1, addJob});
			});
		} else {
			console.warn("[spider] No previous page link found");
		}
	}

	// debug
	// console.log("[spider]", {nextLinks, prevLinks, images});
};
