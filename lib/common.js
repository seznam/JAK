/**
 * @overview deklarace "jmenneho prostoru"
 * @version 1.0
 * @author jelc 
 */ 

/**
 * @namespace
 * @static {Object} SZN staticky objekt, ktery se pouziva pro "zapouzdreni"
 * 					vsech definic a deklaraci<br> v podmince se naleza pro
 * 					jistotu a pro to ze muze byt definovan jeste pred svou
 * 					deklaraci pri pouziti slovniku a konfiguraci   
*/
if(typeof SZN != 'object'){
	var SZN = {};
};




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
		var extend = this._getExtends(classConstructor.extend);
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
 * @private
 * @method ziskava tridy, ze kterych bude nova trida dedit z jeji staticke
 * vlastnosti "Nejaka_Trida.extend", kterou dostane	jako argument 
 * @param {string} extend plne nazvy rodicovskych trid oddelenych mezerami
 * @example <pre>"SZN.Neco SZN.Neco_Jineho Uplne_Neco_Jineho_Mimo_SZN"</pre>
 *	@returns {object} out pole trid ze kterych se bude dedit 	 	 	 	
*/
SZN.ClassMaker._getExtends = function(extend) {
	if(typeof extend != 'string'){
		return [extend];
	} else if (extend instanceof Array) {
		return extend;
	} else {
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
/**
 * @overview Nastorje pro praci s objekty kopirovani, serializace, porovnani
 * @version 1.0
 * @author :jelc
 */     


/**
 * @class trida ktera umoznuje vytvaret hluboke kopie objektu v pripade ze je hloubka
 * objektu konecna a mensi nez hloubka urcena konstantou DEEP, objekty, ktere se odvolavaji sami na sebe
 * nelze kopirovat (cyklicka reference), kopirovat lze pouze objekty ktere obsahuji
 * data a nikoli metody   
 */   
SZN.ObjCopy = function(){
	this.ObjCopy();
};

SZN.ObjCopy.Name = 'ObjCopy';
SZN.ObjCopy.version = '1.0';
SZN.ClassMaker.makeClass(SZN.ObjCopy);

/**
 * @field {number} <strong>konstanta</strong> maximalni povolena hloubka objektu
*/
SZN.ObjCopy.prototype.DEEP = 200;

/**
 * @method implicitni konstruktor, zatim se nepouziva
 */ 
SZN.ObjCopy.prototype.ObjCopy = function(){

};
/**
 * @method destruktor, zatim se nepouziva
 */ 
SZN.ObjCopy.prototype.destructor = function(){

};

/**
 * @method kopiruje objekt (vytvari hlubokou datove a typove shodnou kopii sveho argumentu) 
 * @param {object} objToCopy objekt ke kopirovani
 * @returns {object} kopie argumentu metody
 * @throws {error}  'ObjCopy error: property is function' pokud narazi na vlastnost, ktera je funkci
 * @throws {error}  'ObjCopy structure so deep' pokud je structura objektu hlubsei nez DEEP zanoreni
 */ 
SZN.ObjCopy.prototype.copy = function(objToCopy){
	var deepFlag = 0;
	var mySelf = this;
	var firstStep = true;
	
	var myCopy = function(obj){
		if (typeof obj == 'function'){
			throw new Error('ObjCopy error: property is function');
		}
		var newObject = new Object();
		if(deepFlag <= mySelf.DEEP){
			if(firstStep){
				var firstTest = mySelf._copyBuildInObject(obj);
				if(firstTest.isSet){
					return firstTest.output;
				}
				firstStep = false;			
			}
			for(i in obj){
				if(typeof obj[i] != 'object'){
					if (typeof obj == 'function'){
						throw new Error('ObjCopy error: property is function');
					}					
					newObject[i] = obj[i];
				} else {
					/* vlastnost je vestaveny objekt js */
					var buildInProp = mySelf._copyBuildInObject(obj[i]);
					if(buildInProp.isSet){
						newObject[i] = buildInProp.output;
					} else {
						deepFlag++;
						/* vlastnost je uzivatelsky objekt objekt*/
						newObject[i] = myCopy(obj[i]);
					}
				}			
			}
		} else {
			throw new Error('ObjCopy structure so deep')
		}
		return newObject;
	}
	myObject = myCopy(objToCopy);
	return myObject;	
};
/**
 * @method kopiruje pole, vytvari datove a typove shodnou kopii pole, ktere dostane, jako argument
 * @param {array} arrayToCopy pole ke zkopirovani
 * @returns {array} kopie pole arrayToCopy
 * @theows {error} 'ObjCopy.arrayCopy: Attribute is not Array' pokud argument metody neni pole
 */   
SZN.ObjCopy.prototype.arrayCopy = function(arrayToCopy){
	var newField = new Array();
	var mySelf = this;
	var myCopy = function(field){
		if(field instanceof Array){
			for(var i = 0; i < field.length; i++){
				if(typeof(field[i]) != 'object'){
					newField[i] = field[i];
				} else {
					newField[i] = mySelf.copy(field[i]);
				}
			}
			return newField;
		} else {
			throw new Error('ObjCopy.arrayCopy: Attribute is not Array');
		}
	}
	var myField = myCopy(arrayToCopy);
	return myField;
};
/**
 * @private
 * @method testuje zda je predany objekt instance nektere z nativnich trid javascriptu
 * (String,Number,Array,Boolean,Date,RegExp) a vytvari jejich typove shodnou kopii 
 * @param {any} promena ke zkopirovani
 * @returns {object} s vlastnostmi:
 * <ul>
 * <li>isSet <em>{boolean} urcuje zda byl predany objekt zkopirovan</em></li>
 * <li>output <em>{object}</em> zkopirovany argument metody, pokud to bylo mozne, jinak null</li>   
 * </ul>
 */     
SZN.ObjCopy.prototype._copyBuildInObject = function(testedObj){
	var output = null;
	var isSet = false;
	if(testedObj instanceof String){
		output = new String(testedObj);
		isSet = true;
	} else if(testedObj instanceof Number){
		output = new Number(testedObj);
		isSet = true;
	} else if(testedObj instanceof RegExp){
		output = new RegExp(testedObj);
		isSet = true;
	} else if(testedObj instanceof Array){
		output = this.arrayCopy(testedObj);
		isSet = true;
	} else if(testedObj instanceof Date){
		output = new Date(testedObj);
		isSet = true;
	} else if(testedObj instanceof Boolean){
		output = new Boolean(testedObj)
		isSet = true;
	} else if(testedObj == null){
		isSet = true;
	}
	return {isSet:isSet,output:output};	
};

/**
 * @class trida provadi operace s objekty jako je jejich porovnavani a serializace a deserializace
 * dedi z tridy ObjCopy, takze umi i kopirovat, dedi tez vsechna omezeni sveho rodice
 * (maximalni hloubka zanoreni, umi pracovat pouze s datovymi objekty)  
 */    
SZN.ObjLib = function(){
	this.ObjLib();
};

SZN.ObjLib.Name = 'ObjLib';
SZN.ObjLib.extend = 'SZN.ObjCopy';
SZN.ObjLib.version = '1.0';
SZN.ClassMaker.makeClass(SZN.ObjLib);

/**
 * @method implicitni konstruktor, zatim se nepouziva
 */ 
SZN.ObjLib.prototype.ObjLib = function(){

};
/**
 * @method implicitni konstruktor, zatim se nepouziva
 */ 
SZN.ObjLib.prototype.destructor = function(){

};

/**
 * @method prevadi object na retezec obsahujici literalovou formu zapisu objektu
 * pripadne ho prevadi do lidsky citelne podoby (nelze pak unserializovat) 
 * @param {object} objToSource objekt, ktery chceme serializovat
 * @param {string} showFlag retezec, ktery pouzijeme pro vizualni odsazovani
 * pokud je argument zadan, lze vystup zobrazit, ale nelze ho zpetne prevest na object
 * @returns {string} retezcova reprezantace objektu  
 * @throws {error}  'Serialize error: property is function' pokud narazi na vlastnost, ktera je funkci
 * @throws {error}  'Serialize structure so deep' pokud je structura objektu hlubsei nez DEEP zanoreni
 */    
SZN.ObjLib.prototype.serialize = function(objToSource,showFlag){
	var deepFlag = 0;
	var startString = '{';
	var endString = '}';
	var propertySep = ':';
	var propertyEnd = ',';
	var lineEndMark = this._isIE() ? '\n\r' : '\n'
	var lineEnd = showFlag ? lineEndMark : '';
	var lineTab = showFlag ? showFlag : '';
	var tabs = lineTab;
	var mySelf = this;
	var output = '';
	var firstStep = true;
	var mySource = function(obj){
		/* testuji zda hloubka zanoreni neni vetsi nez DEEP */
		if(deepFlag <= mySelf.DEEP){
			var output = '{' + lineEnd;
			/* nastaveni tabulatoru pro formatovany vystup */
			if(arguments[1]){
				tabs = mySelf._charUp(tabs,lineTab);
			}
			/* serializuji vestavene js objekty */
			if(firstStep){
				var buildIn = mySelf._buildInObjectSerialize(obj);
				if(buildIn.isSet){
					return buildIn.output;
				}
				firstStep = false;
			}
			for(var i in obj){
				if(typeof obj[i] == 'function'){
					/* pokud je vlastnost funkce/metoda vyvolam chybu */
					throw new Error('Serialize: can\'t serialize object with some method - ** ' + i +' **');
				} else if(typeof obj[i] != 'object'){
					/* pokud vlastnost neni objekt osetrim uvozovky v pripade stringu a zapisu ji */
					if(typeof obj[i] == 'string'){
						var str = '\''
						var propValue = obj[i].replace(/\'/g,"\\'");
					} else {
						var str = '';
						var propValue = obj[i];
					}
					output = output + tabs + '\'' + i  + '\'' + propertySep  + str + propValue + str + propertyEnd + lineEnd;
				} else {
					/* otestuji zanoreny objekt zda neni vestavenym js objektem */
					var buildIn = mySelf._buildInObjectSerialize(obj[i]);
					if(buildIn.isSet){
						output = output + tabs + '\'' + i  + '\'' + propertySep + buildIn.output +  propertyEnd + lineEnd;
					} else {
						/* zpracuji zanoreny objekt */
						deepFlag++;
						var isEmpty = true;
						/* zjistim zda vlastnost neni prazdny objekt */
						for(var j in obj[i]){
							if(j) {
								var isEmpty = false;
								break;
							}
						}
						output = output + tabs + '\'' + i  + '\'' + propertySep + (isEmpty ? '{}' : mySource(obj[i],1)) + propertyEnd + lineEnd;
					}
				}
			}
			/* nastavim tabulatory pro formatovany vystup */
			tabs = mySelf._charDown(tabs);
			/* odstranim posledni carku je-li */
			var charNum = (output.lastIndexOf(',') >= 0) ? output.lastIndexOf(',') : output.length;
			output = output.substring(0,charNum) + lineEnd;
			return output +  tabs + endString;
		} else{
			throw new Error('Serialize: structure is so deep.');
		}
	}
	var source = mySource(objToSource);
	return source;
};

/**
 * @method prevedeni pole na retezc ktery odpovida literalove forme zapisu pole
 * @param {array} fieldToSerialize pole urcene k prevedeni
 * @returns literalovy zapis pole
 * @throws {error} 'Serialize: can\'t serialize Function' prvek pole je funkce
 * @throws {error}  'arraySerialize: Attribute is not Array' argument metody neni pole
 */   
SZN.ObjLib.prototype.arraySerialize = function(fieldToSerialize){
	var fieldStr = '';
	var mySelf = this;
	var mySource = function(field){
		if(field instanceof Array){
			for(var i = 0; i < field.length; i++){
				if(typeof field[i] == 'function'){
					throw new Error('Serialize: can\'t serialize Function');
				}
				if(typeof field[i] != 'object'){
					if(typeof field[i] == 'string'){
						var str = field[i].replace(/\'/g,"\\'");
						fieldStr += '\'' + str + '\',';
					} else {
						fieldStr += field[i] + ',';
					}
				} else {
					fieldStr +=  mySelf.serialize(field[i],0) + ',';
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
 * @method prevede retezec obsahujici literalovou formu zapisu pole nebo objektu
 * na pole nebo objekt 
 * @param {string} serializedString retezec k prevedeni
 * @returns {object} vytvoreny ze vstupniho retezce 
 */    
SZN.ObjLib.prototype.unserialize = function(serializedString){
	eval('var newVar=' + serializedString);
	return newVar;
}

/**
 * @method porovnava dva objekty zda jsou datove shodne, nejdrive porovna velikosti serializovanych objektu
 * a pokud jsou shodne porovna prvni s druhym a druhy s prvnim 
 * @param {object} refObj objekt s kterym porovnavame
 * @param {object} matchObj objekt ktery porovnavame
 * @returns true = jsou shodne, false = nejsou shodne
 */    
SZN.ObjLib.prototype.match = function(refObj,matchObj){
	/* nejdrive zjistim jestli jsou objekty shodne pokud jde o jejich retezcovou reprezentaci
	 * 1 rekurze na kazdem objektu, usetrim dalsi dve 
	*/
	if(this.serialize(refObj,0).length == this.serialize(matchObj,0).length){
		/* nyni porovnam refObj s matchObj a naopak */
		var step1 = this._matchProcess(refObj,matchObj);
		var step2 = this._matchProcess(matchObj,refObj);
		return (step1 && step2);
	} else {
		return false;
	}
};

/**
 * @private
 * @method porovnava prvni matchObjs refObj po vlastnostech 
 * @param {object} refObj objekt s kterym porovnavame
 * @param {object} matchObj objekt ktery porovnavame
 * @returns {boolean} true refObj ma vsechny vlastnosti matchObj; false nema
 */    
SZN.ObjLib.prototype._matchProcess = function(refObj,matchObj){
	var success = true;
	var mySelf = this;
	var firstStep = true;
	var myMatch = function(obj1,obj2){
		/* v prvnim kroku provedu porovnani pro vestavene js objekty */
		if(firstStep){
			var buildIn = mySelf._matchBuildInObj(obj1,obj2);
			if((buildIn.isSet) && (!buildIn.success)){
				success = false;
				return false;
			}
			firstStep = false;
		}
		for(var i in obj1){
			/* zjistim zda maji oba objekty vlastnost stejneho jmena a porovnam je*/
			if(((typeof obj1[i] != undefined) && (typeof obj2[i] != undefined)) ||
			((typeof obj1[i] == undefined) && (typeof obj2[i] == undefined))){
				if(typeof obj1[i] != 'object'){
					if(obj1[i] != obj2[i]){
						success =  false;
						return success;
					} else {
						succes = success;
					}
				} else {
					/* vnorim se hloubeji */
					var buildIn = mySelf._matchBuildInObj(obj1,obj2);
					if(buildIn.isSet){
						if(!buildIn.success){
							success = false;
							return false;							
						}
					} else {
						success = myMatch(obj1[i],obj2[i]);
					}
				}
			} else {
				success = false;
				return success;
			}
		}
		return success;
	}
	success = myMatch(refObj,matchObj);
	return success;
};
/**
 * @private
 * @method porovnava nativni javascriptove objekty, zda jsou obsahove shodne
 * @param {object} refObj objekt s kterym porovnavame
 * @param {object} matchObj objekt ktery porovnavame
 * @returns {object} s vlastnostmi:
 * <ul>
 * <li>isSet <em>{boolean}</em> urcuje zda byl predany objektem</li>
 * <li>success <em>{object}</em> ztrue v pripade shody, jinak false</li>   
 * </ul>  
 */    
SZN.ObjLib.prototype._matchBuildInObj = function(refObj,matchObj){
	var objField = ['String','Number','RegExp','Date','Boolean'];
	var success = false;
	var isSet = false;
	for(var i = 0; i < objField.length; i++){
		if((refObj instanceof window[objField[i]]) && (matchObj instanceof window[objField[i]])){
			isSet = true;
			if((this.serialize(refObj,0)) == (this.serialize(matchObj,0))){
				success = true;
			}
		}
	}
	return {isSet:isSet,success:success};
};

/**
 * @private
 * @method prevadi na retezec nativni objekty javascriptu, pripadne pole
 * @param {object} objekt k prevedeni na retezec
 * <ul>
 * <li>isSet <em>{boolean} urcuje zda byl predany objekt serializovan</em></li>
 * <li>output <em>{object}</em> serializovany argument metody, pokud to bylo mozne, jinak null</li>   
 * </ul>
 *
 */     
SZN.ObjLib.prototype._buildInObjectSerialize = function(testedObj){
	var output = null;
	var isSet = false;
	if(testedObj instanceof String){
		var str = testedObj.replace(/\"/g,'\\"');
		output = 'new String("' + str + '")';
		isSet = true;
	} else if(testedObj instanceof Number){
		output = 'new Number(' + testedObj + ')';
		isSet = true;
	} else if(testedObj instanceof RegExp){
		output = 'new RegExp(' + testedObj + ')';
		isSet = true;
	} else if(testedObj instanceof Array){
		output = this.arraySerialize(testedObj);
		isSet = true;
	} else if(testedObj instanceof Date){
		output = 'new Date(' + testedObj + ')';
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
 * @private
 * @method pro lidsky citelny vystup serializovaneho objkektu pricita oddelovaci znak k oddelovaci
 * @param {string} modString aktualne pouzivany oddelovac
 * @param {string} counter  jeden stupen oddelovace
 * @returns {string} modstring + counter
 */   
SZN.ObjLib.prototype._charUp = function(modString,counter){
	return modString + counter;
};
/**
 * @private
 * @method pro lidsky citelny vystup serializovaneho objkektu odebira oddelovaci znak z oddelovace
 * @param {string} modString aktualne pouzivany oddelovac
 * @param {string} counter  jeden stupen oddelovace
 * @returns {string} modstring + counter
 */  
SZN.ObjLib.prototype._charDown = function(modString){
	return modString.substring(0,modString.length-1);
};
/**
 * @private
 * @method testuje zda je pouzivany prohlizec Internet Explorer, pro potreby lidsky citelneho formatovani serializace
 * @returns {boolean} true = ane, false = ne 
 */  
SZN.ObjLib.prototype._isIE = function(){
	if(document.all && document.attachEvent && !window.opera){
		return true;
	}
	return false;
};
/**
 * @overview detekce prohlizece
 * @version 2.0
 * @author : jelc, zara
 */   


/**
 * @static
 * @class Detekce klientskeho prostredi v zavislosti na vlastnostech javascriptu
 * (pokud je to mozne jinak dle vlastnosti navigator.userAgent)
 *
 */
SZN.Browser = {};
SZN.Browser.Name = 'Browser';
SZN.Browser.version = 2.0;
SZN.ClassMaker.makeClass(SZN.Browser);

/** @field {string} platform system uzivatele */
SZN.Browser.platform = '';
/** @field {string} klient prohlizec uzivatele */
SZN.Browser.klient = '';
/** @field {string} version verze prohlizece */
SZN.Browser.version = 0;
/** @field {string} agent hodnota systemove promene "navigator.userAgent" */
SZN.Browser.agent = '';

/**
 * @private
 * @method zjistuje system uzivatele
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
 * @private
 * @method zjistuje typ prohlizece
 * @returns {string} ktery popisuje pouzivany prohlizec
 * <ul>
 * <li>opera - Opera</li>
 * <li>ie - Internet Explorer</li>
 * <li>gecko - Mozilla like</li>
 * <li>konqueror - Konqueror</li>  
 * <li>safari - Safari</li>  
 * <li>oth - vsechno ostatni/neznamy</li>  
 * </ul>  
 */   
SZN.Browser._getKlient = function(){
	if(window.opera){
		return 'opera';
	} else if(document.attachEvent 
	&& (typeof navigator.systemLanguage != 'undefined')){
		return 'ie';
	} else if (document.getAnonymousElementByAttribute){
		return 'gecko';
	} else if(this._agent.indexOf('KHTML')){
		if(this._vendor == 'KDE'){
			return 'konqueror';
		} else {
			return 'safari';
		}
	} else {
		return 'oth';
	}
};

/**
 * @private 
 * @method Nastavuje identifikaci leveho a praveho tlacitka mysi
 * @returns {object} jako asociativni pole s vlastnostmi
 * <em>left</em> a <em>right</em>, ktere obsahuji ciselny identifikator
 * stisknuteho tlacitka mysi jak ho klient vraci ve vlastnosti udalosti
 * <em>e.button</em>
 */
SZN.Browser._getMouse = function(){
	var left;
	var right;
	if ((this.klient == 'ie') || (this.klient == 'konqueror') || (this.klient == 'safari')){
		left = 1;
		right = 2;
	} else if((this.klient == 'opera') && (this.version > 7) && (this.version < 9)) {
		left = 1;
		right = 2;		
	} else {
		left = 0;
		right = 2;
	}
	return {left:left,right:right};	
}

/**
 * @private
 * @method zjistuje verzi daneho prohlizece, detekovaneho metodou "_getKlient"
 * @returns {string} navratova hodnota metod jejich nazev je slozeny z retezcu
 * '_get_' + vlastnost <em>klient</em>  + '_ver'
 * @example  <pre>
 * pro Internet Exlporer je volana metoda <em>this._get_ie_ver()</em>
 *</pre>    
 */   
SZN.Browser._getVersion = function(){
	var out = 0;
	var fncName = '_get_' + this.klient + '_ver';
	
	if(typeof this[fncName] == 'function'){
		return this[fncName]();
	} else {
		return 0;
	}
};

/**
 * @private
 * @method detekce verze Internet Exploreru
 * @returns {string} verze prohlizece od 5.0 do 7 (IE 8 bude detekovano jako 7)
 */   
SZN.Browser._get_ie_ver = function(){
	if(typeof Function.prototype.call != 'undefined'){
		if(window.XMLHttpRequest){
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
 * @private
 * @method detekce verze Opery
 * @returns {string} verze prohlizece od 6 do 9 (> 9 bude detekovano jako 9)
 */  
SZN.Browser._get_opera_ver = function(){
	if(document.designMode && document.execCommand){
		return '9';
	} else if((document.selection) && (document.createRange)){
		return '8';
	} else if(document.createComment){
		return '7';
	} else {
		return '6';
	}
};

/**
 * @private
 * @method detekce verze Gecko prohlizecu
 * @returns {string} verze prohlizece od 1.5do 2 (> 2 bude detekovano jako 2)
 */ 
SZN.Browser._get_gecko_ver = function(){
	if(window.external){
		return '2';
	} else {
		return '1.5';
	}
};

/**
 * @private
 * @method detekce verze Konqueroru
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
 * @private
 * @method detekce verze Safari
 * @returns {string} verze verze se nedetekuje vraci 1
 */ 
SZN.Browser._get_safari_ver = function(){
	return '1';
};

/**
 * @method implicitni konkstruktor
 */   
SZN.Browser._getBrowser = function(){
	this._agent = this.agent = navigator.userAgent;
	this._platform = navigator.platform;
	this._vendor = navigator.vendor;
	this.platform = this._getPlatform();
	this.klient = this._getKlient();
	this.version = this._getVersion();
	this.mouse = this._getMouse();
};
SZN.Browser._getBrowser();
/**
 * @overview "MAKRA"
 * @version 2.0
 * @author jelc, zara
 */
 
   
/**
 * @static
 * @method 	vytvoreni funkce ktera vola funkci ve svem argumentu "fnc" jako metodu 
 * objektu z argumentu "obj", vraci takto modifikovanou funkci a predava ji zbyle
 * argumenty.<br> Zavisi na ni nektere dalsi knihovni tridy
 * 
*/
SZN.bind = function(obj,fnc){
	var myObj = obj;
	var myFnc = fnc;
	var myArgs =[];
	/* 
		pridam si nepovinne argumenty do pole, s temito argumenty bude  
		volana zadana funkce
	*/
	for(var i = 0; i < arguments.length;i++){
		if(i > 1){
			myArgs[myArgs.length] = arguments[i];
		}
	}
	/* 	
		zde vytvorim funkci bude vracet predanou funkci jako metodu predaneho 
		objektu
	*/
	var newFnc = function(){
		var args = arguments;
		var mySelf = arguments.callee;
		var ar = [];
		/* vytvorim si pole argumentu se kterymi bude funkce zavolana */
		if (args.length > 0){
			for(var i = 0; i < args.length;i++){
				ar[i] = args[i];
			}
		}
		/* nastavim argumenty se kterymi se predana funkce zavola */
		ar = ar.concat(newFnc.myArgs);
		/* nastavim this v zavesene funkci */
		var self = mySelf.myObj;
		/* zavolam zavesovanou funkci */
		return mySelf.myFnc.apply(self,ar);
	};
	/* pridam dalsi argumenty se kterymi se zavola zavesena funkce */
	newFnc.myArgs = myArgs;
	/* nastavim si objekt jako jehoz metodu budu zavesenou funkci volat (bude this)*/
	newFnc.myObj = myObj;
	/* nastavim funkci metodu, kterou ve skutecnosti chci volat */
	newFnc.myFnc = myFnc;
	/* nechci zavesovanou funkci opetovne modifikovat pri dalsim zaveseni */
	newFnc.reSet = true;
	return newFnc;
};

/**
* @static
* @method generator unikatnich ID
*/
SZN.idGenerator = function(){
	this.idCnt = this.idCnt < 10000000 ? this.idCnt : 0;
	var ids = 'm' +  new Date().getTime().toString(16) +  'm' + this.idCnt.toString(16);
	this.idCnt++;
	return ids;	
};
/**
 * @overview Zpracovavani udalosti a casovacu
 * @version 2.0
 * @author jelc, zara
 */   

/**
 * @class trida pro praci s udalostmi a casovaci
 * @static
 */   
SZN.Events = {};
SZN.Events.Name = 'Events';
SZN.Events.version = 2.0;
SZN.ClassMaker.makeClass(SZN.Events);

SZN.Events.eventFolder = new Object();

/**
 * @method destruktor, odvesi vsechny handlovane udalosti a jejich posluchace a
 * zrusi se 
 */   
SZN.Events.destructor = function() {
	this.removeAllListeners();
	this.sConstructor.destroy(this);
}

/**
 * @method vraci udalost, ktera je prave zpracovavana
 * @deprecated
 *
 */  
SZN.Events.getEvent = function(e){
	return e || window.event;
}

/**
 * @method vraci cil udalosti
 *
 */  
SZN.Events.getTarget = function(e){
	var e = e || window.event;
	return e.target || e.srcElement; 
}

/**
 * @method volani zaveseni posluchace na pozadovanou udalost, v konecnem dusledku
 * vytvori vlastniho posluchace, ktery bude volat zavesenou udalost s parametry
 * udalost, element, ktery udalost zachytil  
 * @param {object} elm element ktery udalost zachytava
 * @param {string} eType typ udalosti bez predpony "on"
 * @param {object} obj objekt ve kterem se bude udalost zachytavat, pokud je volana
 * globalni funkce musi byt 'window' pripadne 'document' 
 * @param {function | string} func funkce, ktera se bude provadet jako posluchac
 * <em>string</em> pokud jde o metodu <em>obj</em> nebo reference na funkci, ktera se zavola
 * jako metoda <em>obj</em>  
 * @param {boolean} capture hodnaota pouzita jako orgument capture pro DOM zachytavani
 * pro IE je ignorovana 
 * @param {boolean} cached urcuje, zda se ma udalost ukladat do <em>eventFolder</em> 
 * pro pozdejsi odveseni defaultne se vzdy pouzije, pokud func neni <em>null</em> 
 * @returns {string} identifikator handleru v  <em>eventFolder</em> prostrednictvim, ktereho se
 * udalost odvesuje, pokud je <em>cached</em> vyhodnoceno jako true
 * @throws {error}  Events.addListener: arguments[3] must be method of arguments[2]
 * @throws {error} Events.addListener: arguments[2] must be object or function
 */    
SZN.Events.addListener = function(elm,eType,obj,func,capture,cached){
	var capture = arguments[4] ? arguments[4] : false;
	var cached = arguments[5] ? arguments[5] : false;
	var method = null;
	var toFold = null;
	if(typeof obj == 'function'){
		toFold = this._addListener(elm,eType,obj,capture);
	} else if(typeof obj == 'object'){
		var cached = true;
		if(typeof func == 'string'){
			if(typeof obj[func] == 'function'){
				method = this._getMethod(obj,func,elm);
				toFold = this._addListener(elm,eType,method,capture);			
			} else {
				throw new Error('Events.addListener: arguments[3] must be method of arguments[2]');
			}
		} else if(typeof func == 'function'){
			method = this._getMethod(obj,func,elm);
			toFold = this._addListener(elm,eType,method,capture);		
		}
	} else {
		throw new Error('Events.addListener: arguments[2] must be object or function');
	}
	if(cached){
		return this._storeToFolder(toFold);
	} else {
		return 0;
	}
}

/**
 * @private
 * @method vlastni zaveseni posluchace bud DOM kompatibilne, nebo pres attachEvent
 * pro IE 
 * @param {object} elm element ktery udalost zachytava
 * @param {string} eType typ udalosti bez predpony "on"
 * @param {func} func funkce/metoda ktera se bude provadet
 * @param {boolean} capture hodnaota pouzita jako orgument capture pro DOM zachytavani
 * @returns {array} obsahujici argumenty funkce ve shodnem poradi 
 */    
SZN.Events._addListener = function(elm,eType,func,capture){
	if (document.addEventListener) {
		if (window.opera && (elm == window)){
			elm = document;
		}
		elm.addEventListener(eType,func,capture);
	} else if (document.attachEvent) {
		elm.attachEvent('on'+eType,func);
	}
	return [elm,eType,func,capture];
}

/**
 * @private
 * @method Vytvari funkci/metodu, ktera bude fungovat jako posluchac udalosti tak
 * aby v predana metoda byla zpracovavana ve spravnem oboru platnosti, this bude
 * objekt ktery ma naslouchat, pozadovane metode predava objekt udalosti a element na
 * kterem se naslouchalo
 * @param {object} obj objekt v jehoz oboru platnosti se vykona <em>func</em> po zachyceni udalosti
 * @param {function} func funkce/metoda u ktere chceme aby udalost zpracovavala
 * @param {object} elm Element na kterem se posloucha
 * @returns {function} anonymni funkce, ktera zprostredkuje zpracovani udalosti
 * pozadovane metode 
 */    
SZN.Events._getMethod = function(obj,func,elm){
	if(typeof func == 'string'){
		if(typeof obj[func].canTransform == 'undefined'){
			return function(e){return obj[func].apply(obj,[e,elm])};
		} else {
			return obj[func];
		}
	} else {
		if(typeof func.canTransform == 'undefined'){
				return function(e){return func.apply(obj,[e,elm])};
		} else {
			return func;
		}	
	}
}

/**
 * @private
 * @method uklada udaje o zavesenem posluchaci do <em>eventFolder</em> pro pouzit
 * pri odvesovani a vraci identifikator ulozenych udaju 
 * @param {array} data vracena metodou <em>_addListener</em>
 * @returns {string} id identifikator dat v <em>eventFolder</em>
 */   
SZN.Events._storeToFolder = function(data){
	var id = SZN.idGenerator();
	this.eventFolder[id] = new Object();
	this.eventFolder[id].trg = data[0];
	this.eventFolder[id].typ = data[1];
	this.eventFolder[id].action = data[2];
	this.eventFolder[id].bool = data[3];
	return id;	
}

/**
 * @method odebirani posluchacu udalosti, bud zadanim stejnych udaju jako pri handlovani
 * (nedoporuceno) nebo zadanim <em>id (cached)</em>, ktere vraci medoda <em>addListener</em> <br>
 * <strong>a) pokud je zadan jen jeden argument, je povazovan za hodnotu <em>chached</em><br>
 * b) pokud je zadano vsech sest argumentu pouzije se jen hodnota chached je-li string<br>
 * c) jinak se zkusi standardni odveseni, ktere nebude fungovat pokud zaveseni probehlo s <em>chached</em> nastavenym na true  
 * </strong> 
 * @param {object} elm elemnet na kterem se poslouchalo
 * @param {string} eType udalost ktera se zachytavala
 * @param {object} obj objekt v jehoz oboru platnosti se zachycena udalost zpracovala
 * @param {function | string} func funkce/metoda ktera udalost zpracovavala
 * @param {boolean} capture hodnota capture pro DOM odvesovani
 * @param {string} cached id pod kterym jsou uloyena data k odveseni v <em>eventFolder</em>
 * @thorows {error} Events.removeListener: wrong arguments
 */    
SZN.Events.removeListener = function(elm,eType,obj,func,capture,cached){
	var capture = arguments[4] ? arguments[4] : false;
	var cached = arguments[5] ? arguments[5] : false;
	cached = (arguments.length == 1) ? arguments[0] : cached;
	if(typeof cached == 'string'){
		return this._removeById(cached);
	}
	
	if(typeof obj == 'function'){
		return this._removeListener(elm,eType,obj,capture);
	}
	
	throw new Error('Events.removeListener: wrong arguments');
}

/**
 * @private
 * @method provadi skutecne odveseni posluchacu DOM kompatibilne ci pro IE
 * @param {object} elm element na kterem se naslouchalo
 * @param {string} eType udalost, ktera se zachytavala
 * @param {function} func skutecna funkce, ktera zpracovavala udalost
 * @param  {boolean} capture pro DOM zpracovavani stejna hodota jako pri zavesovani
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
 * @private
 * @method vola odveseni na zaklade vlastnosti ulozenych v <em>eventFolder</em>
 * @param {string} cached id pod kterym jsou data o posluchaci ulozena
 * @returns {number} 0 v pripade uspechu, 1 v pripade neuspechu
 */     
SZN.Events._removeById = function(cached){
	try{
		var obj = this.eventFolder[cached];
		this._removeListener(obj.trg,obj.typ,obj.action,obj.bool);
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
 * @method provede odveseni vsech posluchacu, kteri jsou ulozeni v <em>eventFolder</em>
 */   
SZN.Events.removeAllListeners = function(){
	for(var p in this.eventFolder){
		this._removeById(p);
	}
}

/**
 * @method zastavi probublavani udalosti stromem dokumentu
 * @param {object} e zpracovavana udalost 
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
 * @method zrusi vychozi akce (definovane klientem) pro danou udalost
 * @param {object} e zpracovavana udalost 
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
 * @method provadi transformaci predane metody tak aby se zavolala v kontextu objektu <em>owner</em>
 * pri pouziti v intervalu nebo timeoutu, v oboru platnosti <em>owner</em> vytvori funkci, ktera provede
 * volani <em>exeFunc</em> v oboru platnosti <em>owner</em> 
 * @param {object} owner objekt v jehoz oboru platnosti se bude vykonavat funkce/metoda exeFunc v casovaci
 * @param {string} handleFuncName nazev vlastnosti objektu <em>owner</em>, ktera se bude spoustet v casovaci
 * @param {function} exeFunc funkce/metoda, kterou chceme provadet
 */     
SZN.Events.addTimeFunction = function(owner,handleFuncName,exeFunc,exeObj){
	if(!!exeObj){
		owner[handleFuncName] = function(){return exeFunc.apply(exeObj,[])};
	} else {
		owner[handleFuncName] = function(){return exeFunc.apply(owner,[])};
	}
}
/**
 * @overview dom-related funkce
 * @version 3.0
 * @author zara, koko, jelc
 */

/**
 * @static
 * @class staticka trida posytujici nektere prakticke metody na upravy DOM stromu
 */
SZN.Dom = {}
SZN.Dom.Name = "Dom";
SZN.Dom.version = 3.1;
SZN.ClassMaker.makeClass(SZN.Dom);

/**
 * Vytvori DOM node, je mozne rovnou zadat id, CSS tridu a styly
 * @param {String} tagName jmeno tagu (lowercase)
 * @param {String} id id uzlu
 * @param {String} className nazev CSS trid(y)
 * @param {Object} styleObj asociativni pole CSS vlastnosti a jejich hodnot
 */
SZN.cEl = function(tagName,id,className,styleObj) {
	var node = document.createElement(tagName);
	if (arguments.length == 1) { return node; }
	if (id) { node.id = id; }
	if (className) { node.className = className; }
	if (styleObj) for (p in styleObj) {
		node.style[p] = styleObj[p];
	}
	return node;
}
	
/**
 * Alias pro document.createTextNode
 * @param {String} str retezec s textem
 */
SZN.cTxt = function(str) {
	return document.createTextNode(str);
}
	
/**
 * @static
 * @method zjednoduseny pristup k metode DOM document.getElementById
 * @param {string} ids id HTML elementu, ktery chceme ziskat,
 * NEBO primo element
 * @returns {object} HTML element s id = ids, pokud existuje, NEBO element specifikovany jako parametr
 */
 SZN.gEl = function(ids){
	if (typeof(ids) == "string") {
		return document.getElementById(ids);
	} else { return ids; }
}

/**
 * Propoji zadane DOM uzly
 * @param {Array} pole1...poleN libovolny pocet poli; pro kazde pole se vezme jeho prvni prvek a ostatni 
 *   se mu navesi jako potomci
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
 * Otestuje, ma-li zadany DOM uzel danou CSS tridu
 * @param {Object} element DOM uzel
 * @param {String} className CSS trida
 * @return true|false
 */
SZN.Dom.isClass = function(element,className) {
	var arr = element.className.split(" ");
	for (var i=0;i<arr.length;i++) { 
		if (arr[i] == className) { return true; } 
	}
	return false;
}

/**
 * Prida DOM uzlu CSS tridu. Pokud ji jiz ma, pak neudela nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS trida
 */
SZN.Dom.addClass = function(element,className) {
	if (SZN.Dom.isClass(element,className)) { return; }
	element.className += " "+className;
}

/**
 * Odebere DOM uzlu CSS tridu. Pokud ji nema, neudela nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS trida
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
 * Vymaze (removeChild) vsechny potomky daneho DOM uzlu
 * @param {Object} element DOM uzel
 */
SZN.Dom.clear = function(element) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
}

/**
 * @method vraci velikost dokumentu, pro spravnou funkcionalitu je treba aby
 * browser rendroval HTML ve standardnim modu 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>width</em> - sirka dokumentu</li><li><em>height</em> - vyska dokumentu</li></ul> 
 */    
SZN.Dom.getDocSize = function(){
	var x	= document.documentElement.clientWidth && (SZN.Browser.klient != 'opera') ? document.documentElement.clientWidth : document.body.clientWidth;
	var y	= document.documentElement.clientHeight && (SZN.Browser.klient != 'opera') ? document.documentElement.clientHeight : document.body.clientHeight;		
	if ((SZN.Browser.klient == 'safari') || (SZN.Browser.klient == 'konqueror')){
		y = window.innerHeight; 
	}
	return {width:x,height:y};
};

/**
 * @method vracim polohu "obj" ve strance nebo uvnitr objektu ktery predam jako druhy 
 * argument
 * @param {object} obj HTML elmenet, jehoz pozici chci zjistit
 * @param {object} <strong>volitelny</strong> HTML element, vuci kteremu chci zjistit pozici <em>obj</em>, element musi byt jeho rodic
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
 */
SZN.Dom.getBoxPosition = function(obj){
	if(arguments[1]){
		return this._getInBoxPosition(obj,arguments[1])
	} else {
		return this._getBoxPosition(obj)
	}
}

/**
 * @private
 * @method vypocitava pozici elementu obj vuci elementu refBox
 * @param {object} obj HTML elmenet, jehoz pozici chci zjistit
 * @param {object} refBox element vuci kteremu budeme polohu zjistovat musi byt rodic <em>obj</em>
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
 */    
SZN.Dom._getInBoxPosition = function(obj,refBox){
	var top = 0;
	var left = 0;
	do {
		top += obj.offsetTop;
		left += obj.offsetLeft;
		obj = obj.offsetParent;
	} while	(obj.offsetParent != refBox);
	return {top:top,left:left};
}

/**
 * @private
 * @method vypocitava pozici elementu obj vuci elementu refBox
 * @param {object}  obj HTML elmenet, jehoz pozici chci zjistit
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
 */ 
SZN.Dom._getBoxPosition = function(obj){
	var top = 0;
	var left = 0;
	while (obj.offsetParent){
		top += obj.offsetTop;
		left += obj.offsetLeft;
		obj = obj.offsetParent;	
	} 	
	return {top:top,left:left};
}

/**
 * @method vraci aktualni ooskrolovani stranky 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>x</em>(px) - horizontalni odskrolovani</li><li><em>y</em>(px) - vertikalni odskrolovani</li></ul> 
 *
 */
SZN.Dom.getScrollPos = function(){
	if (document.documentElement.scrollTop || document.documentElement.scrollLeft) {
		var ox = document.documentElement.scrollLeft;
		var oy = document.documentElement.scrollTop;
	} else if (document.body.scrollTop) { 
		var ox = document.body.scrollLeft;
		var oy = document.body.scrollTop;
	} else {
		var ox = 0;
		var oy = 0;
	}
	return {x:ox,y:oy};
}


/**
 * @method skryva elementy ktere se mohou objevit v nejvyssi vrstve a prekryt obsah,
 * resp. nelze je prekryt dalsim obsahem (typicky &lt;SELECT&gt; v internet exploreru) 
 * @param {object | string} HTML element nebo jeho ID pod kterym chceme skryvat problematicke prvky
 * @param {array} pole obsahujici nazvy problematickych elementu
 * @param {string} kce kterou chceme provest 'hide' pro skryti 'show' nebo cokoli jineho nez hide pro zobrazeni
 * @examples 
 *  <pre>
 * SZN.elementsHider(SZN.gEl('test'),['select'],'hide')
 * SZN.elementsHider(SZN.gEl('test'),['select'],'show')
 *</pre>   									
 *
 */     
SZN.Dom.elementsHider = function (obj, elements, action) {
	var elems = elements;
	if (!elems) { elems = ["select","object","embed","iframe"]; }
	if (action == 'hide') {
		if(typeof obj == 'string'){
			var obj = SZN.gEl(obj);
		} else {
			var obj = obj;
		}
		
		var box = this.getBoxPosition(obj);
		
		box.width =  obj.offsetWidth + box.left;
		box.height = obj.offsetHeight +box.top;	
	
		for (var e = 0; e < elems.length; ++e) {
			var elm = document.getElementsByTagName(elems[e]);
			
			for (var f = 0; f < elm.length; ++f) {
				var node = this.getBoxPosition(elm[f]);
				node.width = elm[f].offsetWidth + node.left;
				node.height = elm[f].offsetHeight + node.top;
				
				if (!((box.left> node.width) || (box.width < node.left) 
				|| (box.top > node.height) || (box.height < node.top))) {
					elm[f].style.visibility = 'hidden';
					elm[f].myPropertyHide = true;
				}
			}
		}
	} else {
		for (var e = 0; e < elems.length; ++e) {
			var elm = document.getElementsByTagName(elems[e]);
			
			for (var f = 0; f < elm.length; ++f) {
				if (typeof elm[f].myPropertyHide != 'undefined') {
					elm[f].style.visibility = 'visible';
				}
			}
		}
	}
}

/**
 * @method vrati kolekci elementu ktere maji nadefinovanou tridu <em>searchClass</em>
 * @param {string} searchClass vyhledavana trida
 * @param {object} node element dokumentu ve kterem se ma hledat, je-li null prohledava
 * se cely dokument 
 * @param {string} tag nazev tagu na ktery se ma hledani omezit, je-li null prohledavaji se vsechny elementy
 * @returns {array} pole ktere obsahuje vsechny nalezene elementy, ktere maji definovanou tridu <em>searchClass</em>
 */      
SZN.Dom.getElementsByClass = function (searchClass,node,tag) {
	var classElements = new Array();
	if ( node == null ) {
		node = document;
	}
	if ( tag == null ) {
		tag = '*';
	}
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
