// Code injected into the webview

// TODO: security: don't expose filesystem access (or anything else dangerous) to webpages

(()=> {
	console.log("injected");

	const superrez_image = require("./superrez");
	
	function superrez_image_in_place(page_img) {
		superrez_image(page_img, (err, superrezzed_img)=> {
			if (err) {
				return show_error_message("Failed to superrez image", err);
			}
			page_img.style.width = getComputedStyle(page_img).width;
			page_img.style.height = getComputedStyle(page_img).height;
			page_img.src = superrezzed_img.src;
		});
	}
	
	function show_error_message(message, error) {
		alert(`${message}\n\n${error}`);
	}

	function enhance_page() {
		console.log("enhance page");
		// TODO: do more than just one image (but maybe do images in serial, or limited parallel)
		// TODO: look for background-images as well

		const imgs = Array.from(document.querySelectorAll("img"));

		const area = (img)=> img.width * img.height; // TODO: naturalWidth/naturalHeight?
		
		imgs.sort((a, b)=> {
			if (area(a) < area(b)) return +1;
			if (area(a) > area(b)) return -1;
			return 0;
		});
		const main_img = imgs[0];

		superrez_image_in_place(main_img);
	}
	
	window.addEventListener("load", enhance_page);

	// TODO: listen for url change and wait for images to load and then re-enhance
	// in case of history.pushState or hash change?
	// Could just poll location.href
	// Could just periodically poll for images that are large and loaded
})();
