SZN.Dom = {
	create:function(tagName,id,className,styleObj) {
		var node = document.createElement(tagName);
		if (id) { node.id = id; }
		if (className) { node.className = className; }
		if (styleObj) for (p in styleObj) {
			node.style[p] = styleObj[p];
		}
		return node;
	},
	
	append:function() { /* takes variable amount of arrays */
		for (var i=0;i<arguments.length;i++) {
			var arr = arguments[i];
			var head = arr[0];
			for (var j=1;j<arr.length;j++) {
				head.appendChild(arr[j]);
			}
		}
	},
	
	isClass:function(element,className) {
		var arr = element.className.split(" ");
		for (var i=0;i<arr.length;i++) { 
			if (arr[i] == className) { return true; } 
		}
		return false;
	},
	
	addClass:function(element,className) {
		if (SZN.Dom.isClass(element,className)) { return; }
		element.className += " "+className;
	},
	
	removeClass:function(element,className) {
		var names = element.className.split(" ");
		var newClassArr = [];
		for (var i=0;i<names.length;i++) {
			if (names[i] != className) { newClassArr.push(names[i]); }
		}
		element.className = newClassArr.join(" ");
	},
	
	clear:function(element) {
		while (element.firstChild) { element.removeChild(element.firstChild); }
	}
}
