/**
 * @overview Prace s VML
 * @version 2.0
 * @author Wendigo, Zara
 */ 
 
/**
 * @class konstruktor
 * @param {number} sirka canvasu v pixelech
 * @param {number} vyska canvasu v pixelech
 * @param {number} <strong>volitelne</strong> rozsah X (pokud neni uvedeno = realWidth)
 * @param {number} <strong>volitelne</strong> rozsah Y (pokud neni uvedeno = realHeight)
*/ 
SZN.VML = SZN.ClassMaker.makeClass({
	NAME: "VML",
	VERSION: "2.0",
	CLASS: "class",
	IMPLEMENT: SZN.Vector
})

SZN.VML.prototype.$constructor = function(realWidth, realHeight, width, height) {
	var el = SZN.cEl("div",false,false,{position:"absolute", width:realWidth+"px", height:realHeight+"px", overflow:"hidden"});

	/** @field {HTMLelement} zaobalovaci div kvuli orezani */
	this.upperDiv = el;
	
	var el2 = document.createElement("vml:group");
	el2.style.position = 'absolute';
	el2.style.top = 0;
	el2.style.left = 0;
	el2.style.width = realWidth + 'px';
	el2.style.height = realHeight + 'px';
	if (typeof width == 'undefined')
		width = realWidth;
	if (typeof height == 'undefined')
		height = realHeight;
	el2.setAttribute('coordorigin', "0 0");
	el2.setAttribute('coordsize', width + " " + height );
	this.upperDiv.appendChild(el2);
	/** @field {VMLelement} vlastni element */
	this.canvas = el2;
};

/**
 * destruktor
 * @method
 */   
SZN.VML.prototype.$destructor = function() {
	this.upperDiv.removeChild(this.canvas);
	this.canvas = null;
};

/**
 * @see SZN.Vector#clear
 */   
SZN.VML.prototype.clear = function() {
	SZN.Dom.clear(this.canvas);
};

/**
 * @see SZN.Vector#getCanvasElement
 */   
SZN.VML.prototype.getCanvasElement = function() {
	return this.upperDiv;
};

/**
 * @see SZN.Vector#rectangle
 */   
SZN.VML.prototype.rectangle = function(corner, dimensions, options) {
	var o = {
		color:"",
		borderColor:"",
		borderWidth:0
	}
	for (var p in options) { o[p] = options[p]; }

	var el = document.createElement("vml:rect");
	el.style.position = 'absolute';
	el.style.left = corner.getX() + 'px';
	el.style.top  =  corner.getY() + 'px';
	el.style.width  = dimensions.getX() +'px';
	el.style.height = dimensions.getY() + 'px';
	
	if (o.color) {
		el.setAttribute('filled', true);
		el.setAttribute('fillColor', o.color);
	} else {
		el.setAttribute('filled', false);
	}

	if (o.borderColor) {
		el.setAttribute('stroked', true);
		el.setAttribute('strokecolor', o.borderColor);
		if (o.borderWidth) { el.setAttribute('strokeweight', o.borderWidth + 'px'); }
	} else {
		el.setAttribute('stroked', false);
	}
	
	this.canvas.appendChild(el);
	return el;
};

/**
 * @see SZN.Vector#circle
 */   
SZN.VML.prototype.circle = function(center, radius, options) {
	var o = {
		color: "",
		borderColor: "",
		borderWidth: 0
	}
	for (var p in options) { o[p] = options[p]; }

	var el = document.createElement("vml:oval");
	el.style.position = 'absolute';
	el.style.left = (center.getX()-radius) + 'px';
	el.style.top  =  (center.getY()-radius) + 'px';
	el.style.width  = (radius*2) +'px';
	el.style.height = (radius*2) + 'px';
	
	if (o.color) {
		el.setAttribute('filled', true);
		el.setAttribute('fillColor', o.color);
	} else {
		el.setAttribute('filled', false);
	}

	if (o.borderColor) {
		el.setAttribute('stroked', true);
		el.setAttribute('strokecolor', o.borderColor);
		if (o.borderWidth) { el.setAttribute('strokeweight', o.borderWidth + 'px'); }
	} else {
		el.setAttribute('stroked', false);
	}
	
	this.canvas.appendChild(el);
	return el;
};

/**
 * @see SZN.Vector#line
 */   
SZN.VML.prototype.line = function(p1, p2, options) {
	var o = {
		color: "#000",
		width: 0,
		opacity: 0
	}
	for (var p in options) { o[p] = options[p]; }

	var el = document.createElement("vml:line");
	el.style.position = 'absolute';
	el.setAttribute('from', p1.join(" "));
	el.setAttribute('to', p2.join(" "));
	el.setAttribute('stroked', true);
	el.setAttribute('strokecolor', o.color);
	if (o.width) { el.setAttribute('strokeweight', o.width + 'px'); }

	var s = SZN.cEl("vml:stroke");
	s.setAttribute("endcap", "round");
	s.setAttribute("joinstyle", "round");
	el.appendChild(s);
	
	if (o.opacity) { s.setAttribute("opacity",o.opacity); }
	
	return el;
};

/**
 * @see SZN.Vector#polyline
 */   
SZN.VML.prototype.polyline = function(points, options) {
	var o = {
		color: "#000",
		width: 0,
		opacity: 0
	}
	for (var p in options) { o[p] = options[p]; }

	var arr = points.map(function(item) { return item.join(" "); });

	var el = document.createElement("vml:polyline");
	el.style.position = 'absolute';
	el.setAttribute('filled', false);
	el.setAttribute('points', arr.join(", "));

	el.setAttribute('stroked', true);
	el.setAttribute('strokecolor', o.color);

	if (o.width) { el.setAttribute('strokeweight', o.width + 'px'); }

	var s = SZN.cEl("vml:stroke");
	s.setAttribute("endcap", "round");
	s.setAttribute("joinstyle", "round");
	el.appendChild(s);
	
	if (o.opacity) { s.setAttribute("opacity",o.opacity); }
	
	this.canvas.appendChild(el);
	return el;
};

/**
 * @see SZN.Vector#polygon
 */   
SZN.VML.prototype.polygon = function(points, options) {
	var o = {
		color: "",
		borderColor: "",
		borderWidth: 0
	}
	for (var p in options) { o[p] = options[p]; }

	var arr = points.map(function(item) { return item.join(" "); });

	var el = document.createElement("vml:polyline");
	el.style.position = 'absolute';
	el.setAttribute('points', arr.join(", "));

	if (o.color) {
		el.setAttribute('filled', true);
		el.setAttribute('fillColor', o.color);
	} else {
		el.setAttribute('filled', false);
	}

	if (o.borderColor) {
		el.setAttribute('stroked', true);
		el.setAttribute('strokecolor', o.borderColor);
		if (o.borderWidth)
			el.setAttribute('strokeweight', o.borderWidth + 'px');
	} else {
		el.setAttribute('stroked', false);
	}
	return el;
};

/**
 * @see SZN.Vector#path
 */   
SZN.VML.prototype.path = function(format, options) {
	var o = {
		color: "#000",
		width: 0,
		opacity: 0
	}
	for (var p in options) { o[p] = options[p]; }
	
	var f = format.replace(/Z/i,"x") + " e";

	var el = document.createElement("vml:shape");
	el.setAttribute('filled', false);
	el.setAttribute('path', f);

	el.style.width = '100%';
	el.style.height = '100%';   
	el.setAttribute('stroked', true);
	el.setAttribute('strokecolor', o.color);
	el.setAttribute('fillcolor', o.color);

	if (o.width) { el.setAttribute('strokeweight', o.width + 'px'); }

	var s = SZN.cEl("vml:stroke");
	s.setAttribute("endcap", "round");
	s.setAttribute("joinstyle", "round");
	el.appendChild(s);
	
	if (o.opacity) { s.setAttribute("opacity",o.opacity); }

	this.canvas.appendChild(el);
	return el;
}
