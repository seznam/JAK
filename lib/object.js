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
 * @version 1.2
 * @author jelc,zara
 */ 


/**
 * @name SZN.ObjLib
 * @class třída provádí operace s objekty jako je jejich porovnávaní a serializace a deserializace
 * dědí z třídy ObjCopy, takže umí i kopírovat, dědí též všechna omezení svého rodiče
 * (maximalní hloubka zanoření, umí pracovat pouze s datovými objekty) 
 */    
SZN.ObjLib = SZN.ClassMaker.makeClass({
	NAME: "ObjLib",
	VERSION: "1.2",
	CLASS: "class"
});

SZN.ObjLib.prototype.DEEP = 200;

/**
 * implicitní konstruktor, 
 * @method 
 */ 
SZN.ObjLib.prototype.$constructor = function(){
	this.deep = this.DEEP;
	this.setUndefinedHandler();
};
/**
 * implicitni destruktor, zatím se nepoužívá
 * @method 
 */ 
SZN.ObjLib.prototype.$destructor = function(){

};

/**
* Nastaví maximální hloubku rekurze, než dojde k vyvolání výjimky:
* <em>'Serialize: structure is so deep.'</em>. Pokud je hloubka nastavena
* na 0 hloubka rekurze se nekontroluje. Kontroluje ji pouze nativne interpret.
* @method
* @param {number} num požadovaná maximální hloubka zanoření
*/
SZN.ObjLib.prototype.setDeep = function(num){
	this.deep = num;
};

/**
* Vrací nastavenou maximální hloubku rekurze
* @method
* @returns {number}
*/
SZN.ObjLib.prototype.getDeep = function(){
	return this.deep;
};

/**
* metoda nastavuje chování pokud je hodnota proměné <em>undefined</em>.
* Jako parametr očekává string s těmito hodnotami:<br>
* <em>throw</em> - vyvolá výjimku
* <em>nothing</em> - zkopíruje hodnotu<br />
* pokud bude zadán jiný vstup použije se "throw"
* @method
* @param {string} [handleType] řetězec definující požadovanou funkcionalitu
*/
SZN.ObjLib.prototype.setUndefinedHandler = function(handleType){
	var types = {
		"throw" : 1, 
		"nothing" : 1,
		"def" : "throw"
	};
	
	this.undefHandler = types[handleType] ? handleType : types['def'];
};


/**
* vrací nastavení chování při zpracacování proměné jejíž hodnota je <em>undefined</em>
* @method
* @returns {string} který může nabývat hodnot throw,value nebo nothing
*/
SZN.ObjLib.prototype.getUndefinedHandler = function(){
	return this.undefHandler;
};

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

	var mySelf = this;
	var output = '';
	var firstStep = true;
	var cache = [];
	var mySource = function(obj){
		
		
		if(mySelf.deep && (mySelf.deep < deepFlag)){
			throw new Error('Serialize: structure is so deep.');
		}
		
		if(cache.indexOf(obj) != -1){
			throw new Error("serialize: Circular reference encountered");
			return null;					
		}
		
		if(typeof arguments[1] != 'undefined'){
			var propName = arguments[1];
		} else {
			var propName = false
		}
		
		if(!(obj instanceof Object)){
			switch(typeof obj){
				case 'string':
					return '\'' + mySelf._formatString(obj) + '\'';
					break;
				case 'undefined':
					switch(mySelf.undefHandler){
						case 'nothing':
							return obj;
							break;
						default:
							throw new Error('serialize: property ' + (propName ? propName :'obj') + ' is not defined!!')
							break;
					}
					break;
				default:
					return obj;
					break;
			}

		} else {
			cache.push(obj);
			var buildIn = mySelf._buildInObjectSerialize(obj);
			if(buildIn.isSet){
				return buildIn.output;
			} else {
				if(typeof obj == 'function()'){
					throw new Error('Serialize: can\'t serialize object with some method - ** ' + (propName ? 'obj' : propName) +' **');
				}
				var output = startString;
				deepFlag++
				for(var i in obj){
					
					for(var j in obj[i]){
						if(j) {
							var isEmpty = false;
							break;
						}						
					}
					
					var propName = mySelf._formatString(i);
					output += '\'' + propName  + '\'' + propertySep + (isEmpty ? '{}' : mySource(obj[i],i)) + propertyEnd;
				}
				/* odstranim posledni carku je-li */
				var charNum = (output.lastIndexOf(',') >= 0) ? output.lastIndexOf(',') : output.length;
				output = output.substring(0,charNum);
				deepFlag--;
				return output +  endString;				
			}

		}
		
	};
	
	
	var source = mySource(objToSource);
	if(showFlag){
		return this.pretty(source,showFlag)
	} else {
		return source;
	}
};

/**
 * převedení pole na řetězc, který odpovídé literálové formě zápisu pole
 * @method 
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
				if(typeof field[i] == 'function' && !(field[i] instanceof RegExp)){
						throw new Error('Serialize: can\'t serialize Function');
				}
				if((typeof field[i] != 'object') && ((typeof field[i] != 'function'))){
					if(typeof field[i] == 'string'){
						var str = mySelf._formatString(field[i]);
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
 * porovnává dva objekty zda jsou datově shodné, nejdříve porovná velikosti serializovaných objektů
 * a pokud jsou shodné porovná prvni s druhým a druhý s prvním
 * @method  
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
 * porovnává první matchObj s refObj po vlastnostech
 * @private
 * @method  
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
				if((typeof obj1[i] != 'object') && (typeof obj1[i] != 'function')){
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
 * porovnává nativní javascriptové objekty, zda jsou obsahově shodné
 * @private
 * @method 
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
 * převádí na řetězec nativní objekty javascriptu, případně pole
 * @private
 * @method 
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
		output = this.arraySerialize(testedObj);
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
 * @returns {boolean} true = ane, false = ne 
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
* že se předný objekt serializuje a výsledný string se unserializuje
* @method
* @param {object} objToCopy kopírovaný objekt
* @returns {object}
*/
SZN.ObjLib.prototype.copy = function(objToCopy){
	var str = this.serialize(objToCopy);
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
 * @throws {error} 'ObjCopy.arrayCopy: Attribute is not Array' pokud argument metody není pole
 */   
SZN.ObjLib.prototype.arrayCopy = function(arrayToCopy){
	if(field instanceof Array){
		var out =  this.arraySerialize(arrayToCopy);
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
	VERSION: "1.1",
	CLASS: "class",
	EXTEND: SZN.ObjLib
});

SZN.ObjCopy.prototype.$constructor = function(){
	this.callSuper('$constructor',arguments.callee)();
}
