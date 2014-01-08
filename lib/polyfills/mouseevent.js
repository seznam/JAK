/** MouseEvent polyfill to ease dispatchEvent usage */
(function() {
	if (!window.MouseEvent) {
		window.MouseEvent = function(type, props) {
			if (!arguments.length) { throw new Error("Not enough arguments"); }
			var def = {
				type: type,
				cancelable: false,
				bubbles: false
			}
			var event = document.createEventObject();
			for (var p in def)   { event[p] = def[p];   }
			for (var p in props) { event[p] = props[p]; }
			return event;
		}
		return;
	}

	try {
		new MouseEvent("click");
	} catch (e) {
		var ME = function(type, props) {
			if (!arguments.length) { throw new Error("Not enough arguments"); }
			var def = {
				type: type,
				bubbles: false,
				cancelable: false,
				view: window,
				detail: 1,
				screenX: 0,
				screenY: 0,
				clientX: 0,
				clientY: 0,
				ctrlKey: false,
				altLey: false,
				shiftKey: false,
				metaKey: false,
				button: 0,
				relatedTarget: null
			}
			for (var p in props)   { def[p] = props[p];   }
			var event = document.createEvent("MouseEvent");
			event.initMouseEvent(
				def.type, def.bubbles, def.cancelable, def.view, def.detail, def.screenX, def.screenY,
				def.clientX, def.clientY, def.ctrlKey, def.altKey, def.shiftKey, def.metaKey, def.button, def.relatedTarget
			);
			return event;
		}
		ME.prototype = window.MouseEvent.prototype;
		window.MouseEvent = ME;
	}
})();
