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
	IMPLEMENT: SZN.Vector
})

SZN.SVG.prototype.ns = "http://www.w3.org/2000/svg";
SZN.SVG.prototype.xlinkns = "http://www.w3.org/1999/xlink";

SZN.SVG.prototype.$constructor = function(realWidth, realHeight, width, height) {
	var el = SZN.cEl("div",false,false,{position:"absolute", width:realWidth+"px", height:realHeight+"px", overflow:"hidden"});

	/** @field {HTMLelement} zaobalovaci div kvuli orezani */
	this.upperDiv = el;
	
	var el2 = document.createElementNS(this.ns, "svg:svg");
	el2.setAttribute('width', realWidth);
	el2.setAttribute('height', realHeight);
	if (typeof width == 'undefined') { width = realWidth; }
	if (typeof height == 'undefined') { height = realHeight; }
	el2.setAttribute('viewBox', "0 0 " + width + " " + height );
	el2.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", this.xlinkns);
	this.upperDiv.appendChild(el2);
	/** @field {SVGelement} vlastni element */
	this.canvas = el2;
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
 * @see SZN.Vector#getCanvasElement
 */   
SZN.SVG.prototype.getCanvasElement = function() {
	return this.upperDiv;
};

/**
 * @see SZN.Vector#clear
 */   
SZN.SVG.prototype.clear = function() {
	SZN.Dom.clear(this.canvas);
};

/**
 * @see SZN.Vector#rectangle
 */   
SZN.SVG.prototype.rectangle = function(corner, dimensions, options) {
	var o = {
		color:"",
		borderColor:"",
		borderWidth:0
	}
	for (var p in options) { o[p] = options[p]; }

	var el = document.createElementNS(this.ns, "rect");
	el.setAttribute('x', corner.getX());
	el.setAttribute('y', corner.getY());
	el.setAttribute('width', dimensions.getX());
	el.setAttribute('height', dimensions.getY());

	el.setAttribute("fill", o.color || "none");

	if (o.borderColor) {
		el.setAttribute('stroke', o.borderColor);
		if (o.borderWidth) { el.setAttribute('stroke-width', o.borderWidth); }
	}
	
	this.canvas.appendChild(el);
	return el;
};

/**
 * @see SZN.Vector#circle
 */   
SZN.SVG.prototype.circle = function(center, radius, options) {
	var o = {
		color: "",
		borderColor: "",
		borderWidth: 0
	}
	for (var p in options) { o[p] = options[p]; }
	var el = document.createElementNS(this.ns, "circle");
	el.setAttribute('cx', center.getX());
	el.setAttribute('cy', center.getY());
	el.setAttribute('r', radius);
	
	el.setAttribute("fill", o.color || "none");

	if (o.borderColor) {
		el.setAttribute('stroke', o.borderColor);
		if (o.borderWidth) { el.setAttribute('stroke-width', o.borderWidth); }
	}
	
	this.canvas.appendChild(el);
	return el;
};

/**
 * @see SZN.Vector#line
 */   
SZN.SVG.prototype.line = function(p1, p2, options) {
	var o = {
		color: "#000",
		width: 0,
		opacity: 0
	}
	for (var p in options) { o[p] = options[p]; }

	var el = document.createElementNS(this.ns, "line");
	el.setAttribute('x1', p1.getX());
	el.setAttribute('y1', p1.getY());
	el.setAttribute('x2', p2.getX());
	el.setAttribute('y2', p2.getY());

	el.setAttribute('stroke', o.color);
	el.setAttribute('stroke-linecap', 'round');
	
	if (o.width) { el.setAttribute('stroke-width', o.width); }
	if (o.opacity) { el.setAttribute('stroke-opacity', o.opacity); }
		
	this.canvas.appendChild(el);
	return el;
};

/**
 * @see SZN.Vector#polyline
 */   
SZN.SVG.prototype.polyline = function(points, options) {
	var o = {
		color: "#000",
		width: 0,
		opacity: 0
	}
	for (var p in options) { o[p] = options[p]; }

	var arr = points.map(function(item) { return item.join(" "); });

	var el = document.createElementNS(this.ns, "polyline");
	el.setAttribute('fill', 'none');
	el.setAttribute('points', arr.join(", "));
	el.setAttribute('stroke-linejoin', 'round');
	el.setAttribute('stroke-linecap', 'round');
	el.setAttribute('stroke', o.color);
	if (o.width) { el.setAttribute('stroke-width', o.width); }
	if (o.opacity) { el.setAttribute('stroke-opacity', o.opacity); }
	
	this.canvas.appendChild(el);
	return el;
};

/**
 * @see SZN.Vector#polygon
 */   
SZN.SVG.prototype.polygon = function(points, options) {
	var o = {
		color: "",
		borderColor: "",
		borderWidth: 0
	}
	for (var p in options) { o[p] = options[p]; }

	var arr = points.map(function(item) { return item.join(" "); });
	var el = document.createElementNS(this.ns, "polygon");
	el.setAttribute('points', arr.join(", "));
	
	el.setAttribute("fill", o.color || "none");

	if (o.borderColor) {
		el.setAttribute('stroke-linejoin', 'round');
		el.setAttribute('stroke', o.borderColor);
		if (o.borderWidth) { el.setAttribute('stroke-width', o.borderWidth); }
	}
	
	this.canvas.appendChild(el);
	return el;
};

/**
 * @see SZN.Vector#path
 */   
SZN.SVG.prototype.path = function(format, options) {
	var o = {
		color: "#000",
		width: 0,
		opacity: 0
	}
	for (var p in options) { o[p] = options[p]; }

	var el = document.createElementNS(this.ns, "path");
	el.setAttribute("d", format);

	el.setAttribute('stroke', o.color);
	el.setAttribute('fill', "none");
	if (o.width) { el.setAttribute('stroke-width', o.width); }
	if (o.opacity) { el.setAttribute('stroke-opacity', o.opacity); }
	el.setAttribute('stroke-linecap', 'round');
		
	this.canvas.appendChild(el);
	return el;
}
