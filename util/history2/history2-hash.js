/**
 * @class Backend ukladajici historii do URL hashe
 * @signal history-hash-change
 */
JAK.History2.Hash = JAK.ClassMaker.makeSingleton({
	NAME: 'JAK.History2.Hash',
	VERSION: '1.0',
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
	var h = window.location.hash;
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
	window.location.hash = (this.constructor.config.useHashBang? '!' : '') + this._hash;
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

