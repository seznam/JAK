/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Třída sloužící ke zpracovavaní udalostí a časovačů poskytovaných DOM modelem.
 * @version 3.2
 * @author jelc, zara
 */   

/**
 * Jmenný prostor pro správu událostí
 * @group jak
 * @namespace
 */   
JAK.Events = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Events",
	VERSION: "3.2"
});

/**
 * do této vlastnosti ukládáme všechny události pro odvěšení
 */ 
JAK.Events._eventFolder = {};
JAK.Events._domReadyCallbacks = [];

/**
 * Metoda kterou použijeme, pokud chceme navěsit vlastní kód na událost, kdy je DOM strom připraven k použití.
 * Je možné navěsit libovolný počet volaných funkcí.   
 * @param {object} obj kontext, tj. "this" pro funkci
 * @param {function || string} func funkce, která se bude provádět jako posluchač  
 */ 
JAK.Events.onDomReady = function(obj, func) {
	var f = (typeof(func) == "function" ? func : obj[func]);
	if (obj) { f = f.bind(obj); }

	if (document.readyState == "complete") { return setTimeout(f, 0); } /* uz bylo, jen asynchronne vykoname */

	if (!this._domReadyCallbacks.length) { /* prvni volani - navesit relevantni posluchac */
		var process = function() {
			while (this._domReadyCallbacks.length) { this._domReadyCallbacks.shift()(); }
		}
		process = process.bind(this);

		if (window.addEventListener) {
			window.addEventListener("DOMContentLoaded", process);
		} else {
			document.attachEvent("onreadystatechange", function() {
				if (document.readyState == "complete") { process(); }
			});
		}
	}

	this._domReadyCallbacks.push(f);
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
 * @param {string} type název události (bez předpony "on"); možno zadat víc událostí naráz oddělených mezerami
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
 * @param {string} type typ události bez předpony "on"; možno zadat víc událostí naráz oddělených mezerami
 * @param {function} action funkce/metoda která se bude provádět
 * @param {boolean} capture hodnota použitá jako argument capture pro DOM zachytávání
 * @returns {array} obsahující argumenty funkce ve shodném pořadí 
 */    
JAK.Events._addListener = function(elm, type, action, capture) {
	var types = type.split(" ");
	
	for (var i=0;i<types.length;i++) {
		var t = types[i];
		if (document.addEventListener) {
			elm.addEventListener(t, action, capture);
		} else if (document.attachEvent) {
			elm.attachEvent('on'+t, action);
		} else {
			throw new Error("This browser can not handle events");
		}
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
 * @param {string} type událost, která se zachytávala; možno zadat víc událostí naráz oddělených mezerami
 * @param {function} action skutečná funkce, která zpracovávala událost
 * @param  {boolean} capture pro DOM zpracovávání stejna hodota jako při zavěšování
 */    
JAK.Events._removeListener = function(elm, type, action, capture) {
	var types = type.split(" ");
	
	for (var i=0;i<types.length;i++) {
		var t = types[i];
		if (document.removeEventListener) {
			elm.removeEventListener(t, action, capture);
		} else if (document.detachEvent) {
			elm.detachEvent('on'+t, action);
		}
	}
}

/**
 * provede odvěšení událostí podle jejich <em>id</em> uložených v poli
 * @param {array} array pole ID událostí jak je vrací metoda <em>addListener</em>
 */  
JAK.Events.removeListeners = function(array) {
	while(array.length) {
		this.removeListener(array.shift());
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
		for (var j=0; j<events[i].length; j++) {
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
