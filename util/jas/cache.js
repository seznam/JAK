
/**
 * @overview Jednoduche cachovani
 * @author Jose
 */

/**
 * @class Trida pro cachovani
 * @group jas
 */
JAS.Cache = JAK.ClassMaker.makeClass({
	NAME: "Cache",
	VERSION: "1.0"
});

/**
 * @constant
 */
JAS.Cache.LIMITLESS = -1;

JAS.Cache.prototype.$constructor = function() {
	this._storage = {};
};

/**
 * Prida polozku do cache
 *
 * @param   {string} key        klic
 * @param   {any}    value      hodnota
 * @param   {number} expiration doba po jakou se bude polozka platna v sekundach
 * @returns {any}               pokud jiz byla pro tento klic specifikovana nejaka hodnota, vrati ji
 */
JAS.Cache.prototype.set = function(key, value, expiration) {
	if (!key) {
		throw new Error("Invalid key");
	}

	var expire = expiration ? Date.now() + expiration * 1000 : JAS.Cache.LIMITLESS;
	var oldValue = this.get(key);
	this._storage[key] = {
		value: value,
		expire: expire
	};
	return oldValue;
};

/**
 * Vrati polozku z cache
 *
 * @param   {string} key klic
 * @returns {any}        hodnota
 */
JAS.Cache.prototype.get = function(key) {
	if (!key) {
		throw new Error("Invalid key");
	}

	var item = this._storage[key];
	if (!item) {
		return null;
	}
	if (item.expire < Date.now() && item.expire !== JAS.Cache.LIMITLESS) {
		this._storage[key] = null;
		return null;
	} else {
		return item.value;
	}
};

/**
 * Odstrani polozku z cache
 *
 * @param   {string} key klic
 * @returns {any}        hodnota odstranene polozky
 */
JAS.Cache.prototype.remove = function(key) {
	if (!key) {
		throw new Error("Invalid key");
	}

	var item = this._storage[key];
	if (item) {
		this._storage[key] = null;
		return item.value;
	}
	return null;
};

/**
 * Vymaze veskery obsah
 */
JAS.Cache.prototype.clear = function() {
	this._storage = {};
};
/* END of JAS.Cache */
