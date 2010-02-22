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
 * @overview Parsery a validatory vseho mozneho
 * @version 2.0
 * @author zara et al
 */ 
 
/**
 * @namespace Staticka kupa parseru
 * @group jak-utils
 */     
JAK.Parser = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Parser",
	VERSION: "2.0"
});

/**
 * @param {string} str retezec, jenz mame naparsovat
 * @returns {object || false} literalovy objekt, pokud lze. V opacnem pripade false
 */
JAK.Parser.date = function(str) {
	var obj = {
		year:0,
		month:0,
		day:0,
		hours:0,
		minutes:0,
		seconds:0,
		milliseconds:0
	}
	
	var separators = "[\-/\\\\:.]";
	var chars = "[0-9]";
	var patterns = [
		"^ *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2})",
		"^ *("+chars+"{4}) *"+separators+" *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2})",
		"^ *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2}) *"+separators+" *("+chars+"{4})"
	];
	var datePattern = "( +"+chars+"{1,2})?("+separators+chars+"{1,2})?("+separators+chars+"{1,2})? *$";

	var index = 0;
	while (!result && index < patterns.length) {
		var re = new RegExp(patterns[index] + datePattern);
		var result = re.exec(str);
		index++;
	}
	if (!result) { return false; }
	
	var a = parseInt(result[1],10);
	var b = parseInt(result[2],10);
	var c = parseInt(result[3],10);
	var yearIndex = -1;
	if (result[1].length == 4) {
		yearIndex = 0;
	} else if (result[3].length == 4) {
		yearIndex = 2;
	} else {
		var y = (new Date()).getFullYear();
		if (a > 31) {
			a += (a > y-2000 ? 1900 : 2000);
			yearIndex = 0;
		} else {
			c += (c > y-2000 ? 1900 : 2000);
			yearIndex = 2;
		}
	}

	if (yearIndex == 0) { /* year at the beginning */
		obj.year = a;
		var max = Math.max(b,c);
		var min = Math.min(b,c);
		if (max > 13) {
			obj.month = min-1;
			obj.day = max;
		} else {
			obj.month = b-1;
			obj.day = c;
		}
	} else if (yearIndex == 2) { /* year at the end */
		obj.year = c;
		var max = Math.max(a,b);
		var min = Math.min(a,b);
		if (max > 13) {
			obj.month = min-1;
			obj.day = max;
		} else {
			obj.month = b-1;
			obj.day = a;
		}
	} /* year at the end */
	
	/* time */
	if (result[4]) {
		obj.hours = parseInt(result[4].match(/[0-9]+/)[0],10);
		obj.minutes = (result[5] ? parseInt(result[5].match(/[0-9]+/)[0],10) : 0);
		obj.seconds = (result[6] ? parseInt(result[6].match(/[0-9]+/)[0],10) : 0);
	}

	return obj;
};

/**
 * @param {string} str retezec, jenz mame naparsovat
 * @returns {object || false} literalovy objekt, pokud lze. V opacnem pripade false
 */
JAK.Parser.color = function(str) {
	var obj = {r:0, g:0, b:0};

	if (str.indexOf("#") != -1) { /* hex */
		var regs = str.match(/ *#([a-z0-9]+)/i);
		//console.log(str);
		if (!regs) { return false; }
		var c = regs[1];
		if (c.length == 6) {
			obj.r = parseInt(c.slice(0,2),16);
			obj.g = parseInt(c.slice(2,4),16);
			obj.b = parseInt(c.slice(4,6),16);
			return obj;
		} else if (c.length == 3) {
			obj.r = parseInt(c.charAt(0),16)*17;
			obj.g = parseInt(c.charAt(1),16)*17;
			obj.b = parseInt(c.charAt(2),16)*17;
			return obj;
		} else { return false; }
	} else { /* dec */
		var regs = str.match(/ *\( *([0-9]+) *, *([0-9]+) *, *([0-9]+)/);
		if (!regs) { return false; }
		obj.r = parseInt(regs[1],10);
		obj.g = parseInt(regs[2],10);
		obj.b = parseInt(regs[3],10);
		return obj;
	}
}

/**
 * @param {string} str retezec, jenz mame naparsovat
 * @returns {string || false} cast s validni emailovou adresou, pokud lze. V opacnem pripade false
 */
JAK.Parser.email = function(str) {
	var obj = {
		mailbox:"",
		domain:"",
		tld:""
	}
	var regs = str.match(/^ *([a-z][a-z0-9\.\-\_]*)@([a-z0-9][a-z0-9\.\-\_]*)\.([a-z]{2,5}) *$/i);
	//console.log(regs);
	if (regs) {
		obj.mailbox = regs[1];
		obj.domain = regs[2];
		obj.tld = regs[3];
	} else { return false; }
	return obj;
}
