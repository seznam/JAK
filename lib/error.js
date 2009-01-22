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
 * @overview Chybovy handler pro unifikované neobstruktivní zpracovaní chyb
 * @version 1.0
 * @author zara
 */   


/**
 * Konstruktor třídy, nemá smysl vytvářet jeho instance.
 * @namespace
 * @group jak
 */
SZN.Error = SZN.ClassMaker.makeClass({
	NAME: "Error",
	VERSION: "1.0",
	CLASS: "static"
});

/** @field {array} cache,  zásobník chyb */
SZN.Error.cache = [];


/**
 * Metoda uchová chybu v zásobniku chyb
 * @method
 * @param {Error} e JavaScriptový chybový objekt 
 */   
SZN.Error.log = function(e) {
	this.cache.push(e);
};

/**
 * Vypíše dosud zachycené chyby
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
 * Vymaže cache
 * @method 
 */   
SZN.Error.clear = function() {
	this.cache = [];
};
