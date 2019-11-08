module.exports.spiderFromHTML = (html)=> {
	var dummy_element = document.createElement( 'html' );
	dummy_element.innerHTML = html;
	const links = Array.from(dummy_element.getElementsByTagName("a"));
	console.log("[spider] links", links);
	const nextLinks = links.filter((a)=>
		a.outerHTML.match(/next/)
	);
	const prevLinks = links.filter((a)=>
		a.outerHTML.match(/prev/)
	);
	console.log("[spider]", {nextLinks, prevLinks});
	// TODO: look for main image link
	
};
