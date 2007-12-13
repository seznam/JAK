/**
 * @overview Zpracovavani udalosti a casovacu
 * @version 2.0
 * @author jelc, zara
 */   

/**
 * @class trida pro praci s udalostmi a casovaci
 * @static
 */   
SZN.Events = SZN.ClassMaker.makeClass({
	NAME: "Events",
	VERSION: "2.0",
	CLASS: "static"
});

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
