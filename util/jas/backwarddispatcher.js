
/**
 * @overview Dispatcher, slouzi predevsim kvuli zpetne kompabilite (kdy se jeste k routovani dle url pouzivaly jednotlive staty)
 * @author Jose
 */

/**
 * @class Defaultni dispatcher, jez k prevodu url a id stavu pouziva metodu parseUrl registrovanych statu
 * @group jas
 */
JAS.BackwardDispatcher = JAK.ClassMaker.makeClass({
	NAME: "BackwardDispatcher",
	VERSION: "1.0",
	EXTEND: JAS.ADispatcher
});

/**
 * @see JAS.ADispatcher#getStateData
 */
JAS.BackwardDispatcher.prototype.getStateData = function(url) {
	var stateId = "";
	var stateParams = null;

	for (var i = 0, len = JAS.states.length; i < len; i++) {
		var params = JAS.states[i].parseUrl(url);
		if (params) {
			stateId = JAS.states[i].getId();
			stateParams = typeof(params) == "object" ? params : {};
			break;
		}
	}

	return {
		stateId: stateId,
		params: stateParams
	};
};
