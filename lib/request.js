/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class XML/TEXT/JSONP request
 * @group jak
 * @example
 * var r = new JAK.Request(JAK.Request.XML, {method:"get"});
 * r.setCallback(mujObjekt, "jehoMetoda");
 * r.send("/dobrerano", {a:b, c:"asdf&asdf"});
 */
JAK.Request = JAK.ClassMaker.makeClass({
	NAME: "JAK.Request",
	VERSION: "2.0"
});

/** @constant */
JAK.Request.XML		= 0;
/** @constant */
JAK.Request.TEXT	= 1;
/** @constant */
JAK.Request.JSONP	= 2;
/** @constant */
JAK.Request.BINARY	= 3;

/**
 * @param {int} type Type požadavku, jedna z konstant JAK.Request.*
 * @param {object} [options] Konfigurační objekt
 * @param {bool} [options.async=true] Je-li požadavek asynchronní
 * @param {bool} [options.timeout=0] Timeout v msec; 0 = disable
 * @param {bool} [options.method="get"] HTTP metoda požadavku
 */
JAK.Request.prototype.$constructor = function(type, options) {
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
	this._xdomain = false; /* pouzivame IE8+ XDomainRequest? */
	
	this._options = {
		async: true,
		timeout: 0,
		method: "get"
	}
	for (var p in options) { this._options[p] = options[p]; }

	if (this._type == JAK.Request.JSONP) {
		if (this._options.method.toLowerCase() == "post") { throw new Error("POST not supported in JSONP mode"); }
		if (!this._options.async) { throw new Error("Async not supported in JSONP mode"); }
	}
};

JAK.Request.prototype.$destructor = function() {
	if (this._state == this._SENT) { this.abort(); }
	this._xhr = null;
}

/**
 * Nastaví hlavičky požadavku
 * @param {object} headers Hlavičky (dvojice název:hodnota)
 */
JAK.Request.prototype.setHeaders = function(headers) {
	if (this._type == JAK.Request.JSONP) { throw new Error("Request headers not supported in JSONP mode"); }
	for (var p in headers) { this._headers[p] = headers[p]; }
}

/**
 * Vrátí hlavičky odpovědi
 * @returns {object} Hlavičky (dvojice název:hodnota)
 */
JAK.Request.prototype.getHeaders = function() {
	if (this._state != this._DONE) { throw new Error("Response headers not available"); }
	if (this._type == JAK.Request.JSONP) { 	throw new Error("Response headers not supported in JSONP mode"); }
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
JAK.Request.prototype.send = function(url, data) {
	if (this._state != this._NEW) { throw new Error("Request already sent"); }

	this._state = this._SENT;
	this._userCallback(this);

	switch (this._type) {
		case JAK.Request.XML:
		case JAK.Request.TEXT:
		case JAK.Request.BINARY:
			return this._sendXHR(url, data);
		break;
		case JAK.Request.JSONP:
			return this._sendScript(url, data);
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
JAK.Request.prototype.abort = function() {
	if (this._state != this._SENT) { return false; }
	this._state = this._ABORTED;
	if (this._xhr) { this._xhr.abort(); }
	this._userCallback(this);
	return true;
}

/**
 * Nastavení callbacku po dokončení požadavku
 * @param {object || null} obj
 * @param {function || string} method
 */
JAK.Request.prototype.setCallback = function(obj, method) {
	this._setCallback(obj, method, this._DONE);
	return this;
}

/**
 * Nastavení callbacku po odeslání
 * @see JAK.Request#setCallback
 */
JAK.Request.prototype.setSendCallback = function(obj, method) {
	this._setCallback(obj, method, this._SENT);
	return this;
}

/**
 * Nastavení callbacku po abortu
 * @see JAK.Request#setCallback
 */
JAK.Request.prototype.setAbortCallback = function(obj, method) {
	this._setCallback(obj, method, this._ABORTED);
	return this;
}

/**
 * Nastavení callbacku po timeoutu
 * @see JAK.Request#setCallback
 */
JAK.Request.prototype.setTimeoutCallback = function(obj, method) {
	this._setCallback(obj, method, this._TIMEOUT);
	return this;
}

/**
 * Interni registrace callbacku pro zadany stav
 */
JAK.Request.prototype._setCallback = function(obj, method, state) {
	this._callbacks[state] = [obj, method];
}

/**
 * Odeslani pozadavku pres XHR
 */
JAK.Request.prototype._sendXHR = function(url, data) {
	/* nejprve vyrobit instanci XHR */
	if (window.XMLHttpRequest) { 
		var ctor = XMLHttpRequest;
		var r = url.match(/^https?\:\/\/(.*?)\//);
		if (r && r[1] != location.host && window.XDomainRequest) { /* pro cross-domain je v IE >= 8 novy objekt */
			if (this._type == JAK.Request.BINARY) { throw new Error("XDomainRequest does not support BINARY mode"); }
			this._xdomain = true;
			ctor = XDomainRequest; 
		}
		this._xhr = new ctor(); 
	} else if (window.ActiveXObject) { 
		this._xhr = new ActiveXObject("Microsoft.XMLHTTP"); 
	} else { throw new Error("No XHR available"); }
	
	if (this._xdomain) {
		this._xhr.onload = this._onXDomainRequestLoad.bind(this);
	} else {
		this._xhr.onreadystatechange = this._onReadyStateChange.bind(this);
	}

	/* zpracovat parametry */
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

	if (this._type == JAK.Request.BINARY) {
		if (this._xhr.overrideMimeType) {
			this._xhr.overrideMimeType("text/plain; charset=x-user-defined");
		} else if (JAK.Browser.client == "ie") {
			this._buildVBS();
		} else {
			throw new Error("This browser does not support binary transfer");
		}
	}

	this._xhr.open(this._options.method, u, this._options.async);
	for (var p in this._headers) { this._xhr.setRequestHeader(p, this._headers[p]); }
	this._xhr.send(d);
	
	if (this._options.timeout) { setTimeout(this._timeout.bind(this), this._options.timeout); }
	if (!this._options.async) { this._onReadyStateChange(); }
	
	return u;
}

/**
 * Odeslani JSONP pozadavku pres &lt;script&gt;
 */
JAK.Request.prototype._sendScript = function(url, data) {
	var o = data || {};

	this._callback = "callback" + JAK.idGenerator();
	o.callback = this._callback;
	var url = this._buildURL(url, o);
	window[this._callback] = this._scriptCallback.bind(this);
	
	this._script = JAK.mel("script", {type:"text/javascript", src:url});
	document.body.insertBefore(this._script, document.body.firstChild);

	return url;
}

/**
 * Tvorba URL zmixovanim zakladu + dat
 */
JAK.Request.prototype._buildURL = function(url, data) {
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
JAK.Request.prototype._serializeData = function(data) {
	if (typeof(data) == "string") { return data; }
	if (!data) { return ""; }
	
	var arr = [];
	for (var p in data) {
		var value = data[p];
		if (!(value instanceof Array)) { value = [value]; }
		for (var i=0;i<value.length;i++) {
			arr.push(encodeURIComponent(p) + "=" + encodeURIComponent(value[i]));
		}
	}
	return arr.join("&");
}

/**
 * Zmena stavu XHR
 */
JAK.Request.prototype._onReadyStateChange = function() {
	if (this._state == this._ABORTED) { return; }
	if (this._xhr.readyState != 4) { return; }

	var status = this._xhr.status;
	var data;

	if (this._type == JAK.Request.BINARY) {
		data = [];
		if (JAK.Browser.client == "ie") {
			var length = VBS_getLength(this._xhr.responseBody);
			for (var i=0;i<length;i++) { data.push(VBS_getByte(this._xhr.responseBody, i)); }
		} else {
			var text = this._xhr.responseText;
			var length = text.length;
			for (var i=0;i<length;i++) { data.push(text.charCodeAt(i) & 0xFF); }
		}
	} else {
		data = (this._type == JAK.Request.XML ? this._xhr.responseXML : this._xhr.responseText);
	}

	this._done(data, status);
}

/**
 * Nacteni XDomainRequestu
 */
JAK.Request.prototype._onXDomainRequestLoad = function() {
	if (this._state == this._ABORTED) { return; }

	var data = this._xhr.responseText;
	if (this._type == JAK.Request.XML) {
		var xml = new ActiveXObject("Microsoft.XMLDOM");
		xml.async = false;
		xml.loadXML(data);
		data = xml;
	}

	this._done(data, 200);
}

/**
 * JSONP callback
 */
JAK.Request.prototype._scriptCallback = function(data) {
	this._script.parentNode.removeChild(this._script);
	this._script = null;
	delete window[this._callback];

	if (this._state != this._ABORTED) { this._done(data, 200); }
}

/**
 * Request uspesne dokoncen
 */
JAK.Request.prototype._done = function(data, status) {
	this._state = this._DONE;
	this._userCallback(data, status, this);
}

/**
 * Nastal timeout
 */
JAK.Request.prototype._timeout = function() {
	if (this._state != this._SENT) { return; }
	this.abort();
	
	this._state = this._TIMEOUT;
	this._userCallback(this);	
}

/**
 * Volani uziv. callbacku
 */
JAK.Request.prototype._userCallback = function() {
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

JAK.Request.prototype._buildVBS = function() {
	var s = JAK.mel("script", {type:"text/vbscript"});
	s.text = "Function VBS_getByte(data, pos)\n"
		+ "VBS_getByte = AscB(MidB(data, pos+1,1))\n"
		+ "End Function\n"
		+ "Function VBS_getLength(data)\n"
		+ "VBS_getLength = LenB(data)\n"
		+ "End Function";
	document.getElementsByTagName("head")[0].appendChild(s);
}
