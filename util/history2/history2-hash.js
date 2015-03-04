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

