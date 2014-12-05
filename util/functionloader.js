/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * Statická třída JAK.FunctionLoader vystavuje veřejnou metodu ready(), kteoru lze nechat donačíst za běhu další JS
 * zdroje a být informován, až budou načteny. Dále obsahuje doplňkovou metodu loadCSS() pro připnutí za běhu CSS souboru
 * @example
 * Ukázka:
 * JAK.FunctionLoader.ready([
 *			{className: 'geometry',	path:	'http://jak.seznam.cz/js/utils/'},
 *			{className: 'vector',	path:	'http://jak.seznam.cz/js/utils/'},
 *			{className: 'svg',		path:	'http://jak.seznam.cz/js/utils/'},
 *			{className: 'vml',		path:	'http://jak.seznam.cz/js/utils/'}
 *			], mujObj, 'navratovaMetoda');
 *
 * metodě load() je předáno pole s názvem funkčnosti - může být libovolný, ale většinou by se měl shodovat s názvem souboru,
 * volitelnou cestou k souboru (jinak to načítá soubor relativně k dané stránce). Další možné parametry konfiguračního
 * objektu jsou:
 * filename - pokud se soubor jmenuje jinak než className, jde předat název tohoto souboru
 * autoload - boolean hodnota s výchozí hodnotou true, udávající zda se má systém pokusit funkcionalitu načíst, pokud načtena není
 *
 * druhý a třetí parametr metody ready() jsou callback objekt a jeho metoda. Tyto parametry jsou nepovinné. Po načtení
 * je také vytvořen signál s názvem 'functionalityLoaded'. Nejde ale dost dobře odlišit jaký balík souborů (pokud je
 * voláno v jeden čas načtení více balíků funkcionalit najednou) temto sigmál vyvolal.
 *
 *
 * Metoda loadCSS přebírá jeden paremtr s url k souboru, který má připnout do stránky.
 */

/**
 * donacitani funkcionality, pokud trida zavisi na jine {pouziva ji) je vhodne v konstruktoru zavolat tuto tridu s nazvy
 * potrebnych trid a loader zjisti zda je jiz funkcionalita nactena
 * @example
 * JAK.FunctionLoader.ready('ClassName', [autoLoad=true], [filename], [path])
 * @class Function Loader
 * @group jak-utils
 * @namespace
 */
JAK.FunctionLoader = JAK.ClassMaker.makeStatic({
	NAME: 'JAK.FunctionLoader',
	VERSION: '2.0'
});

/**
 * vlastnosti jedinacka  
 */
JAK.FunctionLoader.loadedItems = {}; //uchovava Items kteri rikaji co bylo nacteno

/**
 * @static
 */
JAK.FunctionLoader.ready = function(funcArray, objCallBack, funcCallback) {
	this.loadDefaultScripts();


	//pokud je argumentem objekt, bude z nej pole
	if (! funcArray instanceof Array) {
		funcArray = [funcArray];
	}

	for (var i = 0; i < funcArray.length; i++) {
		funcArray[i].autoLoad = funcArray[i].autoLoad || true;
		funcArray[i].path = funcArray[i].path || false;
		funcArray[i].filename = funcArray[i].filename || false;
		if (!funcArray[i].className) {
			throw new Error('V konfiguračním objektu musí být zadána vlastnost className');
		}
	}
	
	var objCallback = arguments[1] || null;
	var funcCallback = arguments[2] || false;

	//vytvoreni grupy a spusteni jejiho nacteni
	new JAK.FunctionLoader.Group(funcArray, this, objCallback, funcCallback).start();

};

/**
 * zavolani metody pro virtualni vytvoreni Item elementu pro skripty jiz ve strance vlozene
 */
JAK.FunctionLoader.loadDefaultScripts = function() {
	var scripts = document.getElementsByTagName('script');
	for (var i = 0; i < scripts.length; i++) {
		if (scripts[i].src) {
			var s = scripts[i].src;
			var filename = s.substring(s.lastIndexOf('/')+1);
			var className = filename.substring(0, filename.lastIndexOf('.'));

			if (!this.loadedItems[className]) {
				var item = new JAK.FunctionLoader.Item(className);
				item.loaded = true;
				this.loadedItems[className] = item;
			}
		}
	}
}

/**
 * zjisti zda dana funkcionalita je nactena ci nikoli, pokud neni, jde ji to naloadovat, pokud je parametr autoLoad na true
 * @param className
 * @param autoLoad
 * @param path
 * @param filename
 * @returns bool
 */
JAK.FunctionLoader.isPrepared = function(className, autoLoad, path, filename) {
	if (this.loadedItems[className] && this.loadedItems[className].loaded) {
		return true;
	} else {
		if (autoLoad) {
			this.loadNew(className, path, filename);
		}
	}
	return false;
};

/**
 * metoda zajistuje vlastni nacteni, vytvori objekt Item a inicializuje ho
 * @private
 * @param className
 * @param path
 * @param filename
 */
JAK.FunctionLoader.loadNew = function(className, path, filename) {
	if (!filename) {
		filename = className+'.js';
	}
	path +=filename;

	this.loadedItems[className] = new JAK.FunctionLoader.Item(className, path);
	this.loadedItems[className].run();
}

JAK.FunctionLoader.loadCSS = function(url) {
	var links = document.getElementsByTagName('link');
	for (var i = 0; i < links.length; i++) {
		if (links[i].type == 'text/css' && links[i].href == url) {
			return;
		}
	}

	var link = JAK.mel("link", {type:"text/css", rel:"stylesheet", href:url});
	document.getElementsByTagName('head')[0].appendChild(link);
}


/********************************/
/**
 * @class Skupina obalujici nacteni vice skriptu naraz
 * @private
 * @group jak-utils
 * @signal functionalityLoaded
 */
JAK.FunctionLoader.Group = JAK.ClassMaker.makeClass({
	NAME : 'FunctionLoaderGroup',
	VERSION : '1.0',
	CLASS : 'class',
	IMPLEMENT: [JAK.ISignals]
});

/**
 * @param fArray
 * @param functionLoaderInstance
 * @param objCallback
 * @param funcCallback
 */
JAK.FunctionLoader.Group.prototype.$constructor = function(fArray, functionLoaderInstance, objCallback, funcCallback) {
	this._sc = [];
	this.fArray = fArray; //ulozeni pole hodnot co je musim nacist
	this.functionLoaderInstance = functionLoaderInstance; //instance fl ktera mi loaduje me vlastnosti
	this.objCallback = objCallback;
	this.funcCallback = funcCallback;

	this.counter = 0; //pocet knihoven co se maji nacitat
}

JAK.FunctionLoader.Group.prototype.$destructor = function() {
	this.fArray = null;
	this.functionLoaderInstance = null;
}

JAK.FunctionLoader.Group.prototype.start = function() {
	this._signalId = this.addListener('fileLoaded', 'fileLoadedListen');
	var j = 0;
	for (var i = 0; i < this.fArray.length; i++) {
		if (this.functionLoaderInstance.isPrepared(this.fArray[i].className, this.fArray[i].autoLoad, this.fArray[i].path, this.fArray[i].filename) == false) {
			this.counter ++;
			j++;
		}
	}
	
	//taky muze byt vse jiz nacteno, musim se posunout dal sam, hlidam si pomocnou promennou a ne this.counter, ktera se muze zmenit pod rukama
	if (j == 0) {
		this.notify();
	}
}

JAK.FunctionLoader.Group.prototype.fileLoadedListen = function(e) {
	var className = e.target.getClassName();
	for (var i = 0; i < this.fArray.length; i++) {
		if (this.fArray[i].className == className) {
			this.counter--;
			break;
		}
	}

	if (this.counter <= 0) {
		this.notify();
	}
}

JAK.FunctionLoader.Group.prototype.notify = function() {
	this.removeListener(this._signalId);

	this.makeEvent('functionalityLoaded');

	if (this.objCallback !== null && this.funcCallback !== false) {
		this.objCallback[this.funcCallback]();
	}
}

/****************/

/**
 * vlastni item, ktery handluje loadovani a hlida si ho
 * @signal fileLoaded
 * @private
 */
JAK.FunctionLoader.Item = JAK.ClassMaker.makeClass({
	NAME : 'FunctionLoaderItem',
	VERSION : '1.0',
	CLASS : 'class',
	IMPLEMENT: [JAK.ISignals]
});

/**
 * konstruktor
 * @param className
 * @param path
 */
JAK.FunctionLoader.Item.prototype.$constructor = function(className, path) {
	this.className = className;
	this.path = path;
	this.ec = [];

	this.waitForLoadSignal =false; 
	this.loaded = false;
	this.IEloaded = false; //jen pro IE. nacitani JS je pres udalost onReadyState, a ten muze nabyvat vice stavu, takze by se vykonani mohlo volat vicekrat, proto si sem uschovam, ze uz bezelo
}

/**
 * destruktor
 */
JAK.FunctionLoader.Item.prototype.$destructor = function() {
	for (var i = 0; i < this.ec.length; i++) {
		JAK.Events.removeListener(this.ec[i]);
	}
};

JAK.FunctionLoader.Item.prototype.getClassName = function() {
	return this.className;
};

JAK.FunctionLoader.Item.prototype.isLoaded = function() {
	return this.loaded;
};

/**
 * spusteni vlastniho nacteni - vytvoreni script tagu a naveseni udalosti
 */
JAK.FunctionLoader.Item.prototype.run = function() {
	var header = document.getElementsByTagName('head')[0];
	var script = JAK.mel("script", {type:"text/javascript"});
	//script.src = this.path; //presun az za naveseni udalosti

	if (!this.waitForLoadSignal) {
		if ("onreadystatechange" in script) {
			this.ec = JAK.Events.addListener(script, 'readystatechange', this, 'loadCallBackIE', false, true);
			this.IEloaded = false;
		} else {
			this.ec = JAK.Events.addListener(script, 'load', this, 'loadCallBack', false, true);
		}
	} else {
		this.addListener(className+'Loaded', 'loadedCallback');
	}

	script.src = this.path;
	header.appendChild(script);
};

/**
 * tato metoda je volana pouze v IE po nacteni JS dynamicky nalinkovaneho
 * dale vola metodu loadCallback
 * @see loadCallback
 * @param e
 * @param elm
 */
JAK.FunctionLoader.Item.prototype.loadCallBackIE = function(e, elm) {
	if ( (elm.readyState == 'loaded' || elm.readyState == 'complete') && !this.IEloaded ) {
		this.IEloaded = true;
		this.loadCallBack(e, elm);
	}
}

/**
 * metoda volana po nacteni dyn. nalinkovaneho skriptu po uspesnem loginu
 * je setnuty user a nastartovana aplikace auta na mape
 * @param e
 * @param elm
 */
JAK.FunctionLoader.Item.prototype.loadCallBack = function(e, elm) {
	if (!this.waitForLoadSignal) {
		this.makeEvent('fileLoaded');
		this.loaded = true;
	}
}

/**
 * metoda je volana pokud je nastaveno ze chceme poslouchat udalost (signal) nacteni souboru
 * v souboru na konci musi byt v tomto pripade kod se spustenim signalu: neco jako
 * JAK.signals.makeEvent(className+'Loaded', window);
 * @param e
 */
JAK.FunctionLoader.Item.prototype.loadedCallback = function() {
	this.makeEvent('fileLoaded');
	this.loaded = true;
}
