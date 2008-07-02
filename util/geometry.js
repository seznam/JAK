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
 * @param {number} n dimenze prostoru
 * @param {number} [args] hodnoty vektoru
 */ 
SZN.VecNd = SZN.ClassMaker.makeClass({
	NAME:"VecNd",
	VERSION:"1.0",
	CLASS:"class"
});

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
 * @param {number} x souradnice X
 * @param {number} y souradnice Y
*/ 
SZN.Vec2d = SZN.ClassMaker.makeClass({
	NAME:"Vec2d",
	VERSION:"1.0",
	CLASS:"class",
	EXTEND:SZN.VecNd
});

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
