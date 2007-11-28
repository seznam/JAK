/**
 * @overview nastroj pro vytvareni trid a dedicnosti
 * @version 2.0
 * @author jelc, zara
 */   

/**
 * @static
 * @class staticka trida sestavujici dedicnost rozsirovanim prototypoveho objektu
 * doplovanim zakladnicj metod a testovanim zavislosti 
 */    
SZN.ClassMaker = {}

/** @field {string} verze tridy */
SZN.ClassMaker.version  = 2.0;
/** @field {string} nazev tridy */
SZN.ClassMaker.Name = 'ClassMaker';
/** @field {string} */
SZN.ClassMaker.CLASS = 'static';
/** @field {object} instance tridy ObjCopy, je-li k dispozici */
SZN.ClassMaker.copyObj = null;
	
/**
 * @method vlastni nastroj pro vytvoreni tridy, modifikuje prototypovy objekt sveho argumentu
 * @param {object} classConstructor konstruktor vytvarene tridy
*/
SZN.ClassMaker.makeClass =  function(classConstructor){
	this._obj = classConstructor;
	if(!this._testDepend()){
		/* neni splnena zavislost */
		throw new Error("Dependency error in class " + this._obj.Name);
	}
	
	if((classConstructor) && (classConstructor.extend)){
		var extend = this.getExtends(classConstructor.extend);
		this._setInheritance(extend);
	}
	
	if (classConstructor.prototype) {
		classConstructor.prototype.CLASS = 'class';
		classConstructor.prototype.sConstructor = classConstructor;
	} else {
		classConstructor.CLASS = 'static';
	}
	classConstructor.destroy = this._destroy;
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
 * 		constructor : function(any_params){
 * 			any_function_body
 *	 	},
 *	 	staticData : {
 *	 		Name : 'class_name',
 *	 		extend :'class_extend',
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
	trg[classDef.staticData.Name] = classDef.construct;
	trg[classDef.staticData.Name].Name = classDef.staticData.Name;
	trg[classDef.staticData.Name].extend = classDef.staticData.extend;
	if(classDef.staticData.version != 'undefined'){
		trg[classDef.staticData.Name].version = classDef.staticData.version;
	}
	// pokud mohu kopirovat objekty, zkopiruji i nastaveni zavislosti, jsou-li definovane
	if((typeof classDef.staticData.depend != 'undefined') && (!!this.objCopy)){
		trg[classDef.staticData.Name].depend = this.objCopy.copy(classDef.staticData.depend);
	}		
	this.makeClass(trg[classDef.staticData.Name]);
	for(var i in classDef.proto){
		trg[classDef.staticData.Name].prototype[i] = classDef.proto[i];
		// nastavim pro metodu modifikator pristupu
		if((typeof classDef.access == 'object') && (typeof classDef.access[i] != 'undefined')){
			trg[classDef.staticData.Name].prototype[i].access = classDef.access[i];
		}
	}		
}
	
	
/**
 * @private
 * @method metoda slouzici ke zdeni jako ststicka metoda vytvarene tridy
 * nastavuje vsechny vlastnosti sveho argumentu na null	 
 * @param {object} obj cisteny objekt
 */	 	 	 		
SZN.ClassMaker._destroy = function(obj){
	for(var p in obj) {
		obj[p] = null;
	};
}
	
/**
 * @method ziskava tridy, ze kterych bude nova trida dedit z jeji staticke
 * vlastnosti "Nejaka_Trida.extend", kterou dostane	jako argument 
 * @param {string} extend plne nazvy rodicovskych trid oddelenych mezerami
 * @example <pre>"SZN.Neco SZN.Neco_Jineho Uplne_Neco_Jineho_Mimo_SZN"</pre>
 *	@returns {object} out pole trid ze kterych se bude dedit 	 	 	 	
*/
SZN.ClassMaker.getExtends = function(extend) {
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
SZN.ClassMaker._setInheritance = function(extend) {
	for(var i = 0; i < extend.length; i++){
		this._makeInheritance(extend[i]);
	}
}

/**
 * @private
 * @method provadi vlastni kopirovani prototypovych vlastnosti z rodice do potomka
 * pokud je prototypova vlastnost typu object zavola metodu, ktera se pokusi
 * vytvorit hlubokou kopii teto vlastnosti
 * @param {object} data Objekt z jehoz vlastnosti 'protype' budeme kopirovat	  	 
*/
SZN.ClassMaker._makeInheritance = function(data){
	//debug(this._obj.Name)
	for(var p in data.prototype){
		if(typeof data.prototype[p] == 'object'){
			this._copyObjToPrototype(p,data.prototype[p]);
		} else {
			this._obj.prototype[p] = data.prototype[p];
		}
	}
}

/**
 * @private
 * @method vytvari resp. pokusi se vytvorit v nove tride hlubokou kopii
 * argumentu <em>obj</em> jako prototypovou vlastnost <em>name</em>, pokud
 * neuspeje bude vlastnos <em>name</em jen referenci na <em>obj</em>	 
 * @param {string} name nezev nove vytvarene prototypove vlastnosti
 * @param {object} obj Objekt ze ktereho se pokusime vytvorit kopii
*/
SZN.ClassMaker._copyObjToPrototype = function(name,obj){
	if(typeof SZN.ObjCopy != 'undefined'){
		if(this.copyObj == null){
			this.copyObj = new SZN.ObjCopy();
		} 
		this._obj.prototype[name] = this.copyObj.copy(obj);
	}
}

	
/**
 * @private
 * @method testuje zavislosti vytvarene tridy, pokud jsou nastavene
 * @returns {boolean} out true = ok; false = ko	 
*/
SZN.ClassMaker._testDepend = function(){
	var field = (typeof this._obj.depend != 'undefined') ? this._obj.depend : [];
	var out = true;
	for(var i = 0; i < field.length; i++) {
		if((typeof field[i].sClass == 'undefined')
		|| (typeof field[i].sClass.version == 'undefined')){
			return false;				
		}
		var depMajor = field[i].sClass.version.split('.')[0];
		var claMajor = field[i].ver.split('.')[0];
		if(depMajor == claMajor){
			out = true;
		} else {
			out = false;
		}
	}
	return out;
}
