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

/**
 * @class Backend ukladajici historii do URL hashe
 * @signal history-hash-change
 */
JAK.History2.Hash = JAK.ClassMaker.makeSingleton({
	NAME: 'JAK.History2.Hash',
	VERSION: '2.0',
	IMPLEMENT: JAK.ISignals
});


JAK.History2.Hash.config = {
	useHashBang: true	//pouzit hashbang (#!), automaticky pridava/odebira znak '!'	
};

JAK.History2.Hash.prototype.$constructor = function() {
	this._hash = this._getHash();	//vse za # v url
	this._history = this._hash2history(this._hash); //string s historii z hashe - muze se lisit od hashe, pokud pouzivame hashbang

	if ('onhashchange' in window && !this._iframe) {
		JAK.Events.addListener(window, 'hashchange', this, '_ev_hashChanged');
	} else {	
		setInterval( this._checkHash.bind(this), 200 );	
	}
}

/**
 * Ulozeni dat do URL
 * @param {string} history
 * @param {Boolean} [replace] Historii nelze prepsat - vytvori se vzdy nova
 */
JAK.History2.Hash.prototype.save = function(history, replace) {
	
	//nejdriv aktualizovat hodnoty history+hash, pak ulozit (poradi nutne, jinak vznikne navic signal o zmene hashe)
	this._history = history;
	this._hash = this._history2hash(this._history);

	//nepouzivat window.location.hash, mozne potize ve firefoxu
	window.location.href = window.location.href.split('#')[0] + '#' + this._hash;	
}

/**
 * Poskytnuti ulozenych dat
 */
JAK.History2.Hash.prototype.get = function() {
	return this._history;
}

/**
 * Vyvola kontrolu a aktualizaci hashe a pokud se zmenil, tak signal history-hash-change
 */
JAK.History2.Hash.prototype.check = function() {
	this._checkHash();
}



/**
 * Posluchac zmeny hashe
 */
JAK.History2.Hash.prototype._ev_hashChanged = function(e) {
	this._checkHash();
}

/**
 * Nacteni "suroveho" hashe z url
 */
JAK.History2.Hash.prototype._getHash = function() {
	return window.location.href.split('#')[1] || '';
};

/**
 * Prevod hashe z url na string s historii
 * @param {string} hash
 */
JAK.History2.Hash.prototype._hash2history = function(hash) {
	
	var history = hash;
	if (this.constructor.config.useHashBang) { //pro ukladani pouzivame hashbang
		if (history.charAt(0) == '!') { //hash zacina na ! = je to hashbang - usmikneme !
			history	= history.substr(1);
		} else { //hash nezacina na ! = neni hashbang = v hashi neni zadna historie
			history = '';
		}
	}
	
	return history;
};

/**
 * Prevod stringu s historii na hash pro ulozeni do url
 * @param {string} history
 */
JAK.History2.Hash.prototype._history2hash = function(history) {
	
	var hash = history;
	if (this.constructor.config.useHashBang && hash.length) {
		hash = '!' + hash;
	}
	
	return hash;
};

/**
 * Overeni, jestli se neco nezmenilo
 */
JAK.History2.Hash.prototype._checkHash = function() {
	var actHash = this._getHash();
	
	if (actHash != this._hash) { //zmenil se hash
		this._hashChanged(actHash);
	}	
}

/**
 * Zmenil se hash - aktualizace promennych, vyslani signalu history-hash-change
 * @param {string} actHash
 */
JAK.History2.Hash.prototype._hashChanged = function(actHash) {
	this._hash = actHash;
	this._history = this._hash2history(this._hash);

	this.makeEvent('history-hash-change', {hash: this._history});	
}

/**
 * @class Backend ukladajici historii do HTML5 History API
 * @signal history-html5-change
 */
JAK.History2.Html5 = JAK.ClassMaker.makeSingleton({
	NAME: 'JAK.History2.Html5',
	VERSION: '1.2',
	IMPLEMENT: JAK.ISignals
});

/**
 * Vyhodnoceni, zda prohlizec umi potrebne featury pro pouziti html5 history
 */
JAK.History2.Html5.isSupported = ('onpopstate' in window) && window.history && window.history.pushState;

JAK.History2.Html5.prototype.$constructor = function() {
	this._url = this._getUrl();
	
	if ( !this.constructor.isSupported ) {
		return;
	}	
	
	JAK.Events.addListener(window, 'popstate', this, '_ev_urlChanged');
}

/**
 * Ulozeni dat do URL
 * @param {string} url
 * @param {Boolean} [replace] Prepsat aktualni historii?
 */
JAK.History2.Html5.prototype.save = function(url, replace) {
	if (url == this._url) { return; }
	
	this._saveUrl(url, replace);
	this._url = this._getUrl();
}

/**
 * Poskytnuti ulozenych dat
 */
JAK.History2.Html5.prototype.get = function() {
	return this._url;
}


/**
 * Posluchac zmeny url
 */
JAK.History2.Html5.prototype._ev_urlChanged = function(e, elm) {
	this._checkUrl();
}

/**
 * Nacteni hodnoty url
 */
JAK.History2.Html5.prototype._getUrl = function() {
	//nepouzivat window.location.hash, mozne potize ve firefoxu
	var hash = window.location.href.split('#')[1] || '';
	
	return window.location.pathname + window.location.search + (hash? '#' + hash : '');
}

/**
 * Ulozeni dat do url
 * @param {string} url
 * @param {Boolean} [replace] Prepsat aktualni historii?
 */
JAK.History2.Html5.prototype._saveUrl = function(url, replace) {
	if (!url) {
		url = '/';
	}

	if (!replace) {
		window.history.pushState(null, null, url);
	}
	else {
		window.history.replaceState(null, null, url);
	}
}

/**
 * Overeni, zda se zmenila url, pri zmene aktualizace promennych, vyslani signalu history-html5-change
 */
JAK.History2.Html5.prototype._checkUrl = function() {
	var actUrl = this._getUrl();
	if (actUrl != this._url) {
		this._url = actUrl;
		this.makeEvent('history-html5-change', {url: this._url});
	}	
}
/**
 * @class Rozhrani pro tridu, ktera se stara o vytvareni url z parametru a naopak o cteni parametru z url
 */
JAK.History2.IProcessor = JAK.ClassMaker.makeInterface({
	NAME: 'JAK.History2.IProcessor',
	VERSION: '1.0'
});

JAK.History2.IProcessor.prototype.parse = function(str) {
	if (typeof str == 'object') {
		return str;
	}	
	
	//... nejaka vlastni logika prevodu stringu na objekt s parametry...
	var obj = str;
	
	return obj;
}

JAK.History2.IProcessor.prototype.serialize = function(obj) {
	if (typeof obj == 'string' ) {
		return obj;
	}
	
	//... nejaka vlastni logika prevodu objektu na string ...
	var str = obj + '';
	
	return str;
}


/**
 * @class Konkretni implementace rozhrani History2.IProcessor - umi pracovat s url ve tvaru search stringu (?key=value&key2=value2&...)
 */
JAK.History2.KeyValue = JAK.ClassMaker.makeClass({
	NAME: 'JAK.History2.KeyValue',
	VERSION: '1.0',
	IMPLEMENT: JAK.History2.IProcessor
});

JAK.History2.KeyValue.prototype.$constructor = function() {
	
}

JAK.History2.KeyValue.prototype.parse = function(str) {
	if (typeof str == 'object') {
		return str;
	}
	
	var obj = {};
	
	var index = str.indexOf('#');
	str = (index != -1)? str.substring(0, index) : str;	
	
	var index = str.indexOf('?');
	str = (index != -1)? str.substring(index + 1) : '';	

	var parts = str.split('&');
	for (var i = 0; i < parts.length; i++) {
		if (!parts[i].length) {
			continue;
		}
		var tmp = parts[i].split('=');		
		var key = decodeURIComponent(tmp.shift());
		var value = decodeURIComponent(tmp.join('='));
		
		if (key in obj) { //uz tam je, bude to pole 
			if ( !(obj[key] instanceof Array) ) { //pokud to pole jeste neni, vyrobime 
				obj[key] = [obj[key]]; 
			}
			obj[key].push(value);
		} else {
			obj[key] = value;
		}
	}
	return obj;
}

JAK.History2.KeyValue.prototype.serialize = function(state) {
	if (typeof state == 'string' ) {
		return state;
	}
	
	var arr = [];
	for (var p in state) {
		var val = state[p];

		if ( !(val instanceof Array) ) {
			val = val + '';
			if (!val.length) {
				continue;
			}
			arr.push(encodeURIComponent(p) + '=' + encodeURIComponent(val));
		} else {
			for (var i = 0; i < val.length; i++) {
				arr.push(encodeURIComponent(p) + '=' + encodeURIComponent(val[i]));
			}
		}
	}
	return '?' + arr.join('&');
}
