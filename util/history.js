/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Správce historie (část URL za hashem)
 * @group jak-utils
 */
JAK.History = JAK.ClassMaker.makeSingleton({
	NAME: "JAK.History",
	VERSION: "3.1"
});

JAK.History.screen = "/";

JAK.History.prototype.$constructor = function() {
	this._hash = this._getHash();
	this._state = this._URLtoState(this._hash);

	this._clients = [];
	this._lock = true;
	
	this._iframe = null;
	this._iframeLoading = false;

	if (JAK.Browser.client == "ie" && JAK.Browser.version < 8) {
		this._iframe = JAK.mel("iframe", {}, {display:"none"});
		document.body.insertBefore(this._iframe, document.body.firstChild);
		JAK.Events.addListener(this._iframe, "load", this, "_load");
		this._saveIframe();
	}
}

/**
 * Instance se registruje u správce historie
 * @param {JAK.IHistory} client Instance
 * @param {string[]} names Pole názvů, které bude tento klient používat
 */
JAK.History.prototype.register = function(client, names) {
	this._clients.push([client, names]);
}

/**
 * Klient končí registraci
 * @param {JAK.IHistory} client Instance
 */
JAK.History.prototype.unregister = function(client) {
	for (var i=0;i<this._clients.length;i++) {
		var c = this._clients[i];
		if (c == client) {
			this._clients.splice(i, 1);
			return;
		}
	}
	
	throw new Error("Client " + client + " not found");
}

/**
 * Pokyn k uložení historie. Správce historie nyní musí obejít klienty, zjistit jejich stav a pokud došlo ke změně, upravit URL
 */
JAK.History.prototype.save = function() {
	if (this._lock) { return; }
	var stateChanged = false;
	
	for (var i=0;i<this._clients.length;i++) {
		var client = this._clients[i][0];
		var names = this._clients[i][1];
		var data = client.historySave();
		
		for (var j=0;j<names.length;j++) { /* klient tvrdi, ze poskytuje tato data */
			var name = names[j];
			if (!(name in data)) { throw new Error("Client " + client + " did not supply value " + name); }
			if (data[name] != this._state[name]) {
				this._state[name] = data[name];
				stateChanged = true;
			}
		}
	}
	
	if (stateChanged) { this._saveState(); }
}

/**
 * Zapnutí sledování změn hashe
 */
JAK.History.prototype.start = function() {
	this._lock = false;
	setInterval(this._check.bind(this), 200);
}

/**
 * Získání dat pro jednoho registrovaného klienta
 */
JAK.History.prototype.get = function(client) {
	var result = {};

	for (var i=0;i<this._clients.length;i++) {
		var c = this._clients[i][0];
		if (c != client) { continue; }
		
		var names = this._clients[i][1];
		for (var j=0;j<names.length;j++) { /* vsechny hodnoty, ke kterym se klient upsal */
			var name = names[j];
			result[name] = (name in this._state ? this._state[name] : undefined);
		}
		
		return result;
	}
	
	return result;
}

JAK.History.prototype._getHash = function() {
	var h = window.location.hash;
	if (h.length && h.charAt(0) == "#") { h = h.substr(1); }
	return h;
}

JAK.History.prototype._setHash = function(hash) {
	window.location.hash = hash;
}

/**
 * Periodické ověření, jestli se něco nezměnilo
 */
JAK.History.prototype._check = function() {
	var h = this._getHash();
	
	if (h != this._hash) { /* zmenil se hash: v iframe rezimu uzivatelem, v neiframe rezimu nevime jak */
		this._hash = h;
		if (this._iframe) { this._saveIframe(); }
		this._loadState();
	}
	
	if (!this._iframe || this._iframeLoading) { return; }
	
	h = this._iframe.contentWindow.location.href; /* nezmenilo se url v iframe? */
	var index = h.indexOf("?");
	h = (index == -1 ? "" : h.substring(index+1));
	if (h != this._hash) { /* zpropagovat novy hash do url */
		this._hash = h;
		this._setHash(h);
		this._loadState();
	}
	
}

/**
 * Vzít datový objekt a nacpat ho do URL
 */
JAK.History.prototype._saveState = function() {
	this._hash = this._stateToURL(this._state);
	this._setHash(this._hash);
	if (this._iframe) { this._saveIframe(); }
}

/** 
 * Zpropagovat nový hash do iframu 
 */
JAK.History.prototype._saveIframe = function() {
	this._iframeLoading = true;
	this._iframe.contentWindow.location.href = this.constructor.screen + "?" + this._hash; 
}

/**
 * Vzít URL, převést na objekt a notifikovat ty, u kterých došlo ke změně
 */
JAK.History.prototype._loadState = function() {
	this._lock = true;
	
	var data = this._URLtoState(this._hash);
	
	for (var i=0;i<this._clients.length;i++) {
		var client = this._clients[i][0];
		var names = this._clients[i][1];
		
		var notifyClient = false;
		var obj = {};
		for (var j=0;j<names.length;j++) { /* vsechny hodnoty, ke kterym se klient upsal */
			var name = names[j];
			obj[name] = (name in data ? data[name] : undefined);
			if (this._state[name]+"" != obj[name]+"") { notifyClient = true; }
		}
		
		if (notifyClient) { client.historyLoad(obj); }
	}
	
	this._state = data;
	this._lock = false;
}

/**
 * Převod stavu na řetězec
 * @param {object} state
 * @returns {string}
 */
JAK.History.prototype._stateToURL = function(state) {
	var arr = [];
	for (var p in state) {
		var val = state[p];
		if (!val.length) { continue; }
		if (!(val instanceof Array)) { val = [val]; }
		
		for (var i=0;i<val.length;i++) {
			arr.push(encodeURIComponent(p) + "=" + encodeURIComponent(val[i]));
		}
	}
	return arr.join("&");
}

/**
 * Převod řetězce na stavový objekt
 * @param {string} url
 * @returns {object}
 */
JAK.History.prototype._URLtoState = function(url) {
	var obj = {};
	var parts = url.split("&");
	for (var i=0;i<parts.length;i++) {
		var part = parts[i];
		if (!part.length) { continue; }
		var tmp = part.split("=");
		
		var key = decodeURIComponent(tmp.shift());
		var value = decodeURIComponent(tmp.join("="));
		
		if (key in obj) { /* uz tam je, bude to pole */
			if (!(obj[key] instanceof Array)) { obj[key] = [obj[key]]; } /* pokud to pole jeste neni, vyrobime */
			obj[key].push(value);
		} else {
			obj[key] = value;
		}
	}
	return obj;
}

JAK.History.prototype._load = function() { 
	this._iframeLoading = false;
}

/**
 * @class Rozhraní pro třídy, které chtějí spolupracovat se správcem historie
 * @group jak-utils
 */
JAK.IHistory = JAK.ClassMaker.makeInterface({
	NAME: "JAK.IHistory",
	VERSION: "1.0"
});

/**
 * @returns {object} Objekt, jehož klíče jsou názvy položek a hodnoty vždy řetězce
 */
JAK.IHistory.prototype.historySave = function() {
	return {};
}

/**
 * @param {object} data Data z historie. Může obsahovat jen ty položky, se kterými se instance registrovala.
 */
JAK.IHistory.prototype.historyLoad = function(data) {
}
