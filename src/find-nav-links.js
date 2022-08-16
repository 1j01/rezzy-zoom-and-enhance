/* eslint-env node, browser */
(() => {
	let cheerio;
	if (typeof module !== 'undefined' && typeof require === 'function') {
		cheerio = require('cheerio').default;
	}

	const query_param_next_regex = /\?next=/i;
	const next_regex = /next(?![da])|forward|fr?wr?d/i;
	const prev_regex = /prev(?!iew|[eau])|backward|back(\b|[_-])|backwd|bc?k?wd(\b|[_-])/i;
	const ch_regexp = /chapter|chapt?(\b|[_-])|(\b|[_-])ch(\b|[_-])/i;
	const pg_regexp = /page|(\b|[_-])(p[gp]|cc)(\b|[_-])/i;
	const ep_regexp = /episode|ep(\b|[_-])/i;
	const comic_regexp = /comic/i;
	const prev_not_back_regexp = /prev(?!iew|[eau])/i;
	const promo_regexp = /promo|advert|vote|this comic|this project|back this|back now|please back|donate|patreon|kickstarter|gofundme|roundup|webring|comicring|\bring\b|next read|favorite/i; // financial backing link (or link to other separate comics), not a back button

	function outerHTML(element) {
		// native DOM
		if ("outerHTML" in element) {
			return element.outerHTML;
		}
		// cheerio
		return cheerio(element).prop("outerHTML");
	}

	function textContent(element) {
		// native DOM
		if ("textContent" in element) {
			return element.textContent;
		}
		// cheerio
		return cheerio(element).text();
	}

	function find_next_prev_links(links) {
		if (!links) {
			links = document.getElementsByTagName('a');
		}
		if (links.toArray) {
			// cheerio / jQuery
			links = links.toArray();
		} else {
			// native DOM querySelectorAll
			links = [...links];
		}

		// ignore login / authentication links that would otherwise be matched
		// (they often include a "next" parameter that is used to redirect to the page you were on last or that needed authentication)
		links = links.filter((a) => !outerHTML(a).match(query_param_next_regex));

		// TODO: look for linked webcomic image, which could help with webcomics in different languages,
		// which might not say "back"/"forward" in English in any way
		// TODO: look for <link rel="prev" href="...">
		const nextLinks = links.filter((a) => !!outerHTML(a).match(next_regex));
		const prevLinks = links.filter((a) => !!outerHTML(a).match(prev_regex));
		const prioritizePageLinksFirst = (a, b) => {
			const a_is_ch = !!outerHTML(a).match(ch_regexp);
			const b_is_ch = !!outerHTML(b).match(ch_regexp);
			const a_is_pg = !!outerHTML(a).match(pg_regexp);
			const b_is_pg = !!outerHTML(b).match(pg_regexp);
			const a_is_ep = !!outerHTML(a).match(ep_regexp);
			const b_is_ep = !!outerHTML(b).match(ep_regexp);
			const a_is_comic = !!outerHTML(a).match(comic_regexp);
			const b_is_comic = !!outerHTML(b).match(comic_regexp);
			const a_is_prev_not_back = !!outerHTML(a).match(prev_not_back_regexp);
			const b_is_prev_not_back = !!outerHTML(b).match(prev_not_back_regexp);
			const a_is_promo = !!outerHTML(a).match(promo_regexp);
			const b_is_promo = !!outerHTML(b).match(promo_regexp);
			const a_is_long = textContent(a).length > 40;
			const b_is_long = textContent(b).length > 40;

			return (
				// Deprioritize "back this project" funding links
				// (financial backing links, which are not back buttons)
				(a_is_promo - b_is_promo) ||

				// I found long text in a link on https://mara-comic.com/comic/01/01?lang=en
				// "Rosi explores a new style, and Mara leaves her enemies for the crows.
				// Vote on Mara at Top Webcomics to see a preview of the next page!"
				// which contains "next page" in the link text, but the link is not a next link
				// Deprioritize, but don't exclude, just in case.
				// For reference, "Click here to read the next chapter" is 35 characters long.
				(a_is_long - b_is_long) ||

				// deprioritize, but don't exclude chapter buttons;
				// a webcomic could have entire chapters on a page
				(a_is_ch - b_is_ch) ||

				// prioritize "page" links
				(b_is_pg - a_is_pg) ||

				// prioritize "episode" links
				(b_is_ep - a_is_ep) ||

				// prioritize "comic" links, which is hopefully synonymous with page,
				// and not referring to a web ring 
				// (but I'm checking for web rings)
				// TODO: deprioritize/exclude external links
				// and simplify to /page|comic/i
				(b_is_comic - a_is_comic) ||

				// There are different kinds of "back" buttons,
				// for instance on https://www.webcomicsapp.com/view/600503cc8c252b26d748d074/1
				// there is a "Back" button to go back to the comic description page,
				// and a "Previous" button for the previous page of the comic.
				// Prioritize "previous" buttons.
				(b_is_prev_not_back - a_is_prev_not_back) ||

				0
			);
		};
		nextLinks.sort(prioritizePageLinksFirst);
		prevLinks.sort(prioritizePageLinksFirst);

		return {
			nextLinks,
			prevLinks,
			next: nextLinks[0],
			prev: prevLinks[0],
		};
	}

	if (typeof module !== "undefined") {
		module.exports = {
			find_next_prev_links,
		};
	} else {
		globalThis.find_next_prev_links = find_next_prev_links;
	}

})();
