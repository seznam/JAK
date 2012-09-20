/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Prace s VML
 * @version 4.0
 * @author Wendigo, Zara
 */ 

/**
 * Tento soubor obsahuje vetsi mnozstvi hacku, zpusobenych primarne VML nekompatibilitou IE6/7 a IE8rc1. Jmenujme zejmena tyto:
 *
 * 1) namespaces.add MUSI obsahovat treti parametr pro IE8, bez nej se nezapne VML
 * 2) namespaces.add NESMI obsahovat treti parametr pro IE6/7, s nim nefunguji kruhy a kruznice
 * 3) stylesheet s vml\:* MUSI byt pritomen, bez nej se v IE6/7 nerenderuje pruhlednost a oble konce car
 * 4) IE8 neumoznuje zmenu atributu prvku pres setAttribute, ale jen pres primy pristup k vlastnosti
 * 5) IE8 neumi vyrobit vml:shape pres createElement - je nutno pouzit innerHTML nejakeho rodice
 * 6) IE8 nerespektuje podznacky vml:fill a vml:stroke pridane za behu - je nutno je mit pritomny uz pri vyrobe prvku
 * 7) Prvky lze vyrabet pouze v kontejneru, ktery je pripnuty do stranky (proto constructor.tmp)
 * 8) Prvkum lze menit vlastnosti jen pokud jsou pripnuty do stranky (proto constructor.storage)
 * 9) polyline a polygon se spatne tisknou, takze misto nich pouzivame path
 *
 * Dusledek #1: nove prvky se vyrabi pres innerHTML prvku constructor.tmp a pak se presouvaji do constructor.storage, kde
 * se jim daji menit vlastnosti a nebudou prepsany pri tvorbe dalsiho prvku. 
 * 
 * Dusledek #2: Je velmi doporuceno _nemit_ ve strance deklaraci prefixu vml:, nebot bude s nejvetsi pravdepodobnosti stejne spatne.
 * 
 * Zajimavost #1: VML canvas nelze vyrobit drive nez na onload, pokud v dokumentu neni zadny namespace. Toto lze obejit trikem, kdy
 * vyrobime nejaky prazdny namespace (xmlns:test="test").
 * 
 * Zajimavost #2: Zda se, ze VML tiskne (v IE8) jen ty prvky, ktere nejsou prvni v canvasu. Takze tam vzdy jeden prazdny nacpeme.
 */

/**
 * @class VML
 * @augments JAK.Vector.Canvas
 */ 
JAK.VML = JAK.ClassMaker.makeClass({
	NAME: "VML",
	VERSION: "4.0",
	EXTEND: JAK.Vector.Canvas
})

JAK.VML.isSupported = function() {
	return (JAK.Browser.client == "ie");
}

JAK.VML.prototype._styles = ["", "dash", "dot", "dashdot"];
JAK.VML.prototype._lineEnds = ['round', 'square'];

/**
 * @see JAK.Vector.Canvas
 */
JAK.VML.prototype.$constructor = function(width, height) {
    if (JAK.Browser.client == "ie" && !document.namespaces["vml"]) {
		if (document.documentMode && document.documentMode >= 8) {
			document.namespaces.add("vml", "urn:schemas-microsoft-com:vml", "#default#VML");
		} else {
			document.namespaces.add("vml", "urn:schemas-microsoft-com:vml");
		}
		var s = document.createStyleSheet();
		s.cssText = "vml\\:*{behavior:url(#default#VML);";
    }
	
	var storage = JAK.mel("div", null, {display:"none"});
	var tmp = JAK.mel("div", null, {display:"none"});
	document.body.insertBefore(storage, document.body.firstChild);
	document.body.insertBefore(tmp, document.body.firstChild);
	
	this.constructor.storage = storage;
	this.constructor.tmp = tmp;
	
	this.canvas = JAK.mel("div", null, {position:"absolute", overflow:"hidden"});
	this.resize(width, height);
	
	this.clear();
};

/**
 * destruktor
 */   
JAK.VML.prototype.$destructor = function() {
	if (this.canvas.parentNode && this.canvas.parentNode.nodeType == 1) { this.canvas.parentNode.removeChild(this.canvas); }
	this.canvas = null;
};

/**
 * @see JAK.Vector.Canvas#setScale
 */   
JAK.VML.prototype.setScale = function(scale) {
	this.canvas.style.zoom = scale;
}

/**
 * @see JAK.Vector.Canvas#clear
 */   
JAK.VML.prototype.clear = function() {
	JAK.DOM.clear(this.canvas);
	var xxx = this._build("<vml:shape />"); /* v canvasu musi byt nejaky vml prvek, aby fungoval tisk. wtf. */
	this.canvas.appendChild(xxx);
};

/**
 * @see JAK.Vector.Canvas#resize
 */   
JAK.VML.prototype.resize = function(width, height) {
	this.canvas.style.width = width+"px";
	this.canvas.style.height = height+"px";
};

/**
 * @see JAK.Vector.Canvas#getContainer
 */   
JAK.VML.prototype.getContainer = function() {
	return this.canvas;
};

/**
 * @see JAK.Vector.Canvas#getContent
 */   
JAK.VML.prototype.getContent = function() {
	return this.canvas;
};

/**
 * @see JAK.Vector#setContent
 */   
JAK.VML.prototype.setContent = function(content) {
	this.canvas = content;
};


/**
 * @see JAK.Vector.Canvas#path
 */   
JAK.VML.prototype.path = function() {
	var el = this._build("<vml:shape><vml:fill></vml:fill><vml:stroke endcap='round' joinstyle='round'></vml:stroke></vml:shape>");
	
	el.filled = false;
	el.stroked = false;

	el.style.position = "absolute";
	el.style.width = "1px";
	el.style.height = "1px";    
	el.coordsize = "1,1";

	return el;
}

/**
 * @see JAK.Vector.Canvas#polyline
 */   
JAK.VML.prototype.polyline = function() {
	var el = this._build("<vml:polyline><vml:fill></vml:fill><vml:stroke endcap='round' joinstyle='round'></vml:stroke></vml:polyline>");
	el.filled = false;
	el.stroked = false;

	return el;
};

/**
 * @see JAK.Vector.Canvas#polygon
 */   
JAK.VML.prototype.polygon = function() {
	return this.polyline();
};

/**
 * @see JAK.Vector.Canvas#circle
 */   
JAK.VML.prototype.circle = function() {
	var el = this._build("<vml:oval><vml:fill></vml:fill><vml:stroke></vml:stroke></vml:oval>");

	el.style.position = "absolute";
	el.filled = false;
	el.stroked = false;
	
	return el;
};
JAK.VML.prototype.ellipse = JAK.VML.prototype.circle;

/**
 * @see JAK.Vector#group
 */   
JAK.VML.prototype.group = function() {
	return JAK.mel("div");
}

/**
 * @see JAK.Vector.Canvas#setStroke
 */   
JAK.VML.prototype.setStroke = function(element, options) {
	if ("color" in options) { 
		element.strokecolor = options.color; 
	}
	if ("width" in options && options.width) { 
		element.stroked = true;
		element.strokeweight = options.width+"px";
	}
	if ("opacity" in options) {
		element.getElementsByTagName("stroke")[0].opacity = options.opacity; 
	}
	if ("style" in options) {
		element.getElementsByTagName("stroke")[0].dashstyle = this._styles[options.style];
	}
	if ("endCap" in options) {
		element.getElementsByTagName("stroke")[0].endcap = this._lineEnds[options.endCap];
	}
}

/**
 * @see JAK.Vector.Canvas#setFill
 */   
JAK.VML.prototype.setFill = function(element, options) {
	if ("color" in options) { 
		element.filled = true;
		element.fillcolor = options.color;
	}
	if ("opacity" in options) { 
		element.getElementsByTagName("fill")[0].opacity = options.opacity; 
	}
	if ("endCap" in options) {
		element.getElementsByTagName("fill")[0].endcap = this._lineEnds[options.endCap];
	}
}

/**
 * @see JAK.Vector.Canvas#setCenterRadius
 */   
JAK.VML.prototype.setCenterRadius = function(element, center, radius) {
	if (radius instanceof Array) {
		element.style.left = (center.getX()-radius[0]) + "px";
		element.style.top  =  (center.getY()-radius[1]) + "px";
		element.style.width  = (radius[0]*2) +"px";
		element.style.height = (radius[1]*2) + "px";
	} else {
		element.style.left = (center.getX()-radius) + "px";
		element.style.top  =  (center.getY()-radius) + "px";
		element.style.width  = (radius*2) +"px";
		element.style.height = (radius*2) + "px";
	}
}

/**
 * @see JAK.Vector.Canvas#setPoints
 */   
JAK.VML.prototype.setPoints = function(element, points, closed) {
	var arr = [];
	for (var i=0;i<points.length;i++) { arr.push(points[i].join(" ")); }
	if (closed && points.length) { arr.push(points[0].join(" ")); }

	if (!element.points) {
		element.points = arr.join(" ");
	} else {
		element.points.value = arr.join(" ");
	}
}

/**
 * parsovani formatu do datove struktury
 * @param {string} format formatovaci retezec
 */   
JAK.VML.prototype._analyzeFormat = function(format) {
	var data = [];
	var ptr = 0;
	var current = "";
	var obj = false;
	
	while (ptr < format.length) {	
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
 * @param {array} data pole prikazu pro kreslitko
 */   
JAK.VML.prototype._serializeFormat = function(data) {
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
 * @param {array} parameters parametry SVG elipsy
 * @param {vec2d} coords souradnice prvniho bodu
 */   
JAK.VML.prototype._generateArc = function(parameters, coords) {
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
		var s = Math.sqrt(1.0 - numerator/(r1*r1*r2*r2));
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
 * @param {string} format formatovaci retezec
 */   
JAK.VML.prototype._fixFormat = function(format) {
	var coords = new JAK.Vec2d(0,0);
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
			case "z":
			case "Z":
				cmd.command = "X";
			break;
			case "A":
				cmd.command = "AE";
				cmd.parameters = this._generateArc(cmd.parameters, coords);
			break;
		}
	}
	data.push({command:"E", parameters:[]});
	return this._serializeFormat(data);
}

/**
 * Vyrobi prvek v bezpecnem skladisti
 */
JAK.VML.prototype._build = function(str) {
	this.constructor.tmp.innerHTML = str;
	var elm = this.constructor.tmp.firstChild;
	this.constructor.storage.appendChild(elm);
	return elm;
}

/**
 * @see JAK.Vector.Canvas#setFormat
 */   
JAK.VML.prototype.setFormat = function(element, format) {
	var f = this._fixFormat(format);
	element.path = f;
}
