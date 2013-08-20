
/**
 * @overview Jadro
 * @author Jose
 */

/**
 * @namespace
 * @group jas
 */
var JAS = JAS || { NAME:"JAS" };

/**
 * @class Realizuje prepnuti "state" dle vyzadaneho stavu
 * @group jas
 */
JAS.CoreBase = JAK.ClassMaker.makeSingleton({
	NAME: "CoreBase",
	VERSION: "3.2",
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
JAS.CoreBase.parse = function(str) {
	if (str == "") {
		str = "/";
	}
	return str;
};

/**
 * Metoda implementovana kvuli JAK.History2
 *
 * @param  {object} obj
 * @returns {object}
 */
JAS.CoreBase.serialize = function(obj) {
	return obj;
};

JAS.CoreBase.prototype.$constructor = function() {
	this._states = [];
	this._settings = {
		debugLogger: null,
		debugPrefix: "Core: "
	};

	this._history = null;
	this._activeState = null;
};

/**
 * Uvede Jadro do provozu:
 * 1) nacte konfiguraci
 * 2) zaregistruje "staty"
 * 3) Nacte URL a aktivuje podle toho patricny "state"
 *
 * @param {object} states                   seznam "statu" (posledni by mel byt state, ktery se postara o neosetreny stav)
 * @param {object} [settings]               volby nastaveni
 * @param {function} [settings.debugLogger] funkce, kterou se bude realizovat logovani pro ladici ucely. Pokud neni specifikovana, tak se logovani neprovadi
 * @param {string} [settings.debugPrefix]   text, jez bude uvozovat ladici logy Jadra
 * @throws {Error}
 */
JAS.CoreBase.prototype.init = function(states, settings) {
	settings = settings || null;
	if (!states) {
		throw new Error("Invalid argument: States must be set");
	}

	for (var p in settings) {
		this._settings[p] = settings[p];
	}

	for (var i = 0, len = states.length; i < len; i++) {
		this._states.push(states[i]);
		this._log("Registered state %s for state ID „%s“", states[i].constructor.NAME, states[i].getId());
	}

	JAK.History2.config.processor = JAS.CoreBase;
	this._history = JAK.History2.getInstance();
	this._changeState({ url:this._history.get() });
	this.addListener("history-change", "_urlChange", this._history);
};

/**
 * Spusti prepnuti "state" dle specifikovaneho stavu
 *
 * @param {string} stateId   nazev stavu
 * @param {object} [params]  parametry jako "asociativni pole"
 * @throws {Error}
 */
JAS.CoreBase.prototype.go = function(stateId, params) {
	params = params || {};

	if (!stateId) {
		throw new Error("Invalid argument: State ID must be specified");
	}

	this._changeState({ stateId:stateId, params:params });
};

/**
 * Zmeni URL adresu dle aktualniho stavu
 *
 * Aktivniho "statu" se dotaze na URL a tu, pokud "state" nejakou vrati, vlozi do historie
 */
JAS.CoreBase.prototype.update = function() {
	this._log("Request to update");
	if (this._activeState) {
		var newUrl = this._activeState.getUrl();
		if (newUrl) {
			this._log("Changing URL address to '%s'", newUrl);
			this._history.save(newUrl);
		}
	}
};

/**
 * Spusti prepnuti stavu dle zmeny URL adresy
 *
 * @param {object} sigObj objekt signalu
 */
JAS.CoreBase.prototype._urlChange = function(sigObj) {
	var url = sigObj.data.state;
	this._log("URL change to %s", url);
	this._changeState({ url:url });
};

/**
 * Nalezne odpovidajici "state" a spusti prepnuti
 *
 * @param {object} stateOpt           musi obsahovat bud URL stavu nebo nazev stavu
 * @param {string} [stateOpt.url]     URL stavu
 * @param {string} [stateOpt.stateId] nazev stavu
 * @param {object} [stateOpt.params]  parametry stavu
 * @throws {Error}
 */
JAS.CoreBase.prototype._changeState = function(stateOpt) {
	this._log("Request to change state");
	if (this._states.length == 0) {
		throw new Error("Invalid state: Core isn't working right now");
	}
	if (!stateOpt) {
		throw new Error("Invalid argument: State options must be specified");
	}

	var assignUrl = true;
	var newState = null;
	var stateParams = null;
	if (stateOpt.stateId) {
		stateParams = stateOpt.params;
		for (var i = 0, len = this._states.length; i < len; i++) {
			if (stateOpt.stateId === this._states[i].getId()) {
				newState = this._states[i];
				break;
			}
		}
	} else if (stateOpt.url) {
		assignUrl = false;
		var responsableState = this._getResponsibleState(stateOpt.url);

		stateParams = responsableState.params;
		newState = responsableState.state;
	} else {
		throw new Error("Must be specified state URL or ID");
	}

	if (!newState) {
		var errReason = "";
		if (stateOpt.stateId) {
			errReason = "stateID „" + stateOpt.stateId + "“";
		} else {
			errReason = "URL „" + stateOpt.url + "“";
		}
		throw new Error("There isn't state for " + errReason);
	}
	this._log("Going to state ID „%s“, with parameters: %o", newState.getId(), stateParams);
	this._log("Matched state %s", newState.constructor.NAME);

	// deaktivace stareho "state", pokud nejde o prvni (zavadejici) nebo stejny stav
	if (this._activeState && this._activeState != newState) {
		this._log("Starting the deactivation state %s", this._activeState.constructor.NAME);
		this._activeState.deactivate(newState);
		this._log("Deactivation state %s done", this._activeState.constructor.NAME);
	}
	// aktivace noveho stavu
	this._activeState = newState;
	this._log("Starting the activation state %s", this._activeState.constructor.NAME);
	var doNotChangeUrl = this._activeState.activate(stateParams);
	this._log("Activation state %s done", this._activeState.constructor.NAME);

	// dokonceni zmeny stavu
	if (assignUrl && !doNotChangeUrl) {
		var newUrl = this._activeState.getUrl();
		if (newUrl) {
			this._log("Changing URL address to '%s'", newUrl);
			this._history.save(newUrl);
		}
	}
	this._log("State ID „%s“ is complete", this._activeState.getId());
};

/**
 * Nalezne odpovidajici "state" dle URL a vrati jej v objektu, ve kterem je dale odpovidajici ID a parametry stavu
 *
 * @param {string} url                  URL k nemuz hledam "state"
 * @param {string} [stateOpt.stateId]   nazev stavu
 * @param {object} [stateOpt.params]    parametry stavu
 * @returns {object}
 */
JAS.CoreBase.prototype._getResponsibleState = function(url) {
	var returnedParams = {};
	var returnedState = null;
	var returnedStateName = "";

	for (var i = 0, len = this._states.length; i < len; i++) {
		var state = this._states[i];
		var params = state.parseUrl(url);
		if (params) {
			returnedParams = params;
			returnedState = state;
			returnedStateName = state.getId();
			break;
		}
	}

	return { "params": returnedParams, "state": returnedState, "stateName" : returnedStateName };
};

/**
 * Debug log
 *
 * @param {array} arguments prvni argument je text zpravy, vsechny dalsi jsou parametry teto zpravy
 */
JAS.CoreBase.prototype._log = function() {
	if (this._settings.debugLogger) {
		var args = Array.prototype.slice.call(arguments);
		args[0] = this._settings.debugPrefix + args[0];
		this._settings.debugLogger.apply(window, args);
	}
};
/* END of JAS.CoreBase */
