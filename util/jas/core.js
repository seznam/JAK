
/**
 * @overview Navesuje a odvesuje udalosti na prvky slouzici k obsluze aplikace
 * @author Prema
 *
 * Terminologie:
 * 		CoreActions - udalosti definovane v atributu data-action
 */

/**
 * @class Realizuje neveseni a odveseni udalosti na aktivni prvky majici atribut "data-action"
 * @group jas
 */
JAS.Core = JAK.ClassMaker.makeSingleton({
	NAME: 'Core',
	VERSION: '3.2',
	EXTEND: JAS.CoreBase
});

JAS.Core.prototype.$constructor = function() {
	this.$super();

	this._ec = [];
	this._ec.push(JAK.Events.onDomReady(this, "_startDOMProcess"));

	this._actionAttributeName = "data-action";
	this._elmsEvents = [];
};

JAS.Core.prototype.$destructor = function() {
	for (var i=0; i<this._ec.length; i++){
		JAK.Events.removeListener(this._ec[i]);
	};
	this._ec = [];

	for ( var i=0; i<this._elmsEvents.length; i++) {
		var elmEvent = this._elmsEvents[i];
		JAK.Events.removeListener(elmEvent.listenerId);
	};
	this._elmsEvents = [];
};

JAS.Core.prototype._startDOMProcess = function() {
	this.addActions(document.body);
};

/**
 * Ziska aktivni elementy
 *
 * @param {object} dom			element v jehoz potomcich bude proces probihat
 * @returns {array}
 */
JAS.Core.prototype._getActiveElements = function(dom) {
	var elements = dom.querySelectorAll("["+this._actionAttributeName+"]");

	return elements;
};

/**
 * Rozsireni metody ze zakladniho Jadra
 *
 * Spusti prepnuti kontroleru dle specifikovaneho stavu a parametru nebo elementu
 *
 * @param {any} source  nazev stavu, nebo element, z nehoz si nazev a parametry stavu ziskam
 * @param {object} [params]  parametry jako "asociativni pole" (pokud je parametr source element, tak nic)
 * @throws {Error}
 */
JAS.Core.prototype.go = function(source, params) {
	var state = "";
	if (typeof(source) == "string") {
		state = source;
	} else {
		var buffer = this._getStateAndParams(source);
		state = buffer.state;
		params = buffer.params;
	}

	this.$super(state, params);
};

/**
 * Zjisti aktivni prvky v prislusnem DOM a prida na ne posluchace na udalosti
 *
 * @param {object} dom			element v jehoz potomcich bude proces probihat
 * @returns {array}
 */
JAS.Core.prototype.addActions = function(dom) {
	var domElms = this._getActiveElements(dom);
	var actionsCount = 0;

	for (var i=0; i<domElms.length; i++) {
		var elm = domElms[i];
		actionsCount += this._addElmActions(elm);
	};

	this._log("Number of added CoreActions: "+actionsCount);
};

/**
 * Zjisti udalosti a navesi je k elementu
 *
 * @param {object} elm			element na nejz navesuji posluchace
 */
JAS.Core.prototype._addElmActions = function(elm) {
	var events = this._getElmActionEvents(elm);

	var listenersCount = 0;

	for (var i=0; i<events.length; i++) {
		var event = events[i];

		/*- pokud jiz na danou udalost k danemu elementu existuje posluchac, tak jej odstranim -*/
		var removeListenersCount = this._removeElmListeners(elm);
		listenersCount -= removeListenersCount;

		var listenerId = this._addListener(elm, event);
		listenersCount++;

		this._elmsEvents.push({"elm": elm, "event": event, "listenerId": listenerId});
	};

	return listenersCount;
};

/**
 * Navesi posluchac udalosti na element
 *
 * @param {object} elm			element na nejz navesuji posluchace
 * @param {string} event		nazev udalosti
 * @returns {string}
 */
JAS.Core.prototype._addListener = function(elm, event) {
	var listenerId = JAK.Events.addListener(elm, event, this);
	return listenerId;
};

/**
 * Zjisti udalosti na ktereho element prepina pomoci data-action
 *
 * @param {object} elm			element na nejz navesuji posluchace
 * @returns {array}
 */
JAS.Core.prototype._getElmActionEvents = function(elm) {
	var data_action = elm.getAttribute(this._actionAttributeName);
	var data_action_parts = data_action.split(":");
	var events = data_action_parts[0].split(" ");

	return events;
};

/**
 * Zjisti stav do ktereho element prepina pomoci data-action
 *
 * @param {object} elm			element na nejz navesuji posluchace
 */
JAS.Core.prototype._getElmActionState = function(elm) {
	var data_action = elm.getAttribute(this._actionAttributeName);
	if (data_action) {
		var data_action_parts = data_action.split(":");
		if (data_action_parts) {
			var state = data_action_parts[1] || "";
			return state;
		} else {
			return null;
		};
	} else {
		console.warn("Data-action attribute is null");
	};
};

/**
 * Zjisti aktivni prvky v prislusnem DOM a odebere z nich posluchace na udalosti
 *
 * @param {object} dom         URL cile, pouzije se jako klic pro cache
 * @returns {array}
 */
JAS.Core.prototype.removeActions = function(dom) {
	var domElms = this._getActiveElements(dom);
	var actionsCount = 0;

	for (var i=0; i<domElms.length; i++) {
		var elm = domElms[i];
		actionsCount += this._removeElmListeners(elm);
	};

	this._log("Number of removed CoreActions: "+actionsCount);
};

/**
 * Odvesi posluchac udalosti z elementu pokud
 *
 * @param {object} elm			element z nehoz odvesuji posluchace
 * @param {string} event		nazev udalosti
 */
JAS.Core.prototype._removeElmListeners = function(elm) {
	var listenersCount = 0;

	for ( var i=0; i<this._elmsEvents.length; i++) {
		var elmEvent = this._elmsEvents[i];
		if (elmEvent.elm == elm) {
			// odeberu ze seznamu elementu s udalostmi
			this._elmsEvents.splice(i, 1);
			i--;

			if (elmEvent.listenerId) {
				listenersCount++;
				JAK.Events.removeListener(elmEvent.listenerId);
			} else {
				console.error("listener ID is not defined", elm, event);
			};
			break;
		};
	};

	return listenersCount;
};

/**
 * Zjisti aktivni prvky v prislusnem DOM a aktualizuje na nich posluchace na udalosti
 *
 * @param {object} dom			element v jehoz potomcich bude proces probihat
 * @returns {array}
 */
JAS.Core.prototype.updateActions = function(dom) {
	var domElms = this._getActiveElements(dom);
	var actionsRemovedCount = 0;
	var actionsAddedCount = 0;

	for (var i=0; i<domElms.length; i++) {
		var elm = domElms[i];
		actionsRemovedCount += this._removeElmListeners(elm);
		actionsAddedCount += this._addElmActions(elm);
	};

	this._log("Number of removed CoreActions: "+actionsRemovedCount+", Number of added CodeActions: "+actionsAddedCount);
};

/**
 * Zprostredkuje udalost
 *
 * @param {string} e			nazev udalosti
 */
JAS.Core.prototype.handleEvent = function(e) {
	var elm = e.currentTarget ? e.currentTarget : JAK.Events.getTarget(e);

	if (elm.getAttribute("data-stop-event")) {
		JAK.Events.stopEvent(e);	
	};

	JAK.Events.cancelDef(e);

	var stateAndParams = this._getStateAndParams(elm);
	var params = stateAndParams.params;
	var state = stateAndParams.state;
	var actionState = this._getElmActionState(elm);

	if (state != null) {
		if (actionState != null && actionState != "" && state != actionState) {
			console.warn('Conflict in state ID; urlPath state ID: '+state+', data-action state ID: '+actionState+'; used is urlPath state ID');
		};
	} else if (actionState == "") {
		throw new Error("There isn't any state ID in attribute data-action, or any state handler for URL (created from <a>/<form> element)");
	} else {
		state = actionState;
	};

	if (typeof(state) != "undefined") {
		this.go(state, params);
	} else {
		console.warn("Element state is udefined");
	};
};

/**
 * Ziska parametry potrebene pro predani jadru
 *
 * @param {object} elm			element z nehoz odvesuji posluchace
 * @returns {object}
 */
JAS.Core.prototype._getStateAndParams = function(elm) {
	var tagName = elm.tagName.toLowerCase();

	var dataParams = this._getDataParams(elm);

	var tagParams = {};
	var tagState = null;

	switch (tagName) {
		case "a":
			var stateAndParams = this._getUrlStateAndParams(elm.href);
			var tagParams = stateAndParams.params;
			var tagState = stateAndParams.state;
			break;
		case "form":
			var stateAndParams = this._getFormStateAndParams(elm);
			var tagParams = stateAndParams.params;
			var tagState = stateAndParams.state;
			break;
		default:
			break;
	};

	// merge parametru ziskanych z data-params a z kontextu elementu
	var params = tagParams;
	for (var i in dataParams) {
		var param = dataParams[i];
		if (typeof(params[i]) != "undefined" && params[i] != param) {
			console.warn('Conflict in "'+i+'" parameter, tagParam value: '+params[i]+' replaced by dataParam value: '+param);
		};
		params[i] = param;
	};

	return { params: params, state: tagState };
};

/**
 * Ziska parametry data-params
 *
 * @param {object} elm			element z nehoz odvesuji posluchace
 * @returns {object}
 */
JAS.Core.prototype._getDataParams = function(elm) {
	if (elm.hasAttribute("data-params")) {
		var dataParams = elm.getAttribute("data-params");
		var params = JSON.parse(dataParams);
	} else {
		var params = {};
	}
	return params;
};

/**
 * Ziska parametry z url
 *
 * @param {string} url			url ze ktereho chci parametry ziskat
 * @returns {object}
 */
JAS.Core.prototype._getUrlStateAndParams = function(url) {
	var matches = url.match(/http(s)?:\/\/[^\/]*(\/.*)/i);
	var parts = matches[2].split("?");

	// ziskani parametru pathUrl a prislusneho kontroleru, ktery umi zpracovat danou url
	var path = parts[0];
	var pathParse = this._getResponsibleState(path);
	var pathParams = pathParse.params;
	var pathState = pathParse.stateName;

	// zapsani odpovidajiciho stavu aplikace
	var state = null;
	if (pathState != "") {
		state = pathState;
	} else {
		console.info('Not possible find "state" in url');
	};

	// ziskani parametru z queryStringu
	var queryParts = parts[1] ? parts[1].split("&") : [];

	var queryParams = {};
	for ( var i=0; i<queryParts.length; i++) {
		var key = queryParts[i].split("=");
		// zjistim zda jsem jiz parametr neulozil. Pokud ano budu ukladat do pole, jinak ulozim jen hodnotu
		if (key[0] in queryParams) {
			// pokud dany parametr jiz byl ulozen jako hodnota, tak jej preulozim do pole
			if (!(queryParams[key[0]] instanceof Array)) {
				queryParams[key[0]] = [queryParams[key[0]]];
			};
			queryParams[key[0]].push(key[1]);
		} else {
			queryParams[key[0]] = key[1];
		}
	};

	var params = pathParams;
	// merge parametru z pathUrl a queryStringu
	for (var i in queryParams) {
		var param = queryParams[i];
		if (typeof(params[i]) != "undefined") {
			console.warn('Conflict in "'+i+'" parameter, pathUrl value: '+params[i]+' replaced by queryString value: '+param);
		};
		params[i] = param;
	};

	return { params: params, state: state };
};

/**
 * Ziska parametry z formulare
 *
 * @param {object} elm			element z nehoz odvesuji posluchace
 * @returns {object}
 */
JAS.Core.prototype._getFormStateAndParams = function(elm) {
	if (elm.action) {
		var stateAndParams = this._getUrlStateAndParams(elm.action);
		var params = stateAndParams.params;
		var state = stateAndParams.state;
	};

	var elmParams = {};

	var elms = elm.elements;
	for (var i in elms) {
		var elm = elms[i];

		if (!elm.disabled) {
			switch (elm.type) {
				case "checkbox":
				case "radio":
					if (elm.checked) {
						elmParams[elm.name] = elm.value;
					};
					break;
				case "hidden":
				case "textarea":
				case "text":
				case "select-one":
					elmParams[elm.name] = elm.value;
					break;
				case "select-multiple":
					elmParams[elm.name] = [];
					for (var j=0; j<elm.options.length; j++) {
						var option = elm.options[j];
						if (option.selected) {
							elmParams[elm.name].push(option.value);
						}
					};				
					break;
				default:
					break;
			};
		};
	};

	// merge parametru ziskanych z action formulare a z hodnot jeho elementu
	for (var i in elmParams) {
		var param = elmParams[i];
		if (typeof(params[i]) != "undefined") {
			console.warn('Conflict in "'+i+'" parameter, elmParam value: '+params[i]+' replaced by elmParam value: '+param);
		};
		params[i] = param;
	};		

	return { params: params, state: state };
};
/* END of JAS.Core */
