/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Ruzne vektorove struktury
 * @version 2.0
 * @author Zara
 */ 

/**
 * @class N-rozmerny vektor / bod
 * @group jak-utils
 */ 
JAK.VecNd = JAK.ClassMaker.makeClass({
	NAME: "JAK.VecNd",
	VERSION: "2.0"
});

/**
 * @param {int} n dimenze prostoru
 * @param {float} [args] hodnoty vektoru
 */
JAK.VecNd.prototype.$constructor = function(n) {
	this.n = n;
	this.data = [];
	for (var i=0;i<n;i++) {
		var val = (arguments.length > i+1 ? arguments[i+1] : 0);
		this.data.push(val);
	}
}

/**
 * zmena n-te souradnice
 * @param {int} n index
 * @param {float} val nova hodnota
 */   
JAK.VecNd.prototype.setN = function(n, val) {
	this.data[n] = val;
}

/**
 * zjisteni n-te souradnice
 * @param {int} n index
 */   
JAK.VecNd.prototype.getN = function(n) {
	return this.data[n];
}

/**
 * norma vektoru
 * @param {int} [degree=2] stupen normy, default eukleidovska
 */   
JAK.VecNd.prototype.norm = function(degree) {
	var d = degree || 2;
	var sum = 0;
	for (var i=0;i<this.n;i++) {
		sum += Math.pow(this.getN(i),d);
	}
	return Math.pow(sum,1/d);
}

/**
 * pricteni druheho vektoru, modifikuje vektor
 * @private
 * @param {JAK.VecNd} t druhy vektor
 */   
JAK.VecNd.prototype._plus = function(t) {
	for (var i=0;i<this.n;i++) {
		this.setN(i, this.getN(i) + t.getN(i));
	}
	return this;
}

/**
 * pricteni druheho vektoru, vrati novy vektor
 * @param {JAK.VecNd} t druhy vektor
 */   
JAK.VecNd.prototype.plus = function(t) {
	var result = this.clone();
	return result._plus(t);
}

/**
 * odecteni druheho vektoru, modifikuje vektor
 * @private
 * @param {JAK.VecNd} t druhy vektor
 */   
JAK.VecNd.prototype._minus = function(t) {
	for (var i=0;i<this.n;i++) {
		this.setN(i, this.getN(i) - t.getN(i));
	}
	return this;
}

/**
 * odecteni druheho vektoru, vrati novy vektor
 * @param {JAK.VecNd} t druhy vektor
 */   
JAK.VecNd.prototype.minus = function(t) {
	var result = this.clone();
	return result._minus(t);
}

/**
 * nasobeni skalarem, modifikuje vektor
 * @private
 * @param {JAK.VecNd} t druhy vektor
 */   
JAK.VecNd.prototype._multiply = function(num) {
	for (var i=0;i<this.n;i++) {
		this.setN(i, this.getN(i) * num);
	}
	return this;
}

/**
 * nasobeni skalarem, vrati novy vektor
 * @param {float} num 
 */   
JAK.VecNd.prototype.multiply = function(num) {
	var result = this.clone();
	return result._multiply(num);
}

/**
 * skalarni soucin
 * @param {JAK.VecNd} t druhy vektor
 */   
JAK.VecNd.prototype.dot = function(t) {
	var result = 0;
	for (var i=0;i<this.n;i++) {
		result += this.getN(i) * t.getN(i);
	}
	return result;
}

/**
 * normalizace na jednotkovy vektor, modifikuje vektor
 * @private
 * @param {int} [degree=2] stupen normy, default eukleidovska
 */   
JAK.VecNd.prototype._unit = function(degree) {
	var n = this.norm(degree);
	for (var i=0;i<this.n;i++) {
		this.setN(i, this.getN(i) / n);
	}
	return this;
}

/**
 * normalizace na jednotkovy vektor, vrati novy vektor
 * @param {int} [degree=2] stupen normy, default eukleidovska
 */   
JAK.VecNd.prototype.unit = function(degree) {
	var result = this.clone();
	return result._unit(degree);
}

/**
 * vrati kopii vektoru
 */   
JAK.VecNd.prototype.clone = function() {
	var result = new this.constructor(this.n);
	for (var i=0;i<this.n;i++) {
		result.setN(i, this.getN(i));
	}
	return result;
}

/**
 * prevod na retezec, hodnoty spojene zadanym parametrem
 * @param {string} [separator=","] oddelovac
 * @param {bool} [round=false] zaokrouhlit?
 */   
JAK.VecNd.prototype.join = function(separator, round) {
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
JAK.VecNd.prototype.toString = function() {
	return "["+this.join(", ")+"]";
}

/**
 * @class Dvourozmerny vektor / bod
 * @augments JAK.VecNd
 */ 
JAK.Vec2d = JAK.ClassMaker.makeClass({
	NAME: "Vec2d",
	VERSION: "2.0",
	EXTEND: JAK.VecNd
});

/**
 * @param {float} x souradnice X
 * @param {float} y souradnice Y
 */
JAK.Vec2d.prototype.$constructor = function(x, y) {
  	JAK.VecNd.prototype.$constructor.call(this, 2, x, y);
}

/**
 * zmena prvni souradnice
 * @param {float} x nova hodnota
 */   
JAK.Vec2d.prototype.setX = function(x) {
	this.data[0] = x;
}

/**
 * zmena druhe souradnice
 * @param {float} y nova hodnota
 */   
JAK.Vec2d.prototype.setY = function(y) {
	this.data[1] = y;
}

/**
 * zjisteni prvni souradnice
 */   
JAK.Vec2d.prototype.getX = function() {
	return this.data[0];
}

/**
 * zjisteni druhe souradnice
 */   
JAK.Vec2d.prototype.getY = function() {
	return this.data[1];
}

/**
 * vraceni normaly
 */   
JAK.Vec2d.prototype.normal = function() {
	return new this.constructor(this.getY(), -this.getX());
}

/**
 * symetrie okolo zadane osy, modifikuje vektor
 * @private
 * @param {JAK.Vec2d} axis
 */   
JAK.Vec2d.prototype._symmetry = function(axis) {
	var norm = axis.normal()._unit();
	var coef = this.dot(norm);
	return this._minus(norm._multiply(2*coef));
}

/**
 * symetrie okolo zadane osy, vrati novy vektor
 * @param {JAK.Vec2d} axis
 */   
JAK.Vec2d.prototype.symmetry = function(axis) {
	var result = this.clone();
	return result._symmetry(axis);
}

/**
 * vzdalenost (i zaporna) od orientovane primky
 * @param {JAK.Vec2d} p1 prvni bod
 * @param {JAK.Vec2d} p2 druhy bod
 */   
JAK.Vec2d.prototype.distance = function(p1, p2) {
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
