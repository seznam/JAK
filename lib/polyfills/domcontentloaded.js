;(function() {
	var supported = true;
	/*@cc_on if (@_jscript_version <= 8) { supported = false; } @*/
	if (supported) { return; }

	document.addEventListener("readystatechange", function(e) {
		if (document.readyState == "complete") { 
			var event = new CustomEvent("DOMContentLoaded");
			document.dispatchEvent(event);
		}
	});
})();
