/**
 * @class Obecny spravce historie
 * @signal history-change
 */
JAK.History2 = JAK.ClassMaker.makeSingleton({
	NAME: 'JAK.History2',
	VERSION: '1.0',
	IMPLEMENT: JAK.ISignals
});

/* konfigurace ve statickem objektu */
JAK.History2.config = {
	useHtml5: true,	//povolit pouzivani html5 history, pokud to prohlizec umi
	processor: null,		//objekt implementujici rozhrani JAK.History2.IProcessor

	//parametry pro JAK.History2.Hash
	iframeSrc: '/',			//src pro iframe, pouzivano pro ie7- (vhodne prenastavit napr. na url nejakeho maleho obrazku)
	useHashBang: true		//pouzit pri ukladani do hashe hashbang (#!), automaticky pridava/odebira znak '!'	
};


JAK.History2.prototype.$constructor = function() {
	JAK.History2.Hash.config.iframeSrc = this.constructor.config.iframeSrc;
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
 * Ulozeni dat do historie
 * @param {object} state
 */
JAK.History2.prototype.save = function(state) {
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
	
	this._history.save(state);
}

/**
 * Ziskani dat z historie
 */
JAK.History2.prototype.get = function() {	
	//divame se primarne vzdy do hashe, i kdyz jinak pouzivame html5 history
	if (this._isHtml5) {
		 //dulezite!! event hashchange se vyvolava az po eventu popstate, ktery prave zpracovavame,
		 //ale my potrebujeme aktualni hodnotu v hashi hned ted -> "rucni" aktualizace hashe
		this._historyHash.check();
		
		var hash = this._historyHash.get();
		if (hash) {
			return this._processor? this._processor.parse(hash) : hash;
		}
	}
	
	var history = this._history.get();

	//pouzivame ukladani do hashe, hash je prazdny a je povoleno pouzivani html5 history -> precist stav z url
	if ( !history && !this._isHtml5 && this.constructor.config.useHtml5 ) {
		var url = window.location.pathname + window.location.search;
		if (url) {
			return this._processor? this._processor.parse(url) : url;
		}		
	}
	
	//je mozne, ze v historii z url zbyde na konci neco jako '#!' - pryc s tim
	if (this._isHtml5) {
		var idx = history.indexOf('#');
		history = (idx != -1)? history.substring(0, idx) : history;		
	}
	
	return this._processor? this._processor.parse(history) : history;
}

/**
 *  Zjisteni, zda je neco v URL hashi
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

