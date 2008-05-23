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
	this.canvas = el;
};

/**
 * destruktor
 * @method
 */   
SZN.VML.prototype.$destructor = function() {
	this.canvas.parentNode.removeChild(this.canvas);
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
	return this.canvas;
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

	el.style.position = "absolute";
	el.style.width = "1px";
	el.style.height = "1px";    
	el.setAttribute("coordsize","1,1");

	var s = SZN.cEl("vml:stroke");
	el.appendChild(s);
	s.setAttribute("endcap", "round");
	s.setAttribute("joinstyle", "round");
	var s = SZN.cEl("vml:fill");
	el.appendChild(s);

	return el;
}

/**
 * @see SZN.Vector#text
 */   
SZN.VML.prototype.text = function() {
	var el = document.createElement("vml:rectangle");
	var t = document.createElement("vml:textbox");
	el.style.position = "absolute";
	el.appendChild(t);
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
	element.points.value = arr.join(", ");
}

/**
 * parsovani formatu do datove struktury
 * @method
 * @private
 * @param {string} format formatovaci retezec
 */   
SZN.VML.prototype._analyzeFormat = function(format) {
	var data = [];
	var ptr = 0;
	var current = "";
	var obj = false;
	
	while (ptr < format.length) {	
		if (!current) {
		}
		var ch = format.charAt(ptr);
		if (ch.match(/[a-z]/i)) { /* command */
			if (current) { obj.parameters.push(parseFloat(current)); }
			if (obj) { data.push(obj); }
			obj = {
				command:ch,
				parameters:[]
			}
			current = "";
		} else if (ch.match(/[ ,]/)) { /* separator */
			if (current) { obj.parameters.push(parseFloat(current)); }
			current = "";
		} else { /* numba */
			current += ch;
		}
		ptr++;
	}
	if (current) { obj.parameters.push(parseFloat(current)); }
	if (obj) { data.push(obj); }
	return data;
}


/**
 * serializace datove struktury formatu do retezce
 * @method
 * @private
 * @param {array} data pole prikazu pro kreslitko
 */   
SZN.VML.prototype._serializeFormat = function(data) {
	var s = "";
	for (var i=0;i<data.length;i++) {
		var cmd = data[i];
		var numbers = cmd.parameters.map(function(item) { return Math.round(item); });
		s += cmd.command + " " + numbers.join(" ") + " ";
	}
	return s;
}

/**
 * vypocet kruhove vysece pro VML
 * @method
 * @private
 * @param {array} parameters parametry SVG elipsy
 * @param {vec2d} coords souradnice prvniho bodu
 */   
SZN.VML.prototype._generateArc = function(parameters, coords) {
	function calcAngle(ux, uy, vx, vy) {
		var ta = Math.atan2(uy, ux);
		var tb = Math.atan2(vy, vx);
		if (tb >= ta) { return tb-ta; }
		return 2*Math.PI - (ta-tb);
	}
	
	function fixAngle(angle) {
		var a = angle;
		a = 360 * a / (2*Math.PI);
		return a * (2<<15);
	}

	/* parameters: radius_x, radius_y, x_rotation, large_flag, sweep_flag, end_x, end_y */
	/* output: center_x, center_y, radius_x, radius_y, angle_1, angle_2 */

	var r1 = parameters[0]; var r2 = parameters[1];
	var x = parameters[5]; var y = parameters[6];
	var cx = coords.getX(); var cy = coords.getY();
	var largeArcFlag = parameters[3];
	var sweepFlag = parameters[4];

	var xp, yp, cxp, cyp;
	var angle = parameters[2];

	/* slope fun&games ... see SVG spec, section F.6 */
	angle = angle*Math.PI/180.0;
	xp = Math.cos(angle)*(cx-x)/2.0 + Math.sin(angle)*(cy-y)/2.0;
	yp = -Math.sin(angle)*(cx-x)/2.0 + Math.cos(angle)*(cy-y)/2.0;

	/* make sure radii are large enough */
	var root = 0;
	var numerator = r1*r1*r2*r2 - r1*r1*yp*yp - r2*r2*xp*xp;
	if (numerator < 0.0) {
		var s = sqrt(1.0 - numerator/(r1*r1*r2*r2));
		r1 *= s;
		r2 *= s;
		root = 0.0;
	} else {
		root = Math.sqrt(numerator/(r1*r1*yp*yp + r2*r2*xp*xp));
		if (largeArcFlag == sweepFlag) { 
			root = -root;
		}
	}
	cxp = root*r1*yp/r2;
	cyp = -root*r2*xp/r1;

	var centerX = Math.cos(angle)*cxp - Math.sin(angle)*cyp + (cx+x)/2;
	var centerY = Math.sin(angle)*cxp + Math.cos(angle)*cyp + (cy+y)/2;
	
	var theta = calcAngle(1.0, 0.0,  (xp-cxp)/r1, (yp-cyp)/r2);
	var delta  = calcAngle((xp-cxp)/r1, (yp-cyp)/r2,  (-xp-cxp)/r1, (-yp-cyp)/r2);
	if (!sweepFlag && delta > 0) {
		delta -= 2.0*Math.PI;
	} else if (sweepFlag && delta < 0) {
		delta += 2.0*Math.PI;
	}

	coords.setX(x);
	coords.setY(y);
	return [centerX, centerY, r1, r2, -fixAngle(theta), -fixAngle(delta)];
}

/**
 * prevod formatovaciho retezce z SVG do VML
 * @method
 * @private
 * @param {string} format formatovaci retezec
 */   
SZN.VML.prototype._fixFormat = function(format) {
	var coords = new SZN.Vec2d(0,0);
	var data = this._analyzeFormat(format);
	for (var i=0;i<data.length;i++) {
		var cmd = data[i];
		switch (cmd.command) {
			case "M":
			case "L":
				coords.setX(cmd.parameters[0]);
				coords.setY(cmd.parameters[1]);
			break;
			case "C":
				coords.setX(cmd.parameters[4]);
				coords.setY(cmd.parameters[5]);
			break;
			case "Z":
				cmd.command = "X";
			break;
			case "A":
				cmd.command = "AL";
				cmd.parameters = this._generateArc(cmd.parameters, coords);
			break;
		}
	}
	data.push({command:"E", parameters:[]});
	return this._serializeFormat(data);
}

/**
 * @see SZN.Vector#setFormat
 */   
SZN.VML.prototype.setFormat = function(element, format) {
	var f = this._fixFormat(format);
	var a1 = 180;
	var a2 = -12;
	
	a1 *= 2 <<15;
	a2 *= 2 <<15;
	
	
//	f = " M 166 135 L 167 230 AL 39 198 136 95 23566410 -15918905 L 166 135 E  ";
	element.setAttribute("path", f);
}

/**
 * @see SZN.Vector#setText
 */   
SZN.VML.prototype.setText = function(element, text) {
	var tb = element.getElementsByTagName("textbox")[0];
	while (tb.firstChild) { tb.removeChild(tb.firstChild); }
	var txt = document.createTextNode(text);
	tb.appendChild(txt);
}

/**
 * @see SZN.Vector#setPosition
 */   
SZN.VML.prototype.setPosition = function(element, position) {
	element.style.left = Math.round(position.getX())+"px";
	element.style.top = Math.round(position.getY())+"px";
}
