/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Třída sloužící ke zpracovavaní udalostí a časovačů poskytovaných DOM modelem.
 * @version 3.3
 * @author jelc, zara
 */   

/**
 * Jmenný prostor pro správu událostí . JAK.Events jsou <strong>DEPRECATED</strong>, namísto toho se doporučuje použití standardních API.
 * @group jak
 * @namespace
 */   
JAK.Events = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Events",
	VERSION: "3.3"
});

/**
 * do této vlastnosti ukládáme všechny události pro odvěšení
 */ 
JAK.Events._events = {};
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
		document.addEventListener("DOMContentLoaded", process.bind(this), false);
	}

	this._domReadyCallbacks.push(f);
}

/**
 * Zavěšuje posluchače na danou událost; vytváří a ukládá si anonymní funkci
 * která provede vlastní volání registroveného posluchače tak, aby se provedl ve správném
 * oboru platnosti. (this uvnitř posluchače se bude vztahovat k objektu, jehož je naslouchající funkce metodou;
 * jako parametry se předá odkaz na vzniklou událost a prvek, na kterém se naslouchalo.)<br/>
 *
 * Možno volat následujícími způsoby:
 * <ul>
 * <li>addListener(node, "click", obj)</li>
 * <li>addListener(node, "click", fce)</li>
 * <li>addListener(node, "click", obj, fce)</li>
 * <li>addListener(node, "click", obj, "nazevFce")</li>
 * </ul>
 *
 * @param {node} elm element, který událost zachytává
 * @param {string} type název události (bez předpony "on"); možno zadat víc událostí naráz oddělených mezerami
 * @param {object || function} obj 1) objekt, jehož metodu budeme volat, 2) objekt s metodou handleEvent, 3) funkce
 * @param {function || string} [func] funkce, která se bude provádět jako posluchač;
 * <em>string</em> pokud jde o metodu <em>obj</em> nebo reference na funkci, která se zavolá
 * jako metoda <em>obj</em>  
 * @param {boolean} [capture] hodnata použitá jako argument capture pro DOM zachytávání, pro IE je ignorována 
 * @returns {string} identifikátor handleru v <em>_events</em>, prostřednictvím kterého se událost odvěšuje
 *
 * @throws {error} Events.addListener: arguments[3] must be method of arguments[2]
 */
JAK.Events.addListener = function(elm, type, obj, func, capture) {
	obj = obj || window;
	capture = capture || false;

	var id = JAK.idGenerator();

	/* nasledujici sada podminek zpracuje vsechny povolene kombinace vstupu do jedineho spravneho handleru "action" */
	var action = obj;
	if (func) {
		if (typeof(func) == "string") { /* zadano jako string */
			if (typeof(obj[func]) != "function") { throw new Error("Events.addListener: arguments[3] must be method of arguments[2]"); }
			action = function(e) { obj[func](e, elm, id); }
		} else { /* zadano referenci na fci */
			action = function(e) { func.call(obj, e, elm, id); }
		}
	} else if (typeof(obj) == "function") { /* zadano referenci na fci bez objektu */
		action = function(e) { obj(e, elm, id); }
	} else if (!document.addEventListener) { /* varianta handleEvent, ale bez nativni podpory */
		action = function(e) { 
			e.currentTarget = elm;
			obj.handleEvent(e); 
		}
	}

	this._addListener(elm, type, action, capture);

	this._events[id] = {
		elm: elm,
		type: type,
		action: action, 
		capture: capture
	};

	return id;
}

/**
 * Vlastní zavěšení posluchače buď DOM kompatibilně, nebo přes attachEvent pro IE 
 * @param {node} elm element, který událost zachytává
 * @param {string} type typ události bez předpony "on"; možno zadat víc událostí naráz oddělených mezerami
 * @param {function || object} action funkce/metoda která se bude provádět
 * @param {boolean} capture hodnota použitá jako argument capture pro DOM zachytávání
 */    
JAK.Events._addListener = function(elm, type, action, capture) {
	var types = type.split(" ");
	for (var i=0;i<types.length;i++) {
		var t = types[i];
		if (elm.addEventListener) {
			elm.addEventListener(t, action, capture);
		} else {
			elm.attachEvent("on"+t, action);
		}
	}
}

/**
 * Odebírání posluchačů události zadáním <em>id</em>, které vrací medoda <em>addListener</em>
 * @param {string} id ID události
 */    
JAK.Events.removeListener = function(id) {
	if (!(id in this._events)) { throw new Error("Cannot remove non-existent event ID '"+id+"'"); }

	var obj = this._events[id];
	this._removeListener(obj.elm, obj.type, obj.action, obj.capture);
	delete this._events[id];
}

/**
 * provádí skutečné odvěšení posluchačů DOM kompatibilně či pro IE
 * @param {object} elm element na kterém se naslouchalo
 * @param {string} type událost, která se zachytávala; možno zadat víc událostí naráz oddělených mezerami
 * @param {function} action skutečná funkce, která zpracovávala událost
 * @param {boolean} capture pro DOM zpracovávání stejna hodota jako při zavěšování
 */    
JAK.Events._removeListener = function(elm, type, action, capture) {
	var types = type.split(" ");
	
	for (var i=0;i<types.length;i++) {
		var t = types[i];
		if (elm.removeEventListener) {
			elm.removeEventListener(t, action, capture);
		} else {
			elm.detachEvent("on"+t, action);
		}
	}
}

/**
 * Provede odvěšení událostí podle jejich <em>id</em> uložených v poli
 * @param {id[]} array pole ID událostí jak je vrací metoda <em>addListener</em>
 */  
JAK.Events.removeListeners = function(array) {
	while (array.length) { this.removeListener(array.shift()); }
}


/**
 * Provede odvěšení všech posluchačů, kteří jsou uloženi v <em>_events</em>
 */   
JAK.Events.removeAllListeners = function() {
	for (var id in this._events) { this.removeListener(id); }
}

/**
 * Zastaví probublávaní události stromem dokumentu
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
 * Zruší výchozí akce (definované klientem) pro danou událost (např. prokliknutí odkazu)
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
 * Vrací cíl události, tedy na kterém DOM elementu byla vyvolána.
 * @param {object} e událost 
 */  
JAK.Events.getTarget = function(e) {
	var e = e || window.event;
	return e.target || e.srcElement; 
}
