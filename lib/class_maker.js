/**
 * @overview nastroj pro vytvareni trid a dedicnosti
 * @version 3.0
 * @author jelc, zara
 */   

/**
 * @static
 * @name SZN.ClassMaker
 * @class staticka trida sestavujici dedicnost rozsirovanim prototypoveho objektu
 * doplovanim zakladnicj metod a testovanim zavislosti 
 */    
SZN.ClassMaker = {};

/** @field {string} verze tridy */
SZN.ClassMaker.version = "3.0";
/** @field {string} nazev tridy */
SZN.ClassMaker.NAME = "ClassMaker";
/** @field {string} */
SZN.ClassMaker.CLASS = "static";
/** @field {object} instance tridy ObjCopy, je-li k dispozici */
SZN.ClassMaker.copyObj = null;
	
/**
 * @method vlastni nastroj pro vytvoreni tridy, v jedinem parametru se dozvi informace o tride, jiz ma vytvorit
 * @param {object} classConstructor konstruktor vytvarene tridy
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
 * @private
 * @method vytvari tridu pro dalsi pouziti z literaloveho zapisu s presne definovanym tvarem
 * vlastnost <em>constructor</em> obsahuje definici konstruktoru tridy	<br>
 * vlastnost <em>staticData</em> obsahuje pouzivane staticke vlastnosti tridy a
 * vlastnost <em>trg</em>, ktera urcuje v jakem oboru platnosti se trida vytvori<br>
 * vlastnost <em>proto</em> obsahuje vycet vlastnosti, ktere se stanou prototypovymi
 * vlastnostmi nove tridy
 * valstnost <em>access</em> obsahuje definice modifikatoru pristupu pro prototypove
 * metody tridy	  	 	 	 	 	 
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
 * @param {object} classDef literalova definice nove tridy ve vyse uvedene podobe	 	 	 
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
 * @private
 * @method metoda slouzici ke zdeni jako ststicka metoda vytvarene tridy
 * nastavuje vsechny vlastnosti sveho argumentu na null	 
 * @param {object} obj cisteny objekt
 */	 	 	 		
SZN.ClassMaker._destroy = function(obj) {
	for(var p in obj) {
		obj[p] = null;
	};
}
	
/**
 * @method ziskava tridy, ze kterych bude nova trida dedit 
 * @param {string || array || function} extend plne nazvy rodicovskych trid oddelenych mezerami, nebo reference nebo pole
 * @example <pre>"SZN.Neco SZN.Neco_Jineho Uplne_Neco_Jineho_Mimo_SZN"</pre>
 * @returns {object} out pole trid ze kterych se bude dedit 	 	 	 	
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
 * @private
 * @method vola vlastni kopirovani prototypovych vlastnosti jednotlivych rodicu
 * 	 
 * @param {array} extend pole rodicovskych trid
*/
SZN.ClassMaker._setInheritance = function(constructor) {
	var extend = constructor.EXTEND;
	for(var i = 0; i < extend.length; i++){
		this._makeInheritance(constructor,extend[i]);
	}
}

/**
 * @private
 * @method provadi vlastni kopirovani prototypovych vlastnosti z rodice do potomka
 * pokud je prototypova vlastnost typu object zavola metodu, ktera se pokusi
 * vytvorit hlubokou kopii teto vlastnosti
 * @param {object} constructor Potomek, jehoz nove prototypove vlastnosti nastavujeme
 * @param {object} parent Rodic, z jehoz vlastnosti 'protype' budeme kopirovat	  	 
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
 * @private
 * @method testuje zavislosti vytvarene tridy, pokud jsou nastavene
 * @param {array} depend Pole zavislosti, ktere chceme otestovat
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
