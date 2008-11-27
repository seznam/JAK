/*
Licencováno pod MIT Licencí

© 2008 Seznam.cz, a.s.

Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.

Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené 
soubory (dále jen „software“) je oprávněn k nakládání se softwarem bez 
jakýchkoli omezení, včetně bez omezení práva software užívat, pořizovat si 
z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě 
(podlicence) či prodávat jeho kopie, za následujících podmínek:

- výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo 
podstatných součástech Softwaru.

- software je poskytován tak jak stojí a leží, tzn. autor neodpovídá 
za jeho vady, jakož i možné následky, ledaže věc nemá vlastnost, o níž autor 
prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.



Licenced under the MIT License

Copyright (c) 2008 Seznam.cz, a.s.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

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

SZN.SVG.prototype.$constructor = function(width, height) {
	var svg = document.createElementNS(this.ns, "svg");
	svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", this.xlinkns);
	
	var g = document.createElementNS(this.ns, "g");
	svg.appendChild(g);

	SZN.Events.addListener(svg,'mousemove',SZN.Events.cancelDef,false,false)
	SZN.Events.addListener(svg,'mousedown',SZN.Events.cancelDef,false,false)
	SZN.Events.addListener(svg,'mouseup',SZN.Events.cancelDef,false,false)

	this.canvas = svg;
	this.g = g;
	
	this.resize(width, height);
};

/**
 * destruktor
 * @method
 */   
SZN.SVG.prototype.$destructor = function() {
	SZN.Events.removeListener(this.canvas,'mousemove',SZN.Events.cancelDef,false,false)
	SZN.Events.removeListener(this.canvas,'mousedown',SZN.Events.cancelDef,false,false)
	SZN.Events.removeListener(this.canvas,'mouseup',SZN.Events.cancelDef,false,false)

	if (this.canvas.parentNode && this.canvas.parentNode.nodeType == 1) { this.canvas.parentNode.removeChild(this.canvas); }
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
	return this.g;
};

/**
 * @see SZN.Vector#clear
 */   
SZN.SVG.prototype.clear = function() {
	SZN.Dom.clear(this.g);
};

/**
 * @see SZN.Vector#resize
 */   
SZN.SVG.prototype.resize = function(width, height) {
	this.canvas.setAttribute("width", width);
	this.canvas.setAttribute("height", height);
};

/**
 * @see SZN.Vector#setScale
 */   
SZN.SVG.prototype.setScale = function(scale) {
	this.g.setAttribute("transform", "scale("+scale+")");
}


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
