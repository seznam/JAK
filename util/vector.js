/**
 * @class Vektorovy canvas
 * @param {number} realWidth sirka canvasu v pixelech
 * @param {number} realHeight vyska canvasu v pixelech
 * @param {number} [width] rozsah X (pokud neni uvedeno = realWidth)
 * @param {number} [height] rozsah Y (pokud neni uvedeno = realHeight)
 */ 
SZN.Vector = SZN.ClassMaker.makeClass({
	NAME:"Vector",
	CLASS:"class",
	VERSION:"1.0"
});

SZN.Vector.prototype.$constructor = function(realWidth, realHeight, width, height) {}

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
 * @param {array} points souradnice bodu
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
 * spocte kontrolni body
 * @private
 * @method
 * @param {array} points souradnice bodu
 * @param {object} options volitelne veci, polozky: flat, curvature, join
 */   
SZN.Vector.prototype._computeControlPoints = function(points, options) {
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
 * nakresli zhlazenou lomenou caru do canvasu
 * @method
 * @param {array} points pole bodu
 * @param {object} options objekt s volitelnymi hodnotami color, width, opacity, dist, flatEnds
 */   
SZN.Vector.prototype.smoothPolyline = function(points, options) {
	var o = {
		color:"#000",
		width:0,
		opacity:0
	}
	for (var p in options) { o[p] = options[p]; }

	var d = "";
	if (points.length < 3) { return this.drawPolyline(points, o); }
	
	var control = this._computeControlPoints(points, o);
	d += "M "+points[0].join(" ");
	var len = points.length;
	for (var i=1;i<len;i++) {
		var c = control[i-1];
		var x = c[0];
		var y = c[1];
		var point = points[i];
		
		d += "C "+x.join(" ",true)+", "+y.join(" ",true)+", "+point.join(" ",true)+" ";
	}
	
	return this.path(d, o);
}

/**
 * nakresli zhlazenou dvojitou lomenou caru do canvasu
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
		color2:"#fff"
	}
	for (var p in options) { o[p] = options[p]; }
	
	var o1 = {color: o.color1, width: o.width1, opacity: o.opacity1, flat:o.flat};
	var o2 = {color: o.color2, width: o.width2, opacity: o.opacity2, flat:o.flat};
	
	if ("curvature" in o) { 
		o1.curvature = o.curvature;
		o2.curvature = o.curvature;
	}
	
	var l1 = this.smoothPolyline(points, o1);
	var l2 = this.smoothPolyline(points, o2);
	return [l1,l2];
}

