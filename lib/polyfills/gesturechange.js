;(function() {
	if ("ongesturechange" in window || !"ontouchstart" in window) { return; }

	var dist1 = 0;
	var angle1 = 0;
	var gestureStarted = false;

	var dispatch = function(event, target) {
		setTimeout(function() { target.dispatchEvent(event); }, 0);
	}

	document.addEventListener("touchstart", function(e) {
		if (e.touches.length != 2) { return; }
		var t1 = e.touches[0];
		var t2 = e.touches[1];
		var dx = t1.clientX - t2.clientX;
		var dy = t1.clientY - t2.clientY;
		dist1 = Math.sqrt(dx*dx+dy*dy);
		angle1 = Math.atan2(dy,dx);
		gestureStarted = true;

		var event = new CustomEvent("gesturestart", {bubbles:true});
		dispatch(event, e.target);
	}, false);

	document.addEventListener("touchmove", function(e) {
		if (e.touches.length != 2) { return; }

		var t1 = e.touches[0];
		var t2 = e.touches[1];
		var dx = t1.clientX - t2.clientX;
		var dy = t1.clientY - t2.clientY;
		var dist2 = Math.sqrt(dx*dx+dy*dy);
		var angle2 = Math.atan2(dy,dx);

		var event = new CustomEvent("gesturechange", {bubbles: true});
		event.altKey = e.altKey;
		event.ctrlKey = e.ctrlKey;
		event.metaKey = e.metaKey;
		event.shiftKey = e.shiftKey;
		event.rotation = ((angle2 - angle1) * (180 / Math.PI)) % 360;
		event.altKey = e.altKey;
		event.scale = dist2/dist1;

		dispatch(event, e.target);

	}, false);

	document.addEventListener("touchend", function(e) {
		if (!gestureStarted) { return; }
		gestureStarted = false;

		var event = new CustomEvent("gestureend", {bubbles:true});
		dispatch(event, e.target);
	}, false);
})();
