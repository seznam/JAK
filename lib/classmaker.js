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
 * @version 4.1
 * @author jelc, zara
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
 * vlastní metoda pro vytvoření třídy, v jediném parametru se dozví informace o třídě, kterou má vytvořit
 * @method 
 * @param {object} params parametry pro tvorbu nové třídy:
 * <ul>
 * <li>NAME - povinný název třídy</li>
 * <li>VERSION (string) - verze třídy</li>
 * <li>CLASS - "class"/"static"/"singleton", statická třída odpovídá literálovému objektu a nemůže nic dědit</li>
 * <li>EXTEND - reference na rodičovskou třídu</li>
 * <li>IMPLEMENT - pole referencí na rozhraní, jež tato třída implementuje</li>
 * <li>DEPEND - pole závislostí</li>
 * </ul>
 */
SZN.ClassMaker.makeClass = function(params) {
	if (!params.NAME) { throw new Error("No NAME passed to SZN.ClassMaker.makeClass()"); }
	
	/* muzu kopirovat objekty ? */
	if (!this.copyObj && SZN.ObjCopy) { this.copyObj = new SZN.ObjCopy(); }
	
	var version = params.VERSION || "1.0";
	var extend = params.EXTEND || false;
	var implement = params.IMPLEMENT || [];
	var depend = params.DEPEND || [];
	var type = params.CLASS;
	
	/* implement muze byt tez jeden prvek */
	if (!(implement instanceof Array)) { implement = [implement]; }
	
	/* test zavislosti */
	var result = false;
	if (result = this._testDepend(depend)) { throw new Error("Dependency error in class " + params.NAME + " ("+result+")"); }
	
	if (type == "static") { /* staticka trida */
		var obj = {};
		obj.VERSION = version;
		obj.NAME = params.NAME;
		obj.CLASS = type;
		return obj;
	}
	
	var constructor = function() { /* normalni trida */
		if (type == "singleton" && constructor._instance) { throw new Error("Cannot instantiate singleton class"); }
		var inicializator = false;
		if ("$constructor" in arguments.callee.prototype) {
			inicializator = arguments.callee.prototype.$constructor;
		} else if (params.NAME in arguments.callee.prototype) {
			inicializator = arguments.callee.prototype[params.NAME];
		}
		if (inicializator) { inicializator.apply(this,arguments); }
	}
	
	/* staticke vlastnosti */
	constructor.NAME = params.NAME;
	constructor.VERSION = version;
	constructor.EXTEND = extend;
	constructor.IMPLEMENT = implement;
	constructor.DEPEND = depend;
	constructor.CLASS = type;
	
	/* singleton */
	if (type == "singleton") {
		constructor._instance = null;
		constructor.getInstance = this._getInstance;
	}
	
	/* obsolete */
	constructor.destroy = this._destroy;
	
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
 * metoda sloužící ke zdědění jako statická metoda vytvářené třídy
 * nastavuje všechny vlastnosti svého argumentu na null	 
 * @param {object} obj cisteny objekt
 */	 	 	 		
SZN.ClassMaker._destroy = function(obj) {
	for(var p in obj) {
		obj[p] = null;
	};
}
	
/**
 * volá vlastní kopírování prototypových vlastností jednotlivých rodičů
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
 * testuje závislosti vytvářené třídy, pokud jsou nastavené
 * @private
 * @method 
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
 * metoda sloužící ke zdědění jako prototypová metoda vytvářené třídy
 * vrátí fukci která zavolá metodu předka třídy jako vlastní  
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
