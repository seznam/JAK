JAK.Chart.Backend.SVG = JAK.ClassMaker.makeClass({
	NAME: "JAK.Chart.Backend.SVG",
	VERSION: "0.1",
	EXTEND: JAK.Chart.Backend
})

JAK.Chart.Backend.SVG.prototype.ns = "http://www.w3.org/2000/svg";
JAK.Chart.Backend.SVG.prototype.xlinkns = "http://www.w3.org/1999/xlink";
JAK.Chart.Backend.SVG.prototype.stylesConvertTable = {
	left:"start",
	center: "middle",
	right:"end",
	start: "start",
	end:"end"
}

JAK.Chart.Backend.SVG.prototype.$constructor = function(width, height, styles) {
	var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	//svg.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", this.xlinkns);

	var g = document.createElementNS(this.ns, "g");
	g.setAttribute("class","mainGroup");
	svg.appendChild(g);

	this._ec = [];
	this._ec.push(JAK.Events.addListener(svg,'mousemove',JAK.Events.cancelDef));
	this._ec.push(JAK.Events.addListener(svg,'mouseout',JAK.Events.cancelDef));
	this._ec.push(JAK.Events.addListener(svg,'mouseover',JAK.Events.cancelDef));

	svg.style.zIndex = 100;
	svg.style.position = "absolute";

	this._canvas = svg;
	this._g = g;

	this._def = null;
	/*this._f = this._filters(styles);*/

	this.$super(width,height,styles);
}

JAK.Chart.Backend.SVG.prototype.$destructor = function() {
	this._ec.forEach(JAK.Events.removeListener, JAK.Events);
	this._ec = [];
	if (this.canvas.parentNode && this.canvas.parentNode.nodeType == 1) { this.canvas.parentNode.removeChild(this._canvas); }
	this._canvas = null;
}

JAK.Chart.Backend.SVG.prototype._click = function(event) {
	this.makeEvent("click", {originalEvent: event, id: event.target.id});
};

JAK.Chart.Backend.SVG.prototype._mousedown = function(event) {
	this.makeEvent("mouseDown", {originalEvent: event, id: event.target.id});
};

JAK.Chart.Backend.SVG.prototype._mouseup = function(event) {
	this.makeEvent("mouseUp", {originalEvent: event, id: event.target.id});
};

JAK.Chart.Backend.SVG.prototype._mousemove = function(event) {
	if(event.target.id) {
		this.makeEvent("mouseMove", {originalEvent: event, id: event.target.id});
	}
	this.makeEvent("canvasMouseMove", {originalEvent: event});
};

JAK.Chart.Backend.SVG.prototype._mouseout = function(event) {
	if(event.target.id) {
		this.makeEvent("mouseOut", {originalEvent: event, id: event.target.id});
	}
	this.makeEvent("canvasMouseOut", {originalEvent: event});
};

JAK.Chart.Backend.SVG.prototype._mouseover = function(event) {
	if(event.target.id) {
		this.makeEvent("mouseOver", {originalEvent: event, id: event.target.id});
	}
	this.makeEvent("canvasMouseOver", {originalEvent: event});
};

JAK.Chart.Backend.SVG.prototype._doubleclick = function(event) {
	if(event.target.id) {
		this.makeEvent("doubleClick", {originalEvent: event, id: event.target.id});
	}
	this.makeEvent("canvasDoubleClick", {originalEvent: event});
};

JAK.Chart.Backend.SVG.prototype._touchstart = function(event) {
	this.makeEvent("touchStart", {originalEvent: event, id: event.target.id});
};

JAK.Chart.Backend.SVG.prototype._touchend = function(event) {
	this.makeEvent("touchEnd", {originalEvent: event, id: event.target.id});
};

JAK.Chart.Backend.SVG.prototype._gesturechange = function(event) {
	this.makeEvent("gestureChange", {originalEvent: event, id: event.target.id});
};

JAK.Chart.Backend.SVG.prototype.clear = function() {
	JAK.DOM.clear(this._g);
}
JAK.Chart.Backend.SVG.prototype.resize = function(width, height) {
	this._canvas.setAttribute("width", width);
	this._canvas.setAttribute("height", height);
}
JAK.Chart.Backend.SVG.prototype.setScale = function(scale) {
	this._g.setAttribute("transform", "scale("+scale+")");
}
JAK.Chart.Backend.SVG.prototype.getContainer = function() {
	return this._canvas;
}
JAK.Chart.Backend.SVG.prototype.getContent = function() {
	return this._g;
}
JAK.Chart.Backend.SVG.prototype.drawPolyline = function(coords, styles, group, className) {
	if(typeof(styles) == "object") { styles.fillColor = "none";} else { styles = {fillColor:"none"}}
	var el = this._createElement("polyline");
	this._drawPoints(el, coords);
	this._applyStyles(el,styles);

	if (className) { el.setAttribute("class", className); }

	if (group) {group.appendChild(el);}
	else {this._g.appendChild(el);}

	return el.id;
}

JAK.Chart.Backend.SVG.prototype.drawRect = function(x, y, width, height, styles, group, className) {
	var el = this._createElement("rect");

	el.setAttribute("x", x);
	el.setAttribute("y", y);
	el.setAttribute("width", width);
	el.setAttribute("height", height);
	this._applyStyles(el,styles);

	if (className) { el.setAttribute("class", className); }

	if (group) {group.appendChild(el);}
	else {this._g.appendChild(el);}

	return el.id;
}

JAK.Chart.Backend.SVG.prototype.drawCircle = function(x,y,radius, styles, group, className) {
	var el = this._createElement("circle");

	el.setAttribute("cx", x);
	el.setAttribute("cy", y);
	el.setAttribute("r", radius);
	this._applyStyles(el,styles);

	if (className) { el.setAttribute("Class", className); }

	if (group) {group.appendChild(el);}
	else {this._g.appendChild(el);}

	return el.id;
}

JAK.Chart.Backend.SVG.prototype.drawPolygon = function(coords, styles, group, className) {
	var el = this._createElement("polygon");

	this._drawPoints(el,coords);
	this._applyStyles(el,styles);

	if (className) { el.setAttribute("class", className); }

	if (group) {group.appendChild(el);}
	else {this._g.appendChild(el);}

	return el.id;
}

JAK.Chart.Backend.SVG.prototype.drawPath = function(coords, styles, group, className) {
	var el = this._createElement("path");

	points = [];
	for(var i = 0; i < coords.length; i++) {
		var step = coords[i];
		points.push(step.join(" "));
	}
	var path = points.join(" ");

	el.setAttribute("d", path);

	this._applyStyles(el,styles);

	if (className) { el.setAttribute("class", className); }

	if (group) {group.appendChild(el);}
	else {this._g.appendChild(el);}

	return el.id;
}

JAK.Chart.Backend.SVG.prototype.drawText = function(coords, text, styles, group, removeId) {
	styles = JAK.Chart.Backend.prototype._applyStyles.bind(this)(styles)

	var el = this._createElement("text");

	el.setAttribute("x", coords[0]);
	el.setAttribute("y", coords[1]);

	el.setAttribute("text-anchor", this.stylesConvertTable[styles.textAlign]);
	el.setAttribute("dominant-baseline", styles.textBaseline);
	el.setAttribute("font-family", styles.fontFamily);
	el.setAttribute("font-size", styles.fontSize);
	el.setAttribute("fill", styles.fillColor);
	el.setAttribute("fill-opacity", styles.fillOpacity);

	JAK.DOM.setStyle(el, styles.style);

	el.textContent = text;

	// this._applyStyles(el,styles);

	if ( group ) {group.appendChild(el);}
	else {this._g.appendChild(el);}

	if ( removeId ) {el.id="";}

	/*var el = document.createElement("span");
	el.textContent = text;
	group.appendChild(el);*/

	return el.id;
};

JAK.Chart.Backend.SVG.prototype.createGroup = function() {
	var el = this._createElement("g");

	this._g.appendChild(el);

	return [el.id, el];
}

JAK.Chart.Backend.SVG.prototype.createClip = function() {
	var el = this._createElement("clipPath");

	this._g.appendChild(el);

	return [el.id, el];
}

JAK.Chart.Backend.SVG.prototype._drawPoints = function(el, coords) {
	var arr = coords.map(function(item) { return item.join(" "); });
	el.setAttribute("points", arr.join(", "));
	return el;
}

JAK.Chart.Backend.SVG.prototype._applyStyles = function(el, styles) {
	var s = this.$super(styles);

	el.setAttribute("stroke-width", s.lineWidth);
	el.setAttribute("stroke", s.strokeColor);
	el.setAttribute("stroke-opacity", s.strokeOpacity);
	el.setAttribute("stroke-linejoin", s.lineJoin);
	el.setAttribute("stroke-linecap", s.lineCap);
	el.setAttribute("fill", s.fillColor);
	el.setAttribute("fill-opacity", s.fillOpacity);

	return s;
}

JAK.Chart.Backend.SVG.prototype._createElement = function(elementName) {
	var el = document.createElementNS(this.ns, elementName);
	var id = JAK.idGenerator();
	el.setAttribute('id', id);
	return el;
}