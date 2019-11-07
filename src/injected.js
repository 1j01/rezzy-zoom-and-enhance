// Code injected into the webview

// TODO: security: don't expose filesystem access (or anything else dangerous) to webpages

(()=> {
	console.log("injected");

	const superrez_image = require("./superrez");
	
	let dynamic_queue = []; // dynamic as in not static; it will get sorted before items are pulled

	function superrez_image_in_place(page_img) {
		return new Promise((resolve, reject)=> {
			superrez_image(page_img, (err, superrezzed_img)=> {
				if (err) {
					reject(err);
				}
				page_img.style.width = getComputedStyle(page_img).width;
				page_img.style.height = getComputedStyle(page_img).height;
				page_img.src = superrezzed_img.src;
				resolve();
			});
		})
	}
	
	function show_error_message(message, error) {
		alert(`${message}\n\n${error}`);
	}

	function filter_and_sort_queue() {
		
		const area = (img)=> img.width * img.height; // TODO: naturalWidth/naturalHeight?
		// const inDOM = (element)=> element.parentElement != null;
		const isVisible = (element)=> {
			if (!element.parentElement) return false;
			if (element.offsetWidth === 0 || element.offsetHeight === 0) return false;
			const style = getComputedStyle(element);
			if (style.display === "none" || style.visibility === "hidden") return false;
			return true;
		}
		const isInView = (element)=> {
			const bounds = element.getBoundingClientRect();
			return (
				bounds.top >= 0 &&
				bounds.left >= 0 &&
				bounds.bottom <= (window.innerHeight) &&
				bounds.right <= (window.innerWidth)
			);
		};
		// const belongsToCurrentPage = (element)=> {
		// 	element.ownerDocument === document; // erm, we're in the code injected in the page currently
		// };

		dynamic_queue = dynamic_queue.filter(isVisible);
		dynamic_queue.sort((a, b)=> {
			// const a_belongs_to_current_page = belongsToCurrentPage(a);
			// const b_belongs_to_current_page = belongsToCurrentPage(b);
			// if (a_belongs_to_current_page && !b_belongs_to_current_page) return -1;
			// if (b_belongs_to_current_page && !a_belongs_to_current_page) return +1;
			const a_is_in_view = isInView(a);
			const b_is_in_view = isInView(b);
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

		const imgs = Array.from(document.querySelectorAll("img"));

		dynamic_queue = dynamic_queue.concat(imgs);

		while (dynamic_queue.length > 0) {
			filter_and_sort_queue();
			const next_img = dynamic_queue.shift();
			console.log("next_img", next_img);
			try {
				await superrez_image_in_place(next_img);
			} catch(error) {
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
