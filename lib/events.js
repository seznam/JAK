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
 * @version 2.5
 * @author jelc, zara
 */   

/**
 * Jmenný prostor pro správu událostí
 * @group jak
 * @namespace
 */   
JAK.Events = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Events",
	VERSION: "2.5"
});

/**
 * do této vlastnosti ukládáme všechny události pro odvěšení
 */ 
JAK.Events._eventFolder = {};

/**
 * vnitřní proměnné pro onDomRady()
 * @private 
 */ 
JAK.Events._domReadyTimer = null;
JAK.Events._domReadyCallback = [];   //zasobnik s objekty a jejich metodami, ktere chci zavolat po nastoleni udalosti
JAK.Events._domReadyAlreadyRun = false;/*ondomready je odchytavano specificky pro ruzne browsery a na konci je window.onload, tak aby se nespustilo 2x*/
JAK.Events._windowLoadListenerId = false; /*v nekterych prohlizecich pouzivame listener, pro jeho odveseni sem schovavam jeho id*/

/**
 * metoda kterou použijeme, pokud chceme navěsit vlastní kód na událost, kdy je DOM strom připraven k použití.
 * Je možné navěsit libovolný počet volaných funkcí.   
 * @method 
 * @param {object} obj objekt ve kterém se bude událost zachytávat, pokud je volána
 * globalní funkce musí byt 'window' případně 'document' 
 * @param {function || string} func funkce, která se bude provádět jako posluchač  
 */ 
JAK.Events.onDomReady = function(obj, func) {
	JAK.Events._domReadyCallback[JAK.Events._domReadyCallback.length] = {obj: obj, func: func}
	JAK.Events._onDomReady();
}

/**
 * vnitrni metoda volana z onDomReady, dulezite kvuli volani bez parametru pro IE, abychom v tom timeoutu mohli volat sama sebe
 * @private
 * @method 
 */ 
JAK.Events._onDomReady = function() {
	if((/Safari/i.test(navigator.userAgent)) || (/WebKit|Khtml/i.test(navigator.userAgent))){ //safari, konqueror
		JAK.Events._domReadyTimer=setInterval(function(){
			if(/loaded|complete/.test(document.readyState)){
			    clearInterval(JAK.Events._domReadyTimer);
			    JAK.Events._domReady(); // zavolani cilove metody
			}}, 10);
	} else if (document.all && !window.opera){ //IE
		//v IE
		//nejsme v ramu
		if (window.parent == window) {
			try {
				// Diego Perini trik bez document.write, vice viz http://javascript.nwbox.com/IEContentLoaded/
				document.documentElement.doScroll("left"); //test moznosti scrolovat, scrolovani jde dle msdn az po content load
			} catch( error ) {
				setTimeout( arguments.callee, 1 ); //nejde, tak volam sama sebe
				return;
			}
			// uz to proslo
			JAK.Events._domReady(); // zavolani cilove metody
		
			//v ramu horni kod nefunguje, protoze document.documentElement je jen stranka s framesetem a ten je rychle nacten ale v ram nacten a byt redy nemusi 
		} else {
			JAK.Events._windowLoadListenerId = JAK.Events.addListener(window, 'load', window, function(){JAK.Events._domReady();});
		}
	} else 	if (document.addEventListener) { //FF, opera
		//JAK.Events._domReadyAlreadyRun = true;
  		document.addEventListener("DOMContentLoaded", JAK.Events._domReady, false); //FF, Opera ma specifickou udalost 
  	} else {
	  	//pokud nic z toho tak dame jeste onload alespon :-)
	  	JAK.Events._windowLoadListenerId = JAK.Events.addListener(window, 'load', window, function(){JAK.Events._domReady();});
	}
}

/**
 * metoda, která je volána z JAK.Events.onDomReady když je dom READY, tato metoda volá 
 * na předaném objektu funkci která byla zadaná 
 * @private
 * @method 
 */ 
JAK.Events._domReady = function() {
	//zaruceni ze se to spusti jen jednou, tedy tehdy kdyz je _domReadyAlreadyRun=false
	if (!JAK.Events._domReadyAlreadyRun) {
		//metoda byla opravdu zavolana
		JAK.Events._domReadyAlreadyRun = true;
	
		//pro FF, operu odvesim udalost
		if (document.addEventListener) {
			document.removeEventListener("DOMContentLoaded", JAK.Events._domReady, true);
		}
		//odveseni udalosti window.onload
		if (JAK.Events._windowLoadListenerId) {
			JAK.Events.removeListener(JAK.Events._windowLoadListenerId);
			JAK.Events._windowLoadListenerId = false;
		}
		
		//vlastni volani metody objektu
		for(var i=0; i < JAK.Events._domReadyCallback.length; i++) {
			var callback =  JAK.Events._domReadyCallback[i];
			if (typeof callback.func == 'string') {
				callback.obj[callback.func]();
			} else {
				callback.func.apply(callback.obj, []);
			}
		}
		//cisteni, uz nechceme zadny odkazy na objekty a funkce
		JAK.Events._domReadyCallback = [];
	}
	
}

/**
 * Zavěšuje posluchače na danou událost, vytváří a ukládá si anonymní funkci
 * která provede vlastní volání registroveného posluchače tak aby se provedl ve správném
 * oboru platnosti. (this uvnitř posluchače se bude vztahovat k objektu jehož je naslouchající funkce metodou  
 * a jako parametry se jí předá odkaz na událost, která byla zachycena a element, na kterém se naslouchalo.)<br/>
 * <strong>POZOR!</strong> Dle specifikace se nevolá capture posluchač, pokud je navěšený na prvek, 
 * na kterém událost vznikla (jen na jeho předcích). 
 * Dodržuje to však pouze Opera, Gecko ne (viz https://bugzilla.mozilla.org/show_bug.cgi?id=235441).
 * @param {node} elm element, který událost zachytává
 * @param {string} type název události (bez předpony "on")
 * @param {object} obj objekt, jehož metodu budeme volat 
 * @param {function || string} func funkce, která se bude provádět jako posluchač
 * <em>string</em> pokud jde o metodu <em>obj</em> nebo reference na funkci, která se zavolá
 * jako metoda <em>obj</em>  
 * @param {boolean} capture hodnata použitá jako argument capture pro DOM zachytávání, pro IE je ignorována 
 * @returns {string} identifikátor handleru v <em>_eventFolder</em>, prostřednictvím kterého se událost odvěšuje
 * @throws {error} Events.addListener: arguments[3] must be method of arguments[2]
 */
JAK.Events.addListener = function(elm, type, obj, func, capture) {
	var capture = capture || false;
	var action = null;
	var id = JAK.idGenerator();

	if (arguments.length > 3) { /* funkce zadana jako 4. parametr */
		if (typeof(func) == "string" && typeof(obj[func]) != "function") {
			throw new Error("Events.addListener: arguments[3] must be method of arguments[2]");
		}
		action = this._getMethod(obj, func, elm, id);
	} else { /* funkce zadana jako 3. parametr */
		action = this._getMethod(window, obj, elm, id);
	}
	
	this._addListener(elm, type, action, capture);

	this._eventFolder[id] = {
		elm: elm,
		type: type,
		action: action, 
		capture: capture, 
		obj: obj, /* kvuli visualevents */
		func: func /* kvuli visualevents */
	};

	return id;
}

/**
 * Vlastní zavěšení posluchače bud DOM kompatibilně, nebo přes attachEvent pro IE 
 * @param {node} elm element, který událost zachytává
 * @param {string} type typ události bez předpony "on"
 * @param {function} action funkce/metoda která se bude provádět
 * @param {boolean} capture hodnota použitá jako argument capture pro DOM zachytávání
 * @returns {array} obsahující argumenty funkce ve shodném pořadí 
 */    
JAK.Events._addListener = function(elm, type, action, capture){
	if (document.addEventListener) {
		elm.addEventListener(type, action, capture);
	} else if (document.attachEvent) {
		elm.attachEvent('on'+type, action);
	} else {
		throw new Error("This browser can not handle events");
	}
}

/**
 * Vytváří funkci/metodu, která bude fungovat jako posluchač události tak
 * aby předaná metoda byla zpracovávána ve správnem oboru platnosti, this bude
 * objekt který ma naslouchat, požadované metodě předává objekt události a element na
 * kterém se naslouchalo
 * @param {object} obj objekt v jehož oboru platnosti se vykoná <em>func</em> po zachycení události
 * @param {function} func funkce/metoda, u které chceme aby use dálost zpracovávala
 * @param {node} elm Element na kterém se poslouchá (druhý parametr callbacku)
 * @param {string} id ID události (třetí parametr callbacku)
 * @returns {function} anonymní funkce, volaná se správnými parametry ve správném kontextu
 */    
JAK.Events._getMethod = function(obj, func, elm, id) {
	var f = (typeof(func) == "string" ? obj[func] : func);
	return function(e) {
		return f.call(obj, e, elm, id);
	}
}

/**
 * Odebírání posluchačů události zadáním <em>id</em>, které vrací medoda <em>addListener</em>
 * @param {id} id ID události
 */    
JAK.Events.removeListener = function(id) {
	if (!(id in this._eventFolder)) { throw new Error("Cannot remove non-existent event ID '"+id+"'"); }

	var obj = this._eventFolder[id];
	this._removeListener(obj.elm, obj.type, obj.action, obj.capture);
	delete this._eventFolder[id];
}

/**
 * provádí skutečné odvěšení posluchačů DOM kompatibilně či pro IE
 * @param {object} elm element na kterém se naslouchalo
 * @param {string} type událost, která se zachytávala
 * @param {function} action skutečná funkce, která zpracovávala událost
 * @param  {boolean} capture pro DOM zpracovávání stejna hodota jako při zavěšování
 */    
JAK.Events._removeListener = function(elm, type, action, capture) {
	if (document.removeEventListener) {
		elm.removeEventListener(type, action, capture);
	} else if (document.detachEvent) {
		elm.detachEvent('on'+type, action);
	}
}

/**
 * provede odvěšení všech posluchačů, kteří jsou uloženi v <em>_eventFolder</em>
 */   
JAK.Events.removeAllListeners = function() {
	for (var id in this._eventFolder) { this.removeListener(id); }
}

/**
 * zastaví probublávaní události stromem dokumentu
 * @param {object} e zpracovávaná událost 
 */  
JAK.Events.stopEvent = function(e) {
	var e = e || window.event;
	if (e.stopPropagation){
		e.stopPropagation();
	} else { 
		e.cancelBubble = true;
	}
}

/**
 * zruší výchozí akce (definované klientem) pro danou událost (např. prokliknutí odkazu)
 * @param {object} e zpracovávaná událost 
 */   
JAK.Events.cancelDef = function(e) {
	var e = e || window.event;
	if(e.preventDefault) {
		e.preventDefault();
	} else {
		e.returnValue = false;
	}
}

/**
 * vrací cíl události, tedy na kterém DOM elementu byla vyvolána.
 * @param {object} e událost 
 */  
JAK.Events.getTarget = function(e) {
	var e = e || window.event;
	return e.target || e.srcElement; 
}

/**
 * metoda vrací strukturovaný objekt s informacemi o nabindovaných událostech. struktura je vhodná pro bookmarklet
 * Visual Event (http://www.sprymedia.co.uk/article/Visual+Event) od Allana Jardine. Po spuštění jeho JS bookmarkletu
 * jsou navěšené události vizualizovány na dané stránce
 */
JAK.Events.getInfo = function() {
	var output = [];

	var nodes = [];
	var events = [];

	for (var id in JAK.Events._eventFolder) {
		var o = JAK.Events._eventFolder[id];
		var elm = o.elm;

		var index = nodes.indexOf(elm);
		if (index == -1) {
			index = nodes.push(elm) - 1;
			events[index] = [];
		}

		events[index].push(o);
	}

	for (var i=0; i<nodes.length; i++) {
		var listeners = [];
		for (var j=0; i<events[i].length; j++) {
			var o = events[i][j];

			var obj = o.obj || window;
			var func = o.func || o.obj;

			listeners.push({
				'sType': o.type,
				'bRemoved': false,
				'sFunction':  (obj != window && obj.constructor ? '['+obj.constructor.NAME+']' : '') + 
					(typeof(func) == 'string' ? '.'+func+' = '+ obj[func].toString() : ' '+func.toString())
			});
		}

		output.push({
			'sSource': 'JAK',
			'nNode': nodes[i],
			'aListeners': listeners
		});
	}

	return output;
}
