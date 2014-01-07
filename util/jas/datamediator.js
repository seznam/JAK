
/**
 * @overview Obal nad JAK.Request, ktery zaroven spravuje cachovani
 * @author Jose
 */

/**
 * @class Trida pro ziskavani dat ze serveru
 * @group jas
 */
JAS.DataMediator = JAK.ClassMaker.makeClass({
	NAME: 'DataMediator',
	VERSION: '1.0'
});

/**
 * @constant
 */
JAS.DataMediator.DEFAULT_TIMEOUT = 0;

/**
 * @static
 */
JAS.DataMediator._cache = new JAS.Cache();

/**
 * @param {number} [timeout] Timeout v msec; 0 = disable
 */
JAS.DataMediator.prototype.$constructor = function(timeout) {
	timeout = typeof(timeout) == "undefined" ? JAS.DataMediator.DEFAULT_TIMEOUT : timeout;

	this._options = {
		usePost: false,
		timeout: timeout
	};

	this._url = "";
	this._request = null;
	this._promise = null;
	this._response = this._response.bind(this);
	this._timeout = this._timeout.bind(this);
};

JAS.DataMediator.prototype.$destructor = function() {
	if (this._request) {
		this._request.abort();
	}
	if (this._promise) {
		this._promise.reject({ reason:"destruction", msg:"Instance was destructed" });
	}
	this._request = null;
	this._promise = null;
};

/**
 * Odesle pozadavek
 *
 * @param {string} url          URL cile, pouzije se jako klic pro cache
 * @param {object} [data]       data k odeslani, pokud je specifikovan nepouzije se cache
 * @param {number} [expiration] jak dlouho se ma vysledek cachovat (v sekundach), pokud je 0, pak se necachuje
 * @returns {JAK.Promise}
 */
JAS.DataMediator.prototype.send = function(url, data, expiration) {
	this._url = url;
	this._expiration = expiration;
	this._options.usePost = !!data;

	this._promise = new JAK.Promise();
	if (expiration > 0 && !this._options.usePost && JAS.DataMediator._cache.get(url)) {
		this._promise.fulfill(JAS.DataMediator._cache.get(url));

	} else {
		this._request = new JAK.Request(
			JAK.Request.TEXT,
			{
				method: (this._options.usePost ? "post" : "get"),
				timeout: 0
			}
		);
		this._request.setCallback(this._response);
		this._request.send(this._makeCacheProofUrl(url), data);
		if (this._options.timeout) {
			setTimeout(this._timeout, this._options.timeout);
		}
	}
	return this._promise;
};

/**
 * Prerusi probihajici pozadavek
 *
 * @returns {boolean} zda probihal nejaky pozadavek
 */
JAS.DataMediator.prototype.abort = function() {
	var r = false;
	if (this._request) {
		r = this._request.abort();
	}
	if (this._promise) {
		this._promise.reject({ reason:"aborted", msg:"Request was aborted" });
	}
	this._promise = null;
	this._request = null;
	return r;
};

JAS.DataMediator.prototype._timeout = function() {
	if (this._request) {
		this._request.abort();
	}
	if (this._promise) {
		this._promise.reject({ reason:"timeout", msg:"Request was aborted by timeout" });
	}
	this._promise = null;
	this._request = null;
};

JAS.DataMediator.prototype._response = function(data, status) {
	if (status != 200) {
		this._promise.reject({ reason:"failed", status:status, msg:"Bad response" });
	} else {
		var result = { data:data };
		this._promise.fulfill(result);
		JAS.DataMediator._cache.set(this._url, result, this._expiration);
	}
	this._promise = null;
	this._request = null;
};

JAS.DataMediator.prototype._makeCacheProofUrl = function(url) {
	if (url.indexOf("?") > -1) {
		var glue = "&";
	} else {
		var glue = "?";
	}
	return url + glue + Math.random();
};
