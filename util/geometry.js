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
 * pricteni druheho vektoru
 * @method
 * @param {vecNd} t druhy vektor
 */   
SZN.VecNd.prototype.plus = function(t) {
	var result = new this.sConstructor(this.n);
	for (var i=0;i<this.n;i++) {
		result.setN(i, this.getN(i) + t.getN(i));
	}
	return result;
}

/**
 * odecteni druheho vektoru
 * @method
 * @param {vecNd} t druhy vektor
 */   
SZN.VecNd.prototype.minus = function(t) {
	var result = new this.sConstructor(this.n);
	for (var i=0;i<this.n;i++) {
		result.setN(i, this.getN(i) - t.getN(i));
	}
	return result;
}

/**
 * nasobeni skalarem
 * @method
 * @param {number} num 
 */   
SZN.VecNd.prototype.multiply = function(num) {
	var result = new this.sConstructor(this.n);
	for (var i=0;i<this.n;i++) {
		result.setN(i, this.getN(i) * num);
	}
	return result;
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
 * normalizace na jednotkovy vektor
 * @method
 * @param {number} [degree] stupen normy, default 2 (eukleidovska)
 */   
SZN.VecNd.prototype.unit = function(degree) {
	var n = this.norm(degree);
	var result = new this.sConstructor(this.n);
	for (var i=0;i<this.n;i++) {
		result.setN(i, this.getN(i) / n);
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
  	this.callSuper('$constructor', arguments.callee)(2, x, y);
}

/**
 * zmena prvni souradnice
 * @method
 * @param {number} x nova hodnota
 */   
SZN.Vec2d.prototype.setX = function(x) {
	this.callSuper('setN', arguments.callee)(0, x);
}

/**
 * zmena druhe souradnice
 * @method
 * @param {number} y nova hodnota
 */   
SZN.Vec2d.prototype.setY = function(y) {
	this.callSuper('setN', arguments.callee)(1, y);
}

/**
 * zjisteni prvni souradnice
 * @method
 */   
SZN.Vec2d.prototype.getX = function() {
	return this.callSuper('getN', arguments.callee)(0);
}

/**
 * zjisteni druhe souradnice
 * @method
 */   
SZN.Vec2d.prototype.getY = function() {
	return this.callSuper('getN', arguments.callee)(1);
}

/**
 * vraceni normaly
 * @method
 */   
SZN.Vec2d.prototype.normal = function() {
	return new this.sConstructor(-this.getY(), this.getX());
}

/**
 * symetrie okolo zadane osy
 * @method
 * @param {vec2d} axis
 */   
SZN.Vec2d.prototype.symmetry = function(axis) {
	var norm = axis.normal().unit();
	var coef = this.dot(norm);
	return this.minus(norm.multiply(2*coef));
}
