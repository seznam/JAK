/**
 * @class Vektorova grafika
 * @static
 */ 
SZN.Vector = SZN.ClassMaker.makeClass({
	NAME:"Vector",
	CLASS:"static",
	VERSION:"1.0"
});

/**
 * @static 
 * @method
 * vrati instanci canvasu
 */   
SZN.Vector.getCanvas = function(w,h,w2,h2) {	
	if (SZN.Browser.client == "ie") {
		return new SZN.VML(w,h,w2,h2);
	} else {
		return new SZN.SVG(w,h,w2,h2);
	}
}

/**
 * @class Vektorovy canvas
 * @param {number} realWidth sirka canvasu v pixelech
 * @param {number} realHeight vyska canvasu v pixelech
 * @param {number} [width] rozsah X (pokud neni uvedeno = realWidth)
 * @param {number} [height] rozsah Y (pokud neni uvedeno = realHeight)
 */ 
SZN.Vector.Canvas = SZN.ClassMaker.makeClass({
	NAME:"Canvas",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Vector.Canvas.prototype.$constructor = function(realWidth, realHeight, width, height) {}

/**
 * @static 
 * smaze canvas
 * @method
 */   
SZN.Vector.Canvas.prototype.clear = function() {}

/**
 * vrati vnejsi obal
 * @method
 */   
SZN.Vector.Canvas.prototype.getContainer = function() {}

/**
 * vrati vnitrni canvas
 * @method
 */   
SZN.Vector.Canvas.prototype.getContent = function() {}

/**
 * nakresli kruh do canvasu
 * @method
 */   
SZN.Vector.Canvas.prototype.circle = function() {}

/**
 * nakresli lomenou caru do canvasu
 * @method
 */   
SZN.Vector.Canvas.prototype.polyline = function() {}

/**
 * nakresli mnohouhelnik do canvasu
 * @method
 */   
SZN.Vector.Canvas.prototype.polygon = function() {}

/**
 * nakresli obecnou caru
 * @method
 */   
SZN.Vector.Canvas.prototype.path = function() {}

/**
 * nakresli textovy retezec
 * @method
 */   
SZN.Vector.Canvas.prototype.text = function() {}

/**
 * zmeni vlastnosti cary prvku
 * @method
 * @param {element} prvek
 * @param {object} options objekt s povolenymi vlastnostmi color, width, opacity
 */   
SZN.Vector.Canvas.prototype.setStroke = function(element, options) {}

/**
 * zmeni vlastnosti vyplne prvku
 * @method
 * @param {element} prvek
 * @param {object} options objekt s povolenymi vlastnostmi color, opacity
 */   
SZN.Vector.Canvas.prototype.setFill = function(element, options) {}

/**
 * zmeni stred a polomer kruhu
 * @method
 * @param {element} prvek
 * @param {vec2d} center novy stred
 * @param {vec2d} radius novy polomer
 */   
SZN.Vector.Canvas.prototype.setCenterRadius = function(element, center, radius) {}

/**
 * zmeni body pro lomenou caru / mnohouhelnik
 * @method
 * @param {element} prvek
 * @param {array} points pole novych bodu
 * @param {bool} closed ma byt utvar uzavreny? jen hack pro debilni vml
 */   
SZN.Vector.Canvas.prototype.setPoints = function(element, points, closed) {}

/**
 * zmeni formatovaci retezec pro path
 * @method
 * @param {element} prvek
 * @param {string} format novy format
 */   
SZN.Vector.Canvas.prototype.setFormat = function(element, format) {}

/**
 * zmeni text retezci
 * @method
 * @param {element} prvek
 * @param {string} text novy format
 */   
SZN.Vector.Canvas.prototype.setText = function(element, text) {}

/**
 * zmeni pozici bloku textu retezci
 * @method
 * @param {element} prvek
 * @param {vec2d} position nova pozice
 */   
SZN.Vector.Canvas.prototype.setPosition = function(element, position) {}

/**
 * spocte kontrolni body
 * @method
 * @param {array} points souradnice bodu
 * @param {object} options volitelne veci, polozky: flat, curvature, join
 */   
SZN.Vector.Canvas.prototype.computeControlPoints = function(points, options) {
	var o = {
		flat:true,
		curvature:20,
		join:false
	}
	for (var p in options) { o[p] = options[p]; }
	
	/* pro tohle nelze spocitat kontrolni body */
	if (points.length < 2 || (points.length == 2 && !o.join)) { return false; }
	
	var result = [];
	var X = false;
	var Y = false;
	var limit = (o.join ? points.length : points.length-1);
	
	for (var i=0;i<limit;i++) {
		var A = points[i];
		if (o.join) { /* continuous -> wrap around */
			var B = (i+1 == points.length ? points[0] : points[i+1]);
			var C = (i+2 >= points.length ? points[i+2 - points.length]: points[i+2]);
		} else {
			var B = points[i+1];
			var C = (i+2 == points.length ? false : points[i+2]);
		}

		if (!C) { /* compute #2 point for last segment */
			var AB = B.minus(A);
			if (o.flat) {
				Y = A.plus(AB.multiply(0.5));
			} else {
				var vAX = X.minus(A);
				var vYB = vAX.symmetry(AB);
				Y = B.minus(vYB);
			}
		} else { /* compute #2 point for normal segment */
			var vAC = C.minus(A);
			var l = vAC.norm();
			var frac = l / o.curvature;
			var vYB = vAC.multiply(1/frac);
			Y = B.minus(vYB);
		}
		
		if (!X) { /* first segment */
			var AB = B.minus(A);
			if (o.join) { /* step back for continuous first segment */
				var D = points[points.length-1];
				var vBD = D.minus(B);
				var l = vBD.norm();
				var frac = l / o.curvature;
				var vXA = vBD.multiply(1/frac);
				X = A.minus(vXA);
			} else if (o.flat) { /* first segment, flat scenario */
				X = A.plus(AB.multiply(0.5));
			} else {
				var vAX = vYB.symmetry(AB);
				X = A.plus(vAX);
			}
		} 

		result.push([X,Y]);
		
		/* this.circle(X,3,{color:"#0ff"}); */
		/* this.circle(Y,3,{color:"#00f"}); */

		X = B.plus(vYB); /* generate next #1 point */
	}
	return result;
}

/**
 * @class Vektorove primitivum
 * @param {object} canvas Canvas pro vykresleni
 */ 
SZN.Vector.Primitive = SZN.ClassMaker.makeClass({
	NAME:"Primitive",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Vector.Primitive.prototype.$constructor = function(canvas) {
	this.canvas = canvas;
	this.elm = false;
}

SZN.Vector.Primitive.prototype.$destructor = function() {
	if (this.elm) { this.elm.parentNode.removeChild(this.elm); }
}

/**
 * @class Cara
 * @param {object} canvas canvas pro vykresleni
 * @param {array} points body cary
 * @param {object} options objekt s povolenymi hodnotami color, width, curvature, opacity, outlineColor, outlineOpacity, outlineWidth
 */ 
SZN.Vector.Line = SZN.ClassMaker.makeClass({
	NAME:"Line",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Vector.Line.prototype.$constructor = function(canvas, points, options) {
	this.canvas = canvas;
	this.elm2 = false;
	this.options = {
		color:"#000",
		width:1,
		curvature:0,
		opacity:1,
		outlineColor:"#fff",
		outlineOpacity:1,
		outlineWidth:0
	}
	for (var p in options) { this.options[p] = options[p]; }

	var o1 = {
		color:this.options.color,
		width:this.options.width,
		opacity:this.options.opacity
	}
	
	if (this.options.outlineWidth) {
		var o2 = {
			color:this.options.outlineColor,
			width:this.options.outlineWidth,
			opacity:this.options.outlineOpacity
		}
	}
	
	if (this.options.curvature && points.length > 2) { /* zakulacena */
		this.elm = this.canvas.path();		
		if (this.options.outlineWidth) { this.elm2 = this.canvas.path(); }
	} else { /* rovna */
		this.elm = this.canvas.polyline();
		if (this.options.outlineWidth) { this.elm2 = this.canvas.polyline(); }
	}
	
	this.canvas.setStroke(this.elm, o1);
	if (this.options.outlineWidth) { 
		this.canvas.setStroke(this.elm2, o2);
		this.canvas.getContent().appendChild(this.elm2); 
	}
	this.canvas.getContent().appendChild(this.elm);	
	this.setPoints(points);
}

SZN.Vector.Line.prototype.$destructor = function() {
	this.elm.parentNode.removeChild(this.elm);
	if (this.elm2) { this.elm2.parentNode.removeChild(this.elm2); }
}

SZN.Vector.Line.prototype.setPoints = function(points) {
	this.points = points;
	
	if (this.options.curvature && this.points.length > 2) {
		var control = this.canvas.computeControlPoints(this.points, {join:false, curvature:this.options.curvature});
		var d = "M "+this.points[0].join(" ");
		var len = this.points.length;
		for (var i=1;i<len;i++) {
			var c = control[i-1];
			var x = c[0];
			var y = c[1];
			var point = this.points[i];
			d += "C "+x.join(" ")+", "+y.join(" ")+", "+point.join(" ")+" ";
		}

		this.canvas.setFormat(this.elm, d);
		if (this.elm2) { this.canvas.setFormat(this.elm2, d); }
	} else {
		this.canvas.setPoints(this.elm, points);
		if (this.elm2) { this.canvas.setPoints(this.elm2, points); }
	}
}

/**
 * @class Mnohouhelnik
 * @param {object} canvas canvas pro vykresleni
 * @param {array} points body mnohouhelniku
 * @param {object} options objekt s povolenymi hodnotami curvature, color, opacity, outlineColor, outlineOpacity, outlineWidth
 */ 
SZN.Vector.Polygon = SZN.ClassMaker.makeClass({
	NAME:"Polygon",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Vector.Polygon.prototype.$constructor = function(canvas, points, options) {
	this.canvas = canvas;

	this.options = {
		color:"#000",
		curvature:0,
		opacity:1,
		outlineColor:"#fff",
		outlineOpacity:1,
		outlineWidth:0
	}
	for (var p in options) { this.options[p] = options[p]; }

	var stroke = {
		color:this.options.outlineColor,
		width:this.options.outlineWidth,
		opacity:this.options.outlineOpacity
	}
	
	var fill = {
		color:this.options.color,
		opacity:this.options.opacity
	}
	
	if (this.options.curvature) { /* zakulacena */
		this.elm = this.canvas.path();		
	} else { /* rovna */
		this.elm = this.canvas.polygon();
	}
	this.setPoints(points);
	this.canvas.setStroke(this.elm, stroke);
	this.canvas.setFill(this.elm, fill);
	
	this.canvas.getContent().appendChild(this.elm);	
}

SZN.Vector.Polygon.prototype.setPoints = function(points) {
	this.points = points;
	if (this.options.curvature) {
		var control = this.canvas.computeControlPoints(this.points, {join:true, curvature:this.options.curvature});
		var d = "M "+this.points[0].join(" ");
		var len = this.points.length;
		for (var i=1;i<len+1;i++) {
			var c = control[i-1];
			var x = c[0];
			var y = c[1];
			var point = (i >= len ? this.points[0] : this.points[i]);
			d += "C "+x.join(" ")+", "+y.join(" ")+", "+point.join(" ")+" ";
		}
		d += "Z";

		this.canvas.setFormat(this.elm, d);
	} else {
		this.canvas.setPoints(this.elm, points, true);
	}
}

/**
 * @class Kruh
 * @param {object} canvas canvas pro vykresleni
 * @param {vec2d} center stred
 * @param {number} radius polomer
 * @param {object} options objekt s povolenymi hodnotami color, opacity, outlineColor, outlineOpacity, outlineWidth
 */ 
SZN.Vector.Circle = SZN.ClassMaker.makeClass({
	NAME:"Circle",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Vector.Circle.prototype.$constructor = function(canvas, center, radius, options) {
	this.canvas = canvas;
	this.center = new SZN.Vec2d(0,0);
	this.radius = 0;
	this.options = {
		color:"",
		opacity:1,
		outlineColor:"#000",
		outlineOpacity:1,
		outlineWidth:1
	}
	for (var p in options) { this.options[p] = options[p]; }

	var stroke = {
		color:this.options.outlineColor,
		width:this.options.outlineWidth,
		opacity:this.options.outlineOpacity
	}
	
	var fill = {
		color:this.options.color,
		opacity:this.options.opacity
	}
	
	this.elm = this.canvas.circle(this.center, this.radius);		
	this.setCenter(center);
	this.setRadius(radius);
	this.canvas.setStroke(this.elm, stroke);
	this.canvas.setFill(this.elm, fill);
	this.canvas.getContent().appendChild(this.elm);	
}

SZN.Vector.Circle.prototype.setCenter = function(center) {
	this.center = center;
	this.canvas.setCenterRadius(this.elm, this.center, this.radius);
}

SZN.Vector.Circle.prototype.setRadius = function(radius) {
	this.radius = radius;
	this.canvas.setCenterRadius(this.elm, this.center, this.radius);
}

/**
 * @class Path
 * @param {object} canvas canvas pro vykresleni
 * @param {string} format formatovaci retezec
 * @param {object} options objekt s povolenymi hodnotami color, opacity, width, outlineColor, outlineOpacity, outlineWidth
 */ 
SZN.Vector.Path = SZN.ClassMaker.makeClass({
	NAME:"Path",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Vector.Path.prototype.$constructor = function(canvas, format, options) {
	this.canvas = canvas;
	this.elm2 = false;
	this.options = {
		color:"none",
		opacity:1,
		width:0,
		outlineColor:"#fff",
		outlineOpacity:1,
		outlineWidth:1
	}
	for (var p in options) { this.options[p] = options[p]; }

	var stroke = {
		color:this.options.outlineColor,
		width:this.options.outlineWidth,
		opacity:this.options.outlineOpacity
	}
	
	var fill = {
		width:this.options.width,
		color:this.options.color,
		opacity:this.options.opacity
	}

	var two = this.options.width && !format.match(/z/i); /* dva prvky jen pokud je to neuzavrene a oramovane */
	
	this.elm = this.canvas.path();
	this.setFormat(format);

	if (two) {
		this.elm2 = this.canvas.path(); 
		this.setFormat(format);
		this.canvas.setStroke(this.elm, fill);
		this.canvas.setStroke(this.elm2, stroke);
	} else {
		this.canvas.setStroke(this.elm, stroke);
		this.canvas.setFill(this.elm, fill);
	}
	
	if (this.elm2) { this.canvas.getContent().appendChild(this.elm2); }
	this.canvas.getContent().appendChild(this.elm);	
}

SZN.Vector.Path.prototype.$destructor = function() {
	this.elm.parentNode.removeChild(this.elm);
	if (this.elm2) { this.elm2.parentNode.removeChild(this.elm2); }
}

SZN.Vector.Path.prototype.setFormat = function(format) {
	this.canvas.setFormat(this.elm, format);
	if (this.elm2) { this.canvas.setFormat(this.elm2, format); }
}


/**
 * @class Path
 * @param {object} canvas canvas pro vykresleni
 * @param {string} format formatovaci retezec
 * @param {object} options objekt s povolenymi hodnotami color, opacity, width, outlineColor, outlineOpacity, outlineWidth
 */ 
SZN.Vector.Text = SZN.ClassMaker.makeClass({
	NAME:"Text",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Vector.Text.prototype.$constructor = function(canvas, position, text, options) {
	this.canvas = canvas;
	this.elm2 = false;
	this.options = {
		color:"#000"
	}
	for (var p in options) { this.options[p] = options[p]; }

	this.elm = this.canvas.text();
	this.setPosition(position);
	this.setText(text);

	this.canvas.getContent().appendChild(this.elm);	
}

SZN.Vector.Text.prototype.setText = function(text) {
	this.text = text;
	this.canvas.setText(this.elm, this.text);
}

SZN.Vector.Text.prototype.setPosition = function(position) {
	this.position = position;
	this.canvas.setPosition(this.elm, this.position);
}
