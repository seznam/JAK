/*
 * ChildNode polyfill
 * specifications: https://developer.mozilla.org/en-US/docs/Web/API/ChildNode
 * version: 1.0
 * author: filip.mosner@firma.seznam.cz
 */
;(function() {
	var buildDOM = function() {
		var nodes = Array.prototype.slice.call(arguments),
			frag = document.createDocumentFragment(),
			div, node;

		while (node = nodes.shift()) {
			if (typeof node == "string") {
				div = document.createElement("div");
				div.innerHTML = node;
				while (div.firstChild) {
					frag.appendChild(div.firstChild);
				}
			} else {
				frag.appendChild(node);
			}
		}

		return frag;
	};

	var proto = {
		before: function() {
			var frag = buildDOM.apply(this, arguments);
			this.parentNode.insertBefore(frag, this);
		},
		after: function() {
			var frag = buildDOM.apply(this, arguments);
			this.parentNode.insertBefore(frag, this.nextSibling);
		},
		replaceWith: function() {
			if (this.parentNode) {
				var frag = buildDOM.apply(this, arguments);
				this.parentNode.replaceChild(frag, this);
			}
		},
		remove: function() {
			if (this.parentNode) {
				this.parentNode.removeChild(this);
			}
		}
	};

	var a = ["Element", "DocumentType", "CharacterData"]; // interface
	var b = ["before", "after", "replaceWith", "remove"]; // methods
	a.forEach(function(v) {
		b.forEach(function(func) {
			if (window[v]) {
				if (window[v].prototype[func]) { return; }
				window[v].prototype[func] = proto[func];
			}
		});
	});
})();
