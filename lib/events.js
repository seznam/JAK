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
 * @overview Třída sloužící ke zpracovavaní udalostí a časovačů poskytovaných DOM modelem.
 * @version 2.0
 * @author jelc, zara
 */   

/**
 * Statický konstruktor, nemá smysl vytvářet jeho instance.
 * @namespace
 */   
SZN.Events = SZN.ClassMaker.makeClass({
	NAME: "Events",
	VERSION: "2.0",
	CLASS: "static"
});

/**
 * do této vlastnosti ukládáme všechny události pro odvěšení
 * @private 
 */ 
SZN.Events.eventFolder = new Object();

/**
 * vnitřní proměnné pro onDomRady()
 * @private 
 */ 
SZN.Events._domReadyTimer = null;
SZN.Events._domReadyCallback = [];   //zasobnik s objekty a jejich metodami, ktere chci zavolat po nastoleni udalosti
SZN.Events._domReadyAlreadyRun = false;/*ondomready je odchytavano specificky pro ruzne browsery a na konci je window.onload, tak aby se nespustilo 2x*/
SZN.Events._windowLoadListenerId = ''; /*v nekterych prohlizecich pouzivame listener, pro jeho odveseni sem schovavam jeho id*/

/**
 * metoda kterou použijeme, pokud chceme navěsit vlastní kód na událost, kdy je DOM strom připraven k použití.
 * Je možné navěsit libovolný počet volaných funkcí.   
 * @method 
 * @param {object} obj objekt ve kterém se bude událost zachytávat, pokud je volána
 * globalní funkce musí byt 'window' případně 'document' 
 * @param {function | string} func funkce, která se bude provádět jako posluchač  
 */ 
SZN.Events.onDomReady = function(obj, func) {
	SZN.Events._domReadyCallback[SZN.Events._domReadyCallback.length] = {obj: obj, func: func}
	SZN.Events._onDomReady();
}

/**
 * vnitrni metoda volana z onDomReady, dulezite kvuli volani bez parametru pro IE, abychom v tom timeoutu mohli volat sama sebe
 * @private
 * @method 
 */ 
SZN.Events._onDomReady = function() {
	if((/Safari/i.test(navigator.userAgent)) || (/WebKit|Khtml/i.test(navigator.userAgent))){ //safari, konqueror
		SZN.Events._domReadyTimer=setInterval(function(){
			if(/loaded|complete/.test(document.readyState)){
			    clearInterval(SZN.Events._domReadyTimer);
			    SZN.Events._domReady(); // zavolani cilove metody
			}}, 10);//alert('safari/konq');
	} else if (document.all && !window.opera){ //IE
		try {
			// Diego Perini trik bez document.write, vice viz http://javascript.nwbox.com/IEContentLoaded/
			document.documentElement.doScroll("left"); //test moznosti scrolovat, scrolovani jde dle msdn az po content load
		} catch( error ) {
			setTimeout( arguments.callee, 1 ); //nejde, tak volam sama sebe
			return;
		}
		// uz to proslo
		SZN.Events._domReady(); // zavolani cilove metody
		//alert('ie');
	} else 	if (document.addEventListener) { //FF, opera
		//SZN.Events._domReadyAlreadyRun = true;
  		document.addEventListener("DOMContentLoaded", SZN.Events._domReady, false); //FF, Opera ma specifickou udalost 
		//alert('ff/op');
  	}
  	
  	//pokud nic z toho tak dame jeste onload alespon :-)
  	SZN.Events._windowLoadListenerId = SZN.Events.addListener(window, 'load', window, function(){/*alert('onload');*/ SZN.Events._domReady();}, false, true);
}

/**
 * metoda, která je volána z SZN.Events.onDomReady když je dom READY, tato metoda volá 
 * na předaném objektu funkci která byla zadaná 
 * @private
 * @method 
 */ 
SZN.Events._domReady = function () {
	//zaruceni ze se to spusti jen jednou, tedy tehdy kdyz je _domReadyAlreadyRun=false
	if (!SZN.Events._domReadyAlreadyRun) {
		//metoda byla opravdu zavolana
		SZN.Events._domReadyAlreadyRun = true;
	
		//pro FF, operu odvesim udalost
		if (document.addEventListener) {
			document.removeEventListener("DOMContentLoaded", SZN.Events._domReady, true);
		}
		//odveseni udalosti window.onload
		SZN.Events.removeListener(SZN.Events._windowLoadListenerId);
		
		//vlastni volani metody objektu
		for(var i=0; i < SZN.Events._domReadyCallback.length; i++) {
			var callback =  SZN.Events._domReadyCallback[i];
			if (typeof callback.func == 'string') {
				callback.obj[callback.func]();
			} else {
				callback.func.apply(callback.obj, []);
			}
		}
		//cisteni, uz nechceme zadny odkazy na objekty a funkce
		SZN.Events._domReadyCallback = [];
	}
	
}


/**
 * destruktor, odvěsí všechny handlované události a jejich posluchače a zruší se.
 * @method  
 */   
SZN.Events.destructor = function() {
	this.removeAllListeners();
	this.sConstructor.destroy(this);
}

/**
 * vraci událost, která je právě zpracovávána.
 * @method 
 * @deprecated
 * @param {object} e událost  
 */  
SZN.Events.getEvent = function(e){
	return e || window.event;
}

/**
 * vrací cíl události, tedy na kterém DOM elementu byla vyvolána.
 * @method 
 * @param {object} e událost 
 */  
SZN.Events.getTarget = function(e){
	var e = e || window.event;
	return e.target || e.srcElement; 
}

/**
 * zavěšuje posluchače na danou událost, vytváří a ukládá si anonymní funkci
 * která provede vlastní volání registroveného posluchače tak aby se provedl ve správném
 * oboru platnost. (this uvnitř posluchače se bude vztahovat k objektu jehož je naslouchající funkce metodou  
 * a jako parametry se jí předá odkaz na událost, která byla zachycena a element, na kterém se naslouchalo.
 * @method 
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
 * vlastní zavěšení posluchače bud DOM kompatibilně, nebo přes attachEvent
 * pro IE 
 * @private
 * @method 
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
 * Vytváří funkci/metodu, která bude fungovat jako posluchač události tak
 * aby předaná metoda byla zpracovávána ve správnem oboru platnosti, this bude
 * objekt který ma naslouchat, požadované metodě předává objekt události a element na
 * kterém se naslouchalo
 * @private
 * @method 
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
 * ukladá údaje o zavěšeném posluchači do <em>eventFolder</em> pro použití
 * při odvěšování a vrací identifikator uložených údajů
 * @private
 * @method 
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
 * odebírání posluchačů události, buď zadáním stejných údajů jako při handlování
 * (nedoporučeno) nebo zadáním <em>id (cached)</em>, které vrací medoda <em>addListener</em> <br />
 * a) pokud je zadán jen jeden argument, je považován za hodnotu <em>id (chached)</em><br />
 * b) pokud je zadáno všech šest argumentů použije se jen hodnota chached je-li string<br />
 * c) jinak se zkusi standardní odvěšení, které nebude fungovat pokud zavěšení proběhlo s <em>chached</em> nastaveným na true  
 *  
 * @method 
 * @param {object} elm elemnet na kterém se poslouchalo
 * @param {string} eType událost která se zachytávala
 * @param {object} obj objekt v jehož oboru platnosti se zachycená událost zpracovala
 * @param {function | string} func funkce/metoda která událost zpracovávala
 * @param {boolean} capture hodnota capture pro DOM odvěšování
 * @param {string} cached id pod kterým jsou uložena data k odvěšení v <em>eventFolder</em>
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
 * provádí skutečné odvěšení posluchačů DOM kompatibilně či pro IE
 * @private
 * @method 
 * @param {object} elm element na kterém se naslouchalo
 * @param {string} eType událost, která se zachytávala
 * @param {function} func skutečná funkce, která zpracovávala událost
 * @param  {boolean} capture pro DOM zpracovávání stejna hodota jako při zavěšování
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
 * volá odvěšení na základě vlastností uložených v <em>eventFolder</em>
 * @private
 * @method 
 * @param {string} cached id pod kterým jsou data o posluchači uložena
 * @returns {number} 0 v případě úspěchu, 1 v případě neůspěchu
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
 * provede odvěšení všech posluchačů, kteří jsou uloženi v <em>eventFolder</em>
 * @method 
 */   
SZN.Events.removeAllListeners = function(){
	for(var p in this.eventFolder){
		this._removeById(p);
	}
}

/**
 * zastaví probublávaní události stromem dokumentu
 * @method 
 * @param {object} e zpracovávaná událost 
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
 * zruší výchozí akce (definované klientem) pro danou událost (např. prokliknutí odkazu)
 * @method 
 * @param {object} e zpracovávaná událost 
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
 * provádí transformaci předané metody tak aby se zavolala v kontextu objektu <em>owner</em>
 * při použití v intervalu nebo timeoutu, v oboru platnosti <em>owner</em> vytvoří funkci, která provede
 * volání <em>exeFunc</em> v oboru platnosti <em>owner</em>. Vlastně to samé jako SZN.bind().
 * @method  
 * @param {object} owner objekt v jehož oboru platnosti se bude vykonávat funkce/metoda exeFunc v časovači
 * @param {string} handleFuncName název vlastnosti objektu <em>owner</em>, která se bude spouštět v časovači
 * @param {function} exeFunc funkce/metoda, kterou chceme provádět
 * @param {function} exeObj objekt, nad kterym chceme provádět metodu <em>execFunc</em>, není-li zadán je prováděna v kontextu <em>owner</em> 
 */     
SZN.Events.addTimeFunction = function(owner,handleFuncName,exeFunc,exeObj){
	if(!!exeObj){
		owner[handleFuncName] = function(){return exeFunc.apply(exeObj,[])};
	} else {
		owner[handleFuncName] = function(){return exeFunc.apply(owner,[])};
	}
}
