/**
 * @overview Prace s VML
 * @version 2.0
 * @author Wendigo, Zara
 */ 
 
/**
 * @class konstruktor
 * @see SZN.Vector#$constructor
 */ 
SZN.VML = SZN.ClassMaker.makeClass({
	NAME: "VML",
	VERSION: "2.0",
	CLASS: "class",
	IMPLEMENT: SZN.Vector.Canvas
})

SZN.VML.prototype.$constructor = function(realWidth, realHeight, width, height) {
	var el = SZN.cEl("div",false,false,{position:"absolute", width:realWidth+"px", height:realHeight+"px", overflow:"hidden"});

	/** @field {HTMLelement} zaobalovaci div kvuli orezani */
	this.upperDiv = el;
	
	var el2 = SZN.cEl("vml:group",false,false,{position:"absolute", left:"0px", top:"0px", width: realWidth+"px", height: realHeight+"px"});
	if (typeof width == "undefined") { width = realWidth; }
	if (typeof height == "undefined") { height = realHeight; }
	el2.setAttribute("coordorigin", "0 0");
	el2.setAttribute("coordsize", width + " " + height );
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
 * @see SZN.Vector#getContainer
 */   
SZN.VML.prototype.getContainer = function() {
	return this.upperDiv;
};

/**
 * @see SZN.Vector#getContent
 */   
SZN.VML.prototype.getContent = function() {
	return this.canvas;
};

/**
 * @see SZN.Vector#polyline
 */   
SZN.VML.prototype.polyline = function() {
	var el = document.createElement("vml:polyline");
	el.style.position = "absolute";
	el.setAttribute("filled", false);

	var s = SZN.cEl("vml:stroke");
	s.setAttribute("endcap", "round");
	s.setAttribute("joinstyle", "round");
	el.appendChild(s);
	var s = SZN.cEl("vml:fill");
	el.appendChild(s);

	return el;
};

/**
 * @see SZN.Vector#circle
 */   
SZN.VML.prototype.circle = function() {
	var el = document.createElement("vml:oval");
	el.style.position = "absolute";
	
	el.setAttribute("filled", false);
	el.setAttribute("stroked", false);
	
	var s = SZN.cEl("vml:stroke");
	el.appendChild(s);
	var s = SZN.cEl("vml:fill");
	el.appendChild(s);
	
	return el;
};

/**
 * @see SZN.Vector#polygon
 */   
SZN.VML.prototype.polygon = function() {
	var el = document.createElement("vml:polyline");
	el.style.position = "absolute";

	el.setAttribute("filled", false);
	el.setAttribute("stroked", false);
	
	var s = SZN.cEl("vml:stroke");
	el.appendChild(s);
	s.setAttribute("endcap", "round");
	s.setAttribute("joinstyle", "round");
	var s = SZN.cEl("vml:fill");
	el.appendChild(s);
	
	return el;
};

/**
 * @see SZN.Vector#path
 */   
SZN.VML.prototype.path = function() {
	var el = document.createElement("vml:shape");
	
	el.setAttribute("filled", false);
	el.setAttribute("stroked", false);

	el.style.width = "100%";
	el.style.height = "100%";   

	var s = SZN.cEl("vml:stroke");
	el.appendChild(s);
	s.setAttribute("endcap", "round");
	s.setAttribute("joinstyle", "round");
	var s = SZN.cEl("vml:fill");
	el.appendChild(s);

	return el;
}

/**
 * @see SZN.Vector#setStroke
 */   
SZN.VML.prototype.setStroke = function(element, options) {
	if ("color" in options) { element.setAttribute("strokecolor", options.color); }
	if ("width" in options) { 
		element.setAttribute("stroked", true); 
		element.setAttribute("strokeweight", options.width+"px"); 
	}
	if ("opacity" in options) { element.getElementsByTagName("stroke")[0].setAttribute("opacity", options.opacity); }
}

/**
 * @see SZN.Vector#setFill
 */   
SZN.VML.prototype.setFill = function(element, options) {
	if ("color" in options) { 
		element.setAttribute("filled", true); 
		element.setAttribute("fillcolor", options.color); 
	}
	if ("opacity" in options) { element.getElementsByTagName("fill")[0].setAttribute("opacity", options.opacity); }
}

/**
 * @see SZN.Vector#setCenterRadius
 */   
SZN.VML.prototype.setCenterRadius = function(element, center, radius) {
	element.style.left = (center.getX()-radius) + "px";
	element.style.top  =  (center.getY()-radius) + "px";
	element.style.width  = (radius*2) +"px";
	element.style.height = (radius*2) + "px";
}

/**
 * @see SZN.Vector#setPoints
 */   
SZN.VML.prototype.setPoints = function(element, points, closed) {
	var arr = points.map(function(item) { return item.join(" "); });
	if (closed) { arr.push(points[0].join(" ")); }
	element.setAttribute("points", arr.join(", "));
}

/**
 * @see SZN.Vector#setFormat
 */   
SZN.VML.prototype.setFormat = function(element, format) {
	var f = format.replace(/Z/i,"x") + " e";
	element.setAttribute("path", f);
}
