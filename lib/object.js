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
SZN.ObjCopy = SZN.ClassMaker.makeClass({
	NAME: "ObjCopy",
	VERSION: "1.0",
	CLASS: "class"
});

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
SZN.ObjLib = SZN.ClassMaker.makeClass({
	NAME: "ObjLib",
	VERSION: "1.0",
	CLASS: "class",
	EXTEND:"SZN.ObjCopy"
});

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
