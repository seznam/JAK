/**
 * @class Vektorovy canvas
 */ 
SZN.Vector = SZN.ClassMaker.makeClass({
	NAME:"Vector",
	CLASS:"class",
	VERSION:"1.0"
});

/**
 * @static 
 * vrati instanci canvasu
 * @method
 */   
SZN.Vector.getCanvas = function(w,h,w2,h2) {	
	if (SZN.Browser.client == "ie") {
		return new SZN.VML(w,h,w2,h2);
	} else {
		return new SZN.SVG(w,h,w2,h2);
	}
}

/**
 * @static 
 * smaze canvas
 * @method
 */   
SZN.Vector.prototype.clear = function() {}

/**
 * vrati div s canvasem
 * @method
 */   
SZN.Vector.prototype.getCanvasElement = function() {}

/**
 * nakresli obdelnik do canvasu
 * @method
 * @param {vec2d} corner levy horni roh
 * @param {vec2d} dimensions sirka a vyska
 * @param {object} options objekt s volitelnymi hodnotami color, borderColor, borderWidth
 */   
SZN.Vector.prototype.rectangle = function(corner, dimensions, options) {}

/**
 * nakresli kruh do canvasu
 * @method
 * @param {vec2d} center stred
 * @param {number} radius polomer
 * @param {object} options objekt s volitelnymi hodnotami color, borderColor, borderWidth
 */   
SZN.Vector.prototype.circle = function(center, radius, options) {}

/**
 * nakresli usecku do canvasu
 * @method
 * @param {vec2d} p1 prvni bod
 * @param {vec2d} p2 druhy bod
 * @param {object} options objekt s volitelnymi hodnotami color, width, opacity
 */   
SZN.Vector.prototype.line = function(p1, p2, options) {}

/**
 * nakresli lomenou caru do canvasu
 * @method
 * @param {array} points pole bodu
 * @param {object} options objekt s volitelnymi hodnotami color, width, opacity
 */   
SZN.Vector.prototype.polyline = function(points, options) {}

/**
 * nakresli mnohouhelnik do canvasu
 * @method
 * @param {array} points souradnice bodu
 * @param {object} options objekt s volitelnymi hodnotami color, borderColor, borderWidth
 */   
SZN.Vector.prototype.polygon = function(points, options) {}

/**
 * nakresli obecnou caru
 * @method
 * @param {string} format popis cesty
 * @param {object} options objekt s volitelnymi hodnotami color, width, opacity
 */   
SZN.Vector.prototype.path = function(format, options) {}

/**
 * nakresli caru s oramovanim
 * @method
 * @param {vec2d} p1 prvni bod
 * @param {vec2d} p2 druhy bod
 * @param {object} options volitelne veci, polozky: width1, width2, opacity1, opacity2, color1, color2
 */   
SZN.Vector.prototype.doubleLine = function(p1, p2, options) {
	var o = {
		width1:10,
		width2:5,
		opacity1:0,
		opacity2:0,
		color1:"#000",
		color2:"#fff"
	}
	for (var p in options) { o[p] = options[p]; }
	
	var l1 = this.line(p1, p2, {color: o.color1, width: o.width1, opacity: o.opacity1});
	var l2 = this.line(p1, p2, {color: o.color2, width: o.width2, opacity: o.opacity2});
	return [l1,l2];
}

/**
 * nakresli caru s oramovanim
 * @method
 * @param {array} points souradnice bodu prvni bod
 * @param {object} options volitelne veci, polozky: width1, width2, opacity1, opacity2, color1, color2
 */   
SZN.Vector.prototype.doublePolyline = function(points, options) {
	var o = {
		width1:10,
		width2:5,
		opacity1:0,
		opacity2:0,
		color1:"#000",
		color2:"#fff"
	}
	for (var p in options) { o[p] = options[p]; }
	
	var l1 = this.polyline(points, {color: o.color1, width: o.width1, opacity: o.opacity1});
	var l2 = this.polyline(points, {color: o.color2, width: o.width2, opacity: o.opacity2});
	return [l1,l2];
}

/**
 * nakresli zhlazenou lomenou caru do canvasu
 * @method
 * @param {array} points pole bodu
 * @param {object} options objekt s volitelnymi hodnotami color, width, opacity, dist, flatEnds
 */   
SZN.Vector.prototype.smoothPolyline = function(points, options) {
	var o = {
		dist:20,
		color:"#000",
		width:0,
		opacity:0,
		flatEnds:true
	}
	for (var p in options) { o[p] = options[p]; }

	var d = "";
	if (points.length < 3) { return this.drawPolyline(points, color, width, opacity); }
	
	d += "M "+points[0].join(" ");
	
	/*
		A, B, C -> 3 points on curve
		X, Y -> two control points
	*/
	var X = false;
	var Y = false;
	
	for (var i=0;i<pts.length-1;i++) {
		var A = pts[i];
		var B = pts[i+1];
		var C = (i+2 == pts.length ? false : pts[i+2]);

		if (!C) {
			var AB = B.minus(A);
			if (o.flatEnds) {
				Y = A.plus(AB.multiply(0.5));
			} else {
				var vAX = X.minus(A);
				var vYB = vAX.symmetry(AB);
				Y = B.minus(vYB);
			}
		} else {
			/* compute 2nd control point location */
			var vAC = C.minus(A);
			var l = vAC.norm();
			var frac = l / o.dist;
			var vYB = vAC.multiply(1/frac);
			Y = B.minus(vYB);
		}
		
		if (!X) { /* first segment */
			var AB = B.minus(A);
			if (o.flatEnds) {
				X = A.plus(AB.multiply(0.5));
			} else {
				var vAX = vYB.symmetry(AB);
				X = A.plus(vAX);
			}
		}
		
		/* draw */
		d += "C "+X.join(" ",true)+", "+Y.join(" ",true)+", "+B.join(" ",true)+" ";
		
		/* this.circle(X, 3, {color:"#f0f"}); */
		/* this.circle(Y, 3, {color:"#0ff"}); */
		
		/* generate next 1st control point */
		X = B.plus(vYB);
	}
	
	this.path(d, o);
}

/**
 * nakresli zhlazenou dvojitou mnohousecku do canvasu
 * @method
 * @param {array} points pole bodu
 * @param {object} options volitelne veci, polozky: width1, width2, opacity1, opacity2, color1, color2, dist, flatEnds
 */   
SZN.Vector.prototype.smoothDoublePolyline = function(points, options) {
	var o = {
		width1:10,
		width2:5,
		opacity1:0,
		opacity2:0,
		color1:"#000",
		color2:"#fff",
		dist:0,
		flatEnds:true
	}
	for (var p in options) { o[p] = options[p]; }
	
	var o1 = {color: o.color1, width: o.width1, opacity: o.opacity1, flatEnds:o.flatEnds};
	var o2 = {color: o.color2, width: o.width2, opacity: o.opacity2, flatEnds:o.flatEnds};
	
	if (o.dist) { 
		o1.dist = o.dist;
		o2.dist = o.dist;
	}
	
	var l1 = this.smoothPolyline(points, o1);
	var l2 = this.smoothPolyline(points, o2);
	return [l1,l2];
}

