/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Validační rozhranní
 * Poskytuje metody pro validaci elementu.
 * Názvy veřejných metod a jejich chování kopírují nativní validační API
 * https://developer.mozilla.org/en-US/docs/HTML/Forms_in_HTML#Constraint_Validation_API
 */
JAK.HTML5Form.IValidationAPI = JAK.ClassMaker.makeInterface({
	'NAME': 'JAK.HTML5Form.IValidationAPI',
	'VERSION': '1.0'
});

/**
 * Objekt uchovávající stav validace elementu
 */
JAK.HTML5Form.IValidationAPI.prototype._validity = [
	{'key': 'customError', 'value': false},
	{'key': 'valueMissing', 'value': false},
	{'key': 'typeMismatch', 'value': false},
	{'key': 'patternMismatch', 'value': false},
	{'key': 'rangeOverflow', 'value': false},
	{'key': 'rangeUnderflow', 'value': false},
	{'key': 'stepMismatch', 'value': false},
	{'key': 'tooLong', 'value': false},
	{'key': 'valid', 'value': true}
];

/**
 * @method Metoda vracející stav validace elementu.
 * @param {string} elm <strong>volitelný</strong> Název klíče z objektu validity, jehož hodnotu chceme vrátit
 */
JAK.HTML5Form.IValidationAPI.prototype.validity = function (key) {
	this._updateValidity();

	var r = key ? '' : {};

	if (key) {
		this._validity.forEach(function (item) { if (item.key == key) { r = item.value; } });
	} else {
		this._validity.forEach(function (item) { r[item.key] = item.value; });
	}

	return r;
};

/**
 * @method Vrací informaci o tom, jestli je element správně vyplněn
 * @returns {bool}
 */
JAK.HTML5Form.IValidationAPI.prototype.checkValidity = function () {
	return this.validity('valid');
};

/**
 * @method Metoda pro získání textu, který se zobrazí ve validační hlášče
 */
JAK.HTML5Form.IValidationAPI.prototype.validationMessage = function () {

	this._updateValidity();

	for (var i = 0; i < this._validity.length; i++) {
		if (this._validity[i].key != 'valid' && this._validity[i].value == true) {
			var key = this._validity[i].key;
			var message = key == 'customError' ? this._customErrorMessage : JAK.HTML5Form.VALIDATION_MESSAGES[key];

			if (message instanceof Object) {
				if (this.elmType in message) {
					message = message[this.elmType];
				} else {
					message = message['default'];
				}
			}

			// pokud text obsahuje string uzavřený do dvojitých chlupatých závorek,
			// nahradí se string v závorkách za hodnotu atributu, jehož název
			// odpovídá stringu
			message = message.replace(/\{\{[a-z0-9_-]+\}\}/g, (function (match) {
				return this.elm.getAttribute(match.substring(2, match.length - 2));
			}).bind(this));

			return message;
		}
	}

	return '';
};

/**
 * @method Metoda pro nastavení vlastní validační hlášky.
 * Pokud má element nastavenou vlastní validační hlášku, je považován na nevalidní.
 * Předáním prázdného stringu se vlastní validační hláška zruší.
 * @param {string} message Text validační hlášky nebo prázdný string
 */
JAK.HTML5Form.IValidationAPI.prototype.setCustomValidity = function (message) {

	var item = this._validity[0];

	if (message) {
		item.value = true;
		this._customErrorMessage = message;
	} else {
		item.value = false;
		this._customErrorMessage = '';

}};

/**
 * @method Metoda pro ověření toho, jestli je element určený k validaci
 * @returns {bool}
 */
JAK.HTML5Form.IValidationAPI.prototype.willValidate = function () {
	var nodeName = this.elm.nodeName.toLowerCase();
	return !((['fieldset', 'button', 'output'].indexOf(nodeName) != -1) || (['submit', 'button', 'reset'].indexOf(this.elmType) != -1) || this.elm.hasAttribute('disabled'));
};

/**
 * Aktualizace objektu "_validity"
 */
JAK.HTML5Form.IValidationAPI.prototype._updateValidity = function () {
	if (this.willValidate()) {
		// vše v objektu "_validity" se nastaví na false
		// případný customError se zachová
		this._validity.forEach( function (item) {
			if (item.key != 'customError') { item.value = false; }
		});

		// zohlednění nativní validace
		if (this.elm.validity) {
			this._validity.forEach( function (item) {
				// zkopírování nativního customError, pokud byl nastaven
				if (item.key == 'customError') {
					if (this.elm.validity.customError == true) {
						item.value = this.elm.validity[item.key];
						this._customErrorMessage = this.elm.validationMessage();
					}
				} else {
					item.value = this.elm.validity[item.key];
				}

			}, this);
		}

		// volání metody "_validate", pokud jí byla instance odekorována
		if (!(this.elm.disabled)) {
			try { this._validate(); } catch (e) {}
		}

		// nastavení hodnoty klíče "valid"
		// pokud je hodnota některého ze zbývající klíčů "true", valid se nastaví na "false"
		var valid = true;
		for (var i = 0; i < this._validity.length; i++) {
			if (this._validity[i].key != 'valid' && this._validity[i].value == true) {
				valid = false;
				break;
			}
		}
		this._setValidity('valid', valid);
	}
};

/**
 * Metoda pro změny hodnoty klíče v objektu "_validity"
 * @params {string} key Název klíče
 * @params {bool} value Hodnota klíče
 */
JAK.HTML5Form.IValidationAPI.prototype._setValidity = function (key, value) {
	for (var i = 0; i < this._validity.length; i++) {
		if (this._validity[i].key == key) {
			this._validity[i].value = value;
			break;
		}
	}
};

/* ------------------------------------------------------------------------- */

/**
 * @class Třída reprezentující element formuláře
 * @group jak-utils
 * @augments JAK.ISignals
 * @signal change
 * @signal input
 */
JAK.HTML5Form.Element = JAK.ClassMaker.makeClass({
	'NAME': 'JAK.HTML5Form.Element',
	'VERSION': '1.0',
	'IMPLEMENT': [
		JAK.ISignals,
		JAK.IDecorable,
		JAK.HTML5Form.IValidationAPI
	]
});

/**
 * konstruktor
 * @param {node} elm Element
 * @param {object} owner Reference na instanci JAK.HTML5Form
 */
JAK.HTML5Form.Element.prototype.$constructor = function (elm, owner) {
	// DOM element
	this.elm = elm;

	// event listeners kontejner
	this._ec = [];

	// instance třídy JAK.HTML5Form
	this.owner = owner;

	// objekt vlastností pro použité dekorátory
	// {'jmeno_decoratoru': {'dec', 'ev': [], 'sc': [], 'dom' {}}}
	this.decorators = {};

	// uchovává typ elementu
	var nodeName = elm.nodeName.toLowerCase();
	this.elmType = nodeName == 'input' ? this.elm.getAttribute('type') : nodeName;

	// text vlastní validační hlášky
	this._customErrorMessage = '';

	// navěšení posluchačů pro vyvolání signálů
	this._registerSignals();

	this._decorate();
};

/**
 * @method destruktor
 * Ruší funkcionalitu všech použitých dekorátorů
 */
JAK.HTML5Form.Element.prototype.$destructor = function () {
	for (var d in this.decorators) { this.decorators[d].dec.remove(this); }
	JAK.Events.removeListeners(this._ec);
	this._ec = [];
};

/**
 * Metoda prochází vlastnosti inputu a hledá k nim patřičné dokorátory,
 * kterými pak dekoruje instanci elementu
 */
JAK.HTML5Form.Element.prototype._decorate = function () {
	// hledání dekorátoru
	var findDecorator = function (name) {
		if (!name) { return null; }
		for (var prop in JAK.HTML5Form.Decorators) {
			if (prop.toLowerCase() == name.toLowerCase() && typeof JAK.HTML5Form.Decorators[prop] == 'function') {
				return JAK.HTML5Form.Decorators[prop];
			}
		}
	};

	if (this.elm.nodeName.toLowerCase() == 'input') {
		var d = findDecorator('input'+this.elmType);
		if (d) { this.decorate(d); }
	}

	for (var attr in this.elm.attributes) {
		var nodeName = this.elm.attributes[attr].nodeName;
		if (nodeName) {
			var d = findDecorator(nodeName);
			if (d) { this.decorate(d); }
		}
	}
};

/**
 * Navěsí posluchače na události, při nichž se mění hodnota inputu,
 * aby se při nich mohl vyvolat signal "input"
 * Navěsí posluchače na change událost pro vyvolání stejnojmeného signálu
 */
JAK.HTML5Form.Element.prototype._registerSignals = function () {
	// při change události vyvolat signál "change"
	this._ec.push(JAK.Events.addListener(this.elm, 'change', this, function (e, elm) {
		this.makeEvent('change');
	}));

	// při input události vyvolat signál "input" na elementu na rodičovském formuláři
	if (this.owner.isSupported('oninput')) {
		this._ec.push(JAK.Events.addListener(this.elm, 'input', this, function (e, elm) {
			this.makeInputSignal();
		}));
	} else {
		this._ec.push(JAK.Events.addListener(this.elm, 'keyup', this, function (e, elm) {
			this.makeInputSignal();
		}));
		this._ec.push(JAK.Events.addListener(this.elm, 'paste', this, function (e, elm) {
			setTimeout(this.makeInputSignal.bind(this, this), 50);
		}));
	}
};

/**
 * Spouští signál "input" na elementu a na rodičovské instanci JAK.HTML5Form
 */
JAK.HTML5Form.Element.prototype.makeInputSignal = function () {
	this.makeEvent('input');
	this.owner.makeEvent('input');
};
