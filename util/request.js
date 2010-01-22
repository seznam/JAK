/**
 * @class XML/TEXT/JSONP request
 * @group jak
 * @example
 * var r = new SZN.Request(SZN.Request.XML, {method:"get"});
 * r.setCallback(mujObjekt, "jehoMetoda");
 * r.send("/dobrerano", {a:b, c:"asdf&asdf"});
 */
SZN.Request = SZN.ClassMaker.makeClass({
	NAME: "SZN.Request",
	VERSION: "1.0",
	CLASS: "class"
});

/** @constant */
SZN.Request.XML		= 0;
/** @constant */
SZN.Request.TEXT	= 1;
/** @constant */
SZN.Request.JSONP	= 2;

/**
 * @param {int} type Type požadavku, jedna z konstant SZN.Request.*
 * @param {object} [options] Konfigurační objekt
 * @param {bool} [options.async=true] Je-li požadavek asynchronní
 * @param {bool} [options.timeout=0] Timeout v msec; 0 = disable
 * @param {bool} [options.method="get"] HTTP metoda požadavku
 */
SZN.Request.prototype.$constructor = function(type, options) {
	this._NEW		= 0;
	this._SENT		= 1;
	this._DONE		= 2;
	this._ABORTED	= 3;
	this._TIMEOUT	= 4;
	
	this._xhr = null;
	this._callback = "";
	this._script = null;
	this._type = type;
	this._headers = {};
	this._callbacks = {};
	this._state = this._NEW;
	
	this._options = {
		async: true,
		timeout: 0,
		method: "get"
	}
	for (var p in options) { this._options[p] = options[p]; }
	
	if (this._type == SZN.Request.JSONP) {
		if (this._options.method.toLowerCase() == "post") { throw new Error("POST not supported in JSONP mode"); }
		if (!this._options.async) { throw new Error("Async not supported in JSONP mode"); }
	} else {
		if (window.XMLHttpRequest) { 
			this._xhr = new XMLHttpRequest(); 
		} else if (window.ActiveXObject) { 
			this._xhr = new ActiveXObject("Microsoft.XMLHTTP"); 
		} else { throw new Error("No XHR available"); }
		this._xhr.onreadystatechange = SZN.bind(this, this._onReadyStateChange);
	}

};

/**
 * Nastaví hlavičky požadavku
 * @param {object} headers Hlavičky (dvojice název:hodnota)
 */
SZN.Request.prototype.setHeaders = function(headers) {
	if (this._type == SZN.Request.JSONP) { throw new Error("Request headers not supported in JSONP mode"); }
	for (var p in headers) { this._headers[p] = headers[p]; }
}

/**
 * Vrátí hlavičky odpovědi
 * @returns {object} Hlavičky (dvojice název:hodnota)
 */
SZN.Request.prototype.getHeaders = function() {
	if (this._state != this._DONE) { throw new Error("Response headers not available"); }
	if (this._type == SZN.Request.JSONP) { 	throw new Error("Response headers not supported in JSONP mode"); }
	var headers = {};
	var h = this._xhr.getAllResponseHeaders();
	if (h) {
		h = h.split(/[\r\n]/);
		for (var i=0;i<h.length;i++) if (h[i]) {
			var v = h[i].match(/^([^:]+): *(.*)$/);
			headers[v[1]] = v[2];
		}
	}
	return headers;
}

/**
 * Odešle požadavek
 * @param {string} url Cílové URL
 * @param {string || object} [data] Data k odeslání
 */
SZN.Request.prototype.send = function(url, data) {
	if (this._state != this._NEW) { throw new Error("Request already sent"); }

	this._state = this._SENT;
	this._userCallback();

	switch (this._type) {
		case SZN.Request.XML:
		case SZN.Request.TEXT:
			this._sendXHR(url, data);
		break;
		case SZN.Request.JSONP:
			this._sendScript(url, data);
		break;
		default:
			throw new Error("Unknown request type");
		break;
	}
}

/**
 * Přeruší probíhající požadavek
 * @returns {bool} Byl požadavek přerušen?
 */
SZN.Request.prototype.abort = function() {
	if (this._state != this._SENT) { return false; }
	this._state = this._ABORTED;
	if (this._xhr) { this._xhr.abort(); }
	this._userCallback();
	return true;
}

/**
 * Nastavení callbacku po dokončení požadavku
 * @param {object || null} obj
 * @param {function || string} method
 */
SZN.Request.prototype.setCallback = function(obj, method) {
	this._setCallback(obj, method, this._DONE);
}

/**
 * Nastavení callbacku po odeslání
 * @see SZN.Request#setCallback
 */
SZN.Request.prototype.setSendCallback = function(obj, method) {
	this._setCallback(obj, method, this._SENT);
}

/**
 * Nastavení callbacku po abortu
 * @see SZN.Request#setCallback
 */
SZN.Request.prototype.setAbortCallback = function(obj, method) {
	this._setCallback(obj, method, this._ABORTED);
}

/**
 * Nastavení callbacku po timeoutu
 * @see SZN.Request#setCallback
 */
SZN.Request.prototype.setTimeoutCallback = function(obj, method) {
	this._setCallback(obj, method, this._TIMEOUT);
}

/**
 * Interni registrace callbacku pro zadany stav
 */
SZN.Request.prototype._setCallback = function(obj, method, state) {
	this._callbacks[state] = [obj, method];
}

/**
 * Odeslani pozadavku pres XHR
 */
SZN.Request.prototype._sendXHR = function(url, data) {
	var u, d;

	if (this._options.method.toLowerCase() == "get") {
		u = this._buildURL(url, data);
		d = null;
	} else {
		u = url;
		d = this._serializeData(data);
		
		var ctSet = false;
		for (var p in this._headers) {
			if (p.toLowerCase() == "content-type") { 
				ctSet = true;
				break;
			}
		}
		if (!ctSet) { this.setHeaders({"Content-Type":"application/x-www-form-urlencoded"}); }
	}

	this._xhr.open(this._options.method, u, this._options.async);
	for (var p in this._headers) { this._xhr.setRequestHeader(p, this._headers[p]); }
	this._xhr.send(d);
	
	if (this._options.timeout) { setTimeout(SZN.bind(this, this._timeout), this._options.timeout); }
	if (!this._options.async) { this._onReadyStateChange(); }
}

/**
 * Odeslani JSONP pozadavku pres &lt;script&gt;
 */
SZN.Request.prototype._sendScript = function(url, data) {
	var o = data || {};

	this._callback = "callback" + SZN.idGenerator();
	o.callback = this._callback;
	var url = this._buildURL(url, o);
	window[this._callback] = SZN.bind(this, this._scriptCallback);
	
	this._script = document.createElement("script");
	this._script.type = "text/javascript";
	this._script.src = url;
	document.body.insertBefore(this._script, document.body.firstChild);
}

/**
 * Tvorba URL zmixovanim zakladu + dat
 */
SZN.Request.prototype._buildURL = function(url, data) {
	var s = this._serializeData(data);
	if (!s.length) { return url; }
	
	if (url.indexOf("?") == -1) {
		return url + "?" + s;
	} else {
		return url + "&" + s;
	}
}

/**
 * Serialize dat podle HTML formularu
 */
SZN.Request.prototype._serializeData = function(data) {
	if (typeof(data) == "string") { return data; }
	if (!data) { return ""; }
	
	var arr = [];
	for (var p in data) {
		arr.push(encodeURIComponent(p) + "=" + encodeURIComponent(data[p]));
	}
	return arr.join("&");
}

/**
 * Zmena stavu XHR
 */
SZN.Request.prototype._onReadyStateChange = function() {
	if (this._state == this._ABORTED) { return; }
	if (this._xhr.readyState != 4) { return; }

	var status = this._xhr.status;
	var data = (this._type == SZN.Request.XML ? this._xhr.responseXML : this._xhr.responseText);
	this._done(data, status);
}

/**
 * JSONP callback
 */
SZN.Request.prototype._scriptCallback = function(data) {
	this._script.parentNode.removeChild(this._script);
	delete window[this._callback];

	this._done(data, 200);
}

/**
 * Request uspesne dokoncen
 */
SZN.Request.prototype._done = function(data, status) {
	this._state = this._DONE;
	this._userCallback(data, status);
}

/**
 * Nastal timeout
 */
SZN.Request.prototype._timeout = function() {
	if (this._state != this._SENT) { return; }
	this.abort();
	
	this._state = this._TIMEOUT;
	this._userCallback();	
}

/**
 * Volani uziv. callbacku
 */
SZN.Request.prototype._userCallback = function() {
	var data = this._callbacks[this._state];
	if (!data) { return; }
	
	var obj = data[0] || window;
	var method = data[1];
	
	if (obj && typeof(method) == "string") { method = obj[method]; }
	if (!method) {
		method = obj;
		obj = window;
	}
	
	method.apply(obj, arguments);
}
