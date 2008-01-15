/**
 * @overview nástroj pro vytváření tříd a dědičnosti
 * @version 3.0
 * @author jelc, zara
 */   

/**
 * @static
 * @name SZN.ClassMaker
 * @class statická třída sestavující dědičnost rozšiřováním prototypového objektu
 * doplňováním základních metod a testováním závislostí 
 */    
SZN.ClassMaker = {};

/** 
 * @field {string} verze třídy 
 */
SZN.ClassMaker.VERSION = "3.0";
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
	if (!params.NAME) { throw new Error("No	NAME passed to SZN.ClassMaker.makeClass()"); }
	
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
	
	} //else {
		var constructor = function() { /* normalni trida */
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
	//}
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
 * 		$constructor : function(any_params){
 * 			any_function_body
 *	 	},
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
		EXTEND:classDef.staticData.EXTEND,
		DEPEND:classDef.staticData.DEPEND,
		CLASS:"class"
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
 * zavolá danou metodu předka dané třídy s předanými parametry
 * @param {string} methodName název metody předka
 */	 	 	 		
SZN.ClassMaker._callSuper = function(methodName) {
	var args = [];
	for (var i=1;i<arguments.length;i++) { args.push(arguments[i]); }
	var sup = this.sConstructor.EXTEND;
	if (!sup) {
		throw new Error("No super-class available");
	} else if (!(methodName in sup.prototype)) {
		throw new Error("Super-class doesn't have method '"+methodName+"'");
	} else {
		return sup.prototype[methodName].apply(this, args);
	}
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
		this._makeInheritance(constructor,constructor.IMPLEMENT[i]);
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
SZN.ClassMaker._makeInheritance = function(constructor, parent){
	for(var p in parent.prototype){
		if (typeof parent.prototype[p] == 'object') {
			if ("ObjCopy" in SZN) {
				if(this.copyObj == null){
					this.copyObj = new SZN.ObjCopy();
				} 
				constructor.prototype[p] = this.copyObj.copy(parent.prototype[p]);
			}
		} else {
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
