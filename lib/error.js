/**
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

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
 * hodi chybu do zasobniku chyb
 * @method 
 */   
SZN.Error.log = function(e) {
	this.cache.push(e);
};

/**
 * vypise dosud chycene chyby
 * @method 
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
 * vymaze cache
 * @method 
 */   
SZN.Error.clear = function() {
	this.cache = [];
};
