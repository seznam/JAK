
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
 * "State" ktery se pouzije, pokud se nenalezne zadny odpovidajici (404 state)
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
 * @param   {object}   options                        konfiguracni objekt, viz. dale
 * @param   {object}   options.dispatcher             instance dispatchera
 * @param   {array}    options.states                 seznam "statu" (posledni by mel byt state, ktery se postara o neosetreny stav)
 * @param   {object}   options.errorState             "state" pro chybu 404
 * @param   {object}   [options.settings]             volby nastaveni
 * @param   {function} [options.settings.debugLogger] funkce, kterou se bude realizovat logovani pro ladici ucely. Pokud neni specifikovana, tak se logovani neprovadi
 * @param   {string}   [options.settings.debugPrefix] text, jez bude uvozovat ladici logy Jadra
 * @throws  {Error}
 */
JAS.CoreBase.prototype.init = function(options) {
	if (JAS.core) {
		throw new Error("Invalid state: Core is already initialized");
	}
	if (!options.dispatcher) {
		throw new Error("Invalid argument: Dispatcher must be set");
	}
	if (!options.states) {
		throw new Error("Invalid argument: States must be set");
	}
	if (!options.errorState) {
		throw new Error("Invalid argument: Error state must be set");
	}

	for (var p in options.settings) {
		this._settings[p] = options.settings[p];
	}

	JAS.core = this;
	this._log("Registered Core instance %s", this.constructor.NAME);
	JAS.dispatcher = options.dispatcher;
	this._log("Registered Dispatcher %s", options.dispatcher.constructor.NAME);
	for (var i = 0, len = options.states.length; i < len; i++) {
		JAS.states.push(options.states[i]);
		this._log("Registered state %s for state ID „%s“", options.states[i].constructor.NAME, options.states[i].getId());
	}
	JAS.errorState = options.errorState;
	this._log("Registered error state %s", options.errorState.constructor.NAME);

	JAS.dispatcher.init();
};

/**
 * Spusti prepnuti "state" dle specifikovaneho stavu
 *
 * @param   {string}  stateId     nazev stavu
 * @param   {object}  [params]    parametry jako "asociativni pole"
 * @param   {boolean} [updateUrl] zda zmenu stavu propisovat do URL, defaultne true
 * @throws  {Error}
 */
JAS.CoreBase.prototype.go = function(stateId, params, updateUrl) {
	params = params || {};
	updateUrl = typeof(updateUrl) != "undefined" ? !!updateUrl : true;

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
	var activateReturnValue = this._activeState.activate(params);
	this._log("Activation state %s done", this._activeState.constructor.NAME);

	// navratova hodnota metody activate se bere v potaz jen kvuli zpetne kompatibilite!
	// - v nynejsi verzi jiz o nepropsani stavu do URL nezada metoda activate ale getUrl (tim ze nic nevrati)
	if (typeof(activateReturnValue) != "undefined") {
		console.warn("The return value of method state#activate is deprecated. You should use return value (empty string) of method state#getUrl");
	}

	if (updateUrl && !activateReturnValue) {
		this.update();
	}

	this._log("State ID „%s“ is complete", this._activeState.getId());
};

/**
 * Zmeni URL adresu dle aktualniho stavu
 *
 * Aktivniho "statu" se dotaze na URL a tu, pokud "state" nejakou vrati, vlozi do historie
 */
JAS.CoreBase.prototype.update = function() {
	this._log("Request to update URL");
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
