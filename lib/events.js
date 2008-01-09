/**
 * @overview Zpracovavaní udalostí a časovačů
 * @version 2.0
 * @author jelc, zara
 */   

/**
 * @class třída pro práci s událostmi a časovači
 * @name SZN.Events
 * @static
 */   
SZN.Events = SZN.ClassMaker.makeClass({
	NAME: "Events",
	VERSION: "2.0",
	CLASS: "static"
});

SZN.Events.eventFolder = new Object();

/**
 * @method destruktor, odvěsí všechny handlované události a jejich posluchače a
 * zruší se 
 */   
SZN.Events.destructor = function() {
	this.removeAllListeners();
	this.sConstructor.destroy(this);
}

/**
 * @method vraci událost, která je právě zpracovávána
 * @deprecated
 *
 */  
SZN.Events.getEvent = function(e){
	return e || window.event;
}

/**
 * @method vraci cíl události
 *
 */  
SZN.Events.getTarget = function(e){
	var e = e || window.event;
	return e.target || e.srcElement; 
}

/**
 * @method zavěšuje posluchače na danou událost, vytváří a ukládá si anonymní funkci
 * která provede vlastní volání registroveného posluchače tak aby se provedl ve správném
 * oboru platnost. (this uvnitř posluchače se bude vztahovat k objektu jehož je naslouchající funkce metodou  
 * a jako parametry se jí předá odkaz na událost, která byla zachycena a element, na kterém se naslouchalo.
 * @param {object} elm element, který událost zachytává
 * @param {string} eType typ události bez předpony "on"
 * @param {object} obj objekt ve kterém se bude událost zachytávat, pokud je volána
 * globalní funkce musí byt 'window' případně 'document' 
 * @param {function | string} func funkce, která se bude provádět jako posluchač
 * <em>string</em> pokud jde o metodu <em>obj</em> nebo reference na funkci, která se zavolá
 * jako metoda <em>obj</em>  
 * @param {boolean} capture hodnata použitá jako argument capture pro DOM zachytávání
 * pro IE je ignorována 
 * @param {boolean} cached určuje, zda se má událost ukládat do <em>eventFolder</em> 
 * pro pozdější odvěšení. Pokud ano, pak addEventListener vrací jednoznačné ID, pod kterým je možno událost odvěsit.
 * @returns {string} identifikátor handleru v  <em>eventFolder</em> prostřednictvím, kterého se
 * událost odvěšuje, pokud je <em>cached</em> vyhodnoceno jako true
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
 * @method vlastní zavěšení posluchače bud DOM kompatibilně, nebo přes attachEvent
 * pro IE 
 * @param {object} elm element, který událost zachytává
 * @param {string} eType typ události bez předpony "on"
 * @param {func} func funkce/metoda která se bude provádět
 * @param {boolean} capture hodnota použitá jako argument capture pro DOM zachytávání
 * @returns {array} obsahující argumenty funkce ve shodném pořadí 
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
 * @method Vytváří funkci/metodu, která bude fungovat jako posluchač události tak
 * aby předaná metoda byla zpracovávána ve správnem oboru platnosti, this bude
 * objekt který ma naslouchat, požadované metodě předává objekt události a element na
 * kterém se naslouchalo
 * @param {object} obj objekt v jehož oboru platnosti se vykoná <em>func</em> po zachycení události
 * @param {function} func funkce/metoda, u které chceme aby use dálost zpracovávala
 * @param {object} elm Element na kterém se poslouchá
 * @returns {function} anonymní funkce, která zprostředkuje zpracování události
 * požadované metodě 
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
 * @method ukladá údaje o zavěšeném posluchači do <em>eventFolder</em> pro použití
 * při odvěšování a vrací identifikator uložených údajů
 * @param {array} data vrácená metodou <em>_addListener</em>
 * @returns {string} id identifikátor dat v <em>eventFolder</em>
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
