
/**
 * @overview <em>Abstraktni trida</em> pro dispatcher, s nimz bude pracovat Jadro
 * @author Jose
 */

/**
 * @class Abstraktni trida dispatcheru
 * @group jas
 */
JAS.ADispatcher = JAK.ClassMaker.makeClass({
	NAME: "ADispatcher",
	VERSION: "1.0",
	IMPLEMENT: [JAK.ISignals]
});

/**
 * Tuto metodu pouziva JAK.History2.
 * Osetri stav, kdy neni zadana zadna URL, ale Jadro prazdny retezec neocekava
 * IE totiz (i kdyz nepouziva history) vrati "/", ale Firefox jen ""
 *
 * @param  {string} str
 * @returns {string}
 */
JAS.ADispatcher.parse = function(str) {
	return str;
};

/**
 * Metoda implementovana kvuli JAK.History2
 *
 * @param  {object} obj
 * @returns {object}
 */
JAS.ADispatcher.serialize = function(obj) {
	return obj;
};

/**
 * Obecne parsovani URL
 *
 * @param   {string} url
 * @returns {object} { path:[], qs:{} }
 */
JAS.ADispatcher.baseParseUrl = function(url) {
	var normUrl = url.indexOf("/") === 0 ? url.substring(1) : url;
	var tmp = normUrl.split("?");
	var tmpPath = tmp.shift();
	var tmpQs = tmp.join("?");

	return {
		path: tmpPath.split("/"),
		qs: JAS.Core.parseQs(tmpQs)
	}
};

JAS.ADispatcher.prototype.$constructor = function() {
	this._history = null;
};

/**
 * Uvede dispecera do provozu
 *
 * Tuto metodu vola jadro pri inicializaci
 */
JAS.ADispatcher.prototype.init = function() {
	JAK.History2.config.processor = JAS.ADispatcher;
	this._history = JAK.History2.getInstance();

	this._goUrl(this._history.get());

	this.addListener("history-change", "_urlChange", this._history);
};

/**
 * Slouzi k propsani URL do historie
 *
 * @param   {string} url
 */
JAS.ADispatcher.prototype.pushHistory = function(url) {
	this._history.save(url);
};

/**
 * Prevede URL na ID stavu a jeho parametry
 *
 * @param   {string} url
 * @returns {object}     stateId: ID stavu, params: parametry stavu
 */
JAS.ADispatcher.prototype.getStateData = function(url) {
	throw new Error("Not implemented");
};

/**
 * Z ID stavu a jeho parametru vytvori URL
 *
 * @param   {string}  stateId  nazev stavu
 * @param   {object}  [params] parametry jako "asociativni pole"
 * @returns {string}           odpovidajici URL
 */
JAS.ADispatcher.prototype.makeUrl = function(stateId, params) {
	throw new Error("Not implemented");
};

JAS.ADispatcher.prototype._urlChange = function(sigObj) {
	this._goUrl(sigObj.data.state);
};

JAS.ADispatcher.prototype._goUrl = function(url) {
	var stateData = this.getStateData(this._history.get());
	JAS.core.go(stateData.stateId, stateData.params, false);
};
