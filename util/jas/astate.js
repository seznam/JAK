
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
 * @param   {string} url
 * @returns {object} { path:[], qs:{} }
 */
JAS.AState.prototype.baseParseUrl = function(url) {
	var normUrl = url.indexOf("/") === 0 ? url.substring(1) : url;
	var tmp = normUrl.split("?");
	var tmpPath = tmp.shift();
	var tmpQs = tmp.join("?");

	return {
		path: tmpPath.split("/"),
		qs: JAS.NewCore.parseQs(tmpQs)
	}
};

/**
 * Zjisti jestli je specifikovana URL relevantni pro tento stav.
 *
 * Pokud ano, rozparsuje adresu a z ni vrati parametry tohoto stavu,
 * jinak vrati null
 *
 * @param   {string} url URL stavu
 * @returns {object} rozparsovana URL nebo null
 */
JAS.AState.prototype.parseUrl = function(url) {
	throw new Error("Not implemented");
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
/* END of JAS.AState */
