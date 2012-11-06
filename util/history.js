/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Správce historie (část URL za hashem)
 * @group jak-utils
 * @signal history-change
 */
JAK.History = JAK.ClassMaker.makeSingleton({
	NAME: "JAK.History",
	VERSION: "4.0",
	IMPLEMENT: JAK.ISignals
});

JAK.History.screen = "/";
JAK.History.manager = null;

JAK.History.prototype.$constructor = function() {
	this._data = this._getHash();

	this._iframe = null;
	this._iframeLoading = false; /* dokud se iframe nacita, nekoukame na jeho url */

	if (JAK.Browser.client == "ie" && JAK.Browser.version < 8) {
		this._iframe = JAK.mel("iframe", {}, {display:"none"});
		document.body.insertBefore(this._iframe, document.body.firstChild);
		JAK.Events.addListener(this._iframe, "load", this, "_load");
		this._saveIframe();
	}
	
	setInterval(this._check.bind(this), 200);
}

/**
 * Uložení dat do URL
 * @param {string} data
 */
JAK.History.prototype.set = function(data) {
	/* zadna zmena */
	if (data == this._data) { return; } 
	
	/* zapamatovat a procpat tam, kde je potreba */
	this._data = data;

	this._saveHash();
	if (this._iframe) { this._saveIframe(); }
}

/**
 * Poskytnutí uložených dat
 */
JAK.History.prototype.get = function() {
	return this._data;
}

/**
 * Načtení hodnoty z hashe
 */
JAK.History.prototype._getHash = function() {
	/* POZOR - nekoukame na location.hash, pac FF tam tu hodnotu dava uz dekodovanou */
	var index = window.location.href.indexOf("#");
	if (index == -1) { return ""; }
	return decodeURI(window.location.href.substring(index+1));
}

/**
 * Ulozeni dat do hashe
 */
JAK.History.prototype._saveHash = function() {
	window.location.hash = encodeURI(this._data);
}

/**
 * Periodické ověření, jestli se něco nezměnilo
 */
JAK.History.prototype._check = function() {
	var data = this._getHash();
	
	if (data != this._data) { /* zmenil se hash: v iframe rezimu uzivatelem, v neiframe rezimu nevime jak */
		this._data = data;
		if (this._iframe) { this._saveIframe(); }
		this.makeEvent("history-change");
	}
	
	if (!this._iframe || this._iframeLoading) { return; }
	
	data = this._iframe.contentWindow.location.href; /* nezmenilo se url v iframe? */
	var index = data.indexOf("?");
	data = (index == -1 ? "" : decodeURI(data.substring(index+1)));
	
	if (data != this._data) { /* zpropagovat novy hash do url */
		this._data = data;
		this._saveHash();
		this.makeEvent("history-change");
	}
	
}

/** 
 * Zpropagovat nový hash do iframu 
 */
JAK.History.prototype._saveIframe = function() {
	this._iframeLoading = true;
	this._iframe.contentWindow.location.href = this.constructor.screen + "?" + this._data.replace(/&/g,"&amp;");
}

/**
 * Posluchac nacteni iframe
 */
JAK.History.prototype._load = function() { 
	this._iframeLoading = false;
}

/***/

/**
 * @class Mezistupeň mezi aplikací a historií
 * @group jak-utils
 */
JAK.History.KeyValue = JAK.ClassMaker.makeClass({
	NAME: "JAK.History.KeyValue",
	VERSION: "1.0",
	IMPLEMENT: JAK.ISignals
});

JAK.History.KeyValue.prototype.$constructor = function() {
	this._clients = [];
	this._lock = false;
	this._signal = this.addListener("history-change", "_historyChange");
	this._state = this._parse(JAK.History.getInstance().get());
}

JAK.History.KeyValue.prototype.$destructor = function() {
	this.removeListener(this._signal);
}

/**
 * Instance se registruje u správce historie
 * @param {JAK.IHistory} client Instance
 * @param {string[]} names Pole názvů, které bude tento klient používat
 */
JAK.History.KeyValue.prototype.register = function(client, names) {
	this._clients.push([client, names]);
}

/**
 * Klient končí registraci
 * @param {JAK.IHistory} client Instance
 */
JAK.History.KeyValue.prototype.unregister = function(client) {
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
JAK.History.KeyValue.prototype.save = function() {
	if (this._lock) { return; }

	var stateChanged = false;
	
	for (var i=0;i<this._clients.length;i++) {
		var client = this._clients[i][0];
		var names = this._clients[i][1];
		var data = client.historySave();
		
		for (var j=0;j<names.length;j++) { /* klient tvrdi, ze poskytuje tato data */
			var name = names[j];
			if (!(name in data)) { throw new Error("Client " + client + " did not supply value " + name); }

			var current = (name in this._state ? this._state[name] : "");
			if (data[name] != current) {
				this._state[name] = data[name];
				stateChanged = true;
			}
		}
	}
	
	if (stateChanged) { 
		var data = this._serialize(this._state);
		JAK.History.getInstance().set(data);
		this.makeEvent("history-save");
	}
}

/**
 * Získání dat pro jednoho registrovaného klienta
 */
JAK.History.KeyValue.prototype.get = function(client) {
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

/**
 * Převod stavu na řetězec
 * @param {object} state
 * @returns {string}
 */
JAK.History.KeyValue.prototype._serialize = function(state) {
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
 * @param {string} data
 * @returns {object}
 */
JAK.History.KeyValue.prototype._parse = function(data) {
	var obj = {};
	var parts = data.split("&");
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

JAK.History.KeyValue.prototype._historyChange = function(e) {
	this._lock = true;

	var data = this._parse(JAK.History.getInstance().get());
	
	for (var i=0;i<this._clients.length;i++) {
		var client = this._clients[i][0];
		var names = this._clients[i][1];
		
		var notifyClient = false;
		var dataForClient = {};
		for (var j=0;j<names.length;j++) { /* vsechny hodnoty, ke kterym se klient upsal */
			var name = names[j];
			dataForClient[name] = (name in data ? data[name] : undefined);
			
			var clientState = (name in this._state ? this._state[name] : "");
			if (clientState instanceof Array) { clientState = clientState.join(""); }
			
			var urlState = (name in data ? data[name] : "");
			if (urlState instanceof Array) { urlState = urlState.join(""); }
			
			if (clientState != urlState) { notifyClient = true; }
		}
		
		if (notifyClient) { client.historyLoad(dataForClient); }
	}
	
	this._state = data; /* zapamatovat novy stav */
	this._lock = false;
}

/***/

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
