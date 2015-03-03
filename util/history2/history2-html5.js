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
