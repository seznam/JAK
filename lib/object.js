/**
 * @overview Nastroje pro práci s objekty kopírování, serializace, porovnání
 * @version 1.0
 * @author :jelc
 */     


/**
 * @name SZN.ObjCopy
 * @class třída která umožňuje vytvářet hluboké kopie objektů v případě, že je hloubka
 * objektu konečná a menší než hloubka určená konstantou DEEP, objekty, které se odvolávají sami na sebe
 * nelze kopírovat (cyklická reference), kopírovat lze pouze objekty, které obsahují
 * data a nikoli metody   
 */   
SZN.ObjCopy = SZN.ClassMaker.makeClass({
	NAME: "ObjCopy",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * @field {number} <strong>konstanta</strong> maximální povolená hloubka objektu
*/
SZN.ObjCopy.prototype.DEEP = 200;

/**
 * @method implicitni konstruktor, zatím se nepoužívá
 */ 
SZN.ObjCopy.prototype.ObjCopy = function(){

};
/**
 * @method destruktor, zatím se nepoužívá
 */ 
SZN.ObjCopy.prototype.destructor = function(){

};

/**
 * @method kopíruje objekt (vytváří a vrací hlubokou datově a typově shodnou kopii svého argumentu) 
 * @param {object} objToCopy objekt ke kopírování
 * @returns {object} kopie argumentu metody
 * @throws {error}  'ObjCopy error: property is function' pokud narazí na vlastnost, která je funkcí
 * @throws {error}  'ObjCopy structure so deep' pokud je struktura objektu hlubší než DEEP zanoření
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
 * @method kopíruje pole, vytváří datově a typově shodnou kopii pole, které dostane, jako argument
 * @param {array} arrayToCopy pole ke zkopírování
 * @returns {array} kopie pole arrayToCopy
 * @theows {error} 'ObjCopy.arrayCopy: Attribute is not Array' pokud argument metody není pole
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
 * @method testuje zda je předaný objekt instance některé z nativních tříd javascriptu
 * (String,Number,Array,Boolean,Date,RegExp) a vytváří jejich typově shodnou kopii 
 * @param {any} proměná ke zkopírování
 * @returns {object} s vlastnostmi:
 * <ul>
 * <li>isSet <em>{boolean} určuje zda byl předaný objekt zkopírován</em></li>
 * <li>output <em>{object}</em> zkopírovaný argument metody, pokud to bylo možné, jinak null</li>   
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
 * @name SZN.ObjLib
 * @class třída provádí operace s objekty jako je jejich porovnávaní a serializace a deserializace
 * dědí z třídy ObjCopy, takže umí i kopírovat, dědí též všechna omezení svého rodiče
 * (maximalní hloubka zanoření, umí pracovat pouze s datovými objekty) 
 * @extend SZN.ObjCopy  
 */    
SZN.ObjLib = SZN.ClassMaker.makeClass({
	NAME: "ObjLib",
	VERSION: "1.0",
	CLASS: "class",
	EXTEND:"SZN.ObjCopy"
});

/**
 * @method implicitní konstruktor, zatím se nepoužívá
 */ 
SZN.ObjLib.prototype.ObjLib = function(){

};
/**
 * @method implicitni konstruktor, zatím se nepoužívá
 */ 
SZN.ObjLib.prototype.destructor = function(){

};

/**
 * @method převádí objekt na řetězec obsahující literalovou formu zapisu objektu (JSON)
 * případně ho převádí do lidsky čitelné podoby (nelze pak unserializovat) 
 * @param {object} objToSource objekt, který chceme serializovat
 * @param {string} showFlag řetězec, který použijeme pro vizualní odsazování
 * pokud je argument zadán, lze výstup zobrazit, ale nelze ho zpětně převést na object
 * @returns {string} řetězcová reprezantace objektu  
 * @throws {error}  'Serialize error: property is function' pokud narazí na vlastnost, která je funkcí
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
 * @method převedení pole na řetězc, který odpovídé literálové formě zápisu pole
 * @param {array} fieldToSerialize pole určené k převedení
 * @returns literalový zápis pole
 * @throws {error} 'Serialize: can\'t serialize Function' prvek pole je funkce
 * @throws {error}  'arraySerialize: Attribute is not Array' argument metody není pole
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
 * @method převede řetězec obsahující literálovou formu zápisu pole nebo objektu
 * na pole nebo objekt 
 * @param {string} serializedString řetězec k převedení
 * @returns {object} vytvořený ze vstupního řetězce 
 */    
SZN.ObjLib.prototype.unserialize = function(serializedString){
	eval('var newVar=' + serializedString);
	return newVar;
}

/**
 * @method porovnává dva objekty zda jsou datově shodné, nejdříve porovná velikosti serializovaných objektů
 * a pokud jsou shodné porovná prvni s druhým a druhý s prvním 
 * @param {object} refObj objekt, s kterým porovnáváme
 * @param {object} matchObj objekt, který porovnáváme
 * @returns true = jsou shodné, false = nejsou shodné
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
 * @method porovnává první matchObj s refObj po vlastnostech 
 * @param {object} refObj objekt, s kterým porovnáváme
 * @param {object} matchObj objekt, který porovnáváme
 * @returns {boolean} true refObj má všchny vlastnosti matchObj; false nemá
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
 * @method porovnává nativní javascriptové objekty, zda jsou obsahově shodné
 * @param {object} refObj objekt s kterým porovnáváme
 * @param {object} matchObj objekt který porovnáváme
 * @returns {object} s vlastnostmi:
 * <ul>
 * <li>isSet <em>{boolean}</em> určuje zda byl předaný objektem</li>
 * <li>success <em>{object}</em> true v případě shody, jinak false</li>   
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
 * @method převádí na řetězec nativní objekty javascriptu, případně pole
 * @param {object} objekt k převedení na řetězec
 * <ul>
 * <li>isSet <em>{boolean} určuje zda byl předaný objekt serializován</em></li>
 * <li>output <em>{object}</em> serializovaný argument metody, pokud to bylo možné, jinak null</li>   
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
 * @method pro lidsky čitelný výstup serializovaného objektu přičítá oddělovací znak k oddělovači
 * @param {string} modString aktuálně používaný oddělovač
 * @param {string} counter  jeden stupeň oddělovače
 * @returns {string} modstring + counter
 */   
SZN.ObjLib.prototype._charUp = function(modString,counter){
	return modString + counter;
};
/**
 * @private
 * @method pro lidsky čitelný výstup serializovaného objkektu odebírá oddělovací znak z oddelovače
 * @param {string} modString aktualně používaný oddělovač
 * @param {string} counter  jeden stupeň oddělovače
 * @returns {string} modstring + counter
 */  
SZN.ObjLib.prototype._charDown = function(modString){
	return modString.substring(0,modString.length-1);
};
/**
 * @private
 * @method testuje zda je používaný prohlížeč Internet Explorer, pro potřeby lidsky čitelného formátování serializace
 * @returns {boolean} true = ane, false = ne 
 */  
SZN.ObjLib.prototype._isIE = function(){
	if(document.all && document.attachEvent && !window.opera){
		return true;
	}
	return false;
};
