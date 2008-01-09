/**
 * @overview deklarace "jmenneho prostoru"
 * @version 1.0
 * @author jelc 
 */ 

/**
 * @namespace
 * @name SZN
 * @static {Object} SZN staticky objekt, ktery se pouziva pro "zapouzdreni"
 * 					vsech definic a deklaraci<br> v podmince se naleza pro
 * 					jistotu a pro to ze muze byt definovan jeste pred svou
 * 					deklaraci pri pouziti slovniku a konfiguraci   
*/
if(typeof SZN != 'object'){
	var SZN = {};
};

/**
 * @static
 * @method 	vytvoreni funkce ktera vola funkci ve svem argumentu "fnc" jako metodu 
 * objektu z argumentu "obj" a vraci takto modifikovanou funkci.
 * <br> Zavisi na ni nektere dalsi knihovni tridy
 * 
*/
SZN.bind = function(obj,fnc){
	return function() {
		return fnc.apply(obj,arguments);
	}
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
/**
 * @overview Zpracovavani udalosti a casovacu
 * @version 2.0
 * @author jelc, zara
 */   

/**
 * @class trida pro praci s udalostmi a casovaci
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
 * pro pozdejsi odveseni. Pokud ano, pak addEventListener vraci jednoznacne ID, pod kterym je mozno udalost odvesit.
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
 * @overview detekce prohlizece
 * @version 2.0
 * @author : jelc, zara
 */   


/**
 * @static
 * @name SZN.Browser
 * @class Detekce klientskeho prostredi v zavislosti na vlastnostech javascriptu
 * (pokud je to mozne jinak dle vlastnosti navigator.userAgent)
 *
 */
SZN.Browser = SZN.ClassMaker.makeClass({
	NAME: "Browser",
	VERSION: "2.0",
	CLASS: "static"
});

/** @field {string} platform system uzivatele */
SZN.Browser.platform = '';
/** @field {string} client prohlizec uzivatele */
SZN.Browser.client = '';
/** @ignore */
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
	var middle;
	if ((SZN.Browser.client == 'ie') || (SZN.Browser.client == 'konqueror')){
		left = 1;
		middle = 4;
		right = 2;
	} else if((SZN.Browser.client == 'opera') && (SZN.Browser.version > 7) && (SZN.Browser.version < 9)) {
		left = 1;
		middle = 4;
		right = 2;
	} else if (SZN.Browser.client == 'safari'){
		if(parseInt(SZN.Browser.version) > 2){
			left = 0;
			middle = 0;
			right = 2;
		} else {
			left = 1;
			middle = 1;
			right = 2;
		}
	} else {
		left = 0;
		middle = 1;
		right = 2;
	}
	
	return {left:left,right:right, middle:middle};	
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
	var fncName = '_get_' + this.client + '_ver';
	
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
		if(typeof Object.__defineGetter__ == 'function'){
			return '9.5';
		} else {
			return '9';
		}
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
	this.client = this._getKlient();
	this.klient = this.client;
	this.version = this._getVersion();
	this.mouse = this._getMouse();
};
SZN.Browser._getBrowser();
/**
 * @overview rozhrani urcene pro vytvareni hierarchie objektu na zaklade "komponent"
 * "registraci" volani metod objektu z jinych objektu pod jinymi jmeny a volani
 * destruktoru. Rozhrani  
 * @version 1.0
 * @author jelc, wendigo
 */ 
    
/**
 * @class trida pro dedeni rozhrani "Components", neni urcena k vytvareni
 * vlastnich instanci 
 */
SZN.Components = function(){}

SZN.Components.Name = 'Components';
SZN.Components.version = '1.0';

SZN.Components.prototype.CLASS = 'class';


/**
 * @method zjistuje zda ma dana trida definovane komponenty
 * @returns {boolean} <em>true</em> pokud ma komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.hasComponents = function(){
	if(this.components instanceof Array){
		return true;
	} else { 
		return false;
	}
};

/**
 * @method prida vsechny komponenty uvedene v poli <em>componets</em> dane tridy
 * @returns {boolean} <em>true</em> pokud ma komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.addAllComponents = function(){
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length;i++){
		this._addComponent(this.components[i]);
	}
	return true;
};


/**
 * @method prida novou komponentu za behu programu
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na tridu, ktera je komponentou</li>
 * <li>name <em>{string}</em> nazev podk kterym se ma komponenta vytvotit jako vlastnost objektu</li>
 * </ul>   
 */   
SZN.Components.prototype.addNewComponent = function(component){
	if(!this.hasComponents()){
		this.components = new Array();
	}
	this.components.push(component);
	this._addComponent(component);
};

/* pridava jednotlive komponenty z pole */
/**
 * @private
 * @method pridava jednotlive komponenty, pokud komponenta nema definouvanou vlastnost "name", vytvori ji z nazvu konstruktoru 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na tridu, ktera je komponentou</li>
 * <li>name <em>{string}</em> nazev pod kterym se ma komponenta vytvotit jako vlastnost objektu</li>
 * </ul>   
 *
 */    
SZN.Components.prototype._addComponent = function(component){
	if(typeof component.part != 'undefined'){
		if(typeof component.name == 'undefined'){
			component.name = component.part.Name.substring(0,1).toLowerCase();
			component.name += component.part.Name.substring(1);
		} 
		if(typeof component.setting != 'undefined'){
			this[component.name] = new component.part(this,component.name,component.setting);
		} else {
			this[component.name] = new component.part(this,component.name);
		}
	}
};

/* obsahuje registraci 'public' komponent v instanci tridy definovane
*  argumentem owner
*/
/**
 * @method vytvari volani vlastnich metod z objektu, ktery je definovan argumentem owner
 * tak ze cte vlastnost <em>'access'</em> svych metod, vlastost acces je string jehoz
 * prvni casti je specifikator pristupu (poviny) s hodnotou 'public' a za nim nesleduje mezerou
 * oddeleny nazev pod jakym se ma volani vytvorit, neni-li uveden pouzije se nazev vytvoreny
 * ze jmena objektu a metody    
 * @param {object} owner reference na objekt ve kterem se volani vytvori
 * @throws {error} 'registredComponent: component "' + components_name + '" already exist!'
 * pokud <em>owner</em> jiz takto definovanou vlastnost ma 
 */    
SZN.Components.prototype.registredMethod = function(owner){
	var field = [this,this.sConstructor];
	/* registrace verejnych metod */
	for(var i = 0; i < field.length; i++){
		var obj = field[i];
		for(var j in obj){
			/* to je tu kvuli startsim gecko prohlizecum */
			if(obj[j] === null) continue;
			if(typeof obj[j] == 'undefined') continue;
			if((typeof obj[j].access != 'undefined') && (obj[j].access.indexOf('public') == 0)){
				var nameFirstChar = j.substring(0,1).toUpperCase();
				var nameNext = j.substring(1);
				var mods = obj[j].access.replace(/[ ]{2,}/gi,' ').split(' ');			
				
				if(mods.length > 1){
					var name = mods[1];
				} else {
					var namePrefix = (obj == this.sConstructor) ? obj.Name : this._name;
					var name = namePrefix + nameFirstChar + nameNext;
				}
				
				if(typeof owner[name] == 'undefined'){
					owner[name] = (obj == this.sConstructor) ? this.sConstructor[j] : SZN.bind(this,this[j]);
				} else {
					throw new Error('registredComponent: component "' + name + '" already exist!')
				}
			}
		}
	}
};

/* vracim hlavni tridu */
/**
 * @method slouzi k nalezeni hlavniho objektu ktery vytvari danou cast programu
 * a ma definovanou vlastnost TOP_LEVEL 
 * @returns {object} refetrence na hlavni objekt
 * @throws {error}  'can\'t find TOP LEVEL Class' pokud neni nalezen hlavni objekt
 */     
SZN.Components.prototype.getMain = function(){
	var obj = this;
	while(typeof obj.TOP_LEVEL == 'undefined'){
		if(typeof obj._owner == 'undefined'){
			throw new Error('can\'t find TOP LEVEL Class');
		} else {
			obj = obj._owner;
		}
	}
	return obj;
};

/**
 * @method slouzi k postupnemu volani destruktoru vsech komponent
 */
SZN.Components.prototype.callChildDestructor = function(){
	this.inDestruction = true;
	if(!this.hasComponents()){
		return false;
	}
	for(var i = 0; i < this.components.length; i++){
		var cName = this.components[i].name;
		if(this[cName] == null) {
			continue;
		}
		if((typeof this[cName].CLASS != 'undefined') && (typeof this[cName].inDestruction != 'boolean')){
			var name = 'destructor';
			if((typeof this[cName][name] != 'undefined')
			&&(typeof this[cName][name] == 'function')){
				this[cName][name]();
			}
			this[cName] = null;
		} 
	}	
};
/**
 * @overview dom-related funkce
 * @version 3.0
 * @author zara, koko, jelc
 */

/**
 * @static
 * @name SZN.Dom
 * @class staticka trida posytujici nektere prakticke metody na upravy DOM stromu
 */
SZN.Dom = SZN.ClassMaker.makeClass({
	NAME: "Dom",
	VERSION: "3.1",
	CLASS: "static"
});

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
	var x = 0;
	var y = 0;		
	
	if(document.documentElement.clientWidth && SZN.Browser.klient != 'opera'){
		x = document.documentElement.clientWidth;
		y = document.documentElement.clientHeight;
	} else if(SZN.Browser.klient == 'opera') {
		if(parseFloat(SZN.Browser.version) < 9.5){
			x = document.body.clientWidth;
			y = document.body.clientHeight;
		} else {
			x = document.documentElement.clientWidth;
			y = document.documentElement.clientHeight;
		}
	} 
	
	if ((SZN.Browser.klient == 'safari') || (SZN.Browser.klient == 'konqueror')){
		y = window.innerHeight; 
	}
	
	return {width:x,height:y};
};

/**
 * @method vraci polohu "obj" ve strance nebo uvnitr objektu ktery predam jako druhy 
 * argument
 * @param {object} obj HTML elmenet, jehoz pozici chci zjistit
 * @param {object} [ref] <strong>volitelny</strong> HTML element, vuci kteremu chci zjistit pozici <em>obj</em>, element musi byt jeho rodic
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
 */
SZN.Dom.getBoxPosition = function(obj, ref){
	var top = 0;
	var left = 0;
	var refBox = ref || document.body;
	while (obj && obj != refBox) {
		top += obj.offsetTop;
		left += obj.offsetLeft;
		obj = obj.offsetParent;
	}
	return {top:top,left:left};
}

/*
	Par noticek k vypoctum odscrollovani:
	- rodic body je html (documentElement), rodic html je document
	- v strict mode ma scroll okna nastavene html
	- v quirks mode ma scroll okna nastavene body
	- opera dava vzdy do obou dvou
	- safari dava vzdy jen do body
*/

/**
 * @method vraci polohu "obj" v okne nebo uvnitr objektu ktery predam jako druhy 
 * argument, zahrnuje i potencialni odskrolovani kdekoliv nad objektem
 * @param {object} obj HTML elmenet, jehoz pozici chci zjistit
 * @param {object} <strong>volitelny</strong> HTML element, vuci kteremu chci zjistit pozici <em>obj</em>, element musi byt jeho rodic
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni pozice prvku</li><li><em>top</em>(px) - vertikalni pozice prvku</li></ul> 
 */
 SZN.Dom.getFullBoxPosition = function(obj, parent) {
	var pos = SZN.Dom.getBoxPosition(obj, parent);
	var scroll = SZN.Dom.getBoxScroll(obj, parent);
	return {left:pos.left-scroll.x,top:pos.top-scroll.y};
}

/**
 * @method vraci dvojici cisel, o kolik je "obj" odscrollovany vuci oknu nebo vuci zadanemu rodicovskemu objektu
 * @param {object} obj HTML elmenet, jehoz odskrolovani chci zjistit
 * @param {object} <strong>volitelny</strong> HTML element, vuci kteremu chci zjistit odskrolovani <em>obj</em>, element musi byt jeho rodic
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalni scroll prvku</li><li><em>top</em>(px) - vertikalni scroll prvku</li></ul> 
 */
SZN.Dom.getBoxScroll = function(obj, ref){
	var x = 0;
	var y = 0;
	var cur = obj.parentNode;
	var limit = ref || document.documentElement;
	while (1) {
		/* opera debil obcas nastavi scrollTop = offsetTop, aniz by bylo odscrollovano */
		if (SZN.Browser.client == "opera" && SZN.Dom.getStyle(cur,"display") != "block") { 
			cur = cur.parentNode;
			continue; 
		}
		
		/* a taky opera pocita scrollTop jak pro <body>, tak pro <html> */
		if (SZN.Browser.client == "opera" && cur == document.documentElement) { break; }

		x += cur.scrollLeft;
		y += cur.scrollTop;
		if (cur == limit) { break; }
		cur = cur.parentNode;
		if (!cur) { break; }
	}
	return {x:x,y:y};
}

/**
 * @method vraci aktualni odskrolovani stranky 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>x</em>(px) - horizontalni odskrolovani</li><li><em>y</em>(px) - vertikalni odskrolovani</li></ul> 
 *
 */
SZN.Dom.getScrollPos = function(){
	if (document.documentElement.scrollTop || document.documentElement.scrollLeft) {
		var ox = document.documentElement.scrollLeft;
		var oy = document.documentElement.scrollTop;
	} else if (document.body.scrollTop || document.body.scrollLeft) { 
		var ox = document.body.scrollLeft;
		var oy = document.body.scrollTop;
	} else {
		var ox = 0;
		var oy = 0;
	}
	return {x:ox,y:oy};
}

/**
 * @method vraci soucasnou hodnotu nejake css vlastnosti
 * @param {object} elm HTML elmenet, jehoz vlasnost nas zajima
 * @param {string} property retezec s nazvem vlastnosti ("border","backgroundColor",...)
 */
SZN.Dom.getStyle = function(elm, property) {
	if (document.defaultView && document.defaultView.getComputedStyle) {
		var cs = elm.ownerDocument.defaultView.getComputedStyle(elm,'');
		if (!cs) { return false; }
		return cs[property];
	} else {
		return elm.currentStyle[property];
	}
}

/**
 * @method skryva elementy ktere se mohou objevit v nejvyssi vrstve a prekryt obsah,
 * resp. nelze je prekryt dalsim obsahem (typicky &lt;SELECT&gt; v internet exploreru) 
 * @param {object | string} HTML element nebo jeho ID pod kterym chceme skryvat problematicke prvky
 * @param {array} pole obsahujici nazvy problematickych elementu
 * @param {string} kce kterou chceme provest 'hide' pro skryti 'show' nebo cokoli jineho nez hide pro zobrazeni
 * @examples 
 *  <pre>
 * SZN.Dom.elementsHider(SZN.gEl('test'),['select'],'hide')
 * SZN.Dom.elementsHider(SZN.gEl('test'),['select'],'show')
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
/**
 * @overview Nastorje pro praci s objekty kopirovani, serializace, porovnani
 * @version 1.0
 * @author :jelc
 */     


/**
 * @name SZN.ObjCopy
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
 * @name SZN.ObjLib
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
/**
 * @overview Prace HTTPXMLRequestem pro komunikaci klient - server
 * @version 1.0
 * @author koko, jelc 
 */   

/**
 * @class trida provadejici komunikaci klient - server prostrednictvim  HTTPXMLRequest
 * defaultne posilame dotaz metodou GET, asynchrone a odpoved ocekavama v JSON formatu
 * @name SZN.HTTPRequest
 * @param {string} url url na ktere budeme posilat dotazy
 * @param {object} callBackObj objekt v jehoz oboru platnosti zpracovavame odpoved
 * @param {string} callBackFunc metoda, ktera bude odpoved zpracovavat
 */
SZN.HTTPRequest = SZN.ClassMaker.makeClass({
	NAME: "HTTPRequest",
	VERSION: "1.0",
	CLASS: "class"
});

SZN.HTTPRequest.prototype.$constructor = function(url,callBackObj,callBackFunc){
	/** @field {object} aktualni nastaveni pro request*/
	this.data = new Object();
	/** @field {string} url na ktere se ptame */
	this.url = url ? url : '';
	/** @field {object} objekt v jehoz oboru platnosti zpracujeme odpoved */
	this.callBackObj = callBackObj;
	/** @field {function} metoda, ktera odpoved zpracuje */
	this.callBackFunc = callBackFunc;

	this.setFormat();
	this.setMode();
	this.setMethod();
	this.setPostData();
	this.setHeaders();
};

/** 
@static 
@class
*/
SZN.HTTPRequest.Setting = function(url,method,postData,headers,mode,format){
	/** @field {string}  url serveru, ktereho se ptame */
	this.url = url ? url : '';
	/** @field {string} metoda dotazu [post,get = default]*/
	this.method = method ? method : '';
	/** @field {string} mod dotazu [sync,async = default]*/
	this.mode = mode ? mode : '';
	/** @field {string} format odpoved [xml,json = default]*/
	this.format = format ? format : '';
	/** @field {array} nastaveni hlavicek, pole objektu s vlatnostmi <em>type</em> a <em>content</em> */
	this.headers = headers ? headers : '';
	/** @field {string} data pro dotaz posilanu metodou post*/
	this.postData = postData ? postData : '';
};


/**
 * @field {object} <strong>konstanta</strong> vyctove pole metod, ktere se mouhou pouzivat a definice defaultni metody
 */
SZN.HTTPRequest.prototype.METHOD = {
	post : 'post',
	get : 'get',
	def : 'get'
};
/**
 * @field {object} <strong>konstanta</strong> vyctove pole formatu odpovedi, ktere se mouhou pouzivat a definice defaultniho formatu
 * 
 */
SZN.HTTPRequest.prototype.FORMAT = {
	json : 'json',
	xml : 'xml',
	txt : 'txt',
	def : 'json'
};
/**
 * @field {object} <strong>konstanta</strong> vyctove pole modu dotazu, ktere se mouhou pouzivat a definice defaultniho modu
 */
SZN.HTTPRequest.prototype.MODE = {
	async : true,
	sync :  false,
	def : true
};

/**
 * @field {array} <strong>konstanta</strong> vychozi nastaveni http hlavicky dotazu
 */
SZN.HTTPRequest.prototype.HEADER = [{typ:'Content-Type', content:'application/x-www-form-urlencoded' }];

/**
 * @method destruktor 
 *
 */  
SZN.HTTPRequest.prototype.destructor = function(){
	for(var i in this){
		this[i] = null;
	}
};
/**
 * @method inicializace <strong>nepouziva se</strong>
 *
 */  
SZN.HTTPRequest.prototype.init = function(){};

/**
 * @method nastavuje metodu komunikace klient - server dle argumentu, pokud argument
 * neni definovan v objektu METHOD pouzije se vychozi 
 * @param {string} method metoda komunikace klient server [get,post]
 */  
SZN.HTTPRequest.prototype.setMethod = function(method){
	this.data.method = this._setMethod(method);
};
/**
 * @method nastavuje mod komunikace klient - server dle argumentu, pokud argument
 * neni definovan v objektu MODE pouzije se vychozi 
 * @param {string} mode mod komunikace klient server [sync,async]
 */  
SZN.HTTPRequest.prototype.setMode = function(mode){
	this.data.mode = this._setMode(mode);
};
/**
 * @method nastavuje format odpovedi serveru dle argumentu, pokud argument
 * neni definovan v objektu FORMAT pouzije se vychozi 
 * @param {string} format format odpovedi serveru [xml,json,txt]
 */  
SZN.HTTPRequest.prototype.setFormat = function(format){
	this.data.format = this._setFormat(format);
};
/**
 * @method nastavuje HTTP hlavicky dotazu
 * @param {array} headers pole objektu s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavicky</li>
 * <li>content - hodnota hlavicky</li>
 * </ul>    
 */  
SZN.HTTPRequest.prototype.setHeaders = function(headers){
	this.data.headers = this._setHeaders(headers);
};
/**
 * @method nastavuje data, ktera se maji posilat metodou POST
 * @param {string} data data, ktera se budou posilat POSTem
 */  
SZN.HTTPRequest.prototype.setPostData = function(data){
	this.data.postData = data ? data : '';
};

/**
 * @method vlastni vyvolani XMLHTTPRequestu, predane parametry se pouziji pro konkretni dotaz
 * pokud nektery neni definovan pouzije se vychozi, nebo nastaveny 
 * @param {string} url url na ktere budeme posilat dotazy (musi byt zadan, ale muze byt prazdny)
 * @param {object} callBackObj objekt v jehoz oboru platnosti zpracovavame odpoved (musi byt zadan, ale muze byt prazdny)
 * @param {string} callBackFunc metoda, ktera bude odpoved zpracovavat (musi byt zadan, ale muze byt prazdny)
 * @param {object} requestData [<em>volitelne</em>] instance objektu Setting s dalsimi daty
 * @returns {object} 1) v pripade asynchroniho requestu objekt reprezentujici request<br>
 * 2) v pripade synchroniho requestu vraci odpoved serveru  jako objekt s vlastnostmi <em>status</em> a <em>data</em>
 */      
SZN.HTTPRequest.prototype.send = function(url,obj,method,requestData){
	var mySelf = this;
	var param = !!requestData ? requestData : {};
	var data = this._setFromData(url,obj,method,param);
	//debug(data.mode)
	// vytvorim request
	var XHR = this._getRequest();
	// otevru request
    try {
		XHR.open(data.method, data.url, data.mode);
	} catch(e){
		return 0;
	}
	
	// nastavim hlavicky
	for(var i = 0; i < data.headers.length; i++){
		XHR.setRequestHeader(data.headers[i].typ,data.headers[i].content);
	}
	// zpracovani asynchroniho requestu
	if(data.mode){
		function stateChangeFunction(){
	        if( XHR.readyState == 4 ) {
	            if( XHR.status == 200 ) {
					if(data.format == 'xml'){
						var out = XHR.responseXML;
					} else if(data.format == 'txt'){
						var out = XHR.responseText;
					} else {
						try {
							eval('var out = ('+XHR.responseText+')');
						} catch(e){
							var out = {requestError : true };
						}
					}
					data.callBackObj[data.callBackFunc](out);
					XHR = null;
	            } else {
					var out = {requestError : XHR.status };
					data.callBackObj[data.callBackFunc](out);
					XHR = null;
				}
	        }		
		}
		XHR.onreadystatechange = stateChangeFunction;
	}
	// odeslani requestu dle nastavenoeho modu post/get
	if(data.method == this.METHOD['post']){ 
	    if(typeof data.postData != 'undefined') {
			XHR.send(data.postData);
		} else {
			return 0;
		}
	} else {
		XHR.send(null);
	}
	// zpracovani synchroniho requestu
	if(!data.mode){
		if(data.format == 'xml'){
			var out = XHR.responseXML;
		} else {
			var out = XHR.responseText
		}
		return { status : XHR.status, data : out };
	} else {
		return XHR;
	}
};

/**
 * @method umoznuje zrusit asynchroni dotaz pokud jiz neni zpracovavan
 * @param {object} XHR objekt requestu vraceny metodou send
 */   
SZN.HTTPRequest.prototype.abort = function(XHR){
	if (typeof XHR == 'object') {
		XHR.abort();
	} else {
		return 0;
	}
};

/**
 * @private
 * @method vraci metodu jakou bude probihat komunikace klient - server pokud je znama,
 * jinak vraci vychozi, definovanou v objektu METHOD
 * @param {string} method pozadovana metoda   
 *
 */  
SZN.HTTPRequest.prototype._setMethod = function(method){
	return (typeof this.METHOD[method] != 'undefined') ? this.METHOD[method] : this.METHOD['def'];
};
/**
 * @private
 * @method vraci mod v jakem bude probihat komunikace klient - server pokud je znama,
 * jinak vraci vychozi, definovanou v objektu MODE
 * @param {string} mode pozadovany mod
 *
 */ 
SZN.HTTPRequest.prototype._setMode = function(mode){
	return (typeof this.MODE[mode] != 'undefined') ? this.MODE[mode] : this.MODE['def'];
};
/**
 * @private
 * @method vraci format jakou bude probihat komunikace klient - server pokud je znama,
 * jinak vraci vychozi, definovanou v objektu FORMAT
 * @param {string} format pozadovany format
 *
 */ 
SZN.HTTPRequest.prototype._setFormat = function(format){
	return (typeof this.FORMAT[format] != 'undefined') ? this.FORMAT[format] : this.FORMAT['def'];
};
/**
 * @private
 * @method pripravuje nastaveni HTTP hlavicek pro zasilany dotaz, pokud nenajde v
 * argumentu hlavicku 'Content-type', pouzije definovanou v HEADER 
 * @param {array} headers pole objektu s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavicky</li>
 * <li>content - hodnota hlavicky</li>
 * </ul> 
 * @returns {array} pole pozadovanych hlavicek, ktere maji byt nastaveny 
 */   
SZN.HTTPRequest.prototype._setHeaders = function(headers){
	var headers = (headers instanceof Array) ? headers : new Array();
	var out = new Array();
	var setContent = false;
	for(var i = 0; i < headers.length; i++){
		if(headers[i].typ == 'Content-Type'){
			setContent = true;
		}
		out[i] = {
			typ : headers[i].typ,
			content : headers[i].content		
		}
	}
	if(!setContent){
		out.push({typ : this.HEADER[0].typ,content : this.HEADER[0].content});
	}
	return out;
}
/**
 * @private
 * @method provadi nastaveni vlastnosti pro dany dotaz, aktualne volanou metodu
 * <em>send</em> aniz by prepisoval nastavene (nutne kvuli asynchronimu volani)  
 * @param {string} url url na ktere budeme posilat dotazy (musi byt zadan, ale muze byt prazdny)
 * @param {object} obj objekt v jehoz oboru platnosti zpracovavame odpoved (musi byt zadan, ale muze byt prazdny)
 * @param {string} func metoda, ktera bude odpoved zpracovavat (musi byt zadan, ale muze byt prazdny)
 * @param {object} setting [<em>volitelne</em>] instance objektu Setting s dalsimi daty
 * @returns {object} data ktera se pouziji v metode <em>send</em>
 */   
SZN.HTTPRequest.prototype._setFromData = function(url,obj,func,setting){
	var data = new Object();
	for(var i in this.data){
		switch (i){
			case 'method':
				if(setting[i]){
					data[i] = this._setMethod(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'format':
				if(setting[i]){
					data[i] = this._setFormat(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'mode':
				if(setting[i]){
					data[i] = this._setMode(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'headers':
				if(setting[i]){
					data.headers = this._setHeaders(setting[i]);
				} else {
					data.headers = this._setHeaders(this.data[i]);
				}
				break;
			default:
				if(setting[i]){
					data[i] = setting[i];
				} else {
					data[i] = this.data[i];
				}				
				break;
		}
	}
	data.url = url ? url : this.url;
	data.callBackObj = obj ? obj : this.callBackObj;
	data.callBackFunc = func ? func : this.callBackFunc;
	return data;
};
/**
 * @private
 * @method crossplatformi vytvareni XMLHttpRequestu 
 * @returns XMLHttpRequest
 *
 */   
SZN.HTTPRequest.prototype._getRequest = function(){
    if(typeof(XMLHttpRequest) != 'undefined') {
		return new XMLHttpRequest();
	}
	else {
		try {
			/*- IE */
			return new ActiveXObject("Msxml2.XMLHTTP"); /*- "Microsoft.XMLHTTP*/
		}
		catch (e) {
			try { 
				return new ActiveXObject("Microsoft.XMLHTTP"); 
			}
			catch (e) {
				return 0;
			}
		}
	}
};
/**
 * @overview Objekt vnitrniho rozhrani definuje vlastnosti a metody nutne pro spravu 
 * internich udalosti je volan zdedenymi metodami u trid ktere maji implementovano rozhrani
 * @version 1.0
 * @author jelc, zara
 */
 SZN.SigInterface = SZN.ClassMaker.makeClass({
	NAME: "SigInterface",
	VERSION: "1.0",
	CLASS: "class"
});
 
 
/**
 * @class trida pro praci s uzivatelsky definovanymi udalostmi a zasilanim zprav,
 * pouziva se prostrednictvim dedenych vlastnosti z rozhrani SZN.Signals 
 * @name SZN.SigInterface
 * @param {object} owner objekt vlastnici tridu
 * @param {string} name nazev instance
 */
SZN.SigInterface.prototype.$constructor = function(owner,name){
	/** 
	 * @private
	 * @field {object}  vlastnik instance
	 */
	this._owner = owner;
	/** 
	 * @private
	 * @field {string} nazev instance
	 */	
	this._name = name;

	/** 
	 * @field {object} zasobnik zprav pro asyncroni processy apod...
 	 */
	this.messageFolder = new Object();
	/**
	 * @field {object} asociativni pole do ktereho se vkladaji vznikle udalosti a
	 * odkud se zpracovavvji	 
	 */
	this.myEventFolder = new Object();
	/**
	 * @field {object} zasobnik posluchacu udalosti
	 */
	this.myHandleFolder = new Object();
	/**
	 * @field {boolean} promena, ktera urcuje, zda je definovano nejake verejne API
	 * pro udalosti	 
	 */	
	this.apiDefined = true;
};

SZN.SigInterface.prototype.destructor = function(){
	// nothing now
};

/**
 * @method vkladani zprav, pouziva se prostrednictvim dedeneho rozhrani Signal
 * @param {string} msgName nazev zpravy 
 * @param {any} msgValue hodnota zpravy 
 */
SZN.SigInterface.prototype.setMessage = function(msgName,msgValue){
	this.messageFolder[msgName] = msgValue;
};

/**
 * metoda pro ziskani hodnoty konkretniho volani ulozeneho v zasobniku
 * @param {string} msgName nazev zpravy
 * @returns {any} hodnotu ulozeneho zpravy
 */
SZN.SigInterface.prototype.getMessage = function(msgName){
	return this.messageFolder[msgName];
};

/**
 * @method volani registrace posluchace uzivatelske udalosti, pokud je jiz na stejny druh 
 *  udalosti zaregistrovana shodna metoda shodneho objektu nic se neprovede, vola se zpozdenim
 *  metidu <em>_addListener</em> 
 * @param {object} owner	objekt/trida  ktera nasloucha, v jehoz oboru platnosti se zpracovani udalosti provede
 * @param {string} type	typ udalosti, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchace ktera ma danou udalost zpracovat
 * @returns {number} 1 v pripade neuspechu, 0 v pripade uspechu 
 */
SZN.SigInterface.prototype.addListener = function(owner,type,funcOrString){
	this._addTimoutFunc(owner,type,funcOrString);
	window.setTimeout(this.tmpHandled,1);	
};

/**
 * @method volani registrace posluchace uzivatelske udalosti, pokud je jiz na stejny druh 
 *  udalosti zaregistrovana shodna metoda shodneho objektu nic se neprovede, vola se <b>bez zpozdeni</b>
 *  metodu <em>_addListener</em> 
 * @param {object} owner	objekt/trida  ktera nasloucha, v jehoz oboru platnosti se zpracovani udalosti provede
 * @param {string} type	typ udalosti, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchace ktera ma danou udalost zpracovat
 * @returns {number} 1 v pripade neuspechu, 0 v pripade uspechu 
 */      
SZN.SigInterface.prototype.addNoDelayListener = function(owner,type,funcOrString){
	this._addListener(owner,type,funcOrString);
};


/**
 * @private
 * @method vlastni registrace posluchace uzivatelske udalosti, pokud je jiz na stejny druh 
 *  udalosti zaregistrovana shodna metoda shodneho objektu nic se neprovede
 * @param {object} owner	objekt/trida  ktera nasloucha, v jehoz oboru platnosti se zpracovani udalosti provede
 * @param {string} type	typ udalosti, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchace ktera ma danou udalost zpracovat
 * @returns {number} 1 v pripade neuspechu, 0 v pripade uspechu 
 */
SZN.SigInterface.prototype._addListener = function(owner,type,funcOrString){
	/* zasobnik pro dany typ udalosti neexistuje musim ho vytvorit */
	if(typeof(this.myHandleFolder[type]) != 'object'){
		this.myHandleFolder[type] = new Object();
	} 
	
	
	/* na tuto udalost je jiz predana funkce zavesena tak nic nedelam */
	for(var i in this.myHandleFolder[type]){
		if((this.myHandleFolder[type][i].eFunction == funcOrString) && 
		(this.myHandleFolder[type][i].eOwner == owner)){
			return 1;
		}
	}
	
	/* identifikator handlovane udalosti */
	var ids = SZN.idGenerator();
	//this.idsFlag++;
	
	/* konecne si to muzu zaregistrovat */
	this.myHandleFolder[type][ids] =	{
		eOwner		: owner,
		eFunction	: funcOrString
	};
	return 0;
};

/**
 * @method odstraneni naslouchani udalosti
 * argumenty:
 * @param {object} owner	objekt/trida  ktera naslouchala, v jehoz oboru platnosti se zpracovani udalosti provadelo
 * @param {string} type	typ udalosti, kterou jsme zachytavali
 * @param {string} functionName funkce/metoda posluchace ktera danou udalost zpracovavala
 * @returns {number} 0 v pripade uspechu, 1 v pripade neuspechu
 */
SZN.SigInterface.prototype.removeListener = function(owner,type,funcOrString){
	var removed = 1;
	for(var i in this.myHandleFolder[type]){
		if((this.myHandleFolder[type][i].eFunction == funcOrString) && 
		(this.myHandleFolder[type][i].eOwner == owner)){
			this.myHandleFolder[type][i] = null;
			delete(this.myHandleFolder[type][i]);
			removed = 0;
		}		
	}
	return removed;
};

/**
 * @method vytvarime udalost, uklada ji do zasobniku udalosti a predava ji ke zpracovani
 * @param {string} type nazev nove udalosti
 * @param {object} trg reference na objekt, ktery udalost vyvolal
 * @param {string} accessType urcuje zda bude udalost viditelna i ve verejnem rozhrani nebo pouze vnitrnim objektum [public | private]
 * @param {number} timestampcas vzniku udalosti 
 */   
SZN.SigInterface.prototype.makeEvent = function(type,trg,accessType,timestamp){
	var ids = SZN.idGenerator();
	this.myEventFolder['e-' + ids] = new this.NewEvent(type,trg,accessType,timestamp,ids);
	this.myEventHandler(this.myEventFolder['e-' + ids]);
};


/**
 * @class konstruktor vnitrni udalosti
 * @param {string} type nazev nove udalosti
 * @param {object} trg reference na objekt, ktery udalost vyvolal
 * @param {string} accessType urcuje zda bude udalost viditelna i ve verejnem rozhrani nebo pouze vnitrnim objektum [public | private]
 * @param {number} timestampcas vzniku udalosti 
 * @param {string} ids unikatni ID 
 */   
SZN.SigInterface.prototype.NewEvent = function(type,trg,access,time,ids){
	/** @field {string} typ udalosti*/
	this.type = type;
	/** @field {object}  objekt, ktery udalost vyvolal*/
	this.target = trg;
	/** @field {string}  specifikace pristupovych prav [public|private]*/
	this.accessType = access;
	/** @field {number} timestamp */
	this.timeStamp = time;
	/** 
	 * @private	
	 * @field {string} unikatni ID
	 */
	this._id = ids;
};


/**
 * method zpracuje udalost - spusti metodu, ktera byla zaragistrovana jako posluchac 
 * a je-li definovane API a udalost je verejna prada ji API handleru
 * definovano api predava mu udalost, je-li verejna, nakonec zavola zruseni udalosti
 * @param {object} myEvent zpracovavana udalost
 */    
SZN.SigInterface.prototype.myEventHandler = function(myEvent){
	var functionCache = [];

	for(var i in this.myHandleFolder){
		if((i == myEvent.type)){
			for(j in this.myHandleFolder[i]){
				functionCache.push(this.myHandleFolder[i][j]);
			}
		}
	}
	
	for (var i=0;i<functionCache.length;i++) {
		var item = functionCache[i];
		var owner = item.eOwner;
		var fnc = item.eFunction;
		if(typeof fnc == 'string'){
			owner[fnc](myEvent);
		} else if(typeof fnc == 'function'){
			fnc(myEvent);
		}
	}
	
	/* je-li definovano api  a je-li udalost api pristupna 
	 * predam mu udalost
	 */
	if((myEvent.accessType == 'public') 
	&& (this.apiDefined) 
	&& (myEvent._owner != 'api')){
		this._owner.apiHandler._apiEventHandler(myEvent);
	}	
	
	/* zrusim udalost */
	this.destroyEvent(myEvent._id);
};

/**
 * @method destruktor udalosti, odstrani udalost definovanou pomoci 'timestamp'
 * v zasobniku a smaze ji
 * @param {string} ids identifikator udalosti v zasobniku
 */     
SZN.SigInterface.prototype.destroyEvent = function(ids){
	this.myEventFolder['e-' + ids] = null;
	delete(this.myEventFolder['e-' + ids]);
};
/**
 * @private
 * @method sluzi k vytvoreni volani metody instance tridy se zpozdenim ve spravnem oboru platnosti,
 * zde je uvedeno aby trida nebyla zavisla na SZN.Events<br>
 * zde slouzi vyhradne jeko hack pro IE, ktere ma problemy pri soucasne praci s polem 
 *  eventFolder pri pridavani a odebirani posluchacu, pri pouziti tridy to jizz neni treba resit
 */  
SZN.SigInterface.prototype._addTimoutFunc = function(){
	var self = this;
	var args = new Array();
	for(var i = 0; i < arguments.length;i++){
		args[i] = arguments[i] 	
	}
	this['tmpHandled'] = function(){return self._addListener.apply(self,args)};
};
/**
 * @overview Rozhrani uzivatelsky definovanymi udalostmi a zpravami pro asynchroni
 * procesy 
 * @name SZN.Signals
 * @version 1.0
 * @author jelc, zara
 */   

/**
 * @class rozhrani pro praci s uzivatelsky definovanyymi udalostmi a zpravami
 * vyzaduje referenci na instanci tridy SZN.sigInterface, vsechny nasledujici metody
 * jsou urceny k pouziti pouze jako zdedene vlastnosti rozhrani, instance tridy
 * se nepouzivaji  
 * @see <strong>SZN.sigInterface</strong> 
 */  
SZN.Signals = SZN.ClassMaker.makeClass({
	NAME: "Signals",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 *  @method slouzi k nalezeni rozhrani u rodicovskych trid, hleda v nadrazenych tridach tridu,
 *  ktera ma nastavenou vlastnost TOP_LEVEL a v ni ocekava instanci tridy SZN.sigInterface s
 *  nazvem "interfaceName"  
 * @param {string}	interfaceName  nazev instance rozhrani v danem objektu 
 * @returns {object} referenci na instanci tridy SZN.sigInterface
 * @throws {error} 	SetInterface:Interface not found  
 */
SZN.Signals.prototype.setInterface = function(interfaceName){
	if(typeof(this[interfaceName]) != 'object'){
		var owner = this._owner;
		while(typeof(owner[interfaceName])== 'undefined'){
			if(typeof owner.TOP_LEVEL != 'undefined'){
				throw new Error('SetInterface:Interface not found');
			} else {
				owner = owner._owner;
			}
		}
		return owner[interfaceName];
	} 
};

/**
 * @method slouzi k registraci zachytavani udalosti v rozhrani
 * @param {object} myListener objekt v jehoz oboru platnosti se bude zachycena udalost zpracovavat
 * @param {string} type nazev udalosti kterou chceme zachytit
 * @param {string} handleFunction nazev metody objektu 'myListener', ktera bude zpracovavat udalost
 * @param {string} [noDelay] je-li parametr zadan a vyhodnocen jako true, provede se registrace poluchace bez zpozdeni 
 * @throws {error} pokud neexistuje rozhrani vyvola chybu 'Interface not defined'
 */
SZN.Signals.prototype.addListener = function(myListener,type,handleFunction,noDelay){
	if(typeof(this.sigInterface) == 'object'){
		if(!noDelay){
			this.sigInterface.addListener(myListener,type,handleFunction);
		} else {
			this.sigInterface.addNoDelayListener(myListener,type,handleFunction);
		}
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * @method slouzi k zruseni zachytavani udalosti 
 * @param {object} myListener objekt v jehoz oboru platnosti se bude zachycena udalost zpracovavala
 * @param {string} type nazev udalosti kterou jsme zachytavali
 * @param {string} handleFunction nazev metody objektu 'myListener', ktera udalost zpracovavala
 * @throws {error} pokud neexistuje rozhrani vyvola chybu 'Interface not defined'
 */
SZN.Signals.prototype.removeListener = function(myListener,type,handleFunction){
	if(typeof(this.sigInterface) == 'object'){
		this.sigInterface.removeListener(myListener,type,handleFunction);
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * @method vytvari novou udalost, kterou zachytava instance tridy SZN.sigInterface
 * @param {string} type nazev vyvolane udalosti
 * @param {object} trg reference na objekt, ktery udalost vyvolal
 * @param {string} accessType urcuje zda bude udalost viditelna i ve verejnem rozhrani
 *					  nebo pouze vnitrnim objektum [private | public]
 * @param {number} timestamp cas vzniku udalosti (v milisekundach)
 * @throws {error} pokud neexistuje rozhrani vyvola chybu 'Interface not defined'   
 */
SZN.Signals.prototype.makeSigEvent = function(type,trg,accessType){
	if(typeof(this.sigInterface) == 'object'){
		var time = new Date().getTime();
		this.sigInterface.makeEvent(type,trg,accessType,time);
	} else {
		throw new Error('Interface not defined');
	}
};
/**
 * @method nastavuje zpravu se jmanem <em>msgName</em> na hodnotu <em>msgValue</em>
 * @param {string} msgName nazev zpravy
 * @param {any} msgValue obsah zpravy
 */   
SZN.Signals.prototype.setSysMessage = function(msgName,msgValue){
	this.sigInterface.setMessage(msgName,msgValue);
};
/**
 * @method cte zpravu se jmenem <em>msgName</em>
 * @param {string} msgName nazev zpravy
 * @return {any} obsah zpravy
 */ 
SZN.Signals.prototype.getSysMessage = function(msgName){
	return this.sigInterface.getMessage(msgName);
};
