/**
 * @class Obecny spravce historie
 * @signal history-change
 * @group jak-utils
 */
JAK.History2 = JAK.ClassMaker.makeSingleton({
	NAME: 'JAK.History2',
	VERSION: '2.0',
	IMPLEMENT: JAK.ISignals
});

/* konfigurace ve statickem objektu */
JAK.History2.config = {
	useHtml5: true,		//povolit pouzivani html5 history, pokud to prohlizec umi
	processor: null,	//objekt implementujici rozhrani JAK.History2.IProcessor

	//parametry pro JAK.History2.Hash
	useHashBang: true	//pouzit pri ukladani do hashe hashbang (#!) - automaticky pridava/odebira znak '!', pri cteni historie ignoruje obycejny hash
};


JAK.History2.prototype.$constructor = function() {
	JAK.History2.Hash.config.useHashBang = this.constructor.config.useHashBang;
	this._historyHash = JAK.History2.Hash.getInstance();
	
	//vytvoreni objektu, ktery se bude starat o ukladani dat do url/hashe a jejich cteni
	if ( this.constructor.config.useHtml5 && JAK.History2.Html5.isSupported ) {
		this._history = JAK.History2.Html5.getInstance();
		this._isHtml5 = true;
		
		this.addListener('history-html5-change', '_sig_historyChange', this._history);

	} else {					
		this._history = this._historyHash;
		this._isHtml5 = false;
		
		this.addListener('history-hash-change', '_sig_historyChange', this._history);
	}

	this._path = this.constructor.config.useHtml5 ? this.aux_getPath() : ''; //uziti, pokud chceme do historie ulozit relativni url
	this._processor = this.constructor.config.processor;
}


/**
 * Ulozeni dat do historie. Defaultne se vklada novy zaznam do historie, pokud jej chceme prepsat,
 * pouzijeme volitelny parametr replace.
 * @param {object} state
 * @param {Boolean} [replace] Prepsat aktualni historii?
 */
JAK.History2.prototype.save = function(state, replace) {
	if (this._processor) {
		state = this._processor.serialize(state);
	} else {
		state = state + '';
	}
	
	//povoleno pouzivani html5 history a dosel nam k nastaveni relativni odkaz - doplnit path,
	//jinak se to nebude chovat pouzitelne (vznikaly by ruzne retezce ziskane z hashe a z url)
	if ( this._path && state.charAt(0) != '?' && state.charAt(0) != '/') {
		state = this._path + state;
	}

	this._history.save(state, replace);
}

/**
 * Ziskani dat z historie
 */
JAK.History2.prototype.get = function() {	
	//divame se primarne vzdy do hashe, i kdyz jinak pouzivame html5 history
	if (this._isHtml5) {
		 //dulezite!! event hashchange se vyvolava az po eventu popstate, ktery prave zpracovavame,
		 //ale my potrebujeme aktualni hodnotu v hashi hned ted -> "rucni" aktualizace hashe
		this._historyHash.check(); //muze vyslat signal "history-hash-change", ten ale v pripade html5 ignorujeme, takze nam to nevadi
		
		var history = this._historyHash.get();
		if (history) {
			return this._processor? this._processor.parse(history) : history;
		}
	}
	
	var history = this._history.get();

	//pouzivame ukladani do hashe, hash je prazdny a je povoleno pouzivani html5 history -> precist stav z url
	if ( !history && !this._isHtml5 && this.constructor.config.useHtml5 ) {
		var hash = window.location.href.split('#')[1] || '';
		history = window.location.pathname + window.location.search + (hash? '#' + hash : '');	
	}
	
	//ocisteni url - je mozne, ze v historii ziskane z url zbyde na konci '#!' - pryc s tim
	if (
		this.constructor.config.useHashBang && //v hloupych prohlizecich pouzivame hashbang
		(history.length > 1 && history.substr(history.length-2) == '#!') //a posledni dva znaky v url jsou "#!"
	) {
		history = history.substring(0, history.length-2); //pryc posledni 2 znaky #!	
	}
	
	return this._processor? this._processor.parse(history) : history;
}

/**
 *  Zjisteni, zda je historie v hashi
 */
JAK.History2.prototype.isHash = function() {
	return this._historyHash.get() ? true : false;
}

/**
 * Ziskani parametru ze zadaneho retezce, pomoci nastaveneho processoru
 * @param {string} str
 */
JAK.History2.prototype.parseState = function(str) {
	if (typeof str == 'string' && this._processor) {
		return this._processor.parse(str);
	} else {
		return str;
	}
}

/**
 * Slozeni url ze zadaneho objektu, pomoci nastaveneho processoru
 * @param {object} state
 */
JAK.History2.prototype.serializeState = function(state) {
	if (typeof state == 'object' && this._processor) {
		return this._processor.serialize(state);
	} else {
		return state;
	}	
}



/**
 * Posluchac signalu zmeny historie, vysila signal dal
 * @param {signal} sig
 */
JAK.History2.prototype._sig_historyChange = function(sig) {
	var state = this.get();
	this.makeEvent('history-change', {state: state});
}



//--------------------- pomocnici ---------------------//

/** 
 * Ziskani casti url bez adresy serveru a skriptu
 * pr.: http://cosi.cz/prvni/druhy/stranka.html -> /prvni/druhy/
 */
JAK.History2.prototype.aux_getPath = function() {
	var path = window.location.pathname;
	var index = path.lastIndexOf('/');
	if ( (index != -1) && (path.length > index) ) {
		path = path.substring(0, index + 1);
	}
	return path;
}

/**
 * Ze stringu vrati jeho search cast (bez otazniku)
 * pr.: cosi/kdesi?a=1&b=2 -> a=1&b=2
 * pr.: cosi/kdesi -> (empty string)
 */
JAK.History2.prototype.aux_getSearch = function(str) {
	var index = str.indexOf('?');
	return (index != -1)? str.substring(index + 1) : '';
}

