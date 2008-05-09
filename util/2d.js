/**
 * @overview Dvourozmerny vektor / bod
 * @version 1.0
 * @author Zara
 */ 

/**
 * @class konstruktor
 * @param {number} x souradnice X
 * @param {number} y souradnice Y
*/ 
SZN.Vec2D = SZN.ClassMaker.makeClass({
	NAME:"Vec2D",
	VERSION:"1.0",
	CLASS:"class"
});

SZN.Vec2D.prototype.$constructor = function(x, y) {
	this.x = x;
	this.y = y;
}

/**
 * @method zmena prvni souradnice
 * @param {number} x nova hodnota
 */   
SZN.Vec2D.prototype.setX = function(x) {
	this.x = x;
}

/**
 * @method zmena druhe souradnice
 * @param {number} y nova hodnota
 */   
SZN.Vec2D.prototype.setY = function(y) {
	this.y = y;
}

/**
 * @method zjisteni prvni souradnice
 */   
SZN.Vec2D.prototype.getX = function() {
	return this.x;
}

/**
 * @method zjisteni druhe souradnice
 */   
SZN.Vec2D.prototype.getY = function() {
	return this.y;
}

/**
 * @method norma vektoru
 * @param {number} [degree] stupen normy, default 2 (eukleidovska)
 */   
SZN.Vec2D.prototype.norm = function(degree) {
	var d = degree || 2;
	return Math.pow(Math.pow(this.getX(),d) + Math.pow(this.getY(),d),1/d);
}

/**
 * @method pricteni druheho vektoru
 * @param {vec2d} t druhy vektor
 */   
SZN.Vec2D.prototype.plus = function(t) {
	return new this.sConstructor(this.getX() + t.getX(), this.getY() + t.getY());
}

/**
 * @method odecteni druheho vektoru
 * @param {vec2d} t druhy vektor
 */   
SZN.Vec2D.prototype.minus = function(t) {
	return new this.sConstructor(this.getX() - t.getX(), this.getY() - t.getY());
}

/**
 * @method nasobeni skalarem
 * @param {number} num 
 */   
SZN.Vec2D.prototype.multiply = function(num) {
	return new this.sConstructor(this.getX() * num, this.getY() * num);
}

/**
 * @method skalarni soucin
 * @param {vec2d} t druhy vektor
 */   
SZN.Vec2D.prototype.dot = function(t) {
	return this.getX() * t.getX() + this.getY() * t.getY();
}

/**
 * @method normalizace na jednotkovy vektor
 * @param {number} [degree] stupen normy, default 2 (eukleidovska)
 */   
SZN.Vec2D.prototype.unit = function(degree) {
	var n = this.norm(degree);
	return new this.sConstructor(this.getX() / n, this.getY() / n);
}

/**
 * @method vraceni normaly
 */   
SZN.Vec2D.prototype.normal = function() {
	return new this.sConstructor(-this.getY(), this.getX());
}

/**
 * @method symetrie okolo zadane osy
 * @param {vec2d} axis
 */   
SZN.Vec2D.prototype.symmetry = function(axis) {
	var norm = axis.normal().unit();
	var coef = this.dot(norm);
	return this.minus(norm.multiply(2*coef));
}

/**
 * @method prevod na retezec, hodnoty spojene zadanym parametrem
 * @param {string} [separator] default carka
 * @param {bool} [round] zaokrouhlit? default false
 */   
SZN.Vec2D.prototype.join = function(separator, round) {
	var s = separator || ",";
	var x = this.getX();
	var y = this.getY();
	if (round) {
		x = Math.round(x);
		y = Math.round(y);
	}
	return x + s + y;
}

/**
 * @method prevod na retezec pro vypis
 */   
SZN.Vec2D.prototype.toString = function() {
	return "["+this.join(", ")+"]";
}
