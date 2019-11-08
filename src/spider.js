module.exports.spiderFromHTML = (html, {backwardPages, forwardPages, addJob})=> {
	var dummy_element = document.createElement( 'html' );
	dummy_element.innerHTML = html;

	const images = Array.from(dummy_element.getElementsByTagName("img"));
	const links = Array.from(dummy_element.getElementsByTagName("a"));
	// console.log("[spider] links", links);
	// TODO: look for main image link
	const nextLinks = links.filter((a)=>
		a.outerHTML.match(/next|forward/)
	);
	const prevLinks = links.filter((a)=>
		a.outerHTML.match(/prev|backward/)
	);
	console.log("[spider]", {nextLinks, prevLinks});
	
	// find jobs
	images.forEach((img)=> {
		addJob(img.src);
	});

	// recurse backwards
	// TODO: prioritize this maybe at like after loading 5 next pages? or something?
	// if (backwardPages > 0) {
	// 	const prevLink = prevLinks[0];
	// 	if (prevLink) {
	// 		const url = prevLink.href;
	// 		require("request")(url, (error, response, body)=> {
	// 			if (error) {
	// 				console.error(`[spider] Failed to get ${url} - stopping scraping (backwards)`);
	// 				return;
	// 			}
	// 			module.exports.spiderFromHTML(body, {backwardPages: backwardPages - 1, forwardPages: 0, addJob});
	// 		});
	// 	} else {
	// 		console.warn("No previous page link found");
	// 	}
	// }

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
				module.exports.spiderFromHTML(body, {backwardPages: 0, forwardPages: forwardPages - 1, addJob});
			});
		} else {
			console.warn("[spider] No previous page link found");
		}
	}

	// debug
	console.log("[spider]", {nextLinks, prevLinks, images});
};
