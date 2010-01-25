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
 * @overview Deklarace "jmenného prostoru" knihoven JAK. Dále obsahuje rozšíření
 * práce s poli dle definice JavaScriptu verze 1.6. Při použití této knihovny je
 * nutné pole vždy procházet pomocí for (var i=0; arr.length > i; i++).  
 * @version 1.1
 * @author jelc 
 */ 

/**
 * @name SZN
 * @group jak
 * @namespace
 * SZN statický objekt, který se používá pro "zapouzdření"
 * všech definic a deklarací. V podmínce se nalezá pro
 * jistotu, protože může být definován ještě před svou
 * deklarací při použití slovníků, nebo konfigurací. 
 */
if(typeof SZN != 'object'){
	var SZN = {NAME:"SZN"};
};

/**
 * vytvoření funkce, která vrací volání funkce ve svém argumentu "fnc" jako metody 
 * objektu z argumentu "obj" s předanými argumenty. Metodu používají další třídy v SZN (např. SZN.Components)
 * @obsolete 
 * @param {object} obj objekt v jehož oboru platnosti bude volán druhý argument
 * @param {function} fnc funkce která bude provedena v oboru platnosti prvního argumentu
 * @example var test = function(){
 *		alert(this.value);
 *  } 
 *  window.value = 1;
 *  var obj = {value:2};
 *  var pokus = SZN.bind(obj,test)
 *  test(); // alert(1);
 *  pokus(); // alert(2);   
 * @return {function} volání takto vytvořené funkce
*/
SZN.bind = function(obj, fnc) {
	return fnc.bind(obj);
};

/**
 * generátor unikatních ID
 * @static
 * @method 
 * @return {string} unikátní ID
 */
SZN.idGenerator = function(){
	this.idCnt = this.idCnt < 10000000 ? this.idCnt : 0;
	var ids = 'm' +  new Date().getTime().toString(16) +  'm' + this.idCnt.toString(16);
	this.idCnt++;
	return ids;	
};

if (!Function.prototype.bind) {
	/**
	 * ES5 Function.prototype.bind
	 * Vrací funkci zbindovanou do zadaného kontextu.
	 * Zbylé volitelné parametry jsou předány volání vnitřní funkce.
	 * @param {object} thisObj Nový kontext
	 * @returns {function}
	 */
	Function.prototype.bind = function(thisObj) { 
		var fn = this;
		var args = Array.prototype.slice.call(arguments, 1); 
		return function() { 
			return fn.apply(thisObj, args.concat(Array.prototype.slice.call(arguments))); 
		}
	}
};

/** 
 * rozšíření polí v JS 1.6 dle definice na http://dev.mozilla.org
 */
if (!Array.prototype.indexOf) { 
	Array.prototype.indexOf = function(item, from) {
	    var len = this.length;
	    var i = from || 0;
	    if (i < 0) { i += len; }
	    for (;i<len;i++) {
			if (i in this && this[i] === item) { return i; }
	    }
	    return -1;
	}
}
if (!Array.indexOf) {
	Array.indexOf = function(obj, item, from) { return Array.prototype.indexOf.call(obj, item, from); }
}

if (!Array.prototype.lastIndexOf) { 
	Array.prototype.lastIndexOf = function(item, from) {
	    var len = this.length;
		var i = from || len-1;
		if (i < 0) { i += len; }
	    for (;i>-1;i--) {
			if (i in this && this[i] === item) { return i; }
	    }
	    return -1;
	}
}
if (!Array.lastIndexOf) { 
	Array.lastIndexOf = function(obj, item, from) { return Array.prototype.lastIndexOf.call(obj, item, from); }
}

if (!Array.prototype.forEach) { 
	Array.prototype.forEach = function(cb, _this) {
	    var len = this.length;
	    for (var i=0;i<len;i++) { 
			if (i in this) { cb.call(_this, this[i], i, this); }
		}
	}
}
if (!Array.forEach) { 
	Array.forEach = function(obj, cb, _this) { Array.prototype.forEach.call(obj, cb, _this); }
}

if (!Array.prototype.every) { 
	Array.prototype.every = function(cb, _this) {
	    var len = this.length;
	    for (var i=0;i<len;i++) {
			if (i in this && !cb.call(_this, this[i], i, this)) { return false; }
	    }
	    return true;
	}
}
if (!Array.every) { 
	Array.every = function(obj, cb, _this) { return Array.prototype.every.call(obj, cb, _this); }
}

if (!Array.prototype.some) { 
	Array.prototype.some = function(cb, _this) {
		var len = this.length;
		for (var i=0;i<len;i++) {
			if (i in this && cb.call(_this, this[i], i, this)) { return true; }
		}
		return false;
	}
}
if (!Array.some) { 
	Array.some = function(obj, cb, _this) { return Array.prototype.some.call(obj, cb, _this); }
}

if (!Array.prototype.map) { 
	Array.prototype.map = function(cb, _this) {
		var len = this.length;
		var res = new Array(len);
		for (var i=0;i<len;i++) {
			if (i in this) { res[i] = cb.call(_this, this[i], i, this); }
		}
		return res;
	}
}
if (!Array.map) { 
	Array.map = function(obj, cb, _this) { return Array.prototype.map.call(obj, cb, _this); }
}

if (!Array.prototype.filter) { 
	Array.prototype.filter = function(cb, _this) {
		var len = this.length;
	    var res = [];
			for (var i=0;i<len;i++) {
				if (i in this) {
					var val = this[i]; // in case fun mutates this
					if (cb.call(_this, val, i, this)) { res.push(val); }
				}
			}
	    return res;
	}
}
if (!Array.filter) { 
	Array.filter = function(obj, cb, _this) { return Array.prototype.filter.call(obj, cb, _this); }
}

/** 
 * Doplneni zadanym znakem zleva na pozadovanou delku
 */
String.prototype.lpad = function(character, count) {
	var ch = character || "0";
	var cnt = count || 2;

	var s = "";
	while (s.length < (cnt - this.length)) { s += ch; }
	s = s.substring(0, cnt-this.length);
	return s+this;
}

/** 
 * Doplneni zadanym znakem zprava na pozadovanou delku
 */
String.prototype.rpad = function(character, count) {
	var ch = character || "0";
	var cnt = count || 2;

	var s = "";
	while (s.length < (cnt - this.length)) { s += ch; }
	s = s.substring(0, cnt-this.length);
	return this+s;
}

/** 
 * Oriznuti bilych znaku ze zacatku a konce textu
 */
String.prototype.trim = function() {
	return this.match(/^\s*([\s\S]*?)\s*$/)[1];
}

Date.prototype._dayNames = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
Date.prototype._dayNamesShort = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
Date.prototype._monthNames = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];
Date.prototype._monthNamesShort = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čer", "Črc", "Srp", "Zář", "Říj", "Lis", "Pro"];

/** 
 * Formatovani data shodne s http://php.net/date
 */
Date.prototype.format = function(str) {
	var suffixes = {
		1:"st",
		2:"nd",
		3:"rd",
		21:"st",
		22:"nd",
		23:"rd",
		31:"st"
	};
	var result = "";
	var escape = false;
	for (var i=0;i<str.length;i++) {
		var ch = str.charAt(i);
		if (escape) {
			escape = false;
			result += ch;
			continue;
		}
		switch (ch) {
			case "\\":
				if (escape) {
					escape = false;
					result += ch;
				} else {
					escape = true;
				}
			break;
			case "d": result += this.getDate().toString().lpad(); break;
			case "j": result += this.getDate(); break;
			case "w": result += this.getDay(); break;
			case "N": result += this.getDay() || 7; break;
			case "S": 
				var d = this.getDate();
				result += suffixes[d] || "th";
			break;
			case "D": result += this._dayNamesShort[(this.getDay() || 7)-1]; break;
			case "l": result += this._dayNames[(this.getDay() || 7)-1]; break;
			case "z":
				var t = this.getTime();
				var d = new Date(t);
				d.setDate(1);
				d.setMonth(0);
				var diff = t - d.getTime();
				result += diff / (1000 * 60 * 60 * 24);
			break;
			
			case "W":
				var d = new Date(this.getFullYear(), this.getMonth(), this.getDate());
				var day = d.getDay() || 7;
				d.setDate(d.getDate() + (4-day));
				var year = d.getFullYear();
				var day = Math.floor((d.getTime() - new Date(year, 0, 1, -6)) / (1000 * 60 * 60 * 24));
				result += (1 + Math.floor(day / 7)).toString().lpad();
			break;

			case "m": result += (this.getMonth()+1).toString().lpad(); break;
			case "n": result += (this.getMonth()+1); break;
			case "M": result += this._monthNamesShort[this.getMonth()]; break;
			case "F": result += this._monthNames[this.getMonth()]; break;
			case "t":
				var t = this.getTime();
				var m = this.getMonth();
				var d = new Date(t);
				var day = 0;
				do {
					day = d.getDate();
					t += 1000 * 60 * 60 * 24;
					d = new Date(t);
				} while (m == d.getMonth());
				result += day;
			break;

			case "L":
				var d = new Date(this.getTime());
				d.setDate(1);
				d.setMonth(1);
				d.setDate(29);
				result += (d.getMonth() == 1 ? "1" : "0");
			break;
			case "Y": result += this.getFullYear().toString().lpad(); break;
			case "y": result += this.getFullYear().toString().lpad().substring(2); break;

			case "a": result += (this.getHours() < 12 ? "am" : "pm"); break;
			case "A": result += (this.getHours() < 12 ? "AM" : "PM"); break;
			case "G": result += this.getHours(); break;
			case "H": result += this.getHours().toString().lpad(); break;
			case "g": result += this.getHours() % 12; break;
			case "h": result += (this.getHours() % 12).toString().lpad(); break;
			case "i": result += this.getMinutes().toString().lpad(); break;
			case "s": result += this.getSeconds().toString().lpad(); break;
			
			case "Z": result += -60*this.getTimezoneOffset(); break;
			
			case "O": 
			case "P": 
				var base = this.getTimezoneOffset()/-60;
				var o = Math.abs(base).toString().lpad();
				if (ch == "P") { o += ":"; }
				o += "00";
				result += (base >= 0 ? "+" : "-")+o;
			break;

			case "U": result += this.getTime()/1000; break; 
			case "u": result += "0"; break; 
			case "c": result += arguments.callee.call(this, "Y-m-d")+"T"+arguments.callee.call(this, "H:i:sP"); break; 
			case "r": result += arguments.callee.call(this, "D, j M Y H:i:s O"); break; 

			default: result += ch; break;
		}
	}
	return result;
}

/**
 * Definice globalniho objektu "console", pokud neexistuje - abychom odchytli zapomenuta ladici volani
 */
if (!window.console) {
	window.console = {
		log: function() {}
	}
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
 * @overview Statická třída sestavující dědičnost rozšiřováním prototypového objektu
 * doplňováním základních metod a testováním závislostí. 
 * @version 4.2
 * @author jelc, zara, aichi
 */   

/**
 * Konstruktor se nevyužívá. Vždy rovnou voláme metody, tedy např.: SZN.ClassMaker.makeClass(...).
 * @namespace
 * @group jak
 */    
SZN.ClassMaker = {};

/** 
 * @field {string} verze třídy 
 */
SZN.ClassMaker.VERSION = "4.2";
/** 
 * @field {string} název třídy 
 */
SZN.ClassMaker.NAME = "ClassMaker";
/** 
 * @field {string} typ třídy (static|class)
 */
SZN.ClassMaker.CLASS = "static";
/** 
 * @field {object} instance třídy ObjCopy, je-li k dispozici (používá se ke kopírování prototypových vlastností, které jsou objekty)
 */
SZN.ClassMaker.copyObj = null;
	
/**
 * Vlastní metoda pro vytvoření třídy, v jediném parametru se dozví informace o třídě, kterou má vytvořit.
 * @param {object} params parametry pro tvorbu nové třídy
 * @param {string} params.NAME povinný název třídy
 * @param {string} [params.VERSION="1.0"] verze třídy
 * @param {string} [params.CLASS] "class"/"static", statická třída odpovídá literálovému objektu a nemůže nic dědit, @deprecated
 * @param {function} [params.EXTEND=false] reference na rodičovskou třídu
 * @param {function[]} [params.IMPLEMENT=[]] pole referencí na rozhraní, jež tato třída implementuje
 * @param {object[]} [params.DEPEND=[]] pole závislostí
 */
SZN.ClassMaker.makeClass = function(params) {
	var p = this._makeDefaultParams(params);
	
	/* back compatibility */
	if (p.CLASS == "static") { /* staticka trida */
		return this.makeStatic(p);
	}
	
	var constructor = function() { /* normalni trida */
		var inicializator = false;
		if ("$constructor" in arguments.callee.prototype) {
			inicializator = arguments.callee.prototype.$constructor;
		} else if (p.NAME in arguments.callee.prototype) { /* back compatibility elseif */
			inicializator = arguments.callee.prototype[p.NAME];
		}
		if (inicializator) { inicializator.apply(this,arguments); }
	}

	/* obsolete */
	constructor.destroy = this._destroy;
	
	return this._addConstructorProperties(constructor, p);
}

/**
 * Vlastní metoda pro vytvoření Jedináčka (Singleton), odlišnost od tvorby třídy přes makeClass je, 
 * že třídě vytvoří statickou metodu getInstance, která vrací právě jednu instanci a dále, že konstruktor
 * nelze zavolat pomocí new (resp. pokud je alespoň jedna instance vytvořena.) Instance je uschována do 
 * vlastnosti třídy _instance
 * @see SZN.ClassMaker.makeClass
 */ 
SZN.ClassMaker.makeSingleton = function(params) {
	var p = this._makeDefaultParams(params);
	
	var constructor = function() { /* normalni trida */
		if (constructor._instance) { throw new Error("Cannot instantiate singleton class"); }
		var inicializator = false;
		if ("$constructor" in arguments.callee.prototype) {
			inicializator = arguments.callee.prototype.$constructor;
		}
		if (inicializator) { inicializator.apply(this,arguments); }
	}
	
	constructor._instance = null;
	constructor.getInstance = this._getInstance;

	return this._addConstructorProperties(constructor, p);
}

/**
 * Vlastní metoda pro vytvoření "třídy" charakterizující rozhranní
 * @see SZN.ClassMaker.makeClass
 */
SZN.ClassMaker.makeInterface = function(params) {
	var p = this._makeDefaultParams(params);
	
	var constructor = function() {
		throw new Error("Cannot instantiate interface");
	}
	
	return this._addConstructorProperties(constructor, p);	
}

/**
 * Vlastní metoda pro vytvoření statické třídy, tedy jmeného prostoru
 * @param {object} params parametry pro tvorbu nové třídy
 * @param {string} params.NAME povinný název třídy
 * @param {string} params.VERSION verze třídy
 */
SZN.ClassMaker.makeStatic = function(params) {
	var p = this._makeDefaultParams(params);

	var obj = {};
	obj.VERSION = p.VERSION;
	obj.NAME = p.NAME;
	return obj;
}

/**
 * Vytvoření defaultních hodnot objektu params, pokud nejsou zadané autorem
 * @param {object} params parametry pro tvorbu nové třídy 
 */ 
SZN.ClassMaker._makeDefaultParams = function(params) {
	params.NAME = params.NAME || false;
	params.VERSION = params.VERSION || "1.0";
	params.EXTEND = params.EXTEND || false;
	params.IMPLEMENT = params.IMPLEMENT || [];
	params.DEPEND = params.DEPEND || [];
	params.CLASS = params.CLASS;
	
	/* implement muze byt tez jeden prvek */
	if (!(params.IMPLEMENT instanceof Array)) { params.IMPLEMENT = [params.IMPLEMENT]; }
	
	this._preMakeTests(params);
	
	return params;
}

/**
 * Otestování parametrů pro tvorbu třídy
 * @param {object} params parametry pro tvorbu nové třídy 
 */ 
SZN.ClassMaker._preMakeTests = function(params) {
    if (!params.NAME) { throw new Error("No NAME passed to SZN.ClassMaker.makeClass()"); }
	
	/* muzu kopirovat objekty ? */
	if (!this.copyObj && SZN.ObjCopy) { this.copyObj = new SZN.ObjCopy(); }
	
	/* test zavislosti */
	var result = false;
	if (result = this._testDepend(params.DEPEND)) { throw new Error("Dependency error in class " + params.NAME + " ("+result+")"); }
}

/**
 * Vytvořenému konstruktoru nové třídy musíme do vínku dát výchozí hodnoty a metody
 */ 
SZN.ClassMaker._addConstructorProperties = function(constructor, params) {
	/* staticke vlastnosti */
	for (var p in params) { constructor[p] = params[p]; }
	
	/* zdedit */
	this._setInheritance(constructor);
	
	/* classMaker dava instancim do vinku tyto vlastnosti a metody */
	constructor.prototype.sConstructor = constructor;
	constructor.prototype.constructor = constructor;
	constructor.prototype.callSuper = this._callSuper;
	constructor.prototype.$super = this._$super;
	
	return constructor;	
}

/**
 * Statická metoda pro všechny singletony
 */
SZN.ClassMaker._getInstance = function() {
	if (!this._instance) { this._instance = new this(); }
	return this._instance;
}

/**
 * Metoda sloužící ke zdědění jako statická metoda vytvářené třídy;
 * nastavuje všechny vlastnosti svého argumentu na null	 
 * @param {object} obj cisteny objekt
 */	 	 	 		
SZN.ClassMaker._destroy = function(obj) {
	for(var p in obj) {
		obj[p] = null;
	};
}
	
/**
 * Volá vlastní kopírování prototypových vlastností jednotlivých rodičů
 * @param {array} extend pole rodicovskych trid
*/
SZN.ClassMaker._setInheritance = function(constructor) {
	if (constructor.EXTEND) { this._makeInheritance(constructor, constructor.EXTEND); }
	for (var i=0; i<constructor.IMPLEMENT.length; i++) {
		this._makeInheritance(constructor, constructor.IMPLEMENT[i], true);
	}
}

/**
 * Provádí vlastní kopírovaní prototypových vlastností z rodiče do potomka 
 * pokud je prototypová vlastnost typu object zavolá metodu, která se pokusí
 * vytvořit hlubokou kopii teto vlastnosti
 * @param {object} constructor Potomek, jehož nové prototypové vlastnosti nastavujeme
 * @param {object} parent Rodič, z jehož vlastnosti 'protype' budeme kopírovat	  	 
 * @param {bool} noSuper Je-li true, jen kopírujeme vlasnosti (IMPLEMENT)
*/
SZN.ClassMaker._makeInheritance = function(constructor, parent, noSuper){
	/* nastavit funkcim predka referenci na predka */
	for (var p in parent.prototype) {
		var item = parent.prototype[p];
		if (typeof(item) != "function") { continue; }
		if (!item.owner) { item.owner = parent; }
	}

	if (!noSuper) { /* extend */
		var tmp = function(){}; 
		tmp.prototype = parent.prototype;
		constructor.prototype = new tmp();
		if (this.copyObj != null) {
			for (var i in parent.prototype) {
				if(typeof parent.prototype[i] == 'object'){
					constructor.prototype[i] = this.copyObj.copy(parent.prototype[i]);
				}
			}
		}
		return;
	}

	for (var p in parent.prototype) { /* implement */
		if (typeof parent.prototype[p] == 'object') {
			if (this.copyObj != null) { constructor.prototype[p] = this.copyObj.copy(parent.prototype[p]); }
		} else {
			// pro rozhrani nededime metody $constructor a $destructor rozhrani
			if (noSuper && ((p == '$constructor') || (p == '$destructor'))) { continue; }		
			constructor.prototype[p] = parent.prototype[p];
		}
	}
}
	
/**
 * Testuje závislosti vytvářené třídy, pokud jsou nastavené
 * @param {array} depend Pole závislostí, ktere chceme otestovat
 * @returns {bool} out true = ok; false = ko	 
*/
SZN.ClassMaker._testDepend = function(depend){
	var out = true;
	for(var i = 0; i < depend.length; i++) {
		var item = depend[i];
		if (!item.sClass) { return "Unsatisfied dependency"; }
		if (!item.ver) { return "Version not specified in dependency"; }
		var depMajor = item.sClass.VERSION.split('.')[0];
		var claMajor = item.ver.split('.')[0];
		if (depMajor != claMajor) { return "Version conflict in "+item.sClass.NAME; }
	}
	return false;
}

/**
 * Metoda sloužící ke zdědění jako prototypová metoda vytvářené třídy
 * vrátí funkci která zavolá metodu předka třídy jako vlastní  
 * @param {string} methodName název metody předka
 * @param {function} callingFunction odkaz na metodu v jejímž kontextu je metoda volána
 * mělo bz to být vždy <strong>arguments.callee</strong>
 * @example 
 *  //trida Car dedi z tridy Vehicle, Vehicle ma metodu getPassangers, kterou trida Car dedi
 *  //pak mohu predefinovat metodu takto:
 *  Car.prototype.getPassangers() {
 *  	var count = this.callSuper('getPassangers', arguments.callee )(); //ty zavorky jsou dulezite!
 *  	return count + 1;  
 *  } 
 */	 	 	 		
SZN.ClassMaker._callSuper = function(methodName,callingFunction){
	var owner = callingFunction.owner || this.constructor; 

	var sup = owner.EXTEND;
	if (!sup) { throw new Error('"No super-class available"'); }
	
	var method = sup.prototype[methodName];
	if (!method || (typeof method != 'function')) { throw new Error("Super-class doesn't have method '"+methodName+"'"); }
	
	var mySelf = this;
	return function() { return method.apply(mySelf,arguments);}
}

/**
 * Další pokus o volání předka. Přímo volá stejně pojmenovanou metodu předka a předá jí zadané parametry.
 */
SZN.ClassMaker._$super = function() {
	var caller = arguments.callee.caller; /* nefunguje v Opere < 9.6 ! */
	if (!caller) { throw new Error("Function.prototype.caller not supported"); }
	
	var owner = caller.owner || this.constructor; /* toto je trida, kde jsme "ted" */

	var callerName = false;
	for (var name in owner.prototype) {
		if (owner.prototype[name] == caller) { callerName = name; }
	}
	if (!callerName) { throw new Error("Cannot find supplied method in constructor"); }
	
	var parent = owner.EXTEND;
	if (!parent) { throw new Error("No super-class available"); }
	if (!parent.prototype[callerName]) { throw new Error("Super-class doesn't have method '"+callerName+"'"); }

	var func = parent.prototype[callerName];
	return func.apply(this, arguments);
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
 * @overview Třída sloužící ke zpracovavaní udalostí a časovačů poskytovaných DOM modelem.
 * @version 2.4
 * @author jelc, zara
 */   

/**
 * Statický konstruktor, nemá smysl vytvářet jeho instance.
 * @group jak
 * @namespace
 */   
SZN.Events = SZN.ClassMaker.makeClass({
	NAME: "Events",
	VERSION: "2.4",
	CLASS: "static"
});

/**
 * do této vlastnosti ukládáme všechny události pro odvěšení
 * @private 
 */ 
SZN.Events.eventFolder = {};

/**
 * vnitřní proměnné pro onDomRady()
 * @private 
 */ 
SZN.Events._domReadyTimer = null;
SZN.Events._domReadyCallback = [];   //zasobnik s objekty a jejich metodami, ktere chci zavolat po nastoleni udalosti
SZN.Events._domReadyAlreadyRun = false;/*ondomready je odchytavano specificky pro ruzne browsery a na konci je window.onload, tak aby se nespustilo 2x*/
SZN.Events._windowLoadListenerId = false; /*v nekterych prohlizecich pouzivame listener, pro jeho odveseni sem schovavam jeho id*/

/**
 * metoda kterou použijeme, pokud chceme navěsit vlastní kód na událost, kdy je DOM strom připraven k použití.
 * Je možné navěsit libovolný počet volaných funkcí.   
 * @method 
 * @param {object} obj objekt ve kterém se bude událost zachytávat, pokud je volána
 * globalní funkce musí byt 'window' případně 'document' 
 * @param {function | string} func funkce, která se bude provádět jako posluchač  
 */ 
SZN.Events.onDomReady = function(obj, func) {
	SZN.Events._domReadyCallback[SZN.Events._domReadyCallback.length] = {obj: obj, func: func}
	SZN.Events._onDomReady();
}

/**
 * vnitrni metoda volana z onDomReady, dulezite kvuli volani bez parametru pro IE, abychom v tom timeoutu mohli volat sama sebe
 * @private
 * @method 
 */ 
SZN.Events._onDomReady = function() {
	if((/Safari/i.test(navigator.userAgent)) || (/WebKit|Khtml/i.test(navigator.userAgent))){ //safari, konqueror
		SZN.Events._domReadyTimer=setInterval(function(){
			if(/loaded|complete/.test(document.readyState)){
			    clearInterval(SZN.Events._domReadyTimer);
			    SZN.Events._domReady(); // zavolani cilove metody
			}}, 10);
	} else if (document.all && !window.opera){ //IE
		//v IE
		//nejsme v ramu
		if (window.parent == window) {
			try {
				// Diego Perini trik bez document.write, vice viz http://javascript.nwbox.com/IEContentLoaded/
				document.documentElement.doScroll("left"); //test moznosti scrolovat, scrolovani jde dle msdn az po content load
			} catch( error ) {
				setTimeout( arguments.callee, 1 ); //nejde, tak volam sama sebe
				return;
			}
			// uz to proslo
			SZN.Events._domReady(); // zavolani cilove metody
		
			//v ramu horni kod nefunguje, protoze document.documentElement je jen stranka s framesetem a ten je rychle nacten ale v ram nacten a byt redy nemusi 
		} else {
			SZN.Events._windowLoadListenerId = SZN.Events.addListener(window, 'load', window, function(){SZN.Events._domReady();});
		}
	} else 	if (document.addEventListener) { //FF, opera
		//SZN.Events._domReadyAlreadyRun = true;
  		document.addEventListener("DOMContentLoaded", SZN.Events._domReady, false); //FF, Opera ma specifickou udalost 
  	} else {
	  	//pokud nic z toho tak dame jeste onload alespon :-)
	  	SZN.Events._windowLoadListenerId = SZN.Events.addListener(window, 'load', window, function(){SZN.Events._domReady();});
	}
}

/**
 * metoda, která je volána z SZN.Events.onDomReady když je dom READY, tato metoda volá 
 * na předaném objektu funkci která byla zadaná 
 * @private
 * @method 
 */ 
SZN.Events._domReady = function () {
	//zaruceni ze se to spusti jen jednou, tedy tehdy kdyz je _domReadyAlreadyRun=false
	if (!SZN.Events._domReadyAlreadyRun) {
		//metoda byla opravdu zavolana
		SZN.Events._domReadyAlreadyRun = true;
	
		//pro FF, operu odvesim udalost
		if (document.addEventListener) {
			document.removeEventListener("DOMContentLoaded", SZN.Events._domReady, true);
		}
		//odveseni udalosti window.onload
		if (SZN.Events._windowLoadListenerId) {
			SZN.Events.removeListener(SZN.Events._windowLoadListenerId);
			SZN.Events._windowLoadListenerId = false;
		}
		
		//vlastni volani metody objektu
		for(var i=0; i < SZN.Events._domReadyCallback.length; i++) {
			var callback =  SZN.Events._domReadyCallback[i];
			if (typeof callback.func == 'string') {
				callback.obj[callback.func]();
			} else {
				callback.func.apply(callback.obj, []);
			}
		}
		//cisteni, uz nechceme zadny odkazy na objekty a funkce
		SZN.Events._domReadyCallback = [];
	}
	
}


/**
 * destruktor, odvěsí všechny handlované události a jejich posluchače a zruší se.
 * @method  
 */   
SZN.Events.destructor = function() {
	this.removeAllListeners();
	this.sConstructor.destroy(this);
}

/**
 * vraci událost, která je právě zpracovávána.
 * @method 
 * @deprecated
 * @param {object} e událost  
 */  
SZN.Events.getEvent = function(e){
	return e || window.event;
}

/**
 * vrací cíl události, tedy na kterém DOM elementu byla vyvolána.
 * @method 
 * @param {object} e událost 
 */  
SZN.Events.getTarget = function(e){
	var e = e || window.event;
	return e.target || e.srcElement; 
}

/**
 * zavěšuje posluchače na danou událost, vytváří a ukládá si anonymní funkci
 * která provede vlastní volání registroveného posluchače tak aby se provedl ve správném
 * oboru platnost. (this uvnitř posluchače se bude vztahovat k objektu jehož je naslouchající funkce metodou  
 * a jako parametry se jí předá odkaz na událost, která byla zachycena a element, na kterém se naslouchalo.<br/>
 * <strong>POZOR!</strong> Dle specifikace se nevolá capture posluchač, pokud je navěšený na prvek, na kterém událost vznikla (jen na jeho předcích). 
 * Dodržuje to však pouze Opera, Gecko ne (viz https://bugzilla.mozilla.org/show_bug.cgi?id=235441).
 * @method 
 * @param {object} elm element, který událost zachytává
 * @param {string} eType typ události bez předpony "on"
 * @param {object} obj objekt ve kterém se bude událost zachytávat, pokud je volána
 * globalní funkce musí byt 'window' případně 'document' 
 * @param {function | string} func funkce, která se bude provádět jako posluchač
 * <em>string</em> pokud jde o metodu <em>obj</em> nebo reference na funkci, která se zavolá
 * jako metoda <em>obj</em>  
 * @param {boolean} capture hodnata použitá jako argument capture pro DOM zachytávání
 * pro IE je ignorována 
 * @returns {string} identifikátor handleru v  <em>eventFolder</em> prostřednictvím, kterého se
 * událost odvěšuje, pokud je <em>cached</em> vyhodnoceno jako true
 * @throws {error}  Events.addListener: arguments[3] must be method of arguments[2]
 * @throws {error} Events.addListener: arguments[2] must be object or function
 */    
SZN.Events.addListener = function(elm, eType, obj, func, capture){
	var capture = capture || false;
	var method = null;
	var toFold = null;
	if (func) {
		if (typeof(func) == "string") {			
			if (typeof(obj[func]) == "function") {
				method = this._getMethod(obj,func,elm);
				toFold = this._addListener(elm,eType,method,capture);			
			} else {
				throw new Error("Events.addListener: arguments[3] must be method of arguments[2]");
			}
		} else {
			method = this._getMethod(obj,func,elm);
			toFold = this._addListener(elm,eType,method,capture);
		}
	} else {
		toFold = this._addListener(elm,eType,obj,capture);
	}

	//uchovavani si obj a func kvuli metode getInfo()
	toFold.push(obj);
	toFold.push(func);
	return this._storeToFolder(toFold);
}

/**
 * vlastní zavěšení posluchače bud DOM kompatibilně, nebo přes attachEvent
 * pro IE 
 * @private
 * @method 
 * @param {object} elm element, který událost zachytává
 * @param {string} eType typ události bez předpony "on"
 * @param {func} func funkce/metoda která se bude provádět
 * @param {boolean} capture hodnota použitá jako argument capture pro DOM zachytávání
 * @returns {array} obsahující argumenty funkce ve shodném pořadí 
 */    
SZN.Events._addListener = function(elm,eType,func,capture){
	if (document.addEventListener) {
		elm.addEventListener(eType,func,capture);
	} else if (document.attachEvent) {
		elm.attachEvent('on'+eType,func);
	}
	return [elm,eType,func,capture];
}

/**
 * Vytváří funkci/metodu, která bude fungovat jako posluchač události tak
 * aby předaná metoda byla zpracovávána ve správnem oboru platnosti, this bude
 * objekt který ma naslouchat, požadované metodě předává objekt události a element na
 * kterém se naslouchalo
 * @private
 * @method 
 * @param {object} obj objekt v jehož oboru platnosti se vykoná <em>func</em> po zachycení události
 * @param {function} func funkce/metoda, u které chceme aby use dálost zpracovávala
 * @param {object} elm Element na kterém se poslouchá
 * @returns {function} anonymní funkce, která zprostředkuje zpracování události
 * požadované metodě 
 */    
SZN.Events._getMethod = function(obj,func,elm){
	if (typeof(func) == "string") {
		return function(e){return obj[func].apply(obj,[e,elm])};
	} else {
		return function(e){return func.apply(obj,[e,elm])};
	}
}

/**
 * ukladá údaje o zavěšeném posluchači do <em>eventFolder</em> pro použití
 * při odvěšování a vrací identifikator uložených údajů
 * @private
 * @method 
 * @param {array} data vrácená metodou <em>_addListener</em>
 * @returns {string} id identifikátor dat v <em>eventFolder</em>
 */   
SZN.Events._storeToFolder = function(data){
	var id = SZN.idGenerator();
	this.eventFolder[id] = {};
	this.eventFolder[id].trg = data[0];
	this.eventFolder[id].typ = data[1];
	this.eventFolder[id].action = data[2];
	this.eventFolder[id].capture = data[3];
	this.eventFolder[id].obj = data[4];
	this.eventFolder[id].func = data[5];
	return id;
}

/**
 * odebírání posluchačů události, buď zadáním stejných údajů jako při handlování
 * (nedoporučeno) nebo zadáním <em>id (cached)</em>, které vrací medoda <em>addListener</em> <br />
 * a) pokud je zadán jen jeden argument, nebo je první argument string, je považován za hodnotu <em>id (chached)</em><br />
 * b) jinak se zkusi standardní odvěšení
 *  
 * @method 
 * @param {object} elm elemnet na kterém se poslouchalo
 * @param {string} eType událost která se zachytávala
 * @param {object} obj objekt v jehož oboru platnosti se zachycená událost zpracovala
 * @param {function || string} func funkce/metoda která událost zpracovávala
 * @param {boolean} capture hodnota capture pro DOM odvěšování
 * @param {string} cached id pod kterým jsou uložena data k odvěšení v <em>eventFolder</em>
 * @throws {error} Events.removeListener: wrong arguments
 */    
SZN.Events.removeListener = function(elm,eType,obj,func,capture,cached){
	var capture = arguments[4] || false;
	var cached = arguments[5] || false;
	if (arguments.length == 1 || typeof(arguments[0]) == "string") { cached = arguments[0]; }
	
	if (typeof cached == 'string') { 
		return this._removeById(cached);
	} else if (typeof obj == 'function') {
		return this._removeListener(elm,eType,obj,capture);
	} else {
		throw new Error('Events.removeListener: wrong arguments');
	}
}

/**
 * provádí skutečné odvěšení posluchačů DOM kompatibilně či pro IE
 * @private
 * @method 
 * @param {object} elm element na kterém se naslouchalo
 * @param {string} eType událost, která se zachytávala
 * @param {function} func skutečná funkce, která zpracovávala událost
 * @param  {boolean} capture pro DOM zpracovávání stejna hodota jako při zavěšování
 *
 */    
SZN.Events._removeListener = function(elm,eType,func,capture){
	if (document.removeEventListener) {
		if (window.opera && (elm == window)){
			elm = document;
		}
		elm.removeEventListener(eType,func,capture);
	} else if (document.detachEvent) {
		elm.detachEvent('on'+eType,func);
	}
	return 0;
}

/**
 * volá odvěšení na základě vlastností uložených v <em>eventFolder</em>
 * @private
 * @method 
 * @param {string} cached id pod kterým jsou data o posluchači uložena
 * @returns {int} 0 v případě úspěchu, 1 v případě neůspěchu
 */     
SZN.Events._removeById = function(cached){
	try{
		var obj = this.eventFolder[cached];
		this._removeListener(obj.trg, obj.typ, obj.action, obj.capture);
		this.eventFolder[cached] = null;
		delete(this.eventFolder[cached]);
	} catch(e){
		//debug(conSerialize(e))
		//debug(obj.trg.nodeName)
		return 1;
	}
	return 0;
}

/**
 * provede odvěšení všech posluchačů, kteří jsou uloženi v <em>eventFolder</em>
 * @method 
 */   
SZN.Events.removeAllListeners = function(){
	for(var p in this.eventFolder){
		this._removeById(p);
	}
}

/**
 * zastaví probublávaní události stromem dokumentu
 * @method 
 * @param {object} e zpracovávaná událost 
 */  
SZN.Events.stopEvent = function(e){
	var e = e || window.event;
	if (e.stopPropagation){
		e.stopPropagation();
	} else { 
		e.cancelBubble = true;
	}
}

/**
 * zruší výchozí akce (definované klientem) pro danou událost (např. prokliknutí odkazu)
 * @method 
 * @param {object} e zpracovávaná událost 
 */   
SZN.Events.cancelDef = function(e){
	var e = e || window.event;
	if(e.preventDefault) {
		e.preventDefault();
	} else {
		e.returnValue = false;
	}
}


/**
 * provádí transformaci předané metody tak aby se zavolala v kontextu objektu <em>owner</em>
 * při použití v intervalu nebo timeoutu, v oboru platnosti <em>owner</em> vytvoří funkci, která provede
 * volání <em>exeFunc</em> v oboru platnosti <em>owner</em>. Vlastně to samé jako SZN.bind().
 * @method  
 * @param {object} owner objekt v jehož oboru platnosti se bude vykonávat funkce/metoda exeFunc v časovači
 * @param {string} handleFuncName název vlastnosti objektu <em>owner</em>, která se bude spouštět v časovači
 * @param {function} exeFunc funkce/metoda, kterou chceme provádět
 * @param {function} exeObj objekt, nad kterym chceme provádět metodu <em>execFunc</em>, není-li zadán je prováděna v kontextu <em>owner</em> 
 */     
SZN.Events.addTimeFunction = function(owner,handleFuncName,exeFunc,exeObj){
	if(!!exeObj){
		owner[handleFuncName] = function(){return exeFunc.apply(exeObj,[])};
	} else {
		owner[handleFuncName] = function(){return exeFunc.apply(owner,[])};
	}
}

/**
 * metoda vrací strukturovaný objekt s informacemi o nabindovaných udalostech. struktura je vhodná pro bookmark
 * Visual Event (http://www.sprymedia.co.uk/article/Visual+Event) od Allana Jardine. Po spuštění jeho JS bookmarku
 * jsou navěšené události vizualizovány na dané stránce
 */
SZN.Events.getInfo = function() {
	var output = [];
	var tmpObjectFolder = [];
	var tmpEventFolder = [];
	for (var i in SZN.Events.eventFolder) {
		var o = SZN.Events.eventFolder[i];
		var index = tmpObjectFolder.indexOf(o.trg);
		if (index == -1) {
			index = tmpObjectFolder.push(o.trg) -1;
			tmpEventFolder[index] = [];
		}

		tmpEventFolder[index].push(o);
	}

	for (var i in tmpObjectFolder) {
		var listeners = [];
		for (var j in tmpEventFolder[i]) {
			var o = tmpEventFolder[i][j];
			var obj = window;
			var func = null;
			if (o.func) {
				obj = o.obj;
				func = o.func;
			} else {
				func = o.action;
			}

			listeners.push({
					'sType': o.typ,
					'sFunction':  (obj != window && obj.constructor ? '['+obj.constructor.NAME+']' : '') + (typeof(func) == 'string' ? '.'+func+' = '+ obj[func].toString() : ' '+func.toString()),
					'bRemoved': false
				});
		}

		output.push({
			'nNode': tmpObjectFolder[i],
			'sSource': 'JAK',
			'aListeners': listeners
		});
	}

	tmpObjectFolder = null;
	tmpEventFolder = null;
	return output;
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
 * @overview Detekce klientského prostředí v závislosti na vlastnostech JavaScriptu
 * (pokud je to možné, jinak dle vlastnosti navigator.userAgent).
 * @version 2.3
 * @author jelc, zara
 */   


/**
 * Statická třída obsahující vlastnosti <em>platform</em>, <em>client</em>,  
 * <em>version</em> a <em>agent</em>, které určují uživatelovo prostředí
 * @namespace
 * @group jak
 */
SZN.Browser = SZN.ClassMaker.makeClass({
	NAME: "Browser",
	VERSION: "2.4",
	CLASS: "static"
});

/** @field {string} platform system uzivatele */
SZN.Browser.platform = '';
/** @field {string} client prohlizec uzivatele */
SZN.Browser.client = '';
/** @ignore */
SZN.Browser.klient = '';
/** @field {string} version verze prohlizece */
SZN.Browser.version = 0;
/** @field {string} agent hodnota systemove promene "navigator.userAgent" */
SZN.Browser.agent = '';
/** @field {object} mouse objekt s vlastnostmi left, right, middle které lze použít k identifikaci stisknutého tlačítka myši */
SZN.Browser.mouse = {};

/**
 * Zjistuje system uzivatele
 * @private
 * @returns {string} ktery popisuje pouzivany system:
 * <ul>
 * <li>nix - Linux, BSD apod.</li>
 * <li>mac - Apple</li>
 * <li>win - Windows pro PC</li>
 * <li>oth - vsechno ostatni</li>  
 * </ul>    
 *
 */   
SZN.Browser._getPlatform = function(){
	if((this._agent.indexOf('X11') != -1) 
	|| (this._agent.indexOf('Linux') != -1)){
		return 'nix';
	} else if(this._agent.indexOf('Mac') != -1){
		return 'mac';
	} else if(this._agent.indexOf('Win') != -1){
		return 'win';
	} else {
		return 'oth';
	}
};

/**
 * Zjistuje typ prohlizece
 * @private
 * @returns {string} ktery popisuje pouzivany prohlizec
 * <ul>
 * <li>opera - Opera</li>
 * <li>ie - Internet Explorer</li>
 * <li>gecko - Mozilla like</li>
 * <li>konqueror - Konqueror</li>  
 * <li>safari - Safari</li>  
 * <li>chrome - Google Chrome</li>  
 * <li>oth - vsechno ostatni/neznamy</li>  
 * </ul>  
 */   
SZN.Browser._getKlient = function(){
	if (window.opera) {
		return "opera";
	} else if (window.chrome) {
		return "chrome";
	} else if(document.attachEvent && (typeof navigator.systemLanguage != "undefined")) {
		return "ie";
	} else if (document.getAnonymousElementByAttribute) {
		return "gecko";
	} else if (this._agent.indexOf("KHTML")) {
		if (this._vendor == "KDE") {
			return "konqueror";
		} else {
			return "safari";
		}
	} else {
		return "oth";
	}
};

/**
 * Nastavuje identifikaci leveho a praveho tlacitka mysi
 * @private 
 * @returns {object} jako asociativni pole s vlastnostmi
 * <em>left</em> a <em>right</em>, ktere obsahuji ciselny identifikator
 * stisknuteho tlacitka mysi jak ho klient vraci ve vlastnosti udalosti
 * <em>e.button</em>
 */
SZN.Browser._getMouse = function(){
	var left;
	var right;
	var middle;
	if ((SZN.Browser.client == 'ie') || (SZN.Browser.client == 'konqueror')){
		left = 1;
		middle = 4;
		right = 2;
	} else if((SZN.Browser.client == 'opera') && (SZN.Browser.version > 7) && (SZN.Browser.version < 9)) {
		left = 1;
		middle = 4;
		right = 2;
	} else if (SZN.Browser.client == 'safari'){
		if (parseInt(SZN.Browser.version) > 2) {
			left = 0;
			middle = 0;
			right = 2;
		} else {
			left = 1;
			middle = 1;
			right = 2;
		}
	} else {
		left = 0;
		middle = 1;
		right = 2;
	}
	
	return {left:left,right:right, middle:middle};	
}

/**
 * Zjistuje verzi daneho prohlizece, detekovaneho metodou "_getKlient"
 * @private
 * @returns {string} navratova hodnota metod jejich nazev je slozeny z retezcu
 * '_get_' + vlastnost <em>klient</em>  + '_ver'
 * @example  <pre>
 * pro Internet Exlporer je volana metoda <em>this._get_ie_ver()</em>
 *</pre>    
 */   
SZN.Browser._getVersion = function(){
	var out = 0;
	var fncName = '_get_' + this.client + '_ver';
	
	if(typeof this[fncName] == 'function'){
		return this[fncName]();
	} else {
		return 0;
	}
};

/**
 * Detekce verze Internet Exploreru
 * @private
 * @returns {string} verze prohlizece od 5.0 do 7 (IE 8 bude detekovano jako 7)
 */   
SZN.Browser._get_ie_ver = function(){
	if(typeof Function.prototype.call != 'undefined'){
		if (window.XDomainRequest) {
			return '8';
		} else if(window.XMLHttpRequest){
			return '7';
		} else if (typeof document.doctype == 'object'){
			return '6';
		} else {
			return '5.5';
		}
	} else {
		return '5.0';
	}
};

/**
 * Detekce verze Opery
 * Od 6 do aktualni verze. od verze 7.6+ je podporovana vlastnost
 * window.opera.version() vracejici aktualni verzi, napr. 9.63  
 * @see http://www.howtocreate.co.uk/operaStuff/operaObject.html 
 * @private
 * @returns {string} verze prohlizece 
 */  
SZN.Browser._get_opera_ver = function(){
	if(window.opera.version){
		return window.opera.version();
	} else { 
		if(document.createComment){
			return '7';
		} else {
			return '6';
		}
	}
};

/**
 * Detekce verze Gecko prohlizecu
 * @private
 * @returns {string} verze prohlizece od 1.5 do 3.5 (> 3.5 bude detekovano jako 3.5)
 */ 
SZN.Browser._get_gecko_ver = function(){
	if (document.getBoxObjectFor === undefined && navigator.geolocation) { 
		return '3.6';
	} else if (navigator.geolocation) {
		return '3.5';
	} else if (document.getElementsByClassName) {
		return '3';
	} else if(window.external){
		return '2';
	} else {
		return '1.5';
	}
};

/**
 * Detekce verze Konqueroru
 * @private
 * @returns {string} verze prohlizece na zaklade hodnot uvedenych v navigator.userAgent
 * detekuji se prvni dve cisla (3.4,3.5,3.6 atd...) 
 */ 
SZN.Browser._get_konqueror_ver = function(){
	var num = this._agent.indexOf('KHTML') + 6;
	var part =  this._agent.substring(num);
	var end = part.indexOf(' ')
	var x = part.substring(0,end - 2);
	return x;
	
};

/**
 * Detekce verze Safari
 * @private
 * @returns {string} verze
 */ 
SZN.Browser._get_safari_ver = function(){
	var ver = this._agent.match(/version\/([0-9]+)/i);
	return (ver ? ver[1] : "1");
};

/**
 * Detekce verze Google Chrome
 * @private
 * @returns {string} verze verze se nedetekuje vraci 1
 */ 
SZN.Browser._get_chrome_ver = function(){
	var ver = this._agent.match(/Chrome\/([0-9]+)/i);
	return (ver ? ver[1] : null);
};

/**
 * Implicitní konkstruktor, je volán při načtení skriptu 
 */   
SZN.Browser.getBrowser = function(){
	this._agent = this.agent = navigator.userAgent;
	this._platform = navigator.platform;
	this._vendor = navigator.vendor;
	this.platform = this._getPlatform();
	this.client = this._getKlient();
	this.klient = this.client;
	this.version = this._getVersion();
	this.mouse = this._getMouse();
};
SZN.Browser.getBrowser();
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
 * @overview <em>Rozhraní</em> určené pro vytváření hierarchie objektů na základě "komponent",
 * Pokud bude mít naše aplikace podobnou strukturu jako ukázkový graf (jednotlivé větve jsou instance tříd),
 * napomáhá automatizaci při jejím vytváření a rušení, včetně rušení jen jednotlivých větví, případně při
 * dynamickém doplňování destruktoru.  
 *   
 * <pre>
 * MAIN
 *  |__ child_1
 *  |__ child_2
 *  	|__child_2.1
 *  	|__child_2.2    
 * </pre>  
 *  
 * @version 1.2
 * @author jelc, wendigo
 */ 
    
/**
 * @class Třída pro dědění rozhraní "Components", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností.  
 * @group jak
 */
SZN.Components = SZN.ClassMaker.makeClass({
	NAME: "Components",
	VERSION: "1.2",
	CLASS: "class"
});

/**
 * zjišťuje zda má daná třída definované komponenty
 * @method 
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.hasComponents = function(){
	if((this.components instanceof Array) && this.components.length){
		return true;
	} else { 
		return false;
	}
};

/**
 * přidá všechny komponenty uvedené v poli <em>componets</em> dané třídy
 * @method 
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.addAllComponents = function(){
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length;i++){
		this._addComponent(this.components[i]);
	}
	return true;
};


/**
 * přidá novou komponentu za běhu programu
 * @method 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název pod kterým se má komponenta vytvořit jako vlastnost objektu</li>
 * </ul>   
 */   
SZN.Components.prototype.addNewComponent = function(component){
	if(!this.hasComponents()){
		this.components = new Array();
	}
	this.components.push(component);
	this._addComponent(component);
};

/* pridava jednotlive komponenty z pole */
/**
 * přidává jednotlivé komponenty, pokud komponenta nemá definouvanou vlastnost "name", vytvoří ji z názvu konstruktoru
 * pokud má již třída vlostnost shodného jména, bude tato vlastnost přepsána 
 * @private
 * @method 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název, pod kterým se ma komponenta vytvořit jako vlastnost objektu</li>
 * </ul>   
 *
 */    
SZN.Components.prototype._addComponent = function(component){
	if(typeof component.part != 'undefined'){
		if(typeof component.name == 'undefined'){
			component.name = component.part.NAME.substring(0,1).toLowerCase();
			component.name += component.part.NAME.substring(1);
		} 
		if(typeof component.setting != 'undefined'){
			this[component.name] = new component.part(this,component.name,component.setting);
		} else {
			this[component.name] = new component.part(this,component.name);
		}
	}
};

/* obsahuje registraci 'public' komponent v instanci tridy definovane
*  argumentem owner
*/
/**
 * vytváří volání vlastních metod z objektu, ktery je definován argumentem owner
 * tak že čte vlastnost <em>'access'</em> svých metod, vlastost acces je string jehož
 * první částí je specifikátor přístupu (poviný) s hodnotou 'public' a za ním následuje mezerou
 * oddělený název pod jakým se má volání vytvořit, není-li uveden použije se název vytvořený
 * ze jména objektu a metody
 * @method      
 * @param {object} owner reference na objekt, ve kterém se volání vytvoří
 * @throws {error} 'registredComponent: component "' + components_name + '" already exist!'
 * pokud <em>owner</em> již takto definovanou vlastnost má 
 */    
SZN.Components.prototype.registredMethod = function(owner){
	var field = [this,this.sConstructor];
	/* registrace verejnych metod */
	for(var i = 0; i < field.length; i++){
		var obj = field[i];
		for(var j in obj){
			/* to je tu kvuli startsim gecko prohlizecum */
			if(obj[j] === null) continue;
			if(typeof obj[j] == 'undefined') continue;
			if((typeof obj[j].access != 'undefined') && (obj[j].access.indexOf('public') == 0)){
				var name = this._createMethodName(obj, j);
				
				if(typeof owner[name] == 'undefined'){
					owner[name] = (obj == this.sConstructor) ? this.sConstructor[j] : SZN.bind(this,this[j]);
				} else {
					throw new Error('registredMethod: method "' + name + '" already exist!')
				}
			}
		}
	}
};

/**
 * odregistrace metod, z objektu owner, ktere byly vytvoreny volanim registredMethod
 * @param {object} owner
 */
SZN.Components.prototype.unregistredMethod = function(owner) {
	var field = [this,this.sConstructor];
	/* odregistrace verejnych metod */
	for(var i = 0; i < field.length; i++){
		var obj = field[i];
		for(var j in obj){
			/* to je tu kvuli startsim gecko prohlizecum */
			if(obj[j] === null) continue;
			if(typeof obj[j] == 'undefined') continue;
			if((typeof obj[j].access != 'undefined') && (obj[j].access.indexOf('public') == 0)){
				//projedu vsechny metody tohoto objektu a odregistruju je z rodice
				var name = this._createMethodName(obj, j);

				if(typeof owner[name] != 'undefined'){
					delete(owner[name]);
				}
			}
		}
	}
}

/**
 * metoda pouzivana registredMethod a unregistredMethod pro vytvoreni jmena metody
 * @param {object} obj
 * @param {string} methodName
 * @return {string}
 */
SZN.Components.prototype._createMethodName = function(obj, methodName) {
	var nameFirstChar = methodName.substring(0,1).toUpperCase();
	var nameNext = methodName.substring(1);
	var mods = obj[methodName].access.replace(/[ ]{2,}/gi,' ').split(' ');

	if(mods.length > 1){
		var name = mods[1];
	} else {
		var namePrefix = (obj == this.sConstructor) ? obj.NAME : this._name;
		var name = namePrefix + nameFirstChar + nameNext;
	}
	return name;
}

/* vracim hlavni tridu */
/**
 * slouží k nalezení hlavniho objektu, který vytváří danou část programu
 * a má definovanou vlastnost TOP_LEVEL
 * @method  
 * @returns {object} refetrence na hlavni objekt
 * @throws {error}  'can\'t find TOP LEVEL Class' pokud není nalezen hlavní objekt
 */     
SZN.Components.prototype.getMain = function(){
	var obj = this;
	while(typeof obj.TOP_LEVEL == 'undefined'){
		if(typeof obj._owner == 'undefined'){
			throw new Error('can\'t find TOP LEVEL Class');
		} else {
			obj = obj._owner;
		}
	}
	return obj;
};

/**
 * slouží k postupnému volání destruktorů všech komponent, daného objektu
 * @method 
 */
SZN.Components.prototype.callChildDestructor = function(){
	this.inDestruction = true;
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length; i++){
		var cName = this.components[i].name;
		if(this[cName] == null) {
			continue;
		}
		if((typeof this[cName].CLASS != 'undefined') && (typeof this[cName].inDestruction != 'boolean')){
			var name = '$destructor';
			if((typeof this[cName][name] != 'undefined')
			&&(typeof this[cName][name] == 'function')){
				this[cName][name]();
			}
			this[cName] = null;
		} 
	}	
};

/**
 * odebere komponentu, ktera je zadana nazvem, nebo objektem
 * @param {object} component
 * @param {boolean} withDestruction - zda ma zavolat destruktor komponenty 
 * @method 
 */
SZN.Components.prototype.removeComponent =function(component, withDestruction){

	for (var i =0; i < this.components.length; i++) {
		var c = this.components[i];
		if (component == c.name || component == this[c.name]  ) {
			if (withDestruction && (typeof this[c.name].$destructor == 'function')) {
				this[c.name].$destructor();
			}
			this[c.name] = null;
			c = null;

			this.components.splice(i,1);
			break;
		}
	}
}/*
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
 * @overview Statická třída posytující některé praktické metody na úpravy a práci s DOM stromem, např. vytváření a získávání elementů.
 * @version 3.6
 * @author zara, koko, jelc
 */

/**
 * Statický konstruktor, nemá smysl vytvářet jeho instance.
 * @namespace
 * @group jak
 */
SZN.Dom = SZN.ClassMaker.makeClass({
	NAME: "Dom",
	VERSION: "3.6",
	CLASS: "static"
});

/**
 * Vytvoří DOM node, je možné rovnou zadat id, CSS třídu a styly
 * @param {String} tagName jméno tagu (lowercase)
 * @param {String} id id uzlu
 * @param {String} className název CSS trid(y)
 * @param {Object} styleObj asociativní pole CSS vlastností a jejich hodnot
 * @param {Object} doc dokument, v jehož kontextu se node vyrobí (default: document)
 */
SZN.cEl = function(tagName,id,className,styleObj,doc) {
	var d = doc || document;
	var node = d.createElement(tagName);
	if (arguments.length == 1) { return node; }
	if (id) { node.id = id; }
	if (className) { node.className = className; }
	if (styleObj) { SZN.Dom.setStyle(node, styleObj); }
	return node;
}
	
/**
 * Alias pro document.createTextNode
 * @param {String} str řetězec s textem
 * @param {Object} doc dokument, v jehož kontextu se node vyrobí (default: document)
 */
SZN.cTxt = function(str, doc) {
	var d = doc || document;
	return d.createTextNode(str);
}
	
/**
 * zjednodušený přístup k metodě DOM document.getElementById
 * @static
 * @method 
 * @param {string} ids id HTML elementu, který chceme získat,
 * NEBO přímo element
 * @returns {object} HTML element s id = ids, pokud existuje, NEBO element specifikovaný jako parametr
 */
 SZN.gEl = function(ids){
	if (typeof(ids) == "string") {
		return document.getElementById(ids);
	} else { return ids; }
}

/**
 * Propoji zadané DOM uzly
 * @param {Array} pole1...poleN libovolný počet polí; pro každé pole se vezme jeho první prvek a ostatní 
 *   se mu navěsí jako potomci
 */
SZN.Dom.append = function() { /* takes variable amount of arrays */
	for (var i=0;i<arguments.length;i++) {
		var arr = arguments[i];
		var head = arr[0];
		for (var j=1;j<arr.length;j++) {
			head.appendChild(arr[j]);
		}
	}
}
	
/**
 * Otestuje, má-li zadany DOM uzel danou CSS třídu
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 * @return {bool} true|false
 */
SZN.Dom.hasClass = function(element,className) {
	var arr = element.className.split(" ");
	for (var i=0;i<arr.length;i++) { 
		if (arr[i] == className) { return true; } 
	}
	return false;
}

/**
 * Přidá DOM uzlu CSS třídu. Pokud ji již má, pak neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 */
SZN.Dom.addClass = function(element,className) {
	if (SZN.Dom.hasClass(element,className)) { return; }
	element.className += " "+className;
}

/**
 * Odebere DOM uzlu CSS třídu. Pokud ji nemá, neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 */
SZN.Dom.removeClass = function(element,className) {
	var names = element.className.split(" ");
	var newClassArr = [];
	for (var i=0;i<names.length;i++) {
		if (names[i] != className) { newClassArr.push(names[i]); }
	}
	element.className = newClassArr.join(" ");
}

/**
 * Vymaže (removeChild) všechny potomky daného DOM uzlu
 * @param {Object} element DOM uzel
 */
SZN.Dom.clear = function(element) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
}

/**
 * vrací velikost dokumentu, lze použít ve standardním i quirk módu 
 * @method  
 * @returns {object} s vlastnostmi:
 * <ul><li><em>width</em> - šířka dokumentu</li><li><em>height</em> - výška dokumentu</li></ul> 
 */    
SZN.Dom.getDocSize = function(){
	var x = 0;
	var y = 0;		
	if (document.compatMode != 'BackCompat') {
		
		if(document.documentElement.clientWidth && SZN.Browser.klient != 'opera'){
			x = document.documentElement.clientWidth;
			y = document.documentElement.clientHeight;
		} else if(SZN.Browser.klient == 'opera') {
			if(parseFloat(SZN.Browser.version) < 9.5){
				x = document.body.clientWidth;
				y = document.body.clientHeight;
			} else {
				x = document.documentElement.clientWidth;
				y = document.documentElement.clientHeight;
			}
		} 
		
		if ((SZN.Browser.klient == 'safari') || (SZN.Browser.klient == 'konqueror')){
			y = window.innerHeight; 
		}
		} else {
			x = document.body.clientWidth;
			y = document.body.clientHeight;
		}
	
	return {width:x,height:y};
};

/**
 * vrací polohu "obj" ve stránce nebo uvnitř objektu který předám jako druhý 
 * argument
 * @method 
 * @param {object} obj HTML element, jehož pozici chci zjistit
 * @param {object} [ref] <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
 */
SZN.Dom.getBoxPosition = function(obj, ref){
	var top = 0;
	var left = 0;
	var refBox = ref || obj.ownerDocument.body;
	
	if (obj.getBoundingClientRect && !ref) { /* pro IE a absolutni zjisteni se da pouzit tenhle trik od eltona: */
		var de = document.documentElement;
		var box = obj.getBoundingClientRect();
		var scroll = SZN.Dom.getBoxScroll(obj);
		return {left:box.left+scroll.x-de.clientLeft, top:box.top+scroll.y-de.clientTop};
	}

	while (obj && obj != refBox) {
		top += obj.offsetTop;
		left += obj.offsetLeft;

		/*pro FF2, safari a chrome, pokud narazime na fixed element, musime se u nej zastavit a pripocitat odscrolovani, ostatni prohlizece to delaji sami*/
		if ((SZN.Browser.client == 'gecko' && SZN.Browser.version < 3) || SZN.Browser.client == 'safari') {
			if (SZN.Dom.getStyle(obj, 'position') == 'fixed') {
				var scroll = SZN.Dom.getScrollPos();
				top += scroll.y;
				left += scroll.x;
				break;
			}
		}

		obj = obj.offsetParent;
	}
	return {top:top,left:left};
}

/*
	Par noticek k výpočtům odscrollovaní:
	- rodič body je html (documentElement), rodič html je document
	- v strict mode má scroll okna nastavené html
	- v quirks mode má scroll okna nastavené body
	- opera dává vždy do obou dvou
	- safari dává vždy jen do body
*/

/**
 * vrací polohu "obj" v okně nebo uvnitř objektu který předáme jako druhý 
 * argument, zahrnuje i potencialni odskrolovani kdekoliv nad objektem 
 *	Par noticek k výpočtům odscrollovaní:<ul>
 *	<li>rodič body je html (documentElement), rodič html je document</li>
 *	<li>v strict mode má scroll okna nastavené html</li>
 *	<li>v quirks mode má scroll okna nastavené body</li>
 *	<li>opera dává vždy do obou dvou</li>
 *	<li>safari dává vždy jen do body </li></ul>
 * @method 
 * @param {object} obj HTML elmenet, jehož pozici chci zjistit
 * @param {object} parent <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalní pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
 */
 SZN.Dom.getFullBoxPosition = function(obj, parent, fixed) {
	var pos = SZN.Dom.getBoxPosition(obj, parent, fixed);
	var scroll = SZN.Dom.getBoxScroll(obj, parent, fixed);
	pos.left -= scroll.x;
	pos.top -= scroll.y;
	return {left:pos.left,top:pos.top};
}

/**
 * vrací dvojici čísel, o kolik je "obj" odscrollovaný vůči oknu nebo vůči zadanému rodičovskému objektu
 * @method 
 * @param {object} obj HTML elmenet, jehož odskrolovaní chci zjistit
 * @param {object} ref <strong>volitelný</strong> HTML element, vůči kterému chci zjistit odskrolování <em>obj</em>, element musí být jeho rodič
 * @param {bool} fixed <strong>volitelný</strong> flag, má-li se brát ohled na "fixed" prvky
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální scroll prvku</li><li><em>top</em>(px) - vertikální scroll prvku</li></ul> 
 */
SZN.Dom.getBoxScroll = function(obj, ref, fixed) {
	var x = 0;
	var y = 0;
	var cur = obj.parentNode;
	var limit = ref || obj.ownerDocument.documentElement;
	var fix = false;
	while (1) {
		/* opera debil obcas nastavi scrollTop = offsetTop, aniz by bylo odscrollovano */
		if (SZN.Browser.client == "opera" && SZN.Dom.getStyle(cur,"display") != "block") { 
			cur = cur.parentNode;
			continue; 
		}
		
		/* a taky stara opera (<9.5) pocita scrollTop jak pro <body>, tak pro <html> - takze <body> preskocime */
		if (SZN.Browser.client == "opera" && SZN.Browser.version < 9.5 && cur == document.body) { 
			cur = cur.parentNode;
			continue; 
		}
		
		if (fixed && SZN.Dom.getStyle(cur, "position") == "fixed") { fix = true; }
		
		if (!fix) {
			x += cur.scrollLeft;
			y += cur.scrollTop;
		}
		
		if (cur == limit) { break; }
		cur = cur.parentNode;
		if (!cur) { break; }
	}
	return {x:x,y:y};
}

/**
 * vrací aktuální odskrolování stránky
 * @method  
 * @returns {object} s vlastnostmi:
 * <ul><li><em>x</em>(px) - horizontální odskrolování</li><li><em>y</em>(px) - vertikální odskrolování</li></ul> 
 *
 */
SZN.Dom.getScrollPos = function(){
	if (document.documentElement.scrollTop || document.documentElement.scrollLeft) {
		var ox = document.documentElement.scrollLeft;
		var oy = document.documentElement.scrollTop;
	} else if (document.body.scrollTop || document.body.scrollLeft) { 
		var ox = document.body.scrollLeft;
		var oy = document.body.scrollTop;
	} else {
		var ox = 0;
		var oy = 0;
	}
	return {x:ox,y:oy};
}

/**
 * vraci současnou hodnotu nějaké css vlastnosti
 * @method 
 * @param {object} elm HTML elmenet, jehož vlasnost nás zajímá
 * @param {string} property řetězec s názvem vlastnosti ("border","backgroundColor",...)
 */
SZN.Dom.getStyle = function(elm, property) {
	if (document.defaultView && document.defaultView.getComputedStyle) {
		var cs = elm.ownerDocument.defaultView.getComputedStyle(elm,'');
		if (!cs) { return false; }
		return cs[property];
	} else {
		return elm.currentStyle[property];
	}
}

/**
 * nastavuje objektu konkretni styly, ktere jsou zadany v objektu pojmenovanych vlastnosti (nazev_CSS : hodnota)
 * @method 
 * @param {object} elm HTML element, jehož vlastnosti měním
 * @param {object} style objekt nastavovaných vlastností, např.: {color: 'red', backgroundColor: 'white'}
 */
SZN.Dom.setStyle = function(elm, style) {
	for (var name in style) {
		elm.style[name] = style[name];
	}
}

/**
 * Přidá do dokumentu zadaný CSS řetězec
 * @param {string} css Kus CSS deklarací
 * @returns {node} vyrobený prvek
 */
SZN.Dom.writeStyle = function(css) {
	var node = SZN.cEl("style");
	node.type = "text/css";
	if (node.styleSheet) { /* ie */
		node.styleSheet.cssText = css;
	} else { /* non-ie */
		node.appendChild(SZN.cTxt(css));
	}
	var head = document.getElementsByTagName("head");
	if (head.length) {
		head = head[0];
	} else {
		head = SZN.cEl("head");
		document.documentElement.appendChild(head, document.body);
	}
	head.appendChild(node);
	return node;
}

/**
 * skrývá elementy které se mohou objevit v nejvyšší vrstvě a překrýt obsah,
 * resp. nelze je překrýt dalším obsahem (typicky &lt;SELECT&gt; v internet exploreru)
 * @method
 * @param {object | string} HTML element nebo jeho ID pod kterým chceme skrývat problematické prvky
 * @param {array} elements pole obsahující názvy problematických elementů
 * @param {string} action akce kterou chceme provést 'hide' pro skrytí 'show' nebo cokoli jiného než hide pro zobrazení
 * @examples 
 *  <pre>
 * SZN.Dom.elementsHider(SZN.gEl('test'),['select'],'hide')
 * SZN.Dom.elementsHider(SZN.gEl('test'),['select'],'show')
 *</pre>   									
 *
 */     
SZN.Dom.elementsHider = function (obj, elements, action) {
	var elems = elements;
	if (!elems) { elems = ["select","object","embed","iframe"]; }
	
	/* nejprve zobrazit vsechny jiz skryte */
	var hidden = arguments.callee.hidden;
	if (hidden) {
		hidden.forEach(function(node){
			node.style.visibility = "visible";
		});
		arguments.callee.hidden = [];
	}
	
	function verifyParent(node) {
		var ok = false;
		var cur = node;
		while (cur.parentNode && cur != document) {
			if (cur == obj) { ok = true; }
			cur = cur.parentNode;
		}
		return ok;
	}
	
	if (action == "hide") { /* budeme schovavat */
		if (typeof obj == 'string') { obj = SZN.gEl(obj); }
		var hidden = [];
		var box = this.getBoxPosition(obj);
		
		box.width =  obj.offsetWidth + box.left;
		box.height = obj.offsetHeight +box.top;	
		for (var e = 0; e < elems.length; ++e) { /* pro kazdy typ uzlu */
			var elm = document.getElementsByTagName(elems[e]);
			for (var f = 0; f < elm.length; ++f) { /* vsechny uzly daneho typu */
				var node = this.getBoxPosition(elm[f]);
				if (verifyParent(elm[f])) { continue; } /* pokud jsou v kontejneru, pod kterym schovavame, tak fakof */
				node.width = elm[f].offsetWidth + node.left;
				node.height = elm[f].offsetHeight + node.top;
				
				if (!((box.left> node.width) || (box.width < node.left) || (box.top > node.height) || (box.height < node.top))) {
					elm[f].style.visibility = 'hidden';
					hidden.push(elm[f]);
				}
			}
		}
		arguments.callee.hidden = hidden;
	}
}

/**
 * Vrátí kolekci elementů, které mají nadefinovanou třídu <em>searchClass</em>
 * @method 
 * @param {string} searchClass vyhledávaná třída
 * @param {object} node element dokumentu, ve kterém se má hledat, je-li null prohledává
 * se celý dokument 
 * @param {string} tag název tagu na který se má hledání omezit, je-li null prohledávají se všechny elementy
 * @returns {array} pole které obsahuje všechny nalezené elementy, které mají definovanou třídu <em>searchClass</em>
 */      
SZN.Dom.getElementsByClass = function (searchClass,node,tag) {
	if (document.getElementsByClassName && !tag) { /* kde lze, uplatnime nativni metodu */
		var elm = node || document;
		return SZN.Dom.arrayFromCollection(elm.getElementsByClassName(searchClass));
	}

	if (document.querySelectorAll && !tag) { /* kde lze, uplatnime nativni metodu */
		var elm = node || document;
		return SZN.Dom.arrayFromCollection(elm.querySelectorAll("."+searchClass));
	}

	var classElements = [];
	var node = node || document;
	var tag = tag || "*";

	var els = node.getElementsByTagName(tag);
	var elsLen = els.length;
	
	var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
	for (var i = 0, j = 0; i < elsLen; i++) {
		if (pattern.test(els[i].className)) {
			classElements[j] = els[i];
			j++;
		}
	}
	return classElements;
}

/**
 * Převede html kolekci, kterou vrací napr. document.getElementsByTagName, na pole, které lze
 * lépe procházet a není "živé" (z které se při procházení můžou ztrácet prvky zásahem jiného skriptu)
 * @param {HTMLCollection} col
 * @return {array}   
 */ 
SZN.Dom.arrayFromCollection = function(col) {
	var result = [];
	try {
		result = Array.prototype.slice.call(col);
	} catch(e) {
		for (var i=0;i<col.length;i++) { result.push(col[i]); }
	} finally {
		return result;
	}
}

/**
 * Rozdělí kus HTML kódu na ne-javascriptovou a javascriptovou část. Chceme-li pak
 * simulovat vykonání kódu prohlížečem, první část vyinnerHTMLíme a druhou vyevalíme.
 * @param {string} str HTML kód
 * @returns {string[]} pole se dvěma položkami - čistým HTML a čistým JS
 */
SZN.Dom.separateCode = function(str) {
    var js = [];
    var out = {}
    var s = str.replace(/<script.*?>([\s\S]*?)<\/script>/g, function(tag, code) {
        js.push(code);
        return "";
    });
    return [s, js.join("\n")];
}

/**
 * Spočítá, o kolik je nutno posunout prvek tak, aby byl vidět v průhledu.
 * @param {node} box
 * @returns {int[]}
 */
SZN.Dom.shiftBox = function(box) {
	var dx = 0;
	var dy = 0;
	
	/* soucasne souradnice vuci pruhledu */
	var pos = SZN.Dom.getBoxPosition(box);
	var scroll = SZN.Dom.getScrollPos();
	pos.left -= scroll.x;
	pos.top -= scroll.y;
	
	var port = SZN.Dom.getDocSize();
	var w = box.offsetWidth;
	var h = box.offsetHeight;
	
	/* dolni okraj */
	var diff = pos.top + h - port.height;
	if (diff > 0) {
		pos.top -= diff;
		dy -= diff;
	}

	/* pravy okraj */
	var diff = pos.left + w - port.width;
	if (diff > 0) {
		pos.left -= diff;
		dx -= diff;
	}
	
	/* horni okraj */
	var diff = pos.top;
	if (diff < 0) {
		pos.top -= diff;
		dy -= diff;
	}

	/* levy okraj */
	var diff = pos.left;
	if (diff < 0) {
		pos.left -= diff;
		dx -= diff;
	}
	
	return [dx, dy];
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
 * @overview Nastroje pro práci s objekty: kopírování, serializace, porovnání.
 * @version 2.0
 * @author jelc,zara
 */ 


/**
 * @class třída provádí operace s objekty jako je jejich porovnávaní a serializace a deserializace
 * dědí z třídy ObjCopy, takže umí i kopírovat, dědí též všechna omezení svého rodiče
 * (maximalní hloubka zanoření, umí pracovat pouze s datovými objekty) 
 * @group jak
 */    
SZN.ObjLib = SZN.ClassMaker.makeClass({
	NAME: "ObjLib",
	VERSION: "2.0",
	CLASS: "class"
});

/**
 * implicitní konstruktor, 
 * @method 
 */ 
SZN.ObjLib.prototype.$constructor = function(){
	this._options = {
		functionResistant : false,
		recursionResistant : false,
		depthResistant : false,
		sortedSerialization : false,
		showFlag : false,
		depth :200
	}
};
/**
 * implicitni destruktor, zatím se nepoužívá
 * @method 
 */ 
SZN.ObjLib.prototype.$destructor = function(){

};
/**
 * Metoda provede merge mezi výchozím nastavením serializace a novým předaným v options
 * vrací nové nastavení, je-li parametr "set" vyhodnocen jako true
 * změní přímo výchozí nastavení
 * @method 
 * @param {object} options objekt popisující chování serializace
 * @param {boolean} options.functionResistant  určuje, jak se zachovat v případě že vlastnost objektu je funkce (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>function: </strong><em>jmeno vlastnosti</em>]")
 * @param {boolean} options.recursionResistant určuje, jak se zachovat v případě nalezení cyklické reference (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>circular reference found</strong>")
 * @param {boolean} options.depthResistant určuje, jak se zachovat v případě překročení maximální povolené hloubky zanoření do objektu (buď vyvoláním výjimky nebo na místo překročení vypíše zprávu <strong>max depth overrun</strong>)
 * @param {boolean} options.sortedSerialization určuje, zda vlastnosti objektu budou v serializovaném výstupu seřazeny
 * @param {string} options.showFlag je-li definován a jeho hodnota se vyhodnotí jako "true" upřesňuje vzhled "pretty" výstupu
 * @param {number} options.depth maximální hloubka do jaké objekt zkoumáme
 * @param {boolean} [set] přepínáč způsobu zpracování true||false = pouze vrátit || přepsat 
 * @return {object} nové nastavení po merge
 */ 
SZN.ObjLib.prototype.reSetOptions = function(newOptions,set){
	if(!newOptions){
		return this._options;
	}
	var out = {};
	for(var i in this._options){
		if(set && newOptions[i]){
			this._options[i] = newOptions[i];
		}
		out[i] = newOptions[i] ? newOptions[i] : this._options[i];
	}
	return out;
}


// prevede serializovany retezec do "lidsky citelne" podoby
/**
* převede řetězec obsahující JSON zápis do čitelnější podoby (přidá zalomení
* na konci řádků a odsazení)
* @method
* @param {string} str převáděný řetězec
* @param {string} [sep] řetězec, který se použije na odsazování řádek
* @returns {string} 
*/
SZN.ObjLib.prototype.pretty = function(str,sep){
	var arr = str.toString().split("");
	var newline = this._isIE() ? "\n\r" : "\n";
	var tab = sep ? sep : "\t";
	
	var ptr = 0;
	var depth = 0;
	var inSpecial = "";
	
	function countBackslashes() {
		var cnt = 0;
		var ptr2 = ptr-1;
		while (ptr2 >= 0 && arr[ptr2] == "\\") {
			cnt++;
			ptr2--;
		}
		return cnt;
	}
	
	while (ptr < arr.length) {
		var ch = arr[ptr];
		switch (ch) {
			case '"':
				if (inSpecial == "re") { break; }
				var num = countBackslashes();
				if (!(num & 1)) {
					inSpecial = (inSpecial ? "" : "str");
				}
			break;
			
			case '/':
				if (inSpecial == "str") { break; }
				var num = countBackslashes();
				if (!(num & 1)) {
					inSpecial = (inSpecial ? "" : "re");
				}
			break;
			
			case ',':
				if (!inSpecial) {
					arr.splice(++ptr, 0, newline);
					for (var i=0;i<depth;i++) {
						arr.splice(++ptr, 0, tab);
					}
				}
			break;
			
			case '{':
			case '[':
				if (!inSpecial) {
					depth++;
					arr.splice(++ptr, 0, newline);
					for (var i=0;i<depth;i++) {
						arr.splice(++ptr, 0, tab);
					}
				}
			break;
			
			case '}':
			case ']':
				if (!inSpecial) {
					arr.splice(ptr++, 0, newline);
					depth--;
					for (var i=0;i<depth;i++) {
						arr.splice(ptr++, 0, tab);
					}
				}
			break;
		
		}
		ptr++;
	}
	return arr.join("");
}


/**
 * převádí objekt na řetězec obsahující literalovou formu zapisu objektu (JSON)
 * případně ho převádí do lidsky čitelné podoby (nelze pak unserializovat)
 * @method  
 * @param {object} objToSource objekt, který chceme serializovat
 * @param {object} [options] objekt popisující chování serializace
 * @param {boolean} [options.functionResistant]  určuje, jak se zachovat v případě že vlastnost objektu je funkce (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>function: </strong><em>jmeno vlastnosti</em>]")
 * @param {boolean} [options.recursionResistant] určuje, jak se zachovat v případě nalezení cyklické reference (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>circular reference found</strong>")
 * @param {boolean} [options.depthResistant] určuje, jak se zachovat v případě překročení maximální povolené hloubky zanoření do objektu (buď vyvoláním výjimky nebo na místo překročení vypíše zprávu <strong>max depth overrun</strong>)
 * @param {boolean} [options.sortedSerialization] určuje, zda vlastnosti objektu budou v serializovaném výstupu seřazeny
 * @param {string} [options.showFlag] je-li definován a jeho hodnota se vyhodnotí jako "true" upřesňuje vzhled "pretty" výstupu
 * @param {number} [options.depth] maximální hloubka do jaké objekt zkoumáme
 * @returns {string} řetězcová reprezantace objektu  
 * @throws {error}  'Serialize error: property is function' pokud narazí na vlastnost, která je funkcí
 * @throws {error}  'Serialize structure so deep' pokud je structura objektu hlubsei nez DEEP zanoreni
 * @throws {error}  'serialize: Circular reference encountered' pokud je nalezena cyklická reference
 */    
SZN.ObjLib.prototype.serialize = function(objToSource,options){
	var deepFlag = 0;
	var startString = '{';
	var endString = '}';
	var propertySep = ':';
	var propertyEnd = ',';

	var mySelf = this;
	var output = '';
	var firstStep = true;
	var cache = [];
	
	var mOptions = this.reSetOptions(options);
	
	var mySource = function(obj){
		
		
		if(mOptions.depth && (mOptions.depth < deepFlag)){
			if(!mOptions.depthResistant){
				throw new Error('Serialize: structure is too depth.');
			} else {
				return '"[max depth overrun]"'
			}
		}
		
		
		if(cache.indexOf(obj) != -1){
			if(!mOptions.recursionResistant){
				// volitelne
				throw new Error("serialize: Circular reference encountered");
				return null;
			} else {
				return '"[circular reference found]"';
			}					
		}
		
		if(typeof arguments[1] != 'undefined'){
			var propName = arguments[1];
		} else {
			var propName = false
		}
		
		if(!(obj instanceof Object)){
			switch(typeof obj){
				case 'string':
					return '"' + mySelf._formatString(obj) + '"';
					break;
				case 'undefined':
					return obj;
					break;
				default:
					return obj;
					break;
			}

		} else {
			cache.push(obj);
			var builtIn = mySelf._builtInObjectSerialize(obj,mOptions);
			if(builtIn.isSet){
				return builtIn.output;
			} else {
				if(typeof obj == 'function'){
					if(!mOptions.functionResistant){
					// volitelne
						throw new Error('Serialize: can\'t serialize object with some method - ** ' + (propName ? 'obj' : propName) +' **');
					} else {
						return '"[' + 'function: ' + propName + ']"';
					}
				}
				var output = startString;
				deepFlag++
				
				var klice = [];
				for (var p in obj) { klice.push(p); }
				// volitelne
				if(mOptions.sortedSerialization){
					klice.sort();
				} 
				
				for(var i=0;i<klice.length;i++){
					var klic = klice[i];

					var propName = mySelf._formatString(klic);
					//output += '"' + propName  + '"' + propertySep + (isEmpty ? '{}' : mySource(obj[klic],klic)) + propertyEnd;
					try {
						var value = obj[klic];
					} catch(e){
						var value = "[value inaccessible]"
					}
					output += '"' + propName  + '"' + propertySep + mySource(value,klic) + propertyEnd;
				}
				/* odstranim posledni carku je-li */
				var charNum = (output.lastIndexOf(propertyEnd) >= 0) ? output.lastIndexOf(propertyEnd) : output.length;
				output = output.substring(0,charNum);
				deepFlag--;
				return output +  endString;				
			}

		}
		
	};
	
	
	var source = mySource(objToSource);
	if(mOptions.showFlag){
		return this.pretty(source,mOptions.showFlag)
	} else {
		return source;
	}
};

/**
 * převedení pole na řetězc, který odpovídé literálové formě zápisu pole
 * @method 
 * @private
 * @param {array} fieldToSerialize pole určené k převedení
 * @param {object} [options] objekt popisující chování serializace
 * @param {boolean} [options.functionResistant]  určuje, jak se zachovat v případě že vlastnost objektu je funkce (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>function: </strong><em>jmeno vlastnosti</em>]")
 * @param {boolean} [options.recursionResistant] určuje, jak se zachovat v případě nalezení cyklické reference (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>circular reference found</strong>")
 * @param {boolean} [options.depthResistant] určuje, jak se zachovat v případě překročení maximální povolené hloubky zanoření do objektu (buď vyvoláním výjimky nebo na místo překročení vypíše zprávu <strong>max depth overrun</strong>)
 * @param {boolean} [options.sortedSerialization] určuje, zda vlastnosti objektu budou v serializovaném výstupu seřazeny
 * @param {string} [options.showFlag] je-li definován a jeho hodnota se vyhodnotí jako "true" upřesňuje vzhled "pretty" výstupu
 * @param {number} [options.depth] maximální hloubka do jaké objekt zkoumáme 
 * @returns literalový zápis pole
 * @throws {error} 'Serialize: can\'t serialize Function' prvek pole je funkce
 * @throws {error}  'arraySerialize: Attribute is not Array' argument metody není pole
 */   
SZN.ObjLib.prototype._arraySerialize = function(fieldToSerialize,options){
	var fieldStr = '';
	var mySelf = this;
	var mOptions = options;
	var mySource = function(field){
		if(field instanceof Array){
			for(var i = 0; i < field.length; i++){
				if(typeof field[i] == 'function' && !(field[i] instanceof RegExp)){
					if(!mOptions.functionResistant){
						throw new Error('Serialize: can\'t serialize Function');
					} else {
						fieldStr +=  '\"[' + 'function: ' + i + ']\",';
						continue;
					}
				}
				if((typeof field[i] != 'object') && ((typeof field[i] != 'function'))){
					if(typeof field[i] == 'string'){
						var str = mySelf._formatString(field[i]);
						fieldStr += '\"' + str + '\",';
					} else {
						fieldStr += field[i] + ',';
					}
				} else {
					fieldStr +=  mySelf.serialize(field[i],mOptions) + ',';
				}
			}
			return '[' + fieldStr.substring(0,fieldStr.length - 1) + ']';
		} else {
			throw new Error('arraySerialize: Attribute is not Array');
		}
	}
	var myString = mySource(fieldToSerialize);
	return myString;
};

/**
 * převede řetězec obsahující literálovou formu zápisu pole nebo objektu 
 * na pole nebo objekt 
 * @method 
 * @param {string} serializedString řetězec k převedení
 * @returns {object} vytvořený ze vstupního řetězce 
 */    
SZN.ObjLib.prototype.unserialize = function(serializedString){
	eval('var newVar=' + serializedString);
	return newVar;
}

/**
 * porovnává dva objekty zda jsou datově shodné, porovnavanim jejich serializovanych retezcu
 * <br /><strong>POZOR: V případě, že jsou atributy options parametru příliš benevolntní nemusí být výsledek porovnání relevantní !!</strong> 
 * @method  
 * @param {object} refObj objekt, s kterým porovnáváme
 * @param {object} matchObj objekt, který porovnáváme
 * @param {object} [options] objekt popisující chování serializace
 * @param {boolean} [options.functionResistant]  určuje, jak se zachovat v případě že vlastnost objektu je funkce (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>function: </strong><em>jmeno vlastnosti</em>]")
 * @param {boolean} [options.recursionResistant] určuje, jak se zachovat v případě nalezení cyklické reference (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>circular reference found</strong>")
 * @param {boolean} [options.depthResistant] určuje, jak se zachovat v případě překročení maximální povolené hloubky zanoření do objektu (buď vyvoláním výjimky nebo na místo překročení vypíše zprávu <strong>max depth overrun</strong>)
 * @param {boolean} [options.sortedSerialization] určuje, zda vlastnosti objektu budou v serializovaném výstupu seřazeny
 * @param {string} [options.showFlag] je-li definován a jeho hodnota se vyhodnotí jako "true" upřesňuje vzhled "pretty" výstupu
 * @param {number} [options.depth] maximální hloubka do jaké objekt zkoumáme 
 * @returns true = jsou shodné, false = nejsou shodné
 */    
SZN.ObjLib.prototype.match = function(refObj,matchObj,options){
	var mOptions = {
		functionResistant : false,
		recursionResistant : false,
		depthResistant : false,
		sortedSerialization : true,
		showFlag : false,
		depth :200
	}
	
	if(options){
		for(var i in mOptions){
			mOptions[i] = (typeof options[i] != 'undefined'? options[i] : mOptions[i]);
		}
	}
	
	if(this.serialize(refObj,mOptions) == this.serialize(matchObj,mOptions)){
		return true;
	} else {
		return false;
	}
};

/**
 * převádí na řetězec nativní objekty javascriptu, případně pole
 * @private
 * @method 
 * @param {object} objekt k převedení na řetězec
 * <ul>
 * <li>isSet <em>{bool} určuje zda byl předaný objekt serializován</em></li>
 * <li>output <em>{object}</em> serializovaný argument metody, pokud to bylo možné, jinak null</li>   
 * </ul>
 *
 */     
SZN.ObjLib.prototype._builtInObjectSerialize = function(testedObj,options){
	var output = null;
	var isSet = false;
	if(testedObj instanceof String){
		//var str = testedObj.replace(/\"/g,'\\"');
		output = 'new String("' + this._formatString(testedObj) + '")';
		isSet = true;
	} else if(testedObj instanceof Number){
		output = 'new Number(' + testedObj + ')';
		isSet = true;
	} else if(testedObj instanceof RegExp){
		output = 'new RegExp(' + testedObj + ')';
		isSet = true;
	} else if(testedObj instanceof Array){
		output = this._arraySerialize(testedObj,options);
		isSet = true;
	} else if(testedObj instanceof Date){
		var tm = testedObj.getTime();
		output = 'new Date(' + tm + ')';
		isSet = true;
	} else if(testedObj instanceof Boolean){
		output = 'new Boolean(' + testedObj + ')';
		isSet = true;
	} else if(testedObj == null){
		isSet = true;
	}
	return {isSet:isSet,output:output};	
};


/**
 * testuje zda je používaný prohlížeč Internet Explorer, pro potřeby lidsky čitelného formátování serializace
 * @private
 * @method 
 * @returns {bool} true = ane, false = ne 
 */  
SZN.ObjLib.prototype._isIE = function(){
	if(document.all && document.attachEvent && !window.opera){
		return true;
	}
	return false;
};

/**
* pokusí se vytvořit datově identickou kopii objektu který dostane jako vstupní argument
* objekt nesmí obsahovat metody a cyklické reference, vlastní kopírování probíhá tak,
* že se předný objekt serializuje a výsledný string se unserializuje.
* <br /><strong>POZOR: V případě, že jsou atributy options parametru příliš benevolntní nevznikne identická kopie a uživatel se o tom nedoví !!</strong>
* @method
* @param {object} objToCopy kopírovaný objekt
* @param {object} [options] objekt popisující chování serializace
* @param {boolean} [options.functionResistant]  určuje, jak se zachovat v případě že vlastnost objektu je funkce (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>function: </strong><em>jmeno vlastnosti</em>]")
* @param {boolean} [options.recursionResistant] určuje, jak se zachovat v případě nalezení cyklické reference (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>circular reference found</strong>")
* @param {boolean} [options.depthResistant] určuje, jak se zachovat v případě překročení maximální povolené hloubky zanoření do objektu (buď vyvoláním výjimky nebo na místo překročení vypíše zprávu <strong>max depth overrun</strong>)
* @param {boolean} [options.sortedSerialization] určuje, zda vlastnosti objektu budou v serializovaném výstupu seřazeny
* @param {string} [options.showFlag] je-li definován a jeho hodnota se vyhodnotí jako "true" upřesňuje vzhled "pretty" výstupu
* @param {number} [options.depth] maximální hloubka do jaké objekt zkoumáme
* @returns {object}
*/
SZN.ObjLib.prototype.copy = function(objToCopy,options){
	var mOptions = this.reSetOptions(options);
	var str = this.serialize(objToCopy,mOptions);
	return this.unserialize(str);	
};

/**
* ošetří escape sekvence ve zpracovávaných řetězcích, momentálně zpracovává
* tyto znaky: '"','\t','\n','\t' a '\'
* @method
* @private
* @param {string} s ošetřovaný řetězec
* @returns {string} ošetřený řetězec
*/
SZN.ObjLib.prototype._formatString = function(s) {
	/* add slashes and quotes */
	var re = /["\\']/g;
	
	var re2 = /[\n\r\t]/g;
	var replace = {
		"\n" : "\\n",
		"\t" : "\\t",
		"\r" : "\\r"
	}
	
	return s.replace(re,this._addSlashes).replace(re2,function(ch) {
		return replace[ch];
	});
	
},

/**
* provede vlastní nahrazení v metodě <em>._formatString</em>
* @method
* @private
* @param {string} ch zpracovávaný znak
* @returns {string} ošetřený znak
*/
SZN.ObjLib.prototype._addSlashes = function(ch) {
	return "\\"+ch;
};

/**
 * kopíruje pole, vytváří datově a typově shodnou kopii pole, které dostane, jako argument
 * @method 
 * @param {array} arrayToCopy pole ke zkopírování
 * @returns {array} kopie pole arrayToCopy
 * @param {object} [options] objekt popisující chování serializace
 * @param {boolean} [options.functionResistant]  určuje, jak se zachovat v případě že vlastnost objektu je funkce (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>function: </strong><em>jmeno vlastnosti</em>]")
 * @param {boolean} [options.recursionResistant] určuje, jak se zachovat v případě nalezení cyklické reference (vyvolat výjimku nebo místo její hodnoty vypsat zprávu "<strong>circular reference found</strong>")
 * @param {boolean} [options.depthResistant] určuje, jak se zachovat v případě překročení maximální povolené hloubky zanoření do objektu (buď vyvoláním výjimky nebo na místo překročení vypíše zprávu <strong>max depth overrun</strong>)
 * @param {boolean} [options.sortedSerialization] určuje, zda vlastnosti objektu budou v serializovaném výstupu seřazeny
 * @param {string} [options.showFlag] je-li definován a jeho hodnota se vyhodnotí jako "true" upřesňuje vzhled "pretty" výstupu
 * @param {number} [options.depth] maximální hloubka do jaké objekt zkoumáme 
 * @throws {error} 'ObjCopy.arrayCopy: Attribute is not Array' pokud argument metody není pole
 */   
SZN.ObjLib.prototype.arrayCopy = function(arrayToCopy,options){
	if(arrayToCopy instanceof Array){
		var mOptions = this.reSetOptions(options);
		var out =  this.arraySerialize(arrayToCopy,mOptions);
		return this.unserialize(out)
	} else {
		throw new Error('ObjCopy.arrayCopy: Attribute is not Array');
	}
};

/**
 * @augments SZN.ObjLib
 * @class třída která umožňuje vytvářet hluboké kopie objektů v případě, že je hloubka
 * objektu konečná a menší než hloubka určená konstantou DEEP, objekty, které se odvolávají sami na sebe
 * nelze kopírovat (cyklická reference), kopírovat lze pouze objekty, které obsahují
 * data a nikoli metody.<br />
 * Třída je přítomna pouze z důvodu zpětné kompatibility, veškerou funkcionalitu implementuje
 * SZN.ObjLib<br />
 * Třída poskytuje <strong>identickou funkcionalitu</strong> jako třída <em>SZN.ObjLib</em>!
 */   
SZN.ObjCopy = SZN.ClassMaker.makeClass({
	NAME: "ObjCopy",
	VERSION: "2.0",
	CLASS: "class",
	EXTEND: SZN.ObjLib
});

SZN.ObjCopy.prototype.$constructor = function(options){
	this.callSuper('$constructor',arguments.callee)(options);
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
 * @overview Třída pro práci s HTTPXmlRequestem pro komunikaci klient - server.
 * @version 1.0
 * @author koko, jelc 
 */   

/**
 * @class třída provádějící komunikaci klient - server prostřednictvím  HTTPxmlRequest
 * defaultně posíláme dotaz metodou GET, asynchroně a odpověď očekáváme v TXT formátu
 * @group jak
 */
SZN.HTTPRequest = SZN.ClassMaker.makeClass({
	NAME: "HTTPRequest",
	VERSION: "1.1",
	CLASS: "class"
});

/**
 * @method
 * @param {string} url url, na které budeme posílat dotazy
 * @param {object} callBackObj objekt, v jehož oboru platnosti zpracováváme odpověď
 * @param {string} callBackFunc metoda, která bude odpověď zpracovávat 
 */ 
SZN.HTTPRequest.prototype.$constructor = function(url,callBackObj,callBackFunc){
	/** @field {object} aktuální nastavení pro request*/
	this.data = new Object();
	/** @field {string} url na které se ptáme */
	this.url = url ? url : '';
	/** @field {object} objekt v jehož oboru platnosti zpracujeme odpověď */
	this.callBackObj = callBackObj;
	/** @field {function} metoda, která odpověď zpracuje */
	this.callBackFunc = callBackFunc;

	this.setFormat();
	this.setMode();
	this.setMethod();
	this.setPostData();
	this.setHeaders();
};

/** 
 * @class konstruktor vytváří "objekt" nastavení (settings) pro instanci SZN.Request
 * @group jak
 * @param {string} [url] url serveru, kterého se ptáme
 * @param {string} [method] metoda dotazu [post,get = default]
 * @param {string} [postData] data pro dotaz posílaný metodou post
 * @param {array} [headers] nastavení hlaviček, pole objektů s vlatnostmi <em>type</em> a <em>content</em>
 * @param {string} [mode]  mod dotazu [sync,async = default]
 * @param {string} [format] formát odpovědi [xml = default]
 */
SZN.HTTPRequest.Setting = function(url,method,postData,headers,mode,format){
	/** @field {string}  url serveru, kterého se ptáme */
	this.url = url ? url : '';
	/** @field {string} metoda dotazu [post,get = default]*/
	this.method = method ? method : '';
	/** @field {string} mod dotazu [sync,async = default]*/
	this.mode = mode ? mode : '';
	/** @field {string} formát odpovědi [xml = default]*/
	this.format = format ? format : '';
	/** @field {array} nastavení hlaviček, pole objektů s vlatnostmi <em>type</em> a <em>content</em> */
	this.headers = headers ? headers : '';
	/** @field {string} data pro dotaz posílaný metodou post*/
	this.postData = postData ? postData : '';
};


/**
 * @field {object} <strong>konstanta</strong> výčtové pole metod, které se mouhou používat a definice defaultní metody
 */
SZN.HTTPRequest.prototype.METHOD = {
	post : 'post',
	get : 'get',
	def : 'get'
};
/**
 * @field {object} <strong>konstanta</strong> výčtové pole formatů odpovědí, které se mouhou používat a definice defaultního formatu
 * 
 */
SZN.HTTPRequest.prototype.FORMAT = {
	xml : 'xml',
	txt : 'txt',
	def : 'txt'
};
/**
 * @field {object} <strong>konstanta</strong> výčtové pole modu dotazu, které se mouhou používat a definice defaultního modu
 */
SZN.HTTPRequest.prototype.MODE = {
	async : true,
	sync :  false,
	def : true
};

/**
 * @field {array} <strong>konstanta</strong> výchozí nastaveni http hlavičky dotazu
 */
SZN.HTTPRequest.prototype.HEADER = [{typ:'Content-Type', content:'application/x-www-form-urlencoded' }];

/**
 * destruktor
 * @method  
 *
 */  
SZN.HTTPRequest.prototype.destructor = function(){
	for(var i in this){
		this[i] = null;
	}
};
/**
 * inicializace <strong>nepoužívá se</strong>
 * @method 
 * @deprecated
 */  
SZN.HTTPRequest.prototype.init = function(){};

/**
 * nastavuje metodu komunikace klient - server dle argumentu, pokud argument
 * není definován v objektu METHOD použije se výchozí (get)
 * @method  
 * @param {string} method metoda komunikace klient server [get,post]
 */  
SZN.HTTPRequest.prototype.setMethod = function(method){
	this.data.method = this._getMethod(method);
};
/**
 * nastavuje möd komunikace klient - server dle argumentu, pokud argument
 * není definován v objektu MODE použije se výchozí
 * @method  
 * @param {string} mode mod komunikace klient server [sync,async]
 */  
SZN.HTTPRequest.prototype.setMode = function(mode){
	this.data.mode = this._getMode(mode);
};
/**
 * nastavuje format odpovědi serveru dle argumentu, pokud argument
 * není definován v objektu FORMAT použije se výchozí
 * @method  
 * @param {string} format format odpovědi serveru [xml,txt]
 */  
SZN.HTTPRequest.prototype.setFormat = function(format){
	this.data.format = this._getFormat(format);
};
/**
 * nastavuje HTTP hlavičky dotazu
 * @method 
 * @param {array} headers pole objektu s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavičky</li>
 * <li>content - hodnota hlavičky</li>
 * </ul>    
 */  
SZN.HTTPRequest.prototype.setHeaders = function(headers){
	this.data.headers = this._setHeaders(headers);
};
/**
 * nastavuje data, která se mají posílat metodou POST
 * @method 
 * @param {string} data data, která se budou posílat POSTem
 */  
SZN.HTTPRequest.prototype.setPostData = function(data){
	this.data.postData = data ? data : '';
};

/**
 *  vlastní vyvolání HTTPxmlRequestu, předané parametry se použijí pro konkretní dotaz
 * pokud některý není definován použije se výchozí, nebo nastavený
 * @method  
 * @param {string} url url, na které budeme posílat dotazy (musí být zadán, ale může být prazdný)
 * @param {object} callBackObj objekt v jehož oboru platnosti zpracováváme odpověď (musí být zadán, ale může být prazdný)
 * @param {string} callBackFunc metoda, ktera bude odpoved zpracovavat (musí být zadán, ale může být prazdný)
 * @param {object} requestData [<em>volitelne</em>] instance objektu Setting s dalšími daty
 * @param {bool} [returnOnly] pokud používáme synchronní request určuje zda se volá callback funkce (parametr má
 * hodnou "false" nebo není zadán - výchozí stav ), nebo bude pouze vracet odpověď od serveru (parametr má hodnotu "true")
 * musí být zadán pokaždé, když použijeme metodu send a nechceme výchozí chování, na asynchroní volání nemá vliv 
 * @returns {object} <ol><li>v případě asynchroního requestu objekt reprezentující request</li>
 * <li>v případě synchroního requestu vrací odpověď serveru  jako objekt s vlastnostmi <em>status</em> a <em>data</em> je-li
 *  returnOnly zadáno jako true, jinak nevrací nic</li></ol>
 */      
SZN.HTTPRequest.prototype.send = function(url,obj,method,requestData,returnOnly){
	var mySelf = this;
	var param = requestData ? requestData : {};
	var data = this._setFromData(url,obj,method,param);
	//debug(data.mode)
	// vytvorim request
	var XHR = this._getRequest();
	// otevru request
    try {
		XHR.open(data.method, data.url, data.mode);
	} catch(e){
		return 0;
	}
	
	// nastavim hlavicky
	for(var i = 0; i < data.headers.length; i++){
		XHR.setRequestHeader(data.headers[i].typ,data.headers[i].content);
	}
	// zpracovani asynchroniho requestu
	if(data.mode){
		function stateChangeFunction(){
	        if( XHR.readyState == 4 ) {
				if(data.format == 'xml'){
					var out = XHR.responseXML;
				} else if(data.format == 'txt'){
					var out = XHR.responseText;
				}
				
				var status = 0;
				try { status = XHR.status; }
				catch(e) { }
				finally {
					data.callBackObj[data.callBackFunc](out,status);
					XHR = null;
				}
	        }		
		}
		XHR.onreadystatechange = stateChangeFunction;
	}
	// odeslani requestu dle nastavenoeho modu post/get
	if(data.method == this.METHOD['post']){ 
	    if(typeof data.postData != 'undefined') {
			XHR.send(data.postData);
		} else {
			return 0;
		}
	} else {
		XHR.send(null);
	}
	// zpracovani synchroniho requestu
	if(!data.mode){
		if(data.format == 'xml'){
			var out = XHR.responseXML;
		} else {
			var out = XHR.responseText
		}
		if(returnOnly){
			return { status : XHR.status, data : out };
		} else {
			data.callBackObj[data.callBackFunc](out,XHR.status);
		}
	} else {
		return XHR;
	}
};

/**
 * umožňuje zrušit asynchroní dotaz pokud již není zpracováván
 * @method 
 * @param {object} XHR objekt requestu vracený metodou send
 */   
SZN.HTTPRequest.prototype.abort = function(XHR){
	if (typeof XHR == 'object' && XHR.readyState != 4) {
		XHR.abort();
	} else {
		return 0;
	}
};

/**
 * vrací metodu jakou bude probíhat komunikace klient - server pokud je známá,
 * jinak vrací výchozí, definovanou v objektu METHOD
 * @private
 * @method  
 * @param {string} method požadovaná metoda   
 * @returns {string}
 */  
SZN.HTTPRequest.prototype._getMethod = function(method){
	return (typeof this.METHOD[method] != 'undefined') ? this.METHOD[method] : this.METHOD['def'];
};
/**
 * vrací mod v jakém bude probíhat komunikace klient - server pokud je známá,
 * jinak vrací vychozí, definovanou v objektu MODE
 * @private
 * @method 
 * @param {string} mode požadovaný mod
 * @returns {string}
 */ 
SZN.HTTPRequest.prototype._getMode = function(mode){
	return (typeof this.MODE[mode] != 'undefined') ? this.MODE[mode] : this.MODE['def'];
};
/**
 * vrací formát jakou bude probíhat komunikace klient - server pokud je znám,
 * jinak vrací vychozí, definovaný v objektu FORMAT
 * @private
 * @method  
 * @param {string} format požadovaný formát
 * @returns {string}
 */ 
SZN.HTTPRequest.prototype._getFormat = function(format){
	return (typeof this.FORMAT[format] != 'undefined') ? this.FORMAT[format] : this.FORMAT['def'];
};
/**
 * připravuje nastavení HTTP hlaviček pro zasílany dotaz, pokud nenajde v
 * argumentu hlavičku 'Content-type', použije definovanou v HEADER
 * @private
 * @method   
 * @param {array} headers pole objektů s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavičky</li>
 * <li>content - hodnota hlavičky</li>
 * </ul> 
 * @returns {array} pole požadovaných hlaviček, které mají být nastaveny 
 */   
SZN.HTTPRequest.prototype._setHeaders = function(headers){
	var headers = (headers instanceof Array) ? headers : new Array();
	var out = new Array();
	var setContent = false;
	for(var i = 0; i < headers.length; i++){
		if(headers[i].typ == 'Content-Type'){
			setContent = true;
		}
		out[i] = {
			typ : headers[i].typ,
			content : headers[i].content		
		}
	}
	if(!setContent){
		out.push({typ : this.HEADER[0].typ,content : this.HEADER[0].content});
	}
	return out;
}
/**
 * provadí nastavení vlastností pro daný dotaz, aktuálně volanou metodu
 * <em>send</em> aniž by přepisoval nastavené (nutné kvůli asynchronímu volání)
 * @private
 * @method   
 * @param {string} url url, na které budeme posílat dotazy (musí být zadán, ale může být prazdný)
 * @param {object} obj objekt, v jehož oboru platnosti zpracováváme odpověď (musí být zadán, ale může být prazdný)
 * @param {string} func metoda, která bude odpověď zpracovávat (musí být zadán, ale může být prazdný)
 * @param {object} setting [<em>volitelné</em>] instance objektu Setting s dalšími daty
 * @returns {object} data, která se použijí v metodě <em>send</em>
 */   
SZN.HTTPRequest.prototype._setFromData = function(url,obj,func,setting){
	var data = new Object();
	for(var i in this.data){
		switch (i){
			case 'method':
				if(setting[i]){
					data[i] = this._getMethod(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'format':
				if(setting[i]){
					data[i] = this._getFormat(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'mode':
				if(setting[i]){
					data[i] = this._getMode(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'headers':
				if(setting[i]){
					data.headers = this._setHeaders(setting[i]);
				} else {
					data.headers = this._setHeaders(this.data[i]);
				}
				break;
			default:
				if(setting[i]){
					data[i] = setting[i];
				} else {
					data[i] = this.data[i];
				}				
				break;
		}
	}
	data.url = url ? url : this.url;
	data.callBackObj = obj ? obj : this.callBackObj;
	data.callBackFunc = func ? func : this.callBackFunc;
	return data;
};
/**
 * crossplatformí vytváření HTTPxmlRequestu
 * @private
 * @method  
 * @returns XMLHttpRequest
 *
 */   
SZN.HTTPRequest.prototype._getRequest = function(){
    if(typeof(XMLHttpRequest) != 'undefined') {
		return new XMLHttpRequest();
	}
	else {
		try {
			/*- IE */
			return new ActiveXObject("Msxml2.XMLHTTP"); /*- "Microsoft.XMLHTTP*/
		}
		catch (e) {
			try { 
				return new ActiveXObject("Microsoft.XMLHTTP"); 
			}
			catch (e) {
				return 0;
			}
		}
	}
};
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
 * @overview Rozhraní určené k práci s uživatelskými událostmi a "globálními" 
 * zprávami, které zjednodušuje práci s objektem, který se o uživatelsky 
 * definované události stará
 * @version 1.2
 * @author jelc, zara
 */   

/**
 * @class třída pro dědění rozhraní "SigInterface", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností.
 * Rozhraní pro práci s uživatelsky definovanými událostmi a zprávami
 * vyžaduje referenci na instanci třídy SZN.signals, všechny následující metody
 * jsou určeny k použití pouze jako zděděné vlastnosti rozhraní,
 * @group jak
 * @see SZN.Signals
 */  
SZN.SigInterface = SZN.ClassMaker.makeClass({
	NAME: "SigInterface",
	VERSION: "1.3",
	CLASS: "class"
});

/**
 * slouží k nalezení rozhraní u rodičovských tříd, hledá v nadřazených třídách třídu,
 * ktera ma nastavenou vlastnost TOP_LEVEL a v ni očekává instanci třídy SZN.Signals s
 * nazvem "interfaceName"
 * @method   
 * @param {string}	interfaceName  název instance třídy SZN.Signals v daném objektu 
 * @returns {object} referenci na instanci třídy SZN.Signals
 * @throws {error} 	SetInterface:Interface not found  
 */
SZN.SigInterface.prototype.setInterface = function(interfaceName){
	if(typeof(this[interfaceName]) != 'object'){
		var owner = this._owner;
		while(typeof(owner[interfaceName])== 'undefined'){
			if(typeof owner.TOP_LEVEL != 'undefined'){
				throw new Error('SetInterface:Interface not found');
			} else {
				owner = owner._owner;
			}
		}
		return owner[interfaceName];
	} 
};

/**
 * slouží k registraci zachytávaní události nad objektem, který implementuje toto rozhraní
 * @method
 * @param {string} type název události, kterou chceme zachytit
 * @param {string} handleFunction název metody objektu 'myListener', která bude zpracovávat událost
 * @param {object} sender objekt, jehož událost chceme poslouchat. Pokud není zadáno (nebo false), odesilatele nerozlišujeme
 * @returns {int} 1 v případě neúspěchu, 0 v pripade úspěchu  
 */
SZN.SigInterface.prototype.addListener = function(type,handleFunction,sender){
	return this.getInterface().addListener(this,type,handleFunction,sender);
};

/**
 * Slouží k zrušení zachytáváni události objektem, který implementuje toto rozhraní. Lze též zadat jen ID 
 * navěšené události (jako jediný parametr).
 * @method
 * @param {string} type název události, kterou jsme zachytávali
 * @param {string} handleFunction název metody objektu 'myListener', která udalost zpracovávala
 * @param {object} sender objekt, jehož událost jsme poslouchali
 */
SZN.SigInterface.prototype.removeListener = function(type, handleFunction, sender) {
	if (arguments.length == 1) {
		return this.getInterface().removeListener(arguments[0]);
	} else {
		return this.getInterface().removeListener(this, type, handleFunction, sender);
	}
};

/**
 * vytváří novou událost, kterou zachytáva instance třídy SZN.Signals
 * @method 
 * @param {string} type název vyvolané události
 * @param {string} accessType určuje zda bude událost viditelná i ve veřejném rozhraní
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost  
 *					  nebo pouze vnitrnim objektum [private | public]
 * @throws {error} pokud neexistuje odkaz na instanci SZN.Signals vyvolá chybu 'Interface not defined'  
 */
SZN.SigInterface.prototype.makeEvent = function(type,accessType,data){
	var time = new Date().getTime();
	this.getInterface().makeEvent(type,this,accessType,time,data);
};
/**
 * nastavuje zprávu se jménem <em>msgName</em> na hodnotu <em>msgValue</em>
 * @method 
 * @param {string} msgName název zprávy
 * @param {any} msgValue obsah zprávy
 */   
SZN.SigInterface.prototype.setSysMessage = function(msgName,msgValue){
	this.getInterface().setMessage(msgName,msgValue);
};
/**
 * čte zprávu se jménem <em>msgName</em>
 * @method 
 * @param {string} msgName název zprávy
 * @return {any} obsah zprávy
 */ 
SZN.SigInterface.prototype.getSysMessage = function(msgName){
	return this.getInterface().getMessage(msgName);
};

SZN.SigInterface.prototype.getInterface = function() {
	return (typeof(this.signals) == "object" ? this.signals : SZN.signals);
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
 * @overview Vytváření a zachytávání vlastních uživatelských událostí, správa
 * globálních zpráv
 * @version 1.5
 * @author jelc, zara
 */
 
/**
 * @class třída pro práci s uživatelsky definovanými událostmi a správou 
 * globálních zpráv.
 * @group jak
 */
 SZN.Signals = SZN.ClassMaker.makeClass({
	NAME: "Signals",
	VERSION: "1.5",
	CLASS: "class"
});
 
/**
 * @param {object} owner objekt vlastnící instanci třídy
 * @param {string} name název instance
 */
SZN.Signals.prototype.$constructor = function(owner,name){
	/** 
	 * @private
	 * @field {object}  vlastník instance
	 */
	this._owner = owner;
	/** 
	 * @private
	 * @field {string} název instance
	 */	
	this._name = name;

	/** 
	 * @field {object} zásobník zpráv pro asyncroní processy apod...
 	 */
	this.messageFolder = {};
	/**
	 * @field {object} asociativní pole, do kterého se vkládají vzniklé události a
	 * odkud se zpracovávají	 
	 */
	this.myEventFolder = {};
	
	/**
	 * @field {object} zásobník posluchačů událostí
	 */
	this._myHandleFolder = {};
	
	/**
	 * @field {object} pomocný IDčkový index pro rychlé odebírání
	 */
	this._myIdFolder = {};
	
	/**
	 * @field {object} proměná, která určuje, zda je definováno nějaké veřejné API
	 * pro události	 
	 */	
	this.apiHandler = null;
};

SZN.Signals.prototype.$destructor = function(){
	// nothing now
};

SZN.Signals.prototype.setApiHandler = function(handler) {
	this.apiHandler = handler;
}

/**
 * vkládání "globálních" zpráv
 * @method 
 * @param {string} msgName název zprávy 
 * @param {any} msgValue hodnota zprávy 
 */
SZN.Signals.prototype.setMessage = function(msgName,msgValue){
	this.messageFolder[msgName] = msgValue;
};

/**
 * metoda pro získání hodnoty konkrétní "globální" zprávy
 * @param {string} msgName název zprávy
 * @returns {any} hodnotu uložená zprávy
 */
SZN.Signals.prototype.getMessage = function(msgName){
	return this.messageFolder[msgName];
};

/**
 * registrace posluchače uživatelské události, pokud je již na stejný druh 
 * události zaregistrována shodná metoda shodného objektu nic se neprovede,
 * @method  
 * @param {object} owner objekt/třída,  která naslouchá, a v jehož oboru platnosti se zpracovaní události provede
 * @param {string} type	typ události, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchače, která má danou událost zpracovat
 * @param {object} sender objekt, jehož událost chceme poslouchat. Pokud není zadáno (nebo false), odesilatele nerozlišujeme
 * @returns {id} id události / null
 */
SZN.Signals.prototype.addListener = function(owner, type, funcOrString, sender){
	/* zasobnik pro dany typ udalosti neexistuje musim ho vytvorit */
	if (!(type in this._myHandleFolder)) {
		this._myHandleFolder[type] = {};
	} 
	
	/* sem ukladam zaznam */
	var typeFolder = this._myHandleFolder[type];

	/* na tuto udalost je jiz predana funkce zavesena tak nic nedelam */
	for (var id in typeFolder){
		var item = typeFolder[id];
		if (
			(item.eFunction == funcOrString) && 
			(item.eOwner == owner) &&
			(item.eSender == sender)
		) {
			return null;
		}
	}

	/* identifikátor handlované události */
	var id = SZN.idGenerator();
	
	/* konecne si to můžu zaregistrovat */
	typeFolder[id] = {
		eOwner		: owner,
		eFunction	: funcOrString,
		eSender		: sender
	};
	
	/* jeste pridam do ID zasobniku */
	this._myIdFolder[id] = typeFolder;
	
	return id;
};

/**
 * Odstranění naslouchání události. Lze též zadat jen ID navěšené události (jako jediný parametr).
 * @method 
 * @param {object} owner objekt/třída  ktera naslouchala, a v jehož oboru platnosti se zpracování události provádělo
 * @param {string} type	typ události, kterou jsme zachytávali
 * @param {string} functionName funkce/metoda posluchače, která danou událost zpracovávala
 * @param {object} sender objekt, jehož událost jsme poslouchali
 * @returns {int} 0 v případě úspěchu, 1 v případě neúspěchu
 */
SZN.Signals.prototype.removeListener = function(owner, type, funcOrString, sender) {
	var id = null;
	
	if (arguments.length == 1) { /* odstraneni pomoci ID */
		id = arguments[0];
	} else { /* odstraneni pomoci vsech parametru */
		var typeFolder = this._myHandleFolder[type];
		for (var p in typeFolder) {
			var item = typeFolder[p];
			if (
				(item.eFunction == funcOrString) && 
				(item.eOwner == owner) &&
				(item.eSender == sender)
			) { id = p; }
		}
	}

	if (!id) { return 1; }

	var typeFolder = this._myIdFolder[id];
	delete typeFolder[id];
	delete this._myIdFolder[id];
	return 0;
};

/**
 * vytváří událost, ukládá ji do zásobníku události a předává ji ke zpracování
 * @method 
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {string} accessType určuje zda bude událost viditeláa i ve veřejném rozhraní (je-li definováno) nebo pouze vnitřním objektům [public | private]
 * @param {int} timestamp čas vzniku události 
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost 
 */   
SZN.Signals.prototype.makeEvent = function(type,trg,accessType,timestamp,data){
	var ids = SZN.idGenerator();
	this.myEventFolder['e-' + ids] = new SZN.Signals.NewEvent(type,trg,accessType,timestamp,ids, data);
	this.myEventHandler(this.myEventFolder['e-' + ids]);
};

/**
 * @class konstruktor vnitřní události
 * @group jak
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {string} accessType určuje zda bude událost viditeláa i ve veřejném rozhraní (je-li definováno) nebo pouze vnitřním objektům [public | private]
 * @param {int} timestamp čas vzniku události 
 * @param {string} ids unikatní ID 
 * @param {object} [data] objekt s vlastnostmi specifickými pro danou událost 
 */   
SZN.Signals.NewEvent = function(type,trg,access,time,ids,data){
	/** @field {string} typ události*/
	this.type = type;
	/** @field {object}  objekt, který událost vyvolal*/
	this.target = trg;
	/** @field {string}  specifikace přístupových prav [public|private]*/
	this.accessType = access;
	/** @field {int} timestamp */
	this.timeStamp = time;
	/** 
	 * @private	
	 * @field {string} unikatní ID
	 */
	this._id = ids;
	/** @field {object} data specifická pro danou událost (definuje je původce události) */	 	
	this.data =  (data && typeof data == 'object') ? data : null;
};


/**
 * zpracuje událost - spustí metodu, která byla zaragistrována jako posluchač  
 * a je-li definované API a událost je veřejná předá ji API handleru
 * definovaného API nakonec zavolá zrušení události
 * @method 
 * @param {object} myEvent zpracovávaná událost
 */    
SZN.Signals.prototype.myEventHandler = function(myEvent){
	var functionCache = [];

	for (var type in this._myHandleFolder){
		if (type == myEvent.type || type == "*") { /* shoda nazvu udalosti */
			for (var p in this._myHandleFolder[type]) {
				var item = this._myHandleFolder[type][p];
				if (!item.eSender || item.eSender == myEvent.target) {
					functionCache.push(item);
				}
			}
		}
	}
	
	for (var i=0;i<functionCache.length;i++) {
		var item = functionCache[i];
		var owner = item.eOwner;
		var fnc = item.eFunction;
		if(typeof fnc == 'string'){
			owner[fnc](myEvent);
		} else if(typeof fnc == 'function'){
			fnc(myEvent);
		}
	}
	
	/* je-li definovano api  a je-li udalost api pristupna 
	 * predam mu udalost
	 */
	if((myEvent.accessType == 'public') 
	&& (this.apiHandler != null) 
	&& (myEvent._owner != 'api')){
		this.apiHandler._apiEventHandler(myEvent);
	}	
	
	/* zrusim udalost */
	this.destroyEvent(myEvent._id);
};

/**
 * destruktor události, odstraní událost definovanou 
 * v zásobniku a smaže ji
 * @method 
 * @param {string} ids identifikátor události v zásobníku
 */     
SZN.Signals.prototype.destroyEvent = function(ids){
	this.myEventFolder['e-' + ids] = null;
	delete(this.myEventFolder['e-' + ids]);
};
SZN.signals = new SZN.Signals();
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
 * @overview Základní nástroje pro práci s "dekorátory".
 * Úvozovky okolo názvu jsou na místě, neb nejde o realizaci návrhového vzoru,
 * ale o naše vlastní, monkeypatch-based řešení.
 * @version 1.0
 * @author zara
 */   

/**
 * @class Abstraktní dekorátor, jedináček
 */
SZN.AbstractDecorator = SZN.ClassMaker.makeSingleton({
	NAME: "SZN.AbstractDecorator",
	VERSION: "1.0"
});

/**
 * Dekorační metoda
 * @param {object} instance To, co chceme poupravit
 * @returns {object} Vrací to, co obdrží
 */
SZN.AbstractDecorator.prototype.decorate = function(instance) {
	instance.$super = this._$super;
	if (!instance.__decorators) { instance.__decorators = []; }
	instance.__decorators.push(this);
	return instance;
}

/**
 * Metoda volání "předka", magie pro otrlé.
 * Volá stejně pojmenovanou metodu objektu před odekorováním. 
 * Pokud je voláno z neodekorované metody, chová se jako $super z ClassMakeru.
 */
SZN.AbstractDecorator.prototype._$super = function() {
	var caller = arguments.callee.caller;
	if (!caller) { throw new Error("Function.prototype.caller not supported"); }

	var decorators = this.__decorators || [];
	var obj = null; /* objekt, jehoz metodu chceme volat */
	var name = null; /* nazev metody */
	
	var i = decorators.length;
	while (i--) { /* projdu vsechny naaplikovane dekoratory */
		var d = decorators[i];
		/**
		 * Hledam dve veci:
		 *  - jak se jmenuje metoda, ze ktere je $super volan,
		 *  - kde je tato metoda deklarovana pred timto dekoratorem
		 */
		
		if (!obj && name && (name in d)) { obj = d; break; } /* mame predchozi objekt s metodou */
		
		for (var p in d) { /* hledame objekt s touto metodou a jeji nazev */
			if (!name && caller == d[p]) { name = p; break; }
		}
	}

	if (!name) {
		/** 
		 * Metoda, ze ktere je volan $super, neni definovana v zadnem dekoratoru.
		 * Chteme tedy volat normalne metodu predka - kod je vybrakovan z ClassMakeru (_$super).
		 */
		var owner = caller.owner || this.constructor; /* toto je trida, kde jsme "ted" */

		var callerName = false;
		for (var name in owner.prototype) {
			if (owner.prototype[name] == caller) { callerName = name; }
		}
		if (!callerName) { throw new Error("Cannot find supplied method in constructor"); }
		
		var parent = owner.EXTEND;
		if (!parent) { throw new Error("No super-class available"); }
		if (!parent.prototype[callerName]) { throw new Error("Super-class doesn't have method '"+callerName+"'"); }

		var func = parent.prototype[callerName];
		return func.apply(this, arguments);
		
	} else if (!obj) {
		/**
		 * Predchudcem teto metody je primo prototypova metoda instance
		 */
		obj = this.constructor.prototype;
		if (!(name in obj)) { throw new Error("Function '"+name+"' has no undecorated parent"); }
	}
	
	return obj[name].apply(this, arguments);
}

/**
 * @class Automatický dekorátor - předá instanci veškeré své metody
 */
SZN.AutoDecorator = SZN.ClassMaker.makeSingleton({
	NAME: "SZN.AutoDecorator",
	VERSION: "1.0",
	EXTEND: SZN.AbstractDecorator
});

/**
 * @see SZN.AbstractDecorator#decorate
 */
SZN.AutoDecorator.prototype.decorate = function(instance) {
	this.$super(instance);
	var exclude = ["constructor", "sConstructor", "$super", "_$super", "callSuper", "decorate"];
	
	for (var p in this) {
		if (exclude.indexOf(p) != -1) { continue; }
		instance[p] = this[p];
	}
}

/**
 * @class Dekorační rozhraní; implementuje ho ten, kdo chce být dekorován
 */
SZN.IDecorable = SZN.ClassMaker.makeClass({
	NAME: "SZN.IDecorable",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * Odekorování této instance zadaným dekorátorem
 * @param {function} decorator Konstruktor dekorátoru
 * @returns {object} Vrací this
 */
SZN.IDecorable.prototype.decorate = function(decorator) {
	var args = [this];
	for (var i=1;i<arguments.length;i++) { args.push(arguments[i]); }
	var dec = decorator.getInstance();
	return dec.decorate.apply(dec, args);
}
