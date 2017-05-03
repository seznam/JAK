/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Vektorova grafika
 * @group jak-utils
 * @namespace
 */ 
JAK.Vector = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Vector",
	VERSION: "2.0",
	DEPEND:[{
		sClass:JAK.Vec2d,
		ver: "2.0"
	}]
});

JAK.Vector.STYLE_SOLID		= 0;
JAK.Vector.STYLE_DASH		= 1;
JAK.Vector.STYLE_DOT		= 2;
JAK.Vector.STYLE_DASHDOT	= 3;

JAK.Vector.END_STYLE_ROUND	= 0;
JAK.Vector.END_STYLE_SQUARE	= 1;

/**
 * @static 
 * vrati instanci canvasu
 */   
JAK.Vector.getCanvas = function(w,h) {
	if (JAK.SVG.isSupported()) {
		return new JAK.SVG(w, h);
	} else if (JAK.VML.isSupported(w, h)) {
		return new JAK.VML(w, h);
	} else {
		return new JAK.Vector.Canvas(w, h);
	}
}

/**
 * @class Vektorovy canvas
 * @group jak-utils
 */ 
JAK.Vector.Canvas = JAK.ClassMaker.makeClass({
	NAME: "JAK.Vector.Canvas",
	VERSION: "1.0"
});

/**
 * @param {int} width sirka canvasu v pixelech
 * @param {int} height vyska canvasu v pixelech
 */
JAK.Vector.Canvas.prototype.$constructor = function(width, height) {
	this._container = JAK.mel("div");
}

/**
 * smaze canvas
 */   
JAK.Vector.Canvas.prototype.clear = function() {}

/**
 * zmeni rozmery canvasu; nijak neovlivni velikost prvku v nem (pretekajici se oriznou)
 * @param {int} width sirka canvasu
 * @param {int} height vyska canvasu
 */   
JAK.Vector.Canvas.prototype.resize = function(width, height) {}

/**
 * nastavi meritko (proporcionalne) prvkum v canvasu
 * @param {float} scale koeficient velikosti (1 = puvodni velikost)
 */   
JAK.Vector.Canvas.prototype.setScale = function(scale) {}

/**
 * vrati vnejsi obal
 */   
JAK.Vector.Canvas.prototype.getContainer = function() { return this._container; }

/**
 * vrati vnitrni canvas
 */   
JAK.Vector.Canvas.prototype.getContent = function() { return this._container; }

/**
 * nastavi vnitrni canvas, tj. misto, kde vznikaji prvky
 */   
JAK.Vector.Canvas.prototype.setContent = function(content) {}

/**
 * nakresli kruh do canvasu
 */   
JAK.Vector.Canvas.prototype.circle = function() {}

/**
 * nakresli elipsu do canvasu
 */   
JAK.Vector.Canvas.prototype.ellipse = function() {}

/**
 * nakresli lomenou caru do canvasu
 */   
JAK.Vector.Canvas.prototype.polyline = function() {}

/**
 * nakresli mnohouhelnik do canvasu
 */   
JAK.Vector.Canvas.prototype.polygon = function() {}

/**
 * nakresli obecnou caru
 */   
JAK.Vector.Canvas.prototype.path = function() {}

/**
 * vyrobi nejaky seskupovaci prvek
 */   
JAK.Vector.Canvas.prototype.group = function() { return JAK.mel("div"); }

/**
 * zmeni vlastnosti cary prvku
 * @param {node} prvek
 * @param {object} options objekt s povolenymi vlastnostmi color, width, opacity, style
 */   
JAK.Vector.Canvas.prototype.setStroke = function(element, options) {}

/**
 * zmeni vlastnosti vyplne prvku
 * @param {node} prvek
 * @param {object} options objekt s povolenymi vlastnostmi color, opacity
 */   
JAK.Vector.Canvas.prototype.setFill = function(element, options) {}

/**
 * zmeni stred a polomer kruhu
 * @param {node} prvek
 * @param {JAK.Vec2d} center novy stred
 * @param {JAK.Vec2d} radius novy polomer
 */   
JAK.Vector.Canvas.prototype.setCenterRadius = function(element, center, radius) {}

/**
 * zmeni body pro lomenou caru / mnohouhelnik
 * @param {node} prvek
 * @param {SNZ.Vec2d[]} points pole novych bodu
 * @param {bool} closed ma byt utvar uzavreny? jen hack pro debilni vml
 */   
JAK.Vector.Canvas.prototype.setPoints = function(element, points, closed) {}

/**
 * zmeni formatovaci retezec pro path
 * @param {node} prvek
 * @param {string} format novy format
 */   
JAK.Vector.Canvas.prototype.setFormat = function(element, format) {}

/**
 * zmeni title prvku
 * @param {node} prvek
 * @param {string} title novy title
 */   
JAK.Vector.Canvas.prototype.setTitle = function(element, title) {
	element.setAttribute("title", title);
}

/**
 * spocte kontrolni body
 * @param {JAK.Vec2d[]} points souradnice bodu
 * @param {object} options volitelne veci, polozky: flat, curvature, join
 */   
JAK.Vector.Canvas.prototype.computeControlPointsSymmetric = function(points, options) {
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
			if (!frac) { frac = Infinity; }
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
				if (!frac) { frac = Infinity; }
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
		
		//new JAK.Vector.Circle(this,X,3,{color:"#0ff"});
		//new JAK.Vector.Circle(this,Y,3,{color:"#0ff"});

		X = B.plus(vYB); /* generate next #1 point */
	}
	return result;
}

/**
 * spocte kontrolni body
 * @param {JAK.Vec2d[]} points souradnice bodu
 * @param {object} options volitelne veci, polozky: flat, curvature, join
 */   
JAK.Vector.Canvas.prototype.computeControlPoints = function(points, options) {
	var o = {
		flat:true,
		curvature:20,
		join:false
	}
	for (var p in options) { o[p] = options[p]; }
	o.curvature = o.curvature / 100;
	
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
			var D = (i ? points[i-1] : points[points.length-1]);
		} else {
			var B = points[i+1];
			var C = (i+2 == points.length ? false : points[i+2]);
			var D = (i ? points[i-1] : false);
		}

		var AB = B.minus(A);
		if (!C) { /* compute #2 point for last segment */
			if (o.flat) {
				Y = A.plus(AB.multiply(0.5));
			} else {
				var vAX = X.minus(A);
				var vYB = vAX.symmetry(AB);
				Y = B.minus(vYB);
			}
		} else { /* compute #2 point for normal segment */
			var vAC = C.minus(A);
			var dist = AB.norm() * o.curvature;
			var norm = vAC.norm();
			var vYB = vAC.multiply(dist / norm || 0);
			Y = B.minus(vYB);
		}
		
		if (D) { /* first point for non-first segment */
			var vBD = D.minus(B);
			var vBA = B.minus(A);
			var dist = vBA.norm() * o.curvature;
			var norm = vBD.norm();
			var vXA = vBD.multiply(dist / norm || 0);
			X = A.minus(vXA);
		} else if (o.flat) { /* first segment, flat scenario */
			X = A.plus(AB.multiply(0.5));
		} else {
			var vAX = vYB.symmetry(AB);
			X = A.plus(vAX);
		}
		
		
		result.push([X,Y]);
		
		//new JAK.Vector.Circle(this,X,3,{color:"#0ff"});
		//new JAK.Vector.Circle(this,Y,3,{color:"#0ff"});
	}
	return result;
}

/**
 * @class Vektorove primitivum
 * @group jak-utils
 */ 
JAK.Vector.Primitive = JAK.ClassMaker.makeClass({
	NAME: "JAK.Vector.Primitive",
	VERSION: "1.0"
});

/**
 * @param {object} canvas Canvas pro vykresleni
 */
JAK.Vector.Primitive.prototype.$constructor = function(canvas) {
	this.canvas = canvas;
	this.elm = null;
	this.elm2 = null;
}

JAK.Vector.Primitive.prototype.getNodes = function() {
	var arr = [this.elm];
	if (this.elm2) { arr.push(this.elm2); }
	return arr;
}

JAK.Vector.Primitive.prototype.$destructor = function() {
	if (this.elm && this.elm.parentNode && this.elm.parentNode.nodeType == 1) { this.elm.parentNode.removeChild(this.elm); }
	if (this.elm2 && this.elm2.parentNode && this.elm2.parentNode.nodeType == 1) { this.elm2.parentNode.removeChild(this.elm2); }
}

/**
 * @class Cara
 * @augments JAK.Vector.Primitive
 */ 
JAK.Vector.Line = JAK.ClassMaker.makeClass({
	NAME: "JAK.Vector.Line",
	VERSION: "1.0",
	EXTEND: JAK.Vector.Primitive
});

/**
 * @param {object} canvas canvas pro vykresleni
 * @param {JAK.Vec2d[]} points body cary
 * @param {object} options objekt s povolenymi hodnotami color, width, curvature, opacity, style, outlineColor, outlineOpacity, outlineWidth, outlineStyle, title
 */
JAK.Vector.Line.prototype.$constructor = function(canvas, points, options) {
	this.canvas = canvas;
	this.elm2 = null;
	this.options = {
		color:"#000",
		width:1,
		curvature:0,
		opacity:1,
		style:JAK.Vector.STYLE_SOLID,
		outlineColor:"#fff",
		outlineOpacity:1,
		outlineWidth:0,
		outlineStyle:JAK.Vector.STYLE_SOLID,
		title:"",
		symmetricCP:true
	}
	for (var p in options) { this.options[p] = options[p]; }

	this._build(points);
}

JAK.Vector.Line.prototype._build = function(points) {
	if (this.elm) { this.elm.parentNode.removeChild(this.elm); }
	if (this.elm2) { this.elm2.parentNode.removeChild(this.elm2); }
	
	if (this.options.curvature) { /* zakulacena */
		this.elm = this.canvas.path();		
		if (this.options.outlineWidth) { this.elm2 = this.canvas.path(); }
	} else { /* rovna */
		this.elm = this.canvas.polyline();
		if (this.options.outlineWidth) { this.elm2 = this.canvas.polyline(); }
	}
	
	this.canvas.setTitle(this.elm, this.options.title);
	if (this.options.outlineWidth) { 
		this.canvas.setTitle(this.elm2, this.options.title);
		this.canvas.getContent().appendChild(this.elm2); 
	}
	this.canvas.getContent().appendChild(this.elm);	

	this.setPoints(points);
	this.setOptions(this.options);
}

JAK.Vector.Line.prototype.setCurvature = function(c) {
	if (!!this.options.curvature != !!c) {
		this.options.curvature = c;
		this._build(this.points);
	} else {
		this.options.curvature = c;
		this.setPoints(this.points);
	}
}

JAK.Vector.Line.prototype.$destructor = function() {
	if (this.elm.parentNode && this.elm.parentNode.nodeType == 1) { this.elm.parentNode.removeChild(this.elm); }
	if (this.elm2 && this.elm2.parentNode && this.elm2.parentNode.nodeType == 1) { this.elm2.parentNode.removeChild(this.elm2); }
}

JAK.Vector.Line.prototype.setPoints = function(points) {
	this.points = points;
	
	if (this.options.curvature) {
		var d = "M "+this.points[0].join(" ");
		var len = this.points.length;
		if (len > 2) {
			if (this.options.symmetricCP) {
				var control = this.canvas.computeControlPointsSymmetric(this.points, {join:false, curvature:this.options.curvature});
			} else {
				var control = this.canvas.computeControlPoints(this.points, {join:false, curvature:this.options.curvature});
			}
			for (var i=1;i<len;i++) {
				var c = control[i-1];
				var x = c[0];
				var y = c[1];
				var point = this.points[i];
				d += "C "+x.join(" ")+", "+y.join(" ")+", "+point.join(" ")+" ";
			}
		} else {
			for (var i=1;i<len;i++) {
				var point = this.points[i];
				d += "L  "+point.join(" ")+" ";
			}
		}

		this.canvas.setFormat(this.elm, d);
		if (this.elm2) { this.canvas.setFormat(this.elm2, d); }
	} else {
		this.canvas.setPoints(this.elm, points);
		if (this.elm2) { this.canvas.setPoints(this.elm2, points); }
	}
}

JAK.Vector.Line.prototype.setOptions = function(options) {
	var o = {};
	if ("width" in options) { o.width = options.width; this.options.width = options.width; }
	if ("opacity" in options) { o.opacity = options.opacity; }
	if ("color" in options) { o.color = options.color; }
	if ("style" in options) { o.style = options.style; }
	if ("endCap" in options) { o.endCap = options.endCap; }
	if ("exactStyle" in options) { o.exactStyle = options.exactStyle; }
	this.canvas.setStroke(this.elm, o);
	
	if (this.elm2) {
		o = {};
		if ("outlineWidth" in options) { o.width = 2*options.outlineWidth + this.options.width; }
		if ("outlineOpacity" in options) { o.opacity = options.outlineOpacity; }
		if ("outlineColor" in options) { o.color = options.outlineColor; }
		if ("outlineStyle" in options) { o.style = options.outlineStyle; }
		if ("outlineEndCap" in options) { o.endCap = options.outlineEndCap; }
		if ("outlineExactStyle" in options) { o.exactStyle = options.outlineExactStyle; }
		this.canvas.setStroke(this.elm2, o);
	}
}

/**
 * @class Mnohouhelnik
 * @augments JAK.Vector.Primitive
 */ 
JAK.Vector.Polygon = JAK.ClassMaker.makeClass({
	NAME: "JAK.Vector.Polygon",
	VERSION: "1.0",
	EXTEND: JAK.Vector.Primitive
});

/**
 * @param {object} canvas canvas pro vykresleni
 * @param {JAK.Vec2d[]} points body mnohouhelniku
 * @param {object} options objekt s povolenymi hodnotami curvature, color, opacity, outlineColor, outlineOpacity, outlineWidth, outlineStyle, title
 */
JAK.Vector.Polygon.prototype.$constructor = function(canvas, points, options) {
	this.canvas = canvas;

	this.options = {
		color:"#000",
		curvature:0,
		opacity:1,
		outlineColor:"#fff",
		outlineOpacity:1,
		outlineWidth:0,
		outlineStyle:JAK.Vector.STYLE_SOLID,
		title:"",
		symmetricCP:true
	}
	for (var p in options) { this.options[p] = options[p]; }

	this._build(points);
}

JAK.Vector.Polygon.prototype._build = function(points) {
	if (this.elm) { this.elm.parentNode.removeChild(this.elm); }

	if (this.options.curvature) { /* zakulacena */
		this.elm = this.canvas.path();		
	} else { /* rovna */
		this.elm = this.canvas.polygon();
	}
	this.canvas.setTitle(this.elm, this.options.title);
	
	this.canvas.getContent().appendChild(this.elm);	
	this.setPoints(points);
	this.setOptions(this.options);
}

JAK.Vector.Polygon.prototype.setPoints = function(points) {
	this.points = points;
	if (this.options.curvature) {
		if (this.options.symmetricCP) {
			var control = this.canvas.computeControlPointsSymmetric(this.points, {join:true, curvature:this.options.curvature});
		} else {
			var control = this.canvas.computeControlPoints(this.points, {join:true, curvature:this.options.curvature});
		}
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

JAK.Vector.Polygon.prototype.setOptions = function(options) {
	var stroke = {};
	if ("outlineColor" in options) { stroke.color = options.outlineColor; }
	if ("outlineWidth" in options) { stroke.width = options.outlineWidth; }
	if ("outlineOpacity" in options) { stroke.opacity = options.outlineOpacity; }
	if ("outlineStyle" in options) { stroke.style = options.outlineStyle; }
	if ("outlineEndCap" in options) { stroke.endCap = options.outlineEndCap; }
	if ("outlineExactStyle" in options) { stroke.exactStyle = options.outlineExactStyle; }
	
	var fill = {};
	if ("color" in options) { fill.color = options.color; }
	if ("opacity" in options) { fill.opacity = options.opacity; }
	if ("fillRule" in options) { fill.fillRule = options.fillRule; }
	
	this.canvas.setStroke(this.elm, stroke);
	this.canvas.setFill(this.elm, fill);
}

JAK.Vector.Polygon.prototype.setCurvature = function(c) {
	if (!!this.options.curvature != !!c) {
		this.options.curvature = c;
		this._build(this.points);
	} else {
		this.options.curvature = c;
		this.setPoints(this.points);
	}
}

/**
 * @class Kruh
 * @augments JAK.Vector.Primitive
 */ 
JAK.Vector.Circle = JAK.ClassMaker.makeClass({
	NAME: "JAK.Vector.Circle",
	VERSION: "1.0",
	EXTEND: JAK.Vector.Primitive
});

JAK.Vector.Circle.prototype._method = "circle";

/**
 * @param {object} canvas canvas pro vykresleni
 * @param {JAK.Vec2d} center stred
 * @param {float} radius polomer
 * @param {object} options objekt s povolenymi hodnotami color, opacity, outlineColor, outlineOpacity, outlineWidth, outlineStyle, title
 */
JAK.Vector.Circle.prototype.$constructor = function(canvas, center, radius, options) {
	this.canvas = canvas;
	this.center = new JAK.Vec2d(0,0);
	this.radius = 0;
	this.options = {
		color:"",
		opacity:1,
		outlineColor:"#000",
		outlineOpacity:1,
		outlineWidth:1,
		outlineStyle:JAK.Vector.STYLE_SOLID,
		title:""
	}
	for (var p in options) { this.options[p] = options[p]; }

	var stroke = {
		color:this.options.outlineColor,
		width:this.options.outlineWidth,
		opacity:this.options.outlineOpacity,
		style:this.options.outlineStyle
	}
	
	var fill = {
		color:this.options.color,
		opacity:this.options.opacity
	}
	this.elm = this.canvas[this._method]();
	this.setCenter(center);
	this.setRadius(radius);
	this.canvas.setTitle(this.elm, this.options.title);
	this.canvas.getContent().appendChild(this.elm);	
	this.setOptions(this.options);
}

JAK.Vector.Circle.prototype.setCenter = function(center) {
	this.center = center;
	this.canvas.setCenterRadius(this.elm, this.center, this.radius);
}

JAK.Vector.Circle.prototype.setOptions = function(options) {
	var stroke = {};
	if ("outlineColor" in options) { stroke.color = options.outlineColor; }
	if ("outlineWidth" in options) { stroke.width = options.outlineWidth; }
	if ("outlineOpacity" in options) { stroke.opacity = options.outlineOpacity; }
	if ("outlineStyle" in options) { stroke.style = options.outlineStyle; }
	if ("outlineEndCap" in options) { stroke.endCap = options.outlineEndCap; }
	if ("outlineExactStyle" in options) { stroke.exactStyle = options.outlineExactStyle; }
	
	var fill = {};
	if ("color" in options) { fill.color = options.color; }
	if ("opacity" in options) { fill.opacity = options.opacity; }
	
	this.canvas.setStroke(this.elm, stroke);
	this.canvas.setFill(this.elm, fill);
}

JAK.Vector.Circle.prototype.setRadius = function(radius) {
	this.radius = radius;
	this.canvas.setCenterRadius(this.elm, this.center, this.radius);
}

/**
 * @class Elipsa
 * @augments JAK.Vector.Primitive
 */ 
JAK.Vector.Ellipse = JAK.ClassMaker.makeClass({
	NAME: "JAK.Vector.Ellipse",
	VERSION: "1.0",
	EXTEND: JAK.Vector.Circle
});
JAK.Vector.Ellipse.prototype._method = "ellipse";

/**
 * @class Path
 * @augments JAK.Vector.Primitive
 */ 
JAK.Vector.Path = JAK.ClassMaker.makeClass({
	NAME: "JAK.Vector.Path",
	VERSION: "1.0",
	EXTEND: JAK.Vector.Primitive
});

/**
 * @param {object} canvas canvas pro vykresleni
 * @param {string} format formatovaci retezec
 * @param {object} options objekt s povolenymi hodnotami color, opacity, width, style, outlineColor, outlineOpacity, outlineWidth, outlineStyle, title
 */
JAK.Vector.Path.prototype.$constructor = function(canvas, format, options) {
	this.canvas = canvas;
	this.elm2 = null;
	this.options = {
		color:"none",
		opacity:1,
		width:0,
		style:JAK.Vector.STYLE_SOLID,
		outlineColor:"#fff",
		outlineOpacity:1,
		outlineWidth:1,
		outlineStyle:JAK.Vector.STYLE_SOLID,
		title:""
	}
	for (var p in options) { this.options[p] = options[p]; }

	var stroke = {
		color:this.options.outlineColor,
		width:this.options.outlineWidth,
		opacity:this.options.outlineOpacity,
		style:this.options.outlineStyle
	}
	
	var fill = {
		width:this.options.width,
		color:this.options.color,
		opacity:this.options.opacity,
		style:this.options.style
	}

	var two = this.options.width && !format.match(/z/i); /* dva prvky jen pokud je to neuzavrene a oramovane */
	
	this.elm = this.canvas.path();
	this.setFormat(format);

	if (two) {
		this.elm2 = this.canvas.path(); 
		this.setFormat(format);
		this.canvas.setTitle(this.elm2, this.options.title);
	}
	
	this.canvas.setTitle(this.elm, this.options.title);
	if (this.elm2) { this.canvas.getContent().appendChild(this.elm2); }
	this.canvas.getContent().appendChild(this.elm);	
	this.setOptions(this.options);
}

JAK.Vector.Path.prototype.$destructor = function() {
	if (this.elm.parentNode && this.elm.parentNode.nodeType == 1) { this.elm.parentNode.removeChild(this.elm); }
	if (this.elm2 && this.elm2.parentNode && this.elm2.parentNode.nodeType == 1) { this.elm2.parentNode.removeChild(this.elm2); }
}

JAK.Vector.Path.prototype.setFormat = function(format) {
	this.canvas.setFormat(this.elm, format);
	if (this.elm2) { this.canvas.setFormat(this.elm2, format); }
}

JAK.Vector.Path.prototype.setOptions = function(options) {
	var stroke = {};
	if ("outlineColor" in options) { stroke.color = options.outlineColor; }
	if ("outlineWidth" in options) { stroke.width = options.outlineWidth; }
	if ("outlineOpacity" in options) { stroke.opacity = options.outlineOpacity; }
	if ("outlineStyle" in options) { stroke.style = options.outlineStyle; }
	if ("outlineEndCap" in options) { stroke.endCap = options.outlineEndCap; }
	if ("outlineExactStyle" in options) { stroke.exactStyle = options.outlineExactStyle; }
	
	var fill = {};
	if ("color" in options) { fill.color = options.color; }
	if ("opacity" in options) { fill.opacity = options.opacity; }
	if ("width" in options) { fill.width = options.width; }
	if ("style" in options) { fill.style = options.style; }
	if ("endCap" in options) { fill.endCap = options.endCap; }
	if ("exactStyle" in options) { fill.exactStyle = options.exactStyle; }
	if ("fillRule" in options) { fill.fillRule = options.fillRule; }
	
	if (this.elm2) {
		if (stroke.width) { stroke.width = fill.width + 2*stroke.width; }
		this.canvas.setStroke(this.elm, fill);
		this.canvas.setStroke(this.elm2, stroke);
	} else {
		this.canvas.setStroke(this.elm, stroke);
		this.canvas.setFill(this.elm, fill);
	}
}
