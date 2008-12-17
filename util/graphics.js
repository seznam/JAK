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
 * @overview Ruzne vektorove struktury
 * @version 1.0
 * @author Zara
 */ 

/**
 * @class N-rozmerny vektor / bod
 * @group jak-utils
 */ 
SZN.VecNd = SZN.ClassMaker.makeClass({
	NAME:"VecNd",
	VERSION:"1.0",
	CLASS:"class"
});

/**
 * @param {number} n dimenze prostoru
 * @param {number} [args] hodnoty vektoru
 */
SZN.VecNd.prototype.$constructor = function(n) {
	this.n = n;
	this.data = [];
	for (var i=0;i<n;i++) {
		var val = (arguments.length > i+1 ? arguments[i+1] : 0);
		this.data.push(val);
	}
}

/**
 * zmena n-te souradnice
 * @method
 * @param {number} n index
 * @param {number} val nova hodnota
 */   
SZN.VecNd.prototype.setN = function(n, val) {
	this.data[n] = val;
}

/**
 * zjisteni n-te souradnice
 * @method
 * @param {number} n index
 */   
SZN.VecNd.prototype.getN = function(n) {
	return this.data[n];
}

/**
 * @method norma vektoru
 * @param {number} [degree] stupen normy, default 2 (eukleidovska)
 */   
SZN.VecNd.prototype.norm = function(degree) {
	var d = degree || 2;
	var sum = 0;
	for (var i=0;i<this.n;i++) {
		sum += Math.pow(this.getN(i),d);
	}
	return Math.pow(sum,1/d);
}

/**
 * pricteni druheho vektoru, modifikuje vektor
 * @method
 * @private
 * @param {vecNd} t druhy vektor
 */   
SZN.VecNd.prototype._plus = function(t) {
	for (var i=0;i<this.n;i++) {
		this.setN(i, this.getN(i) + t.getN(i));
	}
	return this;
}

/**
 * pricteni druheho vektoru, vrati novy vektor
 * @method
 * @param {vecNd} t druhy vektor
 */   
SZN.VecNd.prototype.plus = function(t) {
	var result = this.clone();
	return result._plus(t);
}

/**
 * odecteni druheho vektoru, modifikuje vektor
 * @method
 * @private
 * @param {vecNd} t druhy vektor
 */   
SZN.VecNd.prototype._minus = function(t) {
	for (var i=0;i<this.n;i++) {
		this.setN(i, this.getN(i) - t.getN(i));
	}
	return this;
}

/**
 * odecteni druheho vektoru, vrati novy vektor
 * @method
 * @param {vecNd} t druhy vektor
 */   
SZN.VecNd.prototype.minus = function(t) {
	var result = this.clone();
	return result._minus(t);
}

/**
 * nasobeni skalarem, modifikuje vektor
 * @method
 * @private
 * @param {vecNd} t druhy vektor
 */   
SZN.VecNd.prototype._multiply = function(num) {
	for (var i=0;i<this.n;i++) {
		this.setN(i, this.getN(i) * num);
	}
	return this;
}

/**
 * nasobeni skalarem, vrati novy vektor
 * @method
 * @param {number} num 
 */   
SZN.VecNd.prototype.multiply = function(num) {
	var result = this.clone();
	return result._multiply(num);
}

/**
 * skalarni soucin
 * @method
 * @param {vecNd} t druhy vektor
 */   
SZN.VecNd.prototype.dot = function(t) {
	var result = 0;
	for (var i=0;i<this.n;i++) {
		result += this.getN(i) * t.getN(i);
	}
	return result;
}

/**
 * normalizace na jednotkovy vektor, modifikuje vektor
 * @method
 * @private
 * @param {number} [degree] stupen normy, default 2 (eukleidovska)
 */   
SZN.VecNd.prototype._unit = function(degree) {
	var n = this.norm(degree);
	for (var i=0;i<this.n;i++) {
		this.setN(i, this.getN(i) / n);
	}
	return this;
}

/**
 * normalizace na jednotkovy vektor, vrati novy vektor
 * @method
 * @param {number} [degree] stupen normy, default 2 (eukleidovska)
 */   
SZN.VecNd.prototype.unit = function(degree) {
	var result = this.clone();
	return result._unit(degree);
}

/**
 * vrati kopii vektoru
 * @method
 */   
SZN.VecNd.prototype.clone = function() {
	var result = new this.sConstructor(this.n);
	for (var i=0;i<this.n;i++) {
		result.setN(i, this.getN(i));
	}
	return result;
}

/**
 * prevod na retezec, hodnoty spojene zadanym parametrem
 * @method
 * @param {string} [separator] default carka
 * @param {bool} [round] zaokrouhlit? default false
 */   
SZN.VecNd.prototype.join = function(separator, round) {
	var s = separator || ",";
	var arr = [];
	for (var i=0;i<this.n;i++) {
		var val = this.getN(i);
		if (round) { val = Math.round(val); }
		arr.push(val);
	}
	return arr.join(s);
}

/**
 * @method
 * prevod na retezec pro vypis
 */   
SZN.VecNd.prototype.toString = function() {
	return "["+this.join(", ")+"]";
}

/**
 * @class Dvourozmerny vektor / bod
 * @augments SZN.VecNd
 */ 
SZN.Vec2d = SZN.ClassMaker.makeClass({
	NAME:"Vec2d",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.VecNd
});

/**
 * @param {number} x souradnice X
 * @param {number} y souradnice Y
 */
SZN.Vec2d.prototype.$constructor = function(x, y) {
  	SZN.VecNd.prototype.$constructor.call(this, 2, x, y);
}

/**
 * zmena prvni souradnice
 * @method
 * @param {number} x nova hodnota
 */   
SZN.Vec2d.prototype.setX = function(x) {
	this.data[0] = x;
}

/**
 * zmena druhe souradnice
 * @method
 * @param {number} y nova hodnota
 */   
SZN.Vec2d.prototype.setY = function(y) {
	this.data[1] = y;
}

/**
 * zjisteni prvni souradnice
 * @method
 */   
SZN.Vec2d.prototype.getX = function() {
	return this.data[0];
}

/**
 * zjisteni druhe souradnice
 * @method
 */   
SZN.Vec2d.prototype.getY = function() {
	return this.data[1];
}

/**
 * vraceni normaly
 * @method
 */   
SZN.Vec2d.prototype.normal = function() {
	return new this.sConstructor(this.getY(), -this.getX());
}

/**
 * symetrie okolo zadane osy, modifikuje vektor
 * @method
 * @private
 * @param {vec2d} axis
 */   
SZN.Vec2d.prototype._symmetry = function(axis) {
	var norm = axis.normal()._unit();
	var coef = this.dot(norm);
	return this._minus(norm._multiply(2*coef));
}

/**
 * symetrie okolo zadane osy, vrati novy vektor
 * @method
 * @param {vec2d} axis
 */   
SZN.Vec2d.prototype.symmetry = function(axis) {
	var result = this.clone();
	return result._symmetry(axis);
}

/**
 * vzdalenost (i zaporna) od orientovane primky
 * @method
 * @param {vec2d} p1 prvni bod
 * @param {vec2d} p2 druhy bod
 */   
SZN.Vec2d.prototype.distance = function(p1, p2) {
	var vec = p2.minus(p1);
	var n = vec.normal().unit();
	
	var a1 = p1.getX();
	var a2 = p1.getY();
	var c1 = this.getX();
	var c2 = this.getY();
	
	var v1 = vec.getX();
	var v2 = vec.getY();
	var w1 = n.getX();
	var w2 = n.getY();
	
	var dist = (v1*c2 - v2*c1 + a1*v2 - a2*v1) / (w1*v2 - v1*w2);
	return -dist;
	
}
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
 * @class Vektorova grafika
 * @group jak-utils
 * @static
 */ 
SZN.Vector = SZN.ClassMaker.makeClass({
	NAME:"Vector",
	CLASS:"static",
	VERSION:"1.0",
	DEPEND:[{
		sClass:SZN.Vec2d,
		ver:"1.0"
	}]
});

/**
 * @static 
 * vrati instanci canvasu
 */   
SZN.Vector.getCanvas = function(w,h) {	
	if (SZN.Browser.client == "ie") {
		return new SZN.VML(w,h);
	} else {
		return new SZN.SVG(w,h);
	}
}

/**
 * @class Vektorovy canvas
 * @group jak-utils
 */ 
SZN.Vector.Canvas = SZN.ClassMaker.makeClass({
	NAME:"Canvas",
	VERSION:"1.0",
	CLASS:"class"
});

/**
 * @param {number} width sirka canvasu v pixelech
 * @param {number} height vyska canvasu v pixelech
 */
SZN.Vector.Canvas.prototype.$constructor = function(width, height) {}

/**
 * smaze canvas
 */   
SZN.Vector.Canvas.prototype.clear = function() {}

/**
 * zmeni rozmery canvasu; nijak neovlivni velikost prvku v nem (pretekajici se oriznou)
 * @param {number} width sirka canvasu
 * @param {number} height vyska canvasu
 */   
SZN.Vector.Canvas.prototype.resize = function(width, height) {}

/**
 * nastavi meritko (proporcionalne) prvkum v canvasu
 * @param {number} scale koeficient velikosti (1 = puvodni velikost)
 */   
SZN.Vector.Canvas.prototype.setScale = function(scale) {}

/**
 * vrati vnejsi obal
 */   
SZN.Vector.Canvas.prototype.getContainer = function() {}

/**
 * vrati vnitrni canvas
 */   
SZN.Vector.Canvas.prototype.getContent = function() {}

/**
 * nakresli kruh do canvasu
 */   
SZN.Vector.Canvas.prototype.circle = function() {}

/**
 * nakresli lomenou caru do canvasu
 */   
SZN.Vector.Canvas.prototype.polyline = function() {}

/**
 * nakresli mnohouhelnik do canvasu
 */   
SZN.Vector.Canvas.prototype.polygon = function() {}

/**
 * nakresli obecnou caru
 */   
SZN.Vector.Canvas.prototype.path = function() {}

/**
 * zmeni vlastnosti cary prvku
 * @param {element} prvek
 * @param {object} options objekt s povolenymi vlastnostmi color, width, opacity
 */   
SZN.Vector.Canvas.prototype.setStroke = function(element, options) {}

/**
 * zmeni vlastnosti vyplne prvku
 * @param {element} prvek
 * @param {object} options objekt s povolenymi vlastnostmi color, opacity
 */   
SZN.Vector.Canvas.prototype.setFill = function(element, options) {}

/**
 * zmeni stred a polomer kruhu
 * @param {element} prvek
 * @param {vec2d} center novy stred
 * @param {vec2d} radius novy polomer
 */   
SZN.Vector.Canvas.prototype.setCenterRadius = function(element, center, radius) {}

/**
 * zmeni body pro lomenou caru / mnohouhelnik
 * @param {element} prvek
 * @param {array} points pole novych bodu
 * @param {bool} closed ma byt utvar uzavreny? jen hack pro debilni vml
 */   
SZN.Vector.Canvas.prototype.setPoints = function(element, points, closed) {}

/**
 * zmeni formatovaci retezec pro path
 * @param {element} prvek
 * @param {string} format novy format
 */   
SZN.Vector.Canvas.prototype.setFormat = function(element, format) {}

/**
 * zmeni title prvku
 * @param {element} prvek
 * @param {string} title novy title
 */   
SZN.Vector.Canvas.prototype.setTitle = function(element, title) {
	element.setAttribute("title", title);
}

/**
 * spocte kontrolni body
 * @param {array} points souradnice bodu
 * @param {object} options volitelne veci, polozky: flat, curvature, join
 */   
SZN.Vector.Canvas.prototype.computeControlPointsSymmetric = function(points, options) {
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
		
		//new SZN.Vector.Circle(this,X,3,{color:"#0ff"});
		//new SZN.Vector.Circle(this,Y,3,{color:"#0ff"});

		X = B.plus(vYB); /* generate next #1 point */
	}
	return result;
}

/**
 * spocte kontrolni body
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
		
		//new SZN.Vector.Circle(this,X,3,{color:"#0ff"});
		//new SZN.Vector.Circle(this,Y,3,{color:"#0ff"});
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
	if (this.elm && this.elm.parentNode && this.elm.parentNode.nodeType == 1) { this.elm.parentNode.removeChild(this.elm); }
}

/**
 * @class Cara
 * @param {object} canvas canvas pro vykresleni
 * @param {array} points body cary
 * @param {object} options objekt s povolenymi hodnotami color, width, curvature, opacity, outlineColor, outlineOpacity, outlineWidth, title
 */ 
SZN.Vector.Line = SZN.ClassMaker.makeClass({
	NAME:"Line",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Vector.Primitive
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
		outlineWidth:0,
		title:"",
		symmetricCP:true
	}
	for (var p in options) { this.options[p] = options[p]; }

	this._build(points);
}

SZN.Vector.Line.prototype._build = function(points) {
	var o1 = {
		color:this.options.color,
		width:this.options.width,
		opacity:this.options.opacity
	}
	
	if (this.options.outlineWidth) {
		var o2 = {
			color:this.options.outlineColor,
			width:2*this.options.outlineWidth + this.options.width,
			opacity:this.options.outlineOpacity
		}
	}
	
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
	this.canvas.setStroke(this.elm, o1);
	if (this.options.outlineWidth) { 
		this.canvas.setStroke(this.elm2, o2);
		this.canvas.setTitle(this.elm2, this.options.title);
		this.canvas.getContent().appendChild(this.elm2); 
	}
	this.canvas.getContent().appendChild(this.elm);	
	this.setPoints(points);
}

SZN.Vector.Line.prototype.setCurvature = function(c) {
	if (!!this.options.curvature != !!c) {
		this.options.curvature = c;
		this._build(this.points);
	} else {
		this.options.curvature = c;
		this.setPoints(this.points);
	}
}

SZN.Vector.Line.prototype.$destructor = function() {
	if (this.elm.parentNode && this.elm.parentNode.nodeType == 1) { this.elm.parentNode.removeChild(this.elm); }
	if (this.elm2 && this.elm2.parentNode && this.elm2.parentNode.nodeType == 1) { this.elm2.parentNode.removeChild(this.elm2); }
}

SZN.Vector.Line.prototype.setPoints = function(points) {
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

SZN.Vector.Line.prototype.setOptions = function(options) {
	var o = {};
	if ("width" in options) { o.width = options.width; this.options.width = options.width; }
	if ("opacity" in options) { o.opacity = options.opacity; }
	if ("color" in options) { o.color = options.color; }
	this.canvas.setStroke(this.elm, o);
	
	if (this.elm2) {
		o = {};
		if ("outlineWidth" in options) { o.width = 2*options.outlineWidth + this.options.width; }
		if ("outlineOpacity" in options) { o.opacity = options.outlineOpacity; }
		if ("outlineColor" in options) { o.color = options.outlineColor; }
		this.canvas.setStroke(this.elm2, o);
	}
}

/**
 * @class Mnohouhelnik
 * @param {object} canvas canvas pro vykresleni
 * @param {array} points body mnohouhelniku
 * @param {object} options objekt s povolenymi hodnotami curvature, color, opacity, outlineColor, outlineOpacity, outlineWidth, title
 */ 
SZN.Vector.Polygon = SZN.ClassMaker.makeClass({
	NAME:"Polygon",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Vector.Primitive
});

SZN.Vector.Polygon.prototype.$constructor = function(canvas, points, options) {
	this.canvas = canvas;

	this.options = {
		color:"#000",
		curvature:0,
		opacity:1,
		outlineColor:"#fff",
		outlineOpacity:1,
		outlineWidth:0,
		title:"",
		symmetricCP:true
	}
	for (var p in options) { this.options[p] = options[p]; }

	this._build(points);
}

SZN.Vector.Polygon.prototype._build = function(points) {
	var stroke = {
		color:this.options.outlineColor,
		width:this.options.outlineWidth,
		opacity:this.options.outlineOpacity
	}
	
	var fill = {
		color:this.options.color,
		opacity:this.options.opacity
	}
	
	if (this.elm) { this.elm.parentNode.removeChild(this.elm); }

	if (this.options.curvature) { /* zakulacena */
		this.elm = this.canvas.path();		
	} else { /* rovna */
		this.elm = this.canvas.polygon();
	}
	this.canvas.setStroke(this.elm, stroke);
	this.canvas.setFill(this.elm, fill);
	this.canvas.setTitle(this.elm, this.options.title);
	
	this.canvas.getContent().appendChild(this.elm);	
	this.setPoints(points);
}

SZN.Vector.Polygon.prototype.setPoints = function(points) {
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

SZN.Vector.Polygon.prototype.setCurvature = function(c) {
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
 * @param {object} canvas canvas pro vykresleni
 * @param {vec2d} center stred
 * @param {number} radius polomer
 * @param {object} options objekt s povolenymi hodnotami color, opacity, outlineColor, outlineOpacity, outlineWidth, title
 */ 
SZN.Vector.Circle = SZN.ClassMaker.makeClass({
	NAME:"Circle",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Vector.Primitive
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
		outlineWidth:1,
		title:""
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
	this.canvas.setTitle(this.elm, this.options.title);
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
 * @param {object} options objekt s povolenymi hodnotami color, opacity, width, outlineColor, outlineOpacity, outlineWidth, title
 */ 
SZN.Vector.Path = SZN.ClassMaker.makeClass({
	NAME:"Path",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.Vector.Primitive
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
		outlineWidth:1,
		title:""
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
		if (stroke.outlineWidth) { stroke.outlineWidth = fill.width*2 + stroke.outlineWidth; }
		this.canvas.setStroke(this.elm, fill);
		this.canvas.setStroke(this.elm2, stroke);
		this.canvas.setTitle(this.elm2, this.options.title);
		
	} else {
		this.canvas.setStroke(this.elm, stroke);
		this.canvas.setFill(this.elm, fill);
	}
	
	this.canvas.setTitle(this.elm, this.options.title);
	if (this.elm2) { this.canvas.getContent().appendChild(this.elm2); }
	this.canvas.getContent().appendChild(this.elm);	
}

SZN.Vector.Path.prototype.$destructor = function() {
	if (this.elm.parentNode && this.elm.parentNode.nodeType == 1) { this.elm.parentNode.removeChild(this.elm); }
	if (this.elm2 && this.elm2.parentNode && this.elm2.parentNode.nodeType == 1) { this.elm2.parentNode.removeChild(this.elm2); }
}

SZN.Vector.Path.prototype.setFormat = function(format) {
	this.canvas.setFormat(this.elm, format);
	if (this.elm2) { this.canvas.setFormat(this.elm2, format); }
}
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
 * @class SVG
 * @augments SZN.Vector.Canvas
 */ 
SZN.SVG = SZN.ClassMaker.makeClass({
	NAME: "SVG",
	VERSION: "2.0",
	CLASS: "class",
	IMPLEMENT: SZN.Vector.Canvas
})

SZN.SVG.prototype.ns = "http://www.w3.org/2000/svg";
SZN.SVG.prototype.xlinkns = "http://www.w3.org/1999/xlink";

/**
 * @see SZN.Vector#$constructor
 */
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
 * @overview Prace s VML
 * @version 2.0
 * @author Wendigo, Zara
 */ 
 
/**
 * @class VML
 * @augments SZN.Vector.Canvas
 */ 
SZN.VML = SZN.ClassMaker.makeClass({
	NAME: "VML",
	VERSION: "2.0",
	CLASS: "class",
	IMPLEMENT: SZN.Vector.Canvas
})

/**
 * @see SZN.Vector
 */
SZN.VML.prototype.$constructor = function(width, height) {
    if (SZN.Browser.client == "ie" && !document.namespaces["vml"]) {
        document.namespaces.add("vml", "urn:schemas-microsoft-com:vml");
		var s = document.createStyleSheet();
        s.cssText = "vml\\:*{behavior:url(#default#VML);";
    }
	var el = SZN.cEl("div",false,false,{position:"absolute", overflow:"hidden"});
	this.canvas = el;
	this.resize(width, height);
};

/**
 * destruktor
 */   
SZN.VML.prototype.$destructor = function() {
	if (this.canvas.parentNode && this.canvas.parentNode.nodeType == 1) { this.canvas.parentNode.removeChild(this.canvas); }
	this.canvas = null;
};

/**
 * @see SZN.Vector#setScale
 */   
SZN.VML.prototype.setScale = function(scale) {
	this.canvas.style.zoom = scale;
}

/**
 * @see SZN.Vector#clear
 */   
SZN.VML.prototype.clear = function() {
	SZN.Dom.clear(this.canvas);
};

/**
 * @see SZN.Vector#resize
 */   
SZN.VML.prototype.resize = function(width, height) {
	this.canvas.style.width = width+"px";
	this.canvas.style.height = height+"px";
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
 * @see SZN.Vector#setStroke
 */   
SZN.VML.prototype.setStroke = function(element, options) {
	if ("color" in options) { element.setAttribute("strokecolor", options.color); }
	if ("width" in options && options.width) { 
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
	if (element.points) {
		element.points.value = arr.join(", ");
	} else {
		element.setAttribute("points",arr.join(", "));
	}
}

/**
 * parsovani formatu do datove struktury
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
 * @see SZN.Vector#setFormat
 */   
SZN.VML.prototype.setFormat = function(element, format) {
	var f = this._fixFormat(format);
	element.setAttribute("path", f);
}
