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
SZN.ClassMaker.version = "3.0";
/** 
 * @field {string} název třídy 
 */
SZN.ClassMaker.NAME = "ClassMaker";
/** 
 * @field {string} typ třídy (static|class)
 */
SZN.ClassMaker.CLASS = "static";
/** 
 * @field {object} instance třídy ObjCopy, je-li k dispozici (používá se ke kopírování protozpových vlastností, které jsou objekty)
 */
SZN.ClassMaker.copyObj = null;
	
/**
 * vlastní metoda pro vytvoření třídy, v jediném parametru se dozví informace o třídě, kterou má vytvořit
 * @method 
 * @param {object} classConstructor konstruktor vytvářené třídy
*/
SZN.ClassMaker.makeClass = function(params) {
	if (!params.NAME) { throw new Error("No	NAME passed to ClassMaker.makeClass()"); }
	var version = params.VERSION || "1.0";
	var extend = params.EXTEND || [];
	var depend = params.DEPEND || [];
	var type = params.CLASS;
	
	var result = false;
	if (result = this._testDepend(depend)) {
		/* neni splnena zavislost */
		throw new Error("Dependency error in class " + params.NAME + " ("+result+")");
	}
	
	if (type == "static") { /* snazsi cast - staticka trida */
		var obj = {};
		obj.VERSION = version;
		obj.NAME = params.NAME;
		return obj;
	}
	
	var constructor = function() { /* komplikovanejsi cast - dynamicka trida */
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
	constructor.EXTEND = this._getExtends(extend);
	constructor.DEPEND = depend;
	/* common functionality */
	constructor.destroy = this._destroy;
	this._setInheritance(constructor);
	/* these will get inherited */
	constructor.prototype.CLASS = "class";
	constructor.prototype.sConstructor = constructor;
	
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
 * ziskává a vrací v poli třídy, ze kterých bude nová třída dědit
 * @method  
 * @param {string || array || function} extend plné názvy rodičovských tříd,(nebo rozhraní) oddělených mezerami, nebo reference nebo pole
 * @example <pre>"SZN.Neco SZN.Neco_Jineho Uplne_Neco_Jineho_Mimo_SZN"</pre>
 * @returns {object} out pole tříd ze kterých se bude dědit 	 	 	 	
 */
SZN.ClassMaker._getExtends = function(extend) {
	if (extend instanceof Array) {
		return extend;
	} else if (typeof(extend) == "string") {
		var tmp = extend.split(/[ ]+/);
		var out = new Array();
		for(var i = 0; i < tmp.length; i++){
			try {
				eval('var ext = ' + tmp[i]);
			} catch(e){
				/* rodic neexistuje */
				throw new Error("Inheritance error " + e)
			}
			out[i] = ext;
		}
		return out;
	} else {
		return [extend];
	}
}

/**
 * volá vlastní kopírování prototypových vlastností jednotlivých rodičů
 * @private
 * @method 
 * @param {array} extend pole rodicovskych trid
*/
SZN.ClassMaker._setInheritance = function(constructor) {
	var extend = constructor.EXTEND;
	for(var i = 0; i < extend.length; i++){
		this._makeInheritance(constructor,extend[i]);
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
				constructor.prototype[name] = this.copyObj.copy(parent.prototype[p]);
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
