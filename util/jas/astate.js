
/**
 * @overview <em>Abstraktni trida</em> pro stavy, s nimiz bude pracovat Jadro
 * @author Jose
 */

/**
 * @class Abstraktni trida stavu
 * @group jas
 */
JAS.AState = JAK.ClassMaker.makeClass({
	NAME: "AState",
	VERSION: "2.1"
});

JAS.AState.prototype.$constructor = function() {
	this._id = "";
};

/**
 * Vrati ID stavu, ktery obstarava tento stav
 *
 * @returns {string} ID stavu
 */
JAS.AState.prototype.getId = function() {
	return this._id;
};

/**
 * Obecne parsovani URL
 *
 * @deprecated
 * @param   {string} url
 * @returns {object} { path:[], qs:{} }
 */
JAS.AState.prototype.baseParseUrl = function(url) {
	console.warn("Method JAS.AState#baseParseUrl is deprecated. You should use JAS.ADispatcher#baseParseUrl");
	return JAS.ADispatcher.baseParseUrl(url);
};

/**
 * Aktivuje stav
 *
 * @param   {object} params parametry stavu
 */
JAS.AState.prototype.activate = function(params) {
	throw new Error("Not implemented");
};

/**
 * Deaktivuje stav
 *
 * Parametrem je predana instance stavu, ktery bude nasledne aktivovan
 *
 * @param   {JAS.AState} newState
 */
JAS.AState.prototype.deactivate = function(newState) {
	throw new Error("Not implemented");
};

/**
 * Vrati URL adresu jez reprezentuje dany stav, nebo false rikajici nech URL na pokoji
 *
 * @returns {string|boolen}
 */
JAS.AState.prototype.getUrl = function() {
	throw new Error("Not implemented");
};
