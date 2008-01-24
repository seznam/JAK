/**
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview deklarace "jmenného prostoru"
 * @version 1.0
 * @author jelc 
 */ 

/**
 * @namespace
 * @name SZN
 * @static {Object} SZN statický objekt, který se používá pro "zapouzdření"
 * 					všech definic a deklarací<br> v podmínce se nalezá pro
 * 					jistotu a pro to že může být definován ještě před svou
 * 					deklarací při použití slovníků a konfigurací   
*/
if(typeof SZN != 'object'){
	var SZN = {};
};

/**
 * vytvoření funkce, která vrací volání funkce ve svém argumentu "fnc" jako metody 
 * objektu z argumentu "obj" s předanými argumenty. Metodu používají další třídy v SZN (např. SZN.Components)
 * @static
 * @method 
 * @param {object} obj objekt v jehož oboru platnosti bude volán druhý argument
 * @param {function} fnc funkce která bude provedena v oboru platnosti prvního argumentu
 * @example var test = function(a,b){
 *		if(a > b) return true;
 *		else return false;  
 *  } 
 *  var obj = new Object();
 *  var pokus = SZN.bind(obj,test)
 *  alert(pokus(1,2))   
 * @return {function} volání takto vytvořené funkce
*/
SZN.bind = function(obj,fnc){
	return function() {
		return fnc.apply(obj,arguments);
	}
};

/**
 * generátor unikatních ID
 * @static
 * @method 
 * @return {string} unikátní ID
 */
SZN.idGenerator = function(){
	this.idCnt = this.idCnt < 10000000 ? this.idCnt : 0;
	var ids = 'm' +  new Date().getTime().toString(16) +  'm' + this.idCnt.toString(16);
	this.idCnt++;
	return ids;	
};
/**
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview nástroj pro vytváření tříd a dědičnosti
 * @version 3.0
 * @author jelc, zara
 */   

/**
 * @static
 * @name SZN.ClassMaker
 * @class statická třída sestavující dědičnost rozšiřováním prototypového objektu
 * doplňováním základních metod a testováním závislostí 
 */    
SZN.ClassMaker = {};

/** 
 * @field {string} verze třídy 
 */
SZN.ClassMaker.VERSION = "3.0";
/** 
 * @field {string} název třídy 
 */
SZN.ClassMaker.NAME = "ClassMaker";
/** 
 * @field {string} typ třídy (static|class)
 */
SZN.ClassMaker.CLASS = "static";
/** 
 * @field {object} instance třídy ObjCopy, je-li k dispozici (používá se ke kopírování prototypových vlastností, které jsou objekty)
 */
SZN.ClassMaker.copyObj = null;
	
/**
 * vlastní metoda pro vytvoření třídy, v jediném parametru se dozví informace o třídě, kterou má vytvořit
 * @method 
 * @param {object} params parametry pro tvorbu nové třídy:
 * <ul>
 * <li>NAME - povinný název třídy</li>
 * <li>VERSION (string) - verze třídy</li>
 * <li>TYPE - "class"/"static", statická třída odpovídá literálovému objektu a nemůže nic dědit</li>
 * <li>EXTEND - reference na rodičovskou třídu</li>
 * <li>IMPLEMENT - pole referencí na rozhraní, jež tato třída implementuje</li>
 * <li>DEPEND - pole závislostí</li>
 * </ul>
 */
SZN.ClassMaker.makeClass = function(params) {
	if (!params.NAME) { throw new Error("No	NAME passed to SZN.ClassMaker.makeClass()"); }
	
	var version = params.VERSION || "1.0";
	var extend = params.EXTEND || false;
	var implement = params.IMPLEMENT || [];
	var depend = params.DEPEND || [];
	var type = params.CLASS;
	
	/* implement muze byt tez jeden prvek */
	if (!(implement instanceof Array)) { implement = [implement]; }
	
	/* test zavislosti */
	var result = false;
	if (result = this._testDepend(depend)) { throw new Error("Dependency error in class " + params.NAME + " ("+result+")"); }
	
	if (type == "static") { /* staticka trida */
		var obj = {};
		obj.VERSION = version;
		obj.NAME = params.NAME;
		obj.CLASS = "static";
		return obj;
	
	} //else {
		var constructor = function() { /* normalni trida */
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
		constructor.EXTEND = extend;
		constructor.IMPLEMENT = implement;
		constructor.DEPEND = depend;
		constructor.CLASS = "class";
		
		/* common functionality */
		constructor.destroy = this._destroy;
		this._setInheritance(constructor);
		
		/* these will get inherited */
		constructor.prototype.CLASS = "class";
		constructor.prototype.sConstructor = constructor;
		constructor.prototype.callSuper = this._callSuper;
		
		return constructor;
	//}
}

/**
 * vytváří třídu pro další použití z literálového zápisu s přesně definovaným tvarem
 * vlastnost <em>constructor</em> obsahuje definici konstruktoru třídy	<br />
 * vlastnost <em>staticData</em> obsahuje používané statické vlastnosti třídy<br />
 * vlastnost <em>trg</em>, která určuje v jakém oboru platnosti se třída vytvoří<br />
 * vlastnost <em>proto</em> obsahuje výčet vlastností, které se stanou prototypovými
 * vlastnostmi nové třídy
 * valstnost <em>access</em> obsahuje definice modifikátoru přistupu pro prototypové
 * metody třídy	  	 	 	 	 	 
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
 * @method 
 * @private 
 * @param {object} classDef literalová definice nové třídy ve výše uvedené podobě	 	 	 
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
 * metoda sloužící ke zdědění jako statická metoda vytvářené třídy
 * @private
 * @method 
 * nastavuje všechny vlastnosti svého argumentu na null	 
 * @param {object} obj cisteny objekt
 */	 	 	 		
SZN.ClassMaker._destroy = function(obj) {
	for(var p in obj) {
		obj[p] = null;
	};
}
	
/**
 * metoda sloužící ke zdědění jako prototypová metoda vytvářené třídy
 * @private
 * @method 
 * vrátí fukci která zavolá metodu předka třídy jako vlastní  
 * @param {string} methodName název metody předka
 * @param {function} callingFunction odkaz na metodu v jejímž kontextu je metoda volána
 * mělo bz to být vždy <strong>arguments.callee</strong>
 */	 	 	 		
SZN.ClassMaker._callSuper = function(methodName,callingFunction){
	if(callingFunction.loc_level){
		var level = callingFunction.loc_level;
	} else {
		var level = this.sConstructor;
	}
		
	var sup = level.EXTEND;
	if(!sup){
		throw new Error('"No super-class available"');
	}
	
	var method = sup.prototype[methodName];
	if(!method || (typeof method != 'function')){
		throw new Error('"Super-class doesn\'t have method "'+methodName+'"');
	}
	
	var mySelf = this;
	eval("var func=" + method.toString());
	func.loc_level = sup; 
	return function(){ return func.apply(mySelf,arguments);}
	
}

/**
 * volá vlastní kopírování prototypových vlastností jednotlivých rodičů
 * @private
 * @method 
 * @param {array} extend pole rodicovskych trid
*/
SZN.ClassMaker._setInheritance = function(constructor) {
	if (constructor.EXTEND) { this._makeInheritance(constructor, constructor.EXTEND); }
	for (var i=0; i<constructor.IMPLEMENT.length; i++) {
		this._makeInheritance(constructor,constructor.IMPLEMENT[i],true);
	}
}

/**
 * provadí vlastní kopírovaní prototypových vlastností z rodiče do potomka 
 * pokud je prototypová vlastnost typu object zavolá metodu, která se pokusí
 * vytvořit hlubokou kopii teto vlastnosti
 * @private
 * @method 
 * @param {object} constructor Potomek, jehož nové prototypové vlastnosti nastavujeme
 * @param {object} parent Rodič, z jehož vlastnosti 'protype' budeme kopírovat	  	 
*/
SZN.ClassMaker._makeInheritance = function(constructor, parent, noSuper){
	for(var p in parent.prototype){
		if (typeof parent.prototype[p] == 'object') {
			if ("ObjCopy" in SZN) {
				if(this.copyObj == null){
					this.copyObj = new SZN.ObjCopy();
				} 
				constructor.prototype[p] = this.copyObj.copy(parent.prototype[p]);
			}
		} else {
			// pro rozhrani nededime metody $constructor a $destructor rozhrani
			if(noSuper && ((p == '$constructor') || (p == '$destructor'))){
				continue;
			}		
			constructor.prototype[p] = parent.prototype[p];
		}
	}
}
	
/**
 * testuje závislosti vytvářené třídy, pokud jsou nastavené
 * @private
 * @method 
 * @param {array} depend Pole závislostí, ktere chceme otestovat
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
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

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
 * destruktor, odvěsí všechny handlované události a jejich posluchače a
 * zruší se
 * @method  
 */   
SZN.Events.destructor = function() {
	this.removeAllListeners();
	this.sConstructor.destroy(this);
}

/**
 * vraci událost, která je právě zpracovávána
 * @method 
 * @deprecated
 */  
SZN.Events.getEvent = function(e){
	return e || window.event;
}

/**
 * vraci cíl události
 * @method 
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
 * (nedoporučeno) nebo zadáním <em>id (cached)</em>, které vrací medoda <em>addListener</em> <br>
 * <strong>a) pokud je zadán jen jeden argument, je považován za hodnotu <em>id (chached)</em><br>
 * b) pokud je zadáno všech šest argumentů použije se jen hodnota chached je-li string<br>
 * c) jinak se zkusi standardní odvěšení, které nebude fungovat pokud zavěšení proběhlo s <em>chached</em> nastaveným na true  
 * </strong> 
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
 * zastavi probublávaní události stromem dokumentu
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
 * zruši vychozí akce (definované klientem) pro danou udalost
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
 * provadí transformaci předané metody tak aby se zavolala v kontextu objektu <em>owner</em>
 * při použití v intervalu nebo timeoutu, v oboru platnosti <em>owner</em> vytvoří funkci, která provede
 * volání <em>exeFunc</em> v oboru platnosti <em>owner</em>
 * @method  
 * @param {object} owner objekt v jehož oboru platnosti se bude vykonávat funkce/metoda exeFunc v časovači
 * @param {string} handleFuncName název vlastnosti objektu <em>owner</em>, která se bude spouštět v časovači
 * @param {function} exeFunc funkce/metoda, kterou chceme provádět
 */     
SZN.Events.addTimeFunction = function(owner,handleFuncName,exeFunc,exeObj){
	if(!!exeObj){
		owner[handleFuncName] = function(){return exeFunc.apply(exeObj,[])};
	} else {
		owner[handleFuncName] = function(){return exeFunc.apply(owner,[])};
	}
}
/**
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview detekce prohlizece
 * @version 2.0
 * @author jelc, zara
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
 * zjistuje system uzivatele
 * @private
 * @method 
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
 * zjistuje typ prohlizece
 * @private
 * @method 
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
 * Nastavuje identifikaci leveho a praveho tlacitka mysi
 * @private 
 * @method 
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
 * zjistuje verzi daneho prohlizece, detekovaneho metodou "_getKlient"
 * @private
 * @method 
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
 * detekce verze Internet Exploreru
 * @private
 * @method 
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
 * detekce verze Opery
 * @private
 * @method 
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
 * detekce verze Gecko prohlizecu
 * @private
 * @method 
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
 * detekce verze Konqueroru
 * @private
 * @method 
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
 * detekce verze Safari
 * @private
 * @method 
 * @returns {string} verze verze se nedetekuje vraci 1
 */ 
SZN.Browser._get_safari_ver = function(){
	return '1';
};

/**
 * implicitní konkstruktor, je volán při načtení skriptu 
 * @method 
 */   
SZN.Browser.getBrowser = function(){
	this._agent = this.agent = navigator.userAgent;
	this._platform = navigator.platform;
	this._vendor = navigator.vendor;
	this.platform = this._getPlatform();
	this.client = this._getKlient();
	this.klient = this.client;
	this.version = this._getVersion();
	this.mouse = this._getMouse();
};
SZN.Browser.getBrowser();
/**
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview rozhraní určené pro vytváření hierarchie objektů na základě "komponent",
 * Pokud bude mít naše aplikace podobnou strukturu jako ukázkový graf (jednotlivé větve jsou instance tříd),
 * napomáhá automatizaci při jejím vytváření a rušení, včetně rušení jen jednotlivých větví, případně při
 * dynamickém doplňování destruktoru.  
 *   
 *  <pre>
 *   	MAIN
 *   	 |____ child_1
 *   	 |_____child_2
 *   	 			|__child_2.1
 *   	 			|__child_2.2    
 * </pre>  
 * Rozhrani  
 * @version 1.0
 * @author jelc, wendigo
 */ 
    
/**
 * @class třída pro dědění rozhraní "Components", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností  
 * 
 */
SZN.Components = function(){}

SZN.Components.Name = 'Components';
SZN.Components.version = '1.0';

SZN.Components.prototype.CLASS = 'class';


/**
 * zjišťuje zda má daná třída definované komponenty
 * @method 
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
 */
SZN.Components.prototype.hasComponents = function(){
	if((this.components instanceof Array) && this.components.length){
		return true;
	} else { 
		return false;
	}
};

/**
 * přidá všechny komponenty uvedené v poli <em>componets</em> dané třídy
 * @method 
 * @returns {boolean} <em>true</em> pokud má komponenty, <em>false</em> pokud ne
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
 * přidá novou komponentu za běhu programu
 * @method 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název pod kterým se má komponenta vytvořit jako vlastnost objektu</li>
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
 * přidává jednotlivé komponenty, pokud komponenta nemá definouvanou vlastnost "name", vytvoří ji z názvu konstruktoru
 * pokud má již třída vlostnost shodného jména, bude tato vlastnost přepsána 
 * @private
 * @method 
 * @param {object} component objekt s vlastnostmi:
 * <ul>
 * <li>part <em>{function}</em> odkaz na třídu, která je komponentou</li>
 * <li>name <em>{string}</em> název, pod kterým se ma komponenta vytvořit jako vlastnost objektu</li>
 * </ul>   
 *
 */    
SZN.Components.prototype._addComponent = function(component){
	if(typeof component.part != 'undefined'){
		if(typeof component.name == 'undefined'){
			component.name = component.part.NAME.substring(0,1).toLowerCase();
			component.name += component.part.NAME.substring(1);
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
 * vytváří volání vlastních metod z objektu, ktery je definován argumentem owner
 * tak že čte vlastnost <em>'access'</em> svých metod, vlastost acces je string jehož
 * první částí je specifikátor přístupu (poviný) s hodnotou 'public' a za ním následuje mezerou
 * oddělený název pod jakým se má volání vytvořit, není-li uveden použije se název vytvořený
 * ze jména objektu a metody
 * @method      
 * @param {object} owner reference na objekt, ve kterém se volání vytvoří
 * @throws {error} 'registredComponent: component "' + components_name + '" already exist!'
 * pokud <em>owner</em> již takto definovanou vlastnost má 
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
					var namePrefix = (obj == this.sConstructor) ? obj.NAME : this._name;
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
 * slouží k nalezení hlavniho objektu, který vytváří danou část programu
 * a má definovanou vlastnost TOP_LEVEL
 * @method  
 * @returns {object} refetrence na hlavni objekt
 * @throws {error}  'can\'t find TOP LEVEL Class' pokud není nalezen hlavní objekt
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
 * slouží k postupnému volání destruktorů všech komponent, daného objektu
 * @method 
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
			var name = '$destructor';
			if((typeof this[cName][name] != 'undefined')
			&&(typeof this[cName][name] == 'function')){
				this[cName][name]();
			}
			this[cName] = null;
		} 
	}	
};
/**
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview dom-related funkce
 * @version 3.0
 * @author zara, koko, jelc
 */

/**
 * @static
 * @name SZN.Dom
 * @class statická třída posytující některé praktické metody na úpravy a práci s DOM stromem
 */
SZN.Dom = SZN.ClassMaker.makeClass({
	NAME: "Dom",
	VERSION: "3.1",
	CLASS: "static"
});

/**
 * Vytvoří DOM node, je možné rovnou zadat id, CSS třídu a styly
 * @param {String} tagName jméno tagu (lowercase)
 * @param {String} id id uzlu
 * @param {String} className název CSS trid(y)
 * @param {Object} styleObj asociativní pole CSS vlastností a jejich hodnot
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
 * @param {String} str řetězec s textem
 */
SZN.cTxt = function(str) {
	return document.createTextNode(str);
}
	
/**
 * zjednodušený přístup k metodě DOM document.getElementById
 * @static
 * @method 
 * @param {string} ids id HTML elementu, který chceme získat,
 * NEBO přímo element
 * @returns {object} HTML element s id = ids, pokud existuje, NEBO element specifikovaný jako parametr
 */
 SZN.gEl = function(ids){
	if (typeof(ids) == "string") {
		return document.getElementById(ids);
	} else { return ids; }
}

/**
 * Propoji zadané DOM uzly
 * @param {Array} pole1...poleN libovolný počet polí; pro každé pole se vezme jeho první prvek a ostatní 
 *   se mu navěsí jako potomci
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
 * Otestuje, má-li zadany DOM uzel danou CSS třídu
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 * @return true|false
 */
SZN.Dom.hasClass = function(element,className) {
	var arr = element.className.split(" ");
	for (var i=0;i<arr.length;i++) { 
		if (arr[i] == className) { return true; } 
	}
	return false;
}

/**
 * Přidá DOM uzlu CSS třídu. Pokud ji již má, pak neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
 */
SZN.Dom.addClass = function(element,className) {
	if (SZN.Dom.hasClass(element,className)) { return; }
	element.className += " "+className;
}

/**
 * Odebere DOM uzlu CSS třídu. Pokud ji nemá, neudělá nic.
 * @param {Object} element DOM uzel
 * @param {String} className CSS třída
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
 * Vymaže (removeChild) všechny potomky daného DOM uzlu
 * @param {Object} element DOM uzel
 */
SZN.Dom.clear = function(element) {
	while (element.firstChild) { element.removeChild(element.firstChild); }
}

/**
 * vrací velikost dokumentu, pro správnou funkcionalitu je třeba aby
 * @method 
 * browser rendroval HTML ve standardním modu 
 * @returns {object} s vlastnostmi:
 * <ul><li><em>width</em> - šířka dokumentu</li><li><em>height</em> - výška dokumentu</li></ul> 
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
 * vrací polohu "obj" ve stránce nebo uvnitř objektu který předám jako druhý 
 * argument
 * @method 
 * @param {object} obj HTML elmenet, jehož pozici chci zjistit
 * @param {object} [ref] <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
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
	Par noticek k výpočtům odscrollovaní:
	- rodič body je html (documentElement), rodič html je document
	- v strict mode má scroll okna nastavené html
	- v quirks mode má scroll okna nastavené body
	- opera dává vždy do obou dvou
	- safari dává vždy jen do body
*/

/**
 * vrací polohu "obj" v okně nebo uvnitř objektu který předáme jako druhý 
 * argument, zahrnuje i potencialni odskrolovani kdekoliv nad objektem 
 *	Par noticek k výpočtům odscrollovaní:<br />
 *	- rodič body je html (documentElement), rodič html je document<br />
 *	- v strict mode má scroll okna nastavené html<br />
 *	- v quirks mode má scroll okna nastavené body<br />
 *	- opera dává vždy do obou dvou<br />
 *	- safari dává vždy jen do body <br />
 * @method 
 * @param {object} obj HTML elmenet, jehož pozici chci zjistit
 * @param {object} <strong>volitelný</strong> HTML element, vůči kterému chci zjistit pozici <em>obj</em>, element musí být jeho rodič
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontalní pozice prvku</li><li><em>top</em>(px) - vertikální pozice prvku</li></ul> 
 */
 SZN.Dom.getFullBoxPosition = function(obj, parent) {
	var pos = SZN.Dom.getBoxPosition(obj, parent);
	var scroll = SZN.Dom.getBoxScroll(obj, parent);
	return {left:pos.left-scroll.x,top:pos.top-scroll.y};
}

/**
 * vrací dvojici čísel, o kolik je "obj" odscrollovaný vůči oknu nebo vůči zadanému rodičovskému objektu
 * @method 
 * @param {object} obj HTML elmenet, jehož odskrolovaní chci zjistit
 * @param {object} <strong>volitelný</strong> HTML element, vůči kterému chci zjistit odskrolování <em>obj</em>, element musí být jeho rodič
 * @returns {object} s vlastnostmi :
 * <ul><li><em>left</em>(px) - horizontální scroll prvku</li><li><em>top</em>(px) - vertikální scroll prvku</li></ul> 
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
 * vrací aktuální odskrolování stránky
 * @method  
 * @returns {object} s vlastnostmi:
 * <ul><li><em>x</em>(px) - horizontální odskrolování</li><li><em>y</em>(px) - vertikální odskrolování</li></ul> 
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
 * vraci současnou hodnotu nějaké css vlastnosti
 * @method 
 * @param {object} elm HTML elmenet, jehož vlasnost nás zajímá
 * @param {string} property řetězec s názvem vlastnosti ("border","backgroundColor",...)
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

/*
 * nastavuje objektu konkretny styly, ktere jsou zadany v objektu pojmenovanych vlastnosti (nazev_CSS : hodnota)
 * @method 
 * @param {object} elm HTML element, jehož vlastnosti měním
 * @param {object} style objekt nastavovaných vlastností, např.: {color: 'red', backgroundColor: 'white'}
 */
SZN.Dom.setStyle = function(elm, style) {
	for (name in style) {
		elm.style[name] = style[name];
	}
}

/**
 * skrývá elementy které se mohou objevit v nejvyšší vrstvě a překrýt obsah,
 * resp. nelze je překrýt dalším obsahem (typicky &lt;SELECT&gt; v internet exploreru)
 * @method  
 * @param {object | string} HTML element nebo jeho ID pod kterým chceme skrývat problematické prvky
 * @param {array} elements pole obsahující názvy problematických elementů
 * @param {string} action akce kterou chceme provést 'hide' pro skrytí 'show' nebo cokoli jiného než hide pro zobrazení
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
	
	function testParent(node) {
		var ok = false;
		var cur = node;
		while (cur.parentNode && cur != document) {
			if (cur == obj) { ok = true; }
			cur = cur.parentNode;
		}
		return ok;
	}
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
				if (testParent(elm[f])) { continue; }
				node.width = elm[f].offsetWidth + node.left;
				node.height = elm[f].offsetHeight + node.top;
				
				if (!((box.left> node.width) || (box.width < node.left) 
				|| (box.top > node.height) || (box.height < node.top))) {
					elm[f].style.visibility = 'hidden';
					elm[f].myPropertyHide = true;
				} else {
					elm[f].style.visibility = 'visible';
					elm[f].myPropertyHide = false;
				}
			}
		}
	} else {
		for (var e = 0; e < elems.length; ++e) {
			var elm = document.getElementsByTagName(elems[e]);
			
			for (var f = 0; f < elm.length; ++f) {
				if (testParent(elm[f])) { continue; }
				if (elm[f].myPropertyHide) {
					elm[f].style.visibility = 'visible';
					elm[f].myPropertyHide = false;
				}
			}
		}
	}
}

/**
 * vrati kolekci elementů které mají nadefinovanou třídu <em>searchClass</em>
 * @method 
 * @param {string} searchClass vyhledávaná třída
 * @param {object} node element dokumentu, ve kterém se má hledat, je-li null prohledává
 * se celý dokument 
 * @param {string} tag název tagu na který se má hledání omezit, je-li null prohledávají se všechny elementy
 * @returns {array} pole které obsahuje všechny nalezené elementy, které mají definovanou třídu <em>searchClass</em>
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
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview Nastroje pro práci s objekty kopírování, serializace, porovnání
 * @version 1.0
 * @author jelc
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
 * implicitni konstruktor, zatím se nepoužívá
 * @method 
 */ 
SZN.ObjCopy.prototype.ObjCopy = function(){

};
/**
 * destruktor, zatím se nepoužívá
 * @method 
 */ 
SZN.ObjCopy.prototype.destructor = function(){

};

/**
 * kopíruje objekt (vytváří a vrací hlubokou datově a typově shodnou kopii svého argumentu)
 * @method  
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
 * kopíruje pole, vytváří datově a typově shodnou kopii pole, které dostane, jako argument
 * @method 
 * @param {array} arrayToCopy pole ke zkopírování
 * @returns {array} kopie pole arrayToCopy
 * @throws {error} 'ObjCopy.arrayCopy: Attribute is not Array' pokud argument metody není pole
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
 * testuje zda je předaný objekt instance některé z nativních tříd javascriptu
 * (String,Number,Array,Boolean,Date,RegExp) a vytváří jejich typově shodnou kopii
 * @private
 * @method   
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
	EXTEND:SZN.ObjCopy
});

/**
 * implicitní konstruktor, zatím se nepoužívá
 * @method 
 */ 
SZN.ObjLib.prototype.ObjLib = function(){

};
/**
 * implicitni destruktor, zatím se nepoužívá
 * @method 
 */ 
SZN.ObjLib.prototype.destructor = function(){

};

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
 * pro lidsky čitelný výstup serializovaného objektu přičítá oddělovací znak k oddělovači
 * @private
 * @method 
 * @param {string} modString aktuálně používaný oddělovač
 * @param {string} counter  jeden stupeň oddělovače
 * @returns {string} modstring + counter
 */   
SZN.ObjLib.prototype._charUp = function(modString,counter){
	return modString + counter;
};
/**
 * pro lidsky čitelný výstup serializovaného objkektu odebírá oddělovací znak z oddelovače
 * @private
 * @method 
 * @param {string} modString aktualně používaný oddělovač
 * @param {string} counter  jeden stupeň oddělovače
 * @returns {string} modstring + counter
 */  
SZN.ObjLib.prototype._charDown = function(modString){
	return modString.substring(0,modString.length-1);
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
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview Práce s HTTPxmlRequestem pro komunikaci klient - server
 * @version 1.0
 * @author koko, jelc 
 */   

/**
 * @class třída provádějící komunikaci klient - server prostřednictvím  HTTPxmlRequest
 * defaultně posíláme dotaz metodou GET, asynchroně a odpověď očekáváme v TXT formatu
 * @name SZN.HTTPRequest
 * @param {string} url url, na které budeme posílat dotazy
 * @param {object} callBackObj objekt, v jehož oboru platnosti zpracováváme odpověď
 * @param {string} callBackFunc metoda, která bude odpověď zpracovávat
 */
SZN.HTTPRequest = SZN.ClassMaker.makeClass({
	NAME: "HTTPRequest",
	VERSION: "1.0",
	CLASS: "class"
});

SZN.HTTPRequest.prototype.$constructor = function(url,callBackObj,callBackFunc){
	/** @field {object} aktuální nastavení pro request*/
	this.data = new Object();
	/** @field {string} url na které se ptáme */
	this.url = url ? url : '';
	/** @field {object} objekt v jehož oboru platnosti zpracujeme odpověď */
	this.callBackObj = callBackObj;
	/** @field {function} metoda, která odpověď zpracuje */
	this.callBackFunc = callBackFunc;

	this.setFormat();
	this.setMode();
	this.setMethod();
	this.setPostData();
	this.setHeaders();
};

/** 
@static 
@constructor
@class třída vytváří "objekt" nastavení pro instanci SZN.Request
@param {string} [url] url serveru, kterého se ptáme
@param {string} [method] metoda dotazu [post,get = default]
@param {string} [postData] data pro dotaz posílaný metodou post
@param {array} [headers] nastavení hlaviček, pole objektů s vlatnostmi <em>type</em> a <em>content</em>
@param {string} [mode]  mod dotazu [sync,async = default]
@param {string} [format] formát odpovědi [xml = default]
*/
SZN.HTTPRequest.Setting = function(url,method,postData,headers,mode,format){
	/** @field {string}  url serveru, kterého se ptáme */
	this.url = url ? url : '';
	/** @field {string} metoda dotazu [post,get = default]*/
	this.method = method ? method : '';
	/** @field {string} mod dotazu [sync,async = default]*/
	this.mode = mode ? mode : '';
	/** @field {string} formát odpovědi [xml = default]*/
	this.format = format ? format : '';
	/** @field {array} nastavení hlaviček, pole objektů s vlatnostmi <em>type</em> a <em>content</em> */
	this.headers = headers ? headers : '';
	/** @field {string} data pro dotaz posílaný metodou post*/
	this.postData = postData ? postData : '';
};


/**
 * @field {object} <strong>konstanta</strong> výčtové pole metod, které se mouhou používat a definice defaultní metody
 */
SZN.HTTPRequest.prototype.METHOD = {
	post : 'post',
	get : 'get',
	def : 'get'
};
/**
 * @field {object} <strong>konstanta</strong> výčtové pole formatů odpovědí, které se mouhou používat a definice defaultního formatu
 * 
 */
SZN.HTTPRequest.prototype.FORMAT = {
	xml : 'xml',
	txt : 'txt',
	def : 'txt'
};
/**
 * @field {object} <strong>konstanta</strong> výčtové pole modu dotazu, které se mouhou používat a definice defaultního modu
 */
SZN.HTTPRequest.prototype.MODE = {
	async : true,
	sync :  false,
	def : true
};

/**
 * @field {array} <strong>konstanta</strong> výchozí nastaveni http hlavičky dotazu
 */
SZN.HTTPRequest.prototype.HEADER = [{typ:'Content-Type', content:'application/x-www-form-urlencoded' }];

/**
 * destruktor
 * @method  
 *
 */  
SZN.HTTPRequest.prototype.destructor = function(){
	for(var i in this){
		this[i] = null;
	}
};
/**
 * inicializace <strong>nepoužívá se</strong>
 * @method 
 *
 */  
SZN.HTTPRequest.prototype.init = function(){};

/**
 * nastavuje metodu komunikace klient - server dle argumentu, pokud argument
 * není definován v objektu METHOD použije se výchozí
 * @method  
 * @param {string} method metoda komunikace klient server [get,post]
 */  
SZN.HTTPRequest.prototype.setMethod = function(method){
	this.data.method = this._getMethod(method);
};
/**
 * nastavuje mod komunikace klient - server dle argumentu, pokud argument
 * není definován v objektu MODE použije se výchozí
 * @method  
 * @param {string} mode mod komunikace klient server [sync,async]
 */  
SZN.HTTPRequest.prototype.setMode = function(mode){
	this.data.mode = this._getMode(mode);
};
/**
 * nastavuje format odpovědi serveru dle argumentu, pokud argument
 * není definován v objektu FORMAT použije se výchozí
 * @method  
 * @param {string} format format odpovědi serveru [xml,txt]
 */  
SZN.HTTPRequest.prototype.setFormat = function(format){
	this.data.format = this._getFormat(format);
};
/**
 * nastavuje HTTP hlavičky dotazu
 * @method 
 * @param {array} headers pole objektu s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavičky</li>
 * <li>content - hodnota hlavičky</li>
 * </ul>    
 */  
SZN.HTTPRequest.prototype.setHeaders = function(headers){
	this.data.headers = this._setHeaders(headers);
};
/**
 * nastavuje data, která se mají posílat metodou POST
 * @method 
 * @param {string} data data, která se budou posílat POSTem
 */  
SZN.HTTPRequest.prototype.setPostData = function(data){
	this.data.postData = data ? data : '';
};

/**
 *  vlastní vyvolání HTTPxmlRequestu, předané parametry se použijí pro konkretní dotaz
 * pokud některý není definován použije se výchozí, nebo nastavený
 * @method  
 * @param {string} url url, na které budeme posílat dotazy (musí být zadán, ale může být prazdný)
 * @param {object} callBackObj objekt v jehož oboru platnosti zpracováváme odpověď (musí být zadán, ale může být prazdný)
 * @param {string} callBackFunc metoda, ktera bude odpoved zpracovavat (musí být zadán, ale může být prazdný)
 * @param {object} requestData [<em>volitelne</em>] instance objektu Setting s dalšími daty
 * @param {boolean} [returnOnly] pokud používáme synchronní request určuje zda se volá callback funkce (parametr má
 * hodnou "false" nebo není zadán - výchozí stav ), nebo bude pouze vracet odpověď od serveru (parametr má hodnotu "true")
 * musí být zadán pokaždé, když použijeme metodu send a nechceme výchozí chování, na asynchroní volání nemá vliv 
 * @returns {object} 1) v případě asynchroního requestu objekt reprezentující request<br>
 * 2) v případě synchroního requestu vrací odpověď serveru  jako objekt s vlastnostmi <em>status</em> a <em>data</em> je-li
 *  returnOnly zadáno jako true, jinak nevrací nic
 */      
SZN.HTTPRequest.prototype.send = function(url,obj,method,requestData,returnOnly){
	var mySelf = this;
	var param = requestData ? requestData : {};
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
				if(data.format == 'xml'){
					var out = XHR.responseXML;
				} else if(data.format == 'txt'){
					var out = XHR.responseText;
				}
				data.callBackObj[data.callBackFunc](out,XHR.status);
				XHR = null;
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
		if(returnOnly){
			return { status : XHR.status, data : out };
		} else {
			data.callBackObj[data.callBackFunc](out,XHR.status);
		}
	} else {
		return XHR;
	}
};

/**
 * umožňuje zrušit asynchroní dotaz pokud již není zpracováván
 * @method 
 * @param {object} XHR objekt requestu vracený metodou send
 */   
SZN.HTTPRequest.prototype.abort = function(XHR){
	if (typeof XHR == 'object') {
		XHR.abort();
	} else {
		return 0;
	}
};

/**
 * vrací metodu jakou bude probíhat komunikace klient - server pokud je známá,
 * jinak vrací výchozí, definovanou v objektu METHOD
 * @private
 * @method  
 * @param {string} method požadovaná metoda   
 * @returns {string}
 */  
SZN.HTTPRequest.prototype._getMethod = function(method){
	return (typeof this.METHOD[method] != 'undefined') ? this.METHOD[method] : this.METHOD['def'];
};
/**
 * vrací mod v jakém bude probíhat komunikace klient - server pokud je známá,
 * jinak vrací vychozí, definovanou v objektu MODE
 * @private
 * @method 
 * @param {string} mode požadovaný mod
 * @returns {string}
 */ 
SZN.HTTPRequest.prototype._getMode = function(mode){
	return (typeof this.MODE[mode] != 'undefined') ? this.MODE[mode] : this.MODE['def'];
};
/**
 * vrací formát jakou bude probíhat komunikace klient - server pokud je znám,
 * jinak vrací vychozí, definovaný v objektu FORMAT
 * @private
 * @method  
 * @param {string} format požadovaný formát
 * @returns {string}
 */ 
SZN.HTTPRequest.prototype._getFormat = function(format){
	return (typeof this.FORMAT[format] != 'undefined') ? this.FORMAT[format] : this.FORMAT['def'];
};
/**
 * připravuje nastavení HTTP hlaviček pro zasílany dotaz, pokud nenajde v
 * argumentu hlavičku 'Content-type', použije definovanou v HEADER
 * @private
 * @method   
 * @param {array} headers pole objektů s vlastnostmi:
 * <ul>
 * <li>typ - typ hlavičky</li>
 * <li>content - hodnota hlavičky</li>
 * </ul> 
 * @returns {array} pole požadovaných hlaviček, které mají být nastaveny 
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
 * provadí nastavení vlastností pro daný dotaz, aktuálně volanou metodu
 * <em>send</em> aniž by přepisoval nastavené (nutné kvůli asynchronímu volání)
 * @private
 * @method   
 * @param {string} url url, na které budeme posílat dotazy (musí být zadán, ale může být prazdný)
 * @param {object} obj objekt, v jehož oboru platnosti zpracováváme odpověď (musí být zadán, ale může být prazdný)
 * @param {string} func metoda, která bude odpověď zpracovávat (musí být zadán, ale může být prazdný)
 * @param {object} setting [<em>volitelné</em>] instance objektu Setting s dalšími daty
 * @returns {object} data, která se použijí v metodě <em>send</em>
 */   
SZN.HTTPRequest.prototype._setFromData = function(url,obj,func,setting){
	var data = new Object();
	for(var i in this.data){
		switch (i){
			case 'method':
				if(setting[i]){
					data[i] = this._getMethod(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'format':
				if(setting[i]){
					data[i] = this._getFormat(setting[i])
				} else {
					data[i] = this.data[i]
				}
				break;
			case 'mode':
				if(setting[i]){
					data[i] = this._getMode(setting[i])
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
 * crossplatformí vytváření HTTPxmlRequestu
 * @private
 * @method  
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
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview Rozhraní určené k práci s uživatelskými událostmi a "globálními" 
 * zprávami, které zjednodušuje práci s objektem, který se o uživatelsky 
 * definované události stará
 * @name SZN.SigInterface
 * @version 1.0
 * @author jelc, zara
 */   

/**
 * @class třída pro dědění rozhraní "SigInterface", 
 * jedná se v podstatě o "abstraktní třídu", u které nemá smysl vytvářet její instance
 * a slouží pouze k definování děděných vlastností.
 * Rozhraní pro práci s uživatelsky definovanými událostmi a zprávami
 * vyžaduje referenci na instanci třídy SZN.signals, všechny následující metody
 * jsou určeny k použití pouze jako zděděné vlastnosti rozhraní,
 * @see <strong>SZN.signals</strong> 
 */  
SZN.SigInterface = SZN.ClassMaker.makeClass({
	NAME: "SigInterface",
	VERSION: "1.0",
	CLASS: "class"
});

/**
 * slouží k nalezení rozhraní u rodičovských tříd, hledá v nadřazených třídách třídu,
 * ktera ma nastavenou vlastnost TOP_LEVEL a v ni očekává instanci třídy SZN.Signals s
 * nazvem "interfaceName"
 * @method   
 * @param {string}	interfaceName  název instance třídy SZN.Signals v daném objektu 
 * @returns {object} referenci na instanci třídy SZN.Signals
 * @throws {error} 	SetInterface:Interface not found  
 */
SZN.SigInterface.prototype.setInterface = function(interfaceName){
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
 * slouží k registraci zachytávaní události nad objektem, který implementuje toto rozhraní
 * @method
 * @param {string} type název události, kterou chceme zachytit
 * @param {string} handleFunction název metody objektu 'myListener', která bude zpracovávat událost
 * @throws {error} pokud neexistuje odkaz na instanci SZN.Signals vyvolá chybu 'Interface not defined'
 */
SZN.SigInterface.prototype.addListener = function(type,handleFunction){
	if(typeof(this.signals) == 'object'){
		this.signals.addListener(this,type,handleFunction);
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * slouží k zrušení zachytáváni události objektem, který implementuje toto rozhraní
 * @method
 * @param {string} type název události, kterou jsme zachytávali
 * @param {string} handleFunction název metody objektu 'myListener', která udalost zpracovávala
 * @throws {error} pokud neexistuje odkaz na instanci SZN.Signals vyvolá chybu 'Interface not defined'
 */
SZN.SigInterface.prototype.removeListener = function(type,handleFunction){
	if(typeof(this.signals) == 'object'){
		this.signals.removeListener(this,type,handleFunction);
	} else {
		throw new Error('Interface not defined');
	}
};

/**
 * vytváří novou událost, kterou zachytáva instance třídy SZN.Signals
 * @method 
 * @param {string} type název vyvolané události
 * @param {string} accessType určuje zda bude událost viditelná i ve veřejném rozhraní
 *					  nebo pouze vnitrnim objektum [private | public]
 * @throws {error} pokud neexistuje odkaz na instanci SZN.Signals vyvolá chybu 'Interface not defined'  
 */
SZN.SigInterface.prototype.makeSigEvent = function(type,accessType){
	if(typeof(this.signals) == 'object'){
		var time = new Date().getTime();
		this.signals.makeEvent(type,this,accessType,time);
	} else {
		throw new Error('Interface not defined');
	}
};
/**
 * nastavuje zprávu se jménem <em>msgName</em> na hodnotu <em>msgValue</em>
 * @method 
 * @param {string} msgName název zprávy
 * @param {any} msgValue obsah zprávy
 */   
SZN.SigInterface.prototype.setSysMessage = function(msgName,msgValue){
	this.signals.setMessage(msgName,msgValue);
};
/**
 * čte zprávu se jménem <em>msgName</em>
 * @method 
 * @param {string} msgName název zprávy
 * @return {any} obsah zprávy
 */ 
SZN.SigInterface.prototype.getSysMessage = function(msgName){
	return this.signals.getMessage(msgName);
};
/**
 * Licencováno pod MIT Licencí
 *
 * © 2008 Seznam.cz, a.s.
 * Tímto se uděluje bezúplatná nevýhradní licence k oprávnění užívat Software,
 * časově i místně neomezená, v souladu s příslušnými ustanoveními autorského zákona.
 *
 * Nabyvatel/uživatel, který obdržel kopii tohoto softwaru a další přidružené soubory (dále jen „software“)
 * je oprávněn k nakládání se softwarem bez jakýchkoli omezení, včetně bez omezení práva software užívat,
 * pořizovat si z něj kopie, měnit, sloučit, šířit, poskytovat zcela nebo zčásti třetí osobě (podlicence)
 * či prodávat jeho kopie, za následujících podmínek:
 *
 * - výše uvedené licenční ujednání musí být uvedeno na všech kopiích nebo podstatných součástech Softwaru.
 *
 * - software je poskytován tak jak stojí a leží, tzn. autor neodpovídá za jeho vady, jakož i možné následky,
 * ledaže věc nemá vlastnost, o níž autor prohlásí, že ji má, nebo kterou si nabyvatel/uživatel výslovně vymínil.
 */

/**
 * @overview Vytváření a zachytávání vlastních uživatelských událostí, správa
 * globálních zpráv
 * @version 1.0
 * @author jelc, zara
 */
 SZN.Signals = SZN.ClassMaker.makeClass({
	NAME: "Signals",
	VERSION: "1.0",
	CLASS: "class"
});
 
 
/**
 * @class třída pro práci s uživatelsky definovanými událostmi a správou 
 * globálních zpráv,
 * @name SZN.Signals
 * @param {object} owner objekt vlastnící instanci třídy
 * @param {string} name název instance
 */
SZN.Signals.prototype.$constructor = function(owner,name){
	/** 
	 * @private
	 * @field {object}  vlastník instance
	 */
	this._owner = owner;
	/** 
	 * @private
	 * @field {string} název instance
	 */	
	this._name = name;

	/** 
	 * @field {object} zásobník zpráv pro asyncroní processy apod...
 	 */
	this.messageFolder = new Object();
	/**
	 * @field {object} asociativní pole, do kterého se vkládají vzniklé události a
	 * odkud se zpracovávají	 
	 */
	this.myEventFolder = new Object();
	/**
	 * @field {object} zásobník posluchačů událostí
	 */
	this.myHandleFolder = new Object();
	/**
	 * @field {boolean} proměná, která určuje, zda je definováno nějaké veřejné API
	 * pro události	 
	 */	
	this.apiHandler = null;
};

SZN.Signals.prototype.$destructor = function(){
	// nothing now
};

SZN.Signals.prototype.setApiHandler = function(handler) {
	this.apiHandler = handler;
}

/**
 * vkládání "globálních" zpráv
 * @method 
 * @param {string} msgName název zprávy 
 * @param {any} msgValue hodnota zprávy 
 */
SZN.Signals.prototype.setMessage = function(msgName,msgValue){
	this.messageFolder[msgName] = msgValue;
};

/**
 * metoda pro získání hodnoty konkrétní "globální" zprávy
 * @param {string} msgName název zprávy
 * @returns {any} hodnotu uložená zprávy
 */
SZN.Signals.prototype.getMessage = function(msgName){
	return this.messageFolder[msgName];
};

/**
 * registrace posluchače uživatelské události, pokud je již na stejný druh 
 * události zaregistrována shodná metoda shodného objektu nic se neprovede,
 * @method  
 * @param {object} owner	objekt/třída,  která naslouchá, a v jehož oboru platnosti se zpracování události provede
 * @param {string} type	typ události, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchače, která ma danou událost zpracovat
 * @returns {number} 1 v případě neúspěchu, 0 v pripade úspěchu 
 */
SZN.Signals.prototype.addListener = function(owner,type,funcOrString){
	this._addListener(owner,type,funcOrString);	
};

/**
 * vlastni registrace posluchače uživatelské události
 * @private
 * @method  
 * @param {object} owner	objekt/třída,  která naslouchá, a v jehož oboru platnosti se zpracovaní události provede
 * @param {string} type	typ události, kterou chceme zachytit 
 * @param {string} functionName funkce/metoda posluchače, která má danou událost zpracovat
 * @returns {number} 1 v případě neúspěchu, 0 v pripade úspěchu 
 */
SZN.Signals.prototype._addListener = function(owner,type,funcOrString){
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
	
	/* identifikátor handlované události */
	var ids = SZN.idGenerator();
	//this.idsFlag++;
	
	/* konecne si to můžu zaregistrovat */
	this.myHandleFolder[type][ids] =	{
		eOwner		: owner,
		eFunction	: funcOrString
	};
	return 0;
};

/**
 * odstranění naslouchání události
 * @method 
 * @param {object} owner	objekt/třída  ktera naslouchala, a v jehož oboru platnosti se zpracování události provádělo
 * @param {string} type	typ události, kterou jsme zachytávali
 * @param {string} functionName funkce/metoda posluchače, která danou událost zpracovávala
 * @returns {number} 0 v případě úspěchu, 1 v případě neúspěchu
 */
SZN.Signals.prototype.removeListener = function(owner,type,funcOrString){
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
 * vytváří událost, ukládá ji do zásobníku události a předává ji ke zpracování
 * @method 
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {string} accessType určuje zda bude událost viditeláa i ve veřejném rozhraní (je-li definováno) nebo pouze vnitřním objektům [public | private]
 * @param {number} timestamp čas vzniku události 
 */   
SZN.Signals.prototype.makeEvent = function(type,trg,accessType,timestamp){
	var ids = SZN.idGenerator();
	this.myEventFolder['e-' + ids] = new this.NewEvent(type,trg,accessType,timestamp,ids);
	this.myEventHandler(this.myEventFolder['e-' + ids]);
};


/**
 * @class konstruktor vnitřní události
 * @param {string} type název nové události
 * @param {object} trg reference na objekt, který událost vyvolal
 * @param {string} accessType určuje zda bude událost viditeláa i ve veřejném rozhraní (je-li definováno) nebo pouze vnitřním objektům [public | private]
 * @param {number} timestamp čas vzniku události 
 * @param {string} ids unikatní ID 
 */   
SZN.Signals.prototype.NewEvent = function(type,trg,access,time,ids){
	/** @field {string} typ události*/
	this.type = type;
	/** @field {object}  objekt, který událost vyvolal*/
	this.target = trg;
	/** @field {string}  specifikace přístupových prav [public|private]*/
	this.accessType = access;
	/** @field {number} timestamp */
	this.timeStamp = time;
	/** 
	 * @private	
	 * @field {string} unikatní ID
	 */
	this._id = ids;
};


/**
 * zpracuje událost - spustí metodu, která byla zaragistrována jako posluchač  
 * a je-li definované API a událost je veřejná předá ji API handleru
 * definovaného API nakonec zavolá zrušení události
 * @method 
 * @param {object} myEvent zpracovávaná událost
 */    
SZN.Signals.prototype.myEventHandler = function(myEvent){
	var functionCache = [];

	for(var i in this.myHandleFolder){
		if((i == myEvent.type)){
			for(var j in this.myHandleFolder[i]){
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
	&& (this.apiDefined != null) 
	&& (myEvent._owner != 'api')){
		this._owner.apiHandler._apiEventHandler(myEvent);
	}	
	
	/* zrusim udalost */
	this.destroyEvent(myEvent._id);
};

/**
 * destruktor události, odstraní událost definovanou 
 * v zásobniku a smaže ji
 * @method 
 * @param {string} ids identifikátor události v zásobníku
 */     
SZN.Signals.prototype.destroyEvent = function(ids){
	this.myEventFolder['e-' + ids] = null;
	delete(this.myEventFolder['e-' + ids]);
};

