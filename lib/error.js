/**
 * @overview obecny handler chyb
 * @version 1.0
 * @author zara
 */   


/**
 * @static
 * @name SZN.Error
 * @class Chybovy handler pro unifikovane neobstruktivni zpracovani chyb
 */
SZN.Error = SZN.ClassMaker.makeClass({
	NAME: "Error",
	VERSION: "1.0",
	CLASS: "static"
});

/** @field {array} cache zasobnik chyb */
SZN.Error.cache = [];


/**
 * @method hodi chybu do zasobniku chyb
 */   
SZN.Error.log = function(e) {
	this.cache.push(e);
};

/**
 * @method vypise dosud chycene chyby
 * @returns {string} seznam chyb
 */   
SZN.Error.dump = function() {
	var a = [];
	for (var i=0;i<this.cache.length;i++) {
		var e = this.cache[i];
		var msg = e.message || "[unknown]";
		var line = e.lineNumber || "?";
		var file = e.fileName || "?";
		var s = msg + " ("+file+", #"+line+")";
		a.push(s);
	}
	return a.join(", ");
};

/**
 * @method vymaze cache
 */   
SZN.Error.clear = function() {
	this.cache = [];
};
