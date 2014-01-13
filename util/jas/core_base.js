
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
 * Instance jadra
 *
 * @type {object}
 */
JAS.core = null;

/**
 * Instance dispatchera
 *
 * @type {object}
 */
JAS.dispatcher = null;

/**
 * Pole instanci "statu"
 *
 * @type {array}
 */
JAS.states = [];

/**
 * "State" ktery se pouzije, pokud se nenalezne odpovidajici "state" - 404 state
 *
 * @type {object}
 */
JAS.errorState = null;

/**
 * @class Realizuje prepnuti "state" dle vyzadaneho stavu
 * @group jas
 */
JAS.CoreBase = JAK.ClassMaker.makeSingleton({
	NAME: "CoreBase",
	VERSION: "4.0"
});

JAS.CoreBase.prototype.$constructor = function() {
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
 * 2) zaregistruje instanci jadra, dispatchera a "staty"
 * 3) inicializuje dispatchera
 *
 * @param   {object}   dispatcher             instance dispatchera //TODO: argument by nejspis mel byt jinde, kvuli apetne kompatibilite
 * @param   {array}    states                 seznam "statu" (posledni by mel byt state, ktery se postara o neosetreny stav)
 * @param   {object}   errorState             "state" pro chybu 404
 * @param   {object}   [settings]             volby nastaveni
 * @param   {function} [settings.debugLogger] funkce, kterou se bude realizovat logovani pro ladici ucely. Pokud neni specifikovana, tak se logovani neprovadi
 * @param   {string}   [settings.debugPrefix] text, jez bude uvozovat ladici logy Jadra
 * @throws  {Error}
 */
JAS.CoreBase.prototype.init = function(dispatcher, states, errorState, settings) {
	settings = settings || null;
	if (JAS.core) {
		throw new Error("Invalid state: Core is already initialized");
	}
	if (!dispatcher) {
		throw new Error("Invalid argument: Dispatcher must be set");
	}
	if (!states) {
		throw new Error("Invalid argument: States must be set");
	}
	if (!errorState) {
		throw new Error("Invalid argument: Error state must be set");
	}

	for (var p in settings) {
		this._settings[p] = settings[p];
	}

	JAS.core = this;
	this._log("Registered Core instance „%s“", this.constructor.NAME);
	JAS.dispatcher = dispatcher;
	this._log("Registered Dispatcher „%s“", dispatcher.constructor.NAME);
	for (var i = 0, len = states.length; i < len; i++) {
		JAS.states.push(states[i]);
		this._log("Registered state %s for state ID „%s“", states[i].constructor.NAME, states[i].getId());
	}
	JAS.errorState = errorState;
	this._log("Registered error state %s", errorState.constructor.NAME);

	JAS.dispatcher.init();
};

/**
 * Spusti prepnuti "state" dle specifikovaneho stavu
 *
 * @param   {string}  stateId  nazev stavu
 * @param   {object}  [params] parametry jako "asociativni pole"
 * @returns {boolean}          pokud si "state" nepreje updatovat adresu umisteni tak true, jinak false
 * @throws  {Error}
 */
JAS.CoreBase.prototype.go = function(stateId, params) {
	params = params || {};

	if (!stateId) {
		throw new Error("Invalid argument: State ID must be specified");
	}

	this._log("Going to state ID „%s“, with parameters: %o", stateId, params);

	var newState = null;
	for (var i = 0, len = JAS.states.length; i < len; i++) {
		if (stateId === JAS.states[i].getId()) {
			newState = JAS.states[i];
			break;
		}
	}
	if (!newState) {
		console.warn("There isn't state for stateID „" + stateId + "“");
		newState = JAS.errorState;
	}

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
	var doNotChangeUrl = !!this._activeState.activate(params);
	this._log("Activation state %s done", this._activeState.constructor.NAME);

	return doNotChangeUrl;
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
			JAS.dispatcher.pushHistory(newUrl);
		}
	}
};

/**
 * Debug log
 *
 * @param   {array} arguments prvni argument je text zpravy, vsechny dalsi jsou parametry teto zpravy
 */
JAS.CoreBase.prototype._log = function() {
	if (this._settings.debugLogger) {
		var args = Array.prototype.slice.call(arguments);
		args[0] = this._settings.debugPrefix + args[0];
		this._settings.debugLogger.apply(window, args);
	}
};
