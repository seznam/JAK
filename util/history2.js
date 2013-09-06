/**
 * @class Obecny spravce historie
 * @signal history-change
 * @group jak-utils
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

/**
 * @class Backend ukladajici historii do URL hashe
 * @signal history-hash-change
 */
JAK.History2.Hash = JAK.ClassMaker.makeSingleton({
	NAME: 'JAK.History2.Hash',
	VERSION: '1.1',
	IMPLEMENT: JAK.ISignals
});


JAK.History2.Hash.config = {
	iframeSrc: '/',		//src pro iframe, pouzivano pro ie7- (vhodne prenastavit napr. na url nejakeho maleho obrazku)
	useHashBang: true	//pouzit hashbang (#!), automaticky pridava/odebira znak '!'	
};

JAK.History2.Hash.prototype.$constructor = function() {
	this._hash = this._getHash();

	this._iframe = null;
	this._iframeLoading = false; /* dokud se iframe nacita, nekoukame na jeho url */

	if (JAK.Browser.client == 'ie' && JAK.Browser.version < 8) {
		this._iframe = JAK.mel('iframe', {}, {display:'none'});
		document.body.insertBefore(this._iframe, document.body.firstChild);
		JAK.Events.addListener(this._iframe, 'load', this, '_ev_iframeLoaded');

		this._saveIframe();
	}
	
	if ('onhashchange' in window && !this._iframe) {
		JAK.Events.addListener(window, 'hashchange', this, '_ev_hashChanged');
	} else {	
		setInterval( this._checkHash.bind(this), 200 );	
	}
}

/**
 * Ulozeni dat do URL
 * @param {string} hash
 */
JAK.History2.Hash.prototype.save = function(hash) {
	//zadna zmena
	if (hash == this._hash) { return; } 
	
	//zapamatovat a procpat tam, kde je potreba
	this._hash = hash;
	this._saveHash();
	this._saveIframe();
}

/**
 * Poskytnuti ulozenych dat
 */
JAK.History2.Hash.prototype.get = function() {
	return this._hash;
}

/**
 * Vyvola kontrolu a aktualizaci hashe a pokud se zmenil, tak signal History2.Hash:change
 */
JAK.History2.Hash.prototype.check = function() {
	return this._checkHash();
}



/**
 * Posluchac zmeny hashe
 */
JAK.History2.Hash.prototype._ev_hashChanged = function(e) {
	this._checkHash();
}

/**
 * Posluchac nacteni iframe
 */
JAK.History2.Hash.prototype._ev_iframeLoaded = function() { 
	this._iframeLoading = false;
}

/**
 * Nacteni hodnoty z hashe
 */
JAK.History2.Hash.prototype._getHash = function() {
	//nepouzivat window.location.hash kvuli bugu firefoxu (rusi encodeURIComponent)	
	var h = window.location.href.split("#")[1] || '';

	if (h.length && h.charAt(0) == "#") { 
		h = h.substr(1); 
	}
	if (this.constructor.config.useHashBang && h.length && h.charAt(0) == '!') {
		h = h.substr(1);
	}
	
	return h;
}

/**
 * Ulozeni dat do hashe
 */
JAK.History2.Hash.prototype._saveHash = function() {
	//nepouzivat window.location.hash, mozne potize ve firefoxu
	window.location.href = window.location.href.split('#')[0] + '#' + (this.constructor.config.useHashBang? '!' : '') + this._hash;
}

/**
 * Overeni, jestli se neco nezmenilo
 */
JAK.History2.Hash.prototype._checkHash = function() {
	var actHash = this._getHash();
	
	if (actHash != this._hash) { //zmenil se hash: v iframe rezimu uzivatelem, v neiframe rezimu nevime jak
		this._hashChanged(actHash);
	}
	
	if (!this._iframe || this._iframeLoading) { 
		return; 
	}
	
	//nezmenilo se url v iframe?
	var iframeHash = this._iframe.contentWindow.location.href;
	var index = iframeHash.indexOf('?');
	iframeHash = (index == -1 ? '' : iframeHash.substring(index + 1));
	
	if (iframeHash != this._hash) { //zpropagovat novy hash do url
		this._iframeChanged(iframeHash);
	}	
}

/**
 * Zmenil se hash - aktualizace promennych, vyslani signalu history-hash-change
 * @param {string} actHash
 */
JAK.History2.Hash.prototype._hashChanged = function(actHash) {
	this._hash = actHash;
	this._saveIframe();
	this.makeEvent('history-hash-change', {hash: this._hash});	
}

/**
 * Zmenila se URL (=hash) v iframe - aktualizace promennych, vyslani signalu history-hash-change
 * @param {string} iframeHash
 */
JAK.History2.Hash.prototype._iframeChanged = function(iframeHash) {
	this._hash = iframeHash;
	this._saveHash();
	this.makeEvent('history-hash-change', {hash: this._hash});
}

/** 
 * Zpropagovat novy hash do iframu 
 */
JAK.History2.Hash.prototype._saveIframe = function() {
	if (this._iframe) {
		this._iframeLoading = true;
		this._iframe.contentWindow.location.href = this.constructor.config.iframeSrc + '?' + this._hash;
	}
}

/**
 * @class Backend ukladajici historii do HTML5 History API
 * @signal history-html5-change
 */
JAK.History2.Html5 = JAK.ClassMaker.makeSingleton({
	NAME: 'JAK.History2.Html5',
	VERSION: '1.1',
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
 */
JAK.History2.Html5.prototype.save = function(url) {
	if (url == this._url) { return; }
	
	this._saveUrl(url);
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
	
	return window.location.pathname + window.location.search + hash;
}

/**
 * Ulozeni dat do url
 */
JAK.History2.Html5.prototype._saveUrl = function(url) {
	if (!url) {
		url = '/';
	}
	window.history.pushState(null, null, url);
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
