/**
 * @overview Prace s SVG
 * @version 2.0
 * @author Wendigo, Zara
 */ 
 
/**
 * @class konstruktor
 * @see SZN.Vector#$constructor
 */ 
SZN.SVG = SZN.ClassMaker.makeClass({
	NAME: "SVG",
	VERSION: "2.0",
	CLASS: "class",
	IMPLEMENT: SZN.Vector.Canvas
})

SZN.SVG.prototype.ns = "http://www.w3.org/2000/svg";
SZN.SVG.prototype.xlinkns = "http://www.w3.org/1999/xlink";

SZN.SVG.prototype.$constructor = function(realWidth, realHeight, width, height) {
	var svg = document.createElementNS(this.ns, "svg:svg");
	svg.style.position = "absolute";
	svg.setAttribute("width", realWidth);
	svg.setAttribute("height", realHeight);
	if (typeof width == "undefined") { width = realWidth; }
	if (typeof height == "undefined") { height = realHeight; }
	svg.setAttribute("viewBox", "0 0 " + width + " " + height );
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", this.xlinkns);
	this.canvas = svg;
};

/**
 * destruktor
 * @method
 */   
SZN.SVG.prototype.$destructor = function() {
	this.upperDiv.removeChild(this.canvas);
	this.canvas = null;
};

/**
 * @see SZN.Vector#getContainer
 */   
SZN.SVG.prototype.getContainer = function() {
	return this.canvas;
};

/**
 * @see SZN.Vector#getContent
 */   
SZN.SVG.prototype.getContent = function() {
	return this.canvas;
};

/**
 * @see SZN.Vector#clear
 */   
SZN.SVG.prototype.clear = function() {
	SZN.Dom.clear(this.canvas);
};

/**
 * @see SZN.Vector#polyline
 */   
SZN.SVG.prototype.polyline = function() {
	var el = document.createElementNS(this.ns, "polyline");
	el.setAttribute("fill", "none");
	el.setAttribute("stroke", "none");
	el.setAttribute("stroke-linejoin", "round");
	el.setAttribute("stroke-linecap", "round");

	return el;
};

/**
 * @see SZN.Vector#circle
 */   
SZN.SVG.prototype.circle = function() {
	var el = document.createElementNS(this.ns, "circle");
	el.setAttribute("fill", "none");
	el.setAttribute("stroke", "none");
	return el;
};

/**
 * @see SZN.Vector#polygon
 */   
SZN.SVG.prototype.polygon = function() {
	var el = document.createElementNS(this.ns, "polygon");
	el.setAttribute("fill", "none");
	el.setAttribute("stroke", "none");
	el.setAttribute("stroke-linejoin", "round");
	el.setAttribute("stroke-linecap", "round");
	
	return el;
};

/**
 * @see SZN.Vector#path
 */   
SZN.SVG.prototype.path = function() {
	var el = document.createElementNS(this.ns, "path");
	el.setAttribute("fill", "none");
	el.setAttribute("stroke", "none");
	el.setAttribute("stroke-linejoin", "round");
	el.setAttribute("stroke-linecap", "round");

	return el;
}

/**
 * @see SZN.Vector#text
 */   
SZN.SVG.prototype.text = function() {
	var el = document.createElementNS(this.ns, "text");

	return el;
}

/**
 * @see SZN.Vector#setStroke
 */
SZN.SVG.prototype.setStroke = function(element, options) {
	if ("color" in options) { element.setAttribute("stroke", options.color); }
	if ("opacity" in options) { element.setAttribute("stroke-opacity", options.opacity); }
	if ("width" in options) { element.setAttribute("stroke-width", options.width); }
}

/**
 * @see SZN.Vector#setFill
 */   
SZN.SVG.prototype.setFill = function(element, options) {
	if ("color" in options) { element.setAttribute("fill", options.color); }
	if ("opacity" in options) { element.setAttribute("fill-opacity", options.opacity); }
}

/**
 * @see SZN.Vector#setCenterRadius
 */   
SZN.SVG.prototype.setCenterRadius = function(element, center, radius) {
	element.setAttribute("cx", center.getX());
	element.setAttribute("cy", center.getY());
	element.setAttribute("r", radius);
}

/**
 * @see SZN.Vector#setPoints
 */   
SZN.SVG.prototype.setPoints = function(element, points, closed) {
	var arr = points.map(function(item) { return item.join(" "); });
	element.setAttribute("points", arr.join(", "));
}

/**
 * @see SZN.Vector#setFormat
 */   
SZN.SVG.prototype.setFormat = function(element, format) {
	element.setAttribute("d", format);
}

/**
 * @see SZN.Vector#setText
 */   
SZN.SVG.prototype.setText = function(element, text) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
	var txt = document.createTextNode(text);
	element.appendChild(txt);
}

/**
 * @see SZN.Vector#setPosition
 */   
SZN.SVG.prototype.setPosition = function(element, position) {
	element.setAttribute("x", position.getX());
	element.setAttribute("y", position.getY());
}
