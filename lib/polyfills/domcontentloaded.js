;(function() {
	if (window.getSelection) { return; } /* supported */

	document.addEventListener("readystatechange", function(e) {
		if (document.readyState == "complete") { 
			var event = new CustomEvent("DOMContentLoaded");
			document.dispatchEvent(event);
		}
	});
})();
