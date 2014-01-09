
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
	VERSION: "1.0"
});

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
