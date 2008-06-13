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
 * @version 3.1
 * @author jelc, zara
 */   

/**
 * @static
 * @name SZN.ClassMaker
 * @class Konstruktor se nevyužívá. Vždy rovnou voláme metody, tedy např.: SZN.ClassMaker.makeClass(...).
 */    
SZN.ClassMaker = {};

/** 
 * @field {string} verze třídy 
 */
SZN.ClassMaker.VERSION = "3.1";
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
 * <li>TYPE - "class"/"static", statická třída odpovídá literálovému objektu a nemůže nic dědit</li>
 * <li>EXTEND - reference na rodičovskou třídu</li>
 * <li>IMPLEMENT - pole referencí na rozhraní, jež tato třída implementuje</li>
 * <li>DEPEND - pole závislostí</li>
 * </ul>
 */
SZN.ClassMaker.makeClass = function(params) {
	if (!params.NAME) { throw new Error("No NAME passed to SZN.ClassMaker.makeClass()"); }
	
	/* muzu kopirovat objekty ? */
	if(this.copyObj == null){
		if("ObjCopy" in SZN){
			this.copyObj = new SZN.ObjCopy();
		}
	} 
	
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
		obj.CLASS = "static";
		return obj;
	
	} 
	
	var constructor = function() { /* normalni trida */
	if(this.sConstructor.makeNothing) return;
		var inicializator = false;
		if ("$constructor" in arguments.callee.prototype) {
			inicializator = arguments.callee.prototype.$constructor;
		} else if (params.NAME in arguments.callee.prototype) {
			inicializator = arguments.callee.prototype[params.NAME];
		}
		if (inicializator) { inicializator.apply(this,arguments); }
	}
	
	/* basic properties */
	constructor.NAME = params.NAME;
	constructor.VERSION = version;
	constructor.EXTEND = extend;
	constructor.IMPLEMENT = implement;
	constructor.DEPEND = depend;
	constructor.CLASS = "class";
	
	/* common functionality */
	constructor.destroy = this._destroy;
	this._setInheritance(constructor);
	
	/* these will get inherited */
	constructor.prototype.CLASS = "class";
	constructor.prototype.sConstructor = constructor;
	constructor.prototype.callSuper = this._callSuper;
	
	return constructor;
}

/**
 * vytváří třídu pro další použití z literálového zápisu s přesně definovaným tvarem
 * vlastnost <em>constructor</em> obsahuje definici konstruktoru třídy	<br />
 * vlastnost <em>staticData</em> obsahuje používané statické vlastnosti třídy<br />
 * vlastnost <em>trg</em>, která určuje v jakém oboru platnosti se třída vytvoří<br />
 * vlastnost <em>proto</em> obsahuje výčet vlastností, které se stanou prototypovými
 * vlastnostmi nové třídy
 * valstnost <em>access</em> obsahuje definice modifikátoru přistupu pro prototypové
 * metody třídy	  	 	 	 	 	 
 * <pre>
 * class_name {
 *	 	staticData : {
 *	 		NAME : 'class_name',
 *	 		EXTEND :'class_extend',
 *	 		trg : 'class_owner'	 	 
 * 		},
 * 		proto : {
 * 			class_name : function(){
 * 				any_method_body
 *			}
 *			method_name : function(){
 *				any_method_body
 *	 		}	 
 *		},
 *		access : {
 *			method_name : 'public name'
 *	 	}	 	 
 * }
 *  
 * </pre>
 * @method 
 * @private 
 * @param {object} classDef literalová definice nové třídy ve výše uvedené podobě	 	 	 
 */	 	 	 	
SZN.ClassMaker.jsonToClass = function(classDef) {
	eval('var trg = ' + classDef.staticData.trg);
	var name = classDef.staticData.NAME;
	
	var params = {
		NAME:name,
		VERSION:classDef.staticData.VERSION,
		CLASS:"class"
	}
	
	if(classDef.staticData.EXTEND){
		params.EXTEND = classDef.staticData.EXTEND;
	}

	if(classDef.staticData.DEPEND){
		params.DEPEND = classDef.staticData.DEPEND;
	}

	if(classDef.staticData.IMPLEMENT){
		params.IMPLEMENT = classDef.staticData.IMPLEMENT;
	}
	
	trg[name] = SZN.ClassMaker.makeClass(params);
	
	for (var p in classDef.proto) {
		trg[name].prototype[p] = classDef.proto[p];
		// nastavim pro metodu modifikator pristupu
		if ((typeof classDef.access == 'object') && (typeof classDef.access[p] != 'undefined')) {
			trg[name].prototype[p].access = classDef.access[p];
		}
	}		
}
/**
 * metoda testuje zda z návratové hodnoty metody toString zavolané nad funkcí
 * lze opětovně vztvořit funkci
 * @method
 * @returns {boolean} true v případě úspěchu, false v případě neúspěchu
 */     
SZN.ClassMaker.functionToStringTest = function(){
	var success = true;
	var testFunction = function(){
		var a =1;
		var b = {
			aa:'aa',
			bb:3,
			cc:'mmm'
		};
	}
	var fnc = testFunction.toString();
	try {
		eval( 'var tt = ' + fnc);
	} catch(e){
		success = false;
	} finally {
		if(success && (typeof tt == 'function')){
			return true;
		} else {
			return false;
		}
	}
}

	
/**
 * metoda sloužící ke zdědění jako statická metoda vytvářené třídy
 * @private
 * @method 
 * nastavuje všechny vlastnosti svého argumentu na null	 
 * @param {object} obj cisteny objekt
 */	 	 	 		
SZN.ClassMaker._destroy = function(obj) {
	for(var p in obj) {
		obj[p] = null;
	};
}
	
/**
 * metoda sloužící ke zdědění jako prototypová metoda vytvářené třídy
 * @private
 * @method 
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
	/* pokud nelze vutvorit funkci z hodnoty vracene metodou funkce toString
		pouzijeme alternativni postup, v soucasnosti pouze pro operu mobile
	*/
	if(!SZN.ClassMaker.functionToStringTest()){
		var context = this.__context || this.sConstructor;
		var parent = context.EXTEND;
	
		if(!parent){
			throw new Error('"No super-class available"');
		}
		
		var method = parent.prototype[methodName];
		
		if(!method || (typeof method != 'function')){
			throw new Error('"Super-class doesn\'t have method "'+methodName+'"');
		}
		
		
		var mySelf = this;
		var func = function() {
			mySelf.__context = parent;
			var result = method.apply(mySelf, arguments);
			delete mySelf.__context;
			return result;
		}
		
		return func;	
	}
	
	
	
	if(callingFunction.loc_level){
		var level = callingFunction.loc_level;
	} else {
		var level = this.sConstructor;
	}
		
	var sup = level.EXTEND;
	if(!sup){
		throw new Error('"No super-class available"');
	}
	
	var method = sup.prototype[methodName];
	if(!method || (typeof method != 'function')){
		throw new Error('"Super-class doesn\'t have method "'+methodName+'"');
	}
	
	var mySelf = this;
	eval("var func=" + method.toString());
	func.loc_level = sup; 
	return function(){ return func.apply(mySelf,arguments);}
	
}

/**
 * volá vlastní kopírování prototypových vlastností jednotlivých rodičů
 * @private
 * @method 
 * @param {array} extend pole rodicovskych trid
*/
SZN.ClassMaker._setInheritance = function(constructor) {
	if (constructor.EXTEND) { this._makeInheritance(constructor, constructor.EXTEND); }
	for (var i=0; i<constructor.IMPLEMENT.length; i++) {
		this._makeInheritance(constructor,constructor.IMPLEMENT[i],true);
	}
}

/**
 * provadí vlastní kopírovaní prototypových vlastností z rodiče do potomka 
 * pokud je prototypová vlastnost typu object zavolá metodu, která se pokusí
 * vytvořit hlubokou kopii teto vlastnosti
 * @private
 * @method 
 * @param {object} constructor Potomek, jehož nové prototypové vlastnosti nastavujeme
 * @param {object} parent Rodič, z jehož vlastnosti 'protype' budeme kopírovat	  	 
*/
SZN.ClassMaker._makeInheritance = function(constructor, parent, noSuper){
	
	if(!noSuper) {
		parent.makeNothing = true;
		constructor.prototype = new parent();
		if(this.copyObj != null){
			for(var i in parent.prototype){
				if(typeof parent.prototype[i] == 'object'){
					constructor.prototype[i] = this.copyObj.copy(parent.prototype[i]);
				}
			}
		}
		parent.makeNothing = false;
		return;
	}

	for(var p in parent.prototype){
		if (typeof parent.prototype[p] == 'object') {
			if(this.copyObj != null){
				constructor.prototype[p] = this.copyObj.copy(parent.prototype[p]);
			}
		} else {
			// pro rozhrani nededime metody $constructor a $destructor rozhrani
			if(noSuper && ((p == '$constructor') || (p == '$destructor'))){
				continue;
			}		
			constructor.prototype[p] = parent.prototype[p];
		}
	}
}
	
/**
 * testuje závislosti vytvářené třídy, pokud jsou nastavené
 * @private
 * @method 
 * @param {array} depend Pole závislostí, ktere chceme otestovat
 * @returns {boolean} out true = ok; false = ko	 
*/
SZN.ClassMaker._testDepend = function(depend){
	var out = true;
	for(var i = 0; i < depend.length; i++) {
		var item = depend[i];
		if (!item.sClass || !item.ver) { return "Malformed dependency"; }
		var depMajor = item.sClass.VERSION.split('.')[0];
		var claMajor = item.ver.split('.')[0];
		if (depMajor != claMajor) { return "Version conflict in "+item.sClass.NAME; }
	}
	return false;
}
