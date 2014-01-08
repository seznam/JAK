/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Cross-browser podpora HTML5 formulářů
 * @version 1.0
 * @author Jiří Kuchta
 */

/**
 * @class Cross-browser podpora HTML5 formulářů
 * @group jak-utils
 * @signal input
 */
JAK.HTML5Form = JAK.ClassMaker.makeClass({
	'NAME': 'JAK.HTML5Form',
	'VERSION': '1.0',
	'IMPLEMENT': [JAK.ISignals]
});

/**
 * Validační hlášky
 * @constant
 */
JAK.HTML5Form.VALIDATION_MESSAGES = {
	'valueMissing': {
		'checkbox': 'Chcete-li pokračovat, zaškrtněte prosím toto políčko.',
		'radio': 'Vyberte jednu z těchto možností.',
		'default': 'Vyplňte prosím toto pole.'
	},
	'typeMismatch': {
		'url': 'Zadejte prosím platnou adresu URL.',
		'email': 'Zadejte prosím platnou e-mailovou adresu.',
		'default': 'Vyplňte prosím pole v požadovaném formátu.'
	},
	'patternMismatch': 'Vyplňte prosím pole v požadovaném formátu.',
	'tooLong': 'Je povoleno zadat maximálně {{maxlength}} znaků.',
	'rangeUnderflow': 'Hodnota musí být větší nebo rovna {{min}}.',
	'rangeOverflow': 'Hodnota musí být menší nebo rovna {{max}}.',
	'stepMismatch': 'Neplatná hodnota.',
	'badInput': 'Neplatná hodnota.'
};

/**
 * konstruktor
 * @param {node} form Element formuláře
 * @param {object} opt Objekt konfigurace
 * @param {object} visualizer Třída, která bude použita pro vizualizaci validace
 * @param {object} visualizerOpt Nastavení pro vizualizer
 * @param {object} calendarOpt Nastavení pro calendar widget
 * @param {object} colorPickerOpt Nastavení pro colorpicker widget
 * @param {object} sliderOpt Nastavení pro slider widget
 */
JAK.HTML5Form.prototype.$constructor = function (form, opt) {
	this.options = {
		'visualizer': JAK.HTML5Form.TooltipVisualizer,
		'visualizerOpt': {},
		'calendarOpt': {
			'imageUrl': false,
			'label': 'Vybrat datum',
			'options': {}
		},
		'colorPickerOpt': {
			'imageUrl': false,
			'label': 'Vybrat barvu',
			'options': {}
		},
		'sliderOpt': {}
	};

	for (var p in opt) {
		if (opt[p] instanceof Object) {
			for (var k in opt[p]) {
				this.options[p][k] = opt[p][k];
			}
		} else {
			this.options[p] = opt[p];
		}
	}

	// kontejner pro posluchače událostí
	this._ec = [];

 	// form element
	this.form = form;

	// vygeneruje ID formuláře, pokud žádné nemá
	if (!form.id) { form.id = 'form-'+JAK.idGenerator(); }

	// bude se formulář před odesláním validovat?
	this.willValidate = form.hasAttribute('novalidate') ? false : true;

	// zakáz zobrazení nativní validace formuláře
	form.setAttribute('novalidate', '');

	// ošetření submit a reset událostí
	this._ec.push(JAK.Events.addListener(this.form, 'submit', this, '_submit'));
	this._ec.push(JAK.Events.addListener(this.form, 'reset', this, '_reset'));

	// reference na instance JAK.HTML5Form.Element
	// [id_elementu: instance]
	this.elements = {};

	// tester nativní podpory
	var tester = JAK.HTML5Form.SupportTester.getInstance()
	this.isSupported = tester.test.bind(tester);

	// unikátní index, který je součástí id elementu
	this._nextElementIndex = 0;

	// inicializace vizualizéru validace
	this.visualizer = new this.options.visualizer(this.options.visualizerOpt);

	// získání všech elementů formuláře
	this._getFormElements().forEach(function (elm) { this._addElement(elm); }, this);
};

/**
 * @method destruktor
 */
JAK.HTML5Form.prototype.$destructor = function () {
	JAK.Events.removeListeners(this._ec);
	this._ec = [];
	for (var item in this.elements) {
		this.elements[item].$destructor();
		delete item;
	}
};

/**
 * @method Vrací instanci JAK.HTML5Form.Element
 * @param {node||string} elm Samotný element nebo jeho ID
 * @return {object} instance třídy JAK.HTML5Form.Element
 */
JAK.HTML5Form.prototype.getElement = function (elm) {
	var elem = JAK.gel(elm);
	return elem && elem.id ? this.elements[elem.id] : null;
};

/**
 * @method Registrace nového prvku formuláře.
 * Volá se po appendnutí elementu do DOMu nebo po přidání/odebrání atributů.
 * @param {node||string} elm Samotný element nebo jeho ID
 */
JAK.HTML5Form.prototype.setElement = function (elm) {
	var node = JAK.gel(elm);
	this.unsetElement(node);
	this._addElement(node);
};

/**
 * @method Ruší podporu pro daný element. Volá se před vyjmutím elementu z DOMu.
 * @param {node||string} elm Samotný element nebo jeho ID
 */
JAK.HTML5Form.prototype.unsetElement = function (elm) {
	var node = JAK.gel(elm);
	if (node && (node.id in this.elements)) {
		this.elements[node.id].$destructor();
		delete this.elements[node.id];
	}
};

/**
 * @method Metoda pro zjištění, jestli je formulář správně vyplněn.
 * @param {array} elms <strong>volitelný</strong> Pole instancí JAK.HTML5Form.Element, u kterých se bude zjišťovat validita
 * @returns {bool}
 */
JAK.HTML5Form.prototype.checkValidity = function (elms) {
	elms = elms || this._getValidationElements();
	return elms.every(function(elm, i, arr) {
		return elm.checkValidity();
	})
};

/**
 * @method Projde elementy určené k validaci a ověří správnost vyplnění.
 * Pokud některý z nich není validní, volá vizualizer k zobrazení validační hlášky.
 * @param {array} elms <strong>volitelný</strong> Pole instancí JAK.HTML5Form.Element, u kterých se bude zjišťovat validita
 */
JAK.HTML5Form.prototype.validate = function (elms) {
	// pole elementů, které neprošly validací
	var invalidElements = [];

	// elementy k zvalidování
	elms = elms || this._getValidationElements();

	elms.forEach( function (elm, i, arr) {
		if (!elm.checkValidity()) {
			invalidElements.push(elm);
		}
	});

	// pokud nejsou některé elementy validní, zobraz validační hlášku
	if (invalidElements.length) {
		this.visualizer.showValidation(invalidElements);
	}
};

/**
 * Handler submitu formuláře
 * Formulář se odešle jen případě, že je validace
 * úspěšná nebo vypnutá.
 */
JAK.HTML5Form.prototype._submit = function (e, elm) {
	JAK.Events.cancelDef(e);

	// má se formulář validovat?
	if (this.willValidate) {
		var validationElements = this._getValidationElements();
		// jsou všechny elementy validní?
		if (this.checkValidity(validationElements)) {
			this.form.submit();
		} else {
			this.validate(validationElements);
		}
	} else {
		this.form.submit();
	}
};

/**
 * Handler reset události
 * Odstraní případné validační hlášky.
 */
JAK.HTML5Form.prototype._reset = function (e, elm) {
	this.visualizer.removeValidation();
};

/**
 * Vytváří instance JAK.HTML5Form.Element
 * Elementu přidá ID (pokud žádné nemá), přes které
 * se následně dá na instanci odkazovat.
 * @param {node} node HTML element prvku formuláře
 */
JAK.HTML5Form.prototype._addElement = function (node) {
	if (node.nodeName.toLowerCase() != 'fieldset') {
		if (!node.id) {
			node.id = this.form.id + '-elm-' + this._nextElementIndex;
			this._nextElementIndex++;
		}
		this.elements[node.id] = new JAK.HTML5Form.Element(node, this);
	}
};

/**
 * Získá všechny prvky formuláře - včetně těch, které nejsou
 * jeho potomky, ale mají vyplněný atribut "form" s id daného
 * formuláře
 */
JAK.HTML5Form.prototype._getFormElements = function () {
	var elements = JAK.DOM.arrayFromCollection(this.form.elements);

	if (!this.isSupported('form') && this.form.id) {
		elements = elements.concat(
			JAK.DOM.arrayFromCollection(document.querySelectorAll('[form='+this.form.id+']'))
		);
	}

	return elements;
};

/**
 * Metoda pro získání všech elementů, které jsou určeny k validaci
 * @returns {array} Pole instancí JAK.HTML5Form.Element
 */
JAK.HTML5Form.prototype._getValidationElements = function () {
	// pole elementů, které se budou validovat
	var validationElements = [];
	for (var elm in this.elements) {
		var i = this.elements[elm];
		if (i.willValidate()) { validationElements.push(i); }
	};
	return validationElements;
};
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Tester nativní podpory
 */
JAK.HTML5Form.SupportTester = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.SupportTester',
	'VERSION': '1.0'
});

JAK.HTML5Form.SupportTester.prototype.$constructor = function () {
	// výsledky proběhlých testů
	this._results = {};

	this._results.oninput = 'oninput' in JAK.mel('form');
	this._results.onpropertychange = 'onpropertychange' in JAK.mel('input');
};

/**
 * @method Vyhledá a zavolá vhodný test
 * @param {object} decorator Instance testovaného dekorátoru
 * @param {object} instance Instance JAK.HTML5Form.Element
 * @returns {boolean} Výsledek testu nativní podpory
 */
JAK.HTML5Form.SupportTester.prototype.test = function (decorator, instance) {
	var dname = typeof decorator == 'string' ? decorator : decorator.constructor.NAME.split('.').pop().toLowerCase();
	var nodeName = instance ? instance.elm.nodeName.toLowerCase() : null;

	if (dname in this._results) {
		if (typeof this._results[dname] == 'boolean') {
			return this._results[dname];
		} else {
			return this._results[dname][nodeName];
		}
	} else {
		if (dname.indexOf('input') != -1) {
			// testování podpory inputu
			this._testInput(dname);
			return this._results[dname];
		} else {
			if (dname == 'form') {
				// testování podpory atributu "form"
				this._testFormAttribute();
				return this._results[dname];
			} else {
				// testování ostatních atributů
				this._testAttribute(dname, nodeName);
				return this._results[dname][nodeName];
			}
		}
	}
};

/**
 * Metoda pro testování podpory inputu
 * @param {string} dname Jméno dekorátoru
 */
JAK.HTML5Form.SupportTester.prototype._testInput = function (dname) {
	var i = JAK.mel('input');
	var type = dname.replace('input', '');
	i.setAttribute('type', type);

	if (type == "number") {
		// IE10-11 má jen částečnou podporu number inputu
		try {
			i.value = 1;
			i.stepUp();
			this._results[dname] = true;
		} catch (err) {
			this._results[dname] = false;
		}
		return;
	}

	this._results[dname] = i.type == type;
};

/**
 * Metoda pro otestování atributu
 * @param {string} dname Jméno dekorátoru
 */
JAK.HTML5Form.SupportTester.prototype._testAttribute = function (dname, nodeName) {
	var attrName = dname == 'maxlength' ? 'maxLength' : dname;
	this._results[dname] = this._results[dname] || {};
	this._results[dname][nodeName] = (attrName in JAK.mel(nodeName));
};

/**
 * Metoda pro otestování podpory atributu "form"
 */
JAK.HTML5Form.SupportTester.prototype._testFormAttribute = function () {
	var form = JAK.mel('form');
	var input = JAK.mel('input');
	var div = JAK.mel('div');
	var r = false;

	form.id = 'formtest-' + JAK.idGenerator();
	input.setAttribute('form', form.id);

	div.appendChild(form);
	div.appendChild(input);

	document.body.appendChild(div);
	r = form.elements.length == 1 && input.form == form;
	div.parentNode.removeChild(div);

	this._results['form'] = r;
};
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
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Společný předek pro dekorátory
 * @group jak-utils
 * @augments JAK.AbstractDecorator
 */
JAK.HTML5Form.Decorators = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators',
	'VERSION': '1.0',
	'EXTEND': JAK.AbstractDecorator
});

/**
 * @function Obalí element do wrap elementu
 * @param {node} elm Element, který chceme obalit
 * @returns {node} Wrap element obsahující předaný element
 */
JAK.HTML5Form.Decorators.wrapElement = function (elm) {
	var cont = JAK.mel('span',{'className': 'jak-html5form-wrap'});
	elm.parentNode.insertBefore(cont, elm);
	cont.appendChild(elm);
	return cont;
};

JAK.HTML5Form.Decorators.prototype.$constructor = function () {
	// testování případných závislostí dekorátoru
	if (this.constructor._DEPEND) { this._testDepend();	 }

	// instance testeru nativní podpory
	var tester = JAK.HTML5Form.SupportTester.getInstance();
	this._isSupported = tester.test.bind(tester);
};

/**
 * @method Rodičovská metoda decorate
 * Automaticky odekoruje předanou instanci o metodu "_validate"
 * @param {object} instance Instance třídy JAK.HTML5Form.Element
 */
JAK.HTML5Form.Decorators.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		instance.decorators[this.constructor.NAME] = {'dec': this, 'ec': [], 'sc': [], 'dom': {}};
	}

	if ('_validate' in this) { instance['_validate'] = this['_validate']; }
};

/**
 * @method Rodičovská "remove" metoda pro odstranění funcionality dekorátoru.
 * Stará se o odvěšení event a signal listenerů a případných elementů, které si dekorátor vytvořil
 * @param {object} instance Instance třídy JAK.HTML5Form.Element
 */
JAK.HTML5Form.Decorators.prototype.remove = function (instance) {
	var dname = this.constructor.NAME;

	if (dname in instance.decorators) {
		// odvěšení event listeneru
		JAK.Events.removeListeners(instance.decorators[dname].ec);

		// odvěšení signal listeneru
		instance.removeListeners(instance.decorators[dname].sc);

		// odstranění DOMu dekorátoru
		for (var key in instance.decorators[dname].dom) {
			var node = instance.decorators[dname].dom[key];
			if (!node) { continue; }

			// Před smazáním obalovacího prvku, je nejdřív potřeba z něj vyjmout obalený input
			if (key == 'cont') {
				var parent = node.parentNode;
				var sibling = node.nextSibling;

				if (sibling) {
					parent.insertBefore(instance.elm, sibling);
				} else {
					parent.appendChild(instance.elm);
				}
			}

			if (node && node.parentNode) { node.parentNode.removeChild(node); }
		}

		delete instance.decorators[dname];
	}
};

/**
 * Metoda pro otestování závislostí dekorátoru.
 */
JAK.HTML5Form.Decorators.prototype._testDepend = function () {
	var result = false;
	if (result = JAK.ClassMaker._testDepend(this.constructor._DEPEND)) {
		throw new Error("Dependency error in class " + this.constructor.NAME + " ("+result+")");
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro input typu "url"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 *
 * Testuje, zda je vložená hodnota platná URL adresa
 */
JAK.HTML5Form.Decorators.InputUrl = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.InputUrl',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.InputUrl.REGEXP_PATTERN = /^\s*https?:\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?\s*$/;

JAK.HTML5Form.Decorators.InputUrl.prototype._validate = function () {
	try { this.$super(); } catch (e) {}
	if (this.elm.value && !JAK.HTML5Form.Decorators.InputUrl.REGEXP_PATTERN.test(this.elm.value)) {
		this._setValidity('typeMismatch', true);
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro input typu "email"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 *
 * Testuje, zda je vložená hodnota platný email
 */
JAK.HTML5Form.Decorators.InputEmail = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.InputEmail',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.InputEmail.REGEXP_PATTERN = /^[a-zA-Z0-9.!#$%&’*+\/=?\^_`{|}~\-]+@[a-zA-Z0-9\-]+(?:\.[a-zA-Z0-9\-]+)*$/;

/**
 * Testování hodnoty na platnou emailovou adresu
 * Pokud má input atribut "multiple", je možné zadat více adres oddělených čárkou
 */
JAK.HTML5Form.Decorators.InputEmail.prototype._validate = function () {
	try { this.$super(); } catch (e) {}
	if (this.elm.value) {
		var values = this.elm.value.split(",");
		if (values.length > 1 && !this.elm.hasAttribute('multiple')) {
			this._setValidity('typeMismatch', true);
		} else {
			for (var i = 0; i < values.length; i++) {
				if (!JAK.HTML5Form.Decorators.InputEmail.REGEXP_PATTERN.test(values[i].trim())) {
					this._setValidity('typeMismatch', true);
					break;
				}
			}
		}
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro input typu "number"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 *
 * Dekorovaný objekt obohatí o metody "stepUp" a "stepDown"
 */
JAK.HTML5Form.Decorators.InputNumber = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.InputNumber',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.InputNumber.prototype.decorate = function (instance) {
	this.$super(instance);
	if (!this._isSupported(this, instance)) { this._build(instance); }

	// odekorování instance třídy JAK.HTML5Form.Element o metody "stepUp" a "stepDown"
	instance['stepUp'] = this['stepUp'];
	instance['stepDown'] = this['stepDown'];
};

/**
 * Metoda pro vytvoření ovládacích prvků inputu (šipka nahoru a dolů)
 */
JAK.HTML5Form.Decorators.InputNumber.prototype._build = function (instance) {

	instance.elm.setAttribute('autocomplete', 'off');
	var dname = this.constructor.NAME;

	var cont = JAK.HTML5Form.Decorators.wrapElement(instance.elm);
	var buttonWrap = JAK.mel('span', {'className': 'jak-html5form-number-wrap'});
	var upButton = JAK.mel('input', {'type': 'button', 'className': 'step-up', 'tabIndex': '-1'});
	var downButton = JAK.mel('input', {'type': 'button', 'className': 'step-down', 'tabIndex': '-1'});

	instance.decorators[dname].dom['cont'] = cont;
	instance.decorators[dname].dom['buttonWrap'] = buttonWrap;

	buttonWrap.appendChild(upButton);
	buttonWrap.appendChild(downButton);
	cont.appendChild(buttonWrap);

	instance.decorators[dname].ec.push(JAK.Events.addListener(instance.elm, 'keydown', this._keydown.bind(this, instance)));
	instance.decorators[dname].ec.push(JAK.Events.addListener(upButton, 'click', this.up.bind(this, instance, 1)));
	instance.decorators[dname].ec.push(JAK.Events.addListener(downButton, 'click', this.down.bind(this, instance, 1)));
};

/**
 * @method Veřejná metoda "stepUp"
 * Umožňuje programovou změnu hodnotu o "n" kroků
 * @param {int} n Počet kroků, o kterou se má hodnota zvýšit
 */
JAK.HTML5Form.Decorators.InputNumber.prototype.stepUp = function (n) {
	if (this.owner.isSupported('inputnumber')) {
		this.elm.stepUp(n || 1);
	} else {
		this.decorators['JAK.HTML5Form.Decorators.InputNumber'].dec.up(this, n || 1);
	}
};

/**
 * @method Veřejná metoda "stepDown"
 * Umožňuje programovou změnu hodnotu o "n" kroků
 * @param {int} n Počet kroků, o kterou se má hodnota snížit
 */
JAK.HTML5Form.Decorators.InputNumber.prototype.stepDown = function (n) {
	if (this.owner.isSupported('inputnumber')) {
		this.elm.stepDown(n || 1);
	} else {
		this.decorators['JAK.HTML5Form.Decorators.InputNumber'].dec.down(this, n || 1);
	}
};

/**
 * Handler "keydown" události na inputu
 * Slouží pro zpracování stisku kláves nahoru a dolů
 * @param {object} instance Instance třídy JAK.HTML5Form.Element
 */
JAK.HTML5Form.Decorators.InputNumber.prototype._keydown = function (instance, e, elm) {
	if (e.keyCode == 38)  { // ↑
		this.up(instance, 1, e, elm);
	} else if (e.keyCode == 40) { // ↓
		this.down(instance, 1, e, elm);
	}
};

/**
 * Metoda pro zvýšení hodnoty inputu o "n" kroků
 * @param {object} instance Instance třídy JAK.HTMl5Form.Element
 * @param {int} n Počet kroků, o které se má hodnota zvýšit
 */
JAK.HTML5Form.Decorators.InputNumber.prototype.up = function (instance, n, e, elm) {
	var elm = instance.elm;
	if (!elm.disabled) {
		var data = this._getData(instance);
		var nv = parseFloat(elm.value) ? parseFloat(elm.value) + (data.step * parseFloat(n)) : (data.step * parseFloat(n));

		// oprava zaokroulení
		var decimal = data.step.toString().split('.')[1];
		if (decimal) { nv = nv.toFixed(decimal.length); }
		if (nv <= data.max) { elm.value = parseFloat(nv); }
		if (e) {
			if (!(this._isSupported('oninput')) && !(this._isSupported('onpropertychange'))) {
				instance.makeInputSignal();
			}
			instance.makeEvent('change');
		}
	}
};

/**
 * Metoda pro snížení hodnoty inputu o "n" kroků
 * @param {object} instance Instance třídy JAK.HTMl5Form.Element
 * @param {int} n Počet kroků, o které se má hodnota snížit
 */
JAK.HTML5Form.Decorators.InputNumber.prototype.down = function (instance, n, e, elm) {
	var elm = instance.elm;
	if (!elm.disabled) {
		var data = this._getData(instance);
		var nv = parseFloat(elm.value) ? parseFloat(elm.value - (data.step * n)) : parseFloat(-data.step * n);

		// oprava zaokroulení
		var decimal = data.step.toString().split('.')[1];
		if (decimal) { nv = nv.toFixed(decimal.length); }
		if (nv >= data.min) { elm.value = parseFloat(nv); }
		if (e) {
			if (!(this._isSupported('oninput')) && !(this._isSupported('onpropertychange'))) {
				instance.makeInputSignal();
			}
			instance.makeEvent('change');
		}
	}
};

/**
 * Vrací hodnoty atributů, se kterými dekorátor pracuje při změně hodnoty
 * @param {object} instance Instance JAK.HTMl5Form.Element
 */
JAK.HTML5Form.Decorators.InputNumber.prototype._getData = function (instance) {
	return attr = {
		'min': isNaN(parseFloat(instance.elm.getAttribute('min'))) ? -Infinity : parseFloat(instance.elm.getAttribute('min')),
		'max': isNaN(parseFloat(instance.elm.getAttribute('max'))) ? Infinity : parseFloat(instance.elm.getAttribute('max')),
		'step': parseFloat(instance.elm.getAttribute('step')) || 1
	}
};

/**
 * Validační metoda
 */
JAK.HTML5Form.Decorators.InputNumber.prototype._validate = function () {
	try { this.$super(); } catch (e) {}
	if (this.elmType == 'number') {
		var value = parseFloat(this.elm.value);
		if (this.elm.value && isNaN(value)) {
			this._setValidity('typeMismatch', true);
		};
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro input typu "date"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.InputDate = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.InputDate',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators,
	'_DEPEND': [{
		sClass: JAK.Calendar,
		ver: '3.0'
	}]
});

JAK.HTML5Form.Decorators.InputDate.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		var dname = this.constructor.NAME;
		var cont = JAK.HTML5Form.Decorators.wrapElement(instance.elm);

		var opt = instance.owner.options.calendarOpt;
		instance._calendar = JAK.Calendar.setup(opt.imageUrl, opt.label, opt.options, instance.elm.id);

		instance.decorators[dname].dom['calLauncher'] = JAK.DOM.getElementsByClass('cal-launcher', instance.elm.parentNode)[0];
		instance.decorators[dname].dom['cont'] = cont;

		// při vybrání data vyvolat událost "change" a "input"
		instance.decorators[dname].sc.push(
			instance.addListener('datepick', (function (instance) {
					this.makeInputSignal();
					this.makeEvent('change');
				}.bind(instance)),
			 instance._calendar)
		);
	}
};

/**
 * @method Metoda pro odstranění funkcionality dekorátoru
 * @param {object} instance instance JAK.HTML5Form.Element
 */
JAK.HTML5Form.Decorators.InputDate.prototype.remove = function (instance) {
	if (this.constructor.NAME in instance.decorators) {
		if (instance._calendar) {
			instance._calendar.$destructor();
			delete instance._calendar;
		}
		this.$super(instance);
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro input typu "color"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.InputColor = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.InputColor',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators,
	'_DEPEND': [{
		sClass: JAK.ColorPicker,
		ver: '2.0'
	}]
});

JAK.HTML5Form.Decorators.InputColor.REGEXP_PATTERN = /^#([0-9a-fA-F]{2}){3}|([0-9a-fA-F]){3}$/;

JAK.HTML5Form.Decorators.InputColor.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		var dname = this.constructor.NAME;
		var cont = JAK.HTML5Form.Decorators.wrapElement(instance.elm);

		var opt = instance.owner.options.colorPickerOpt;
		instance._colorpicker = JAK.ColorPicker.setup(opt.imagePath, opt.label, opt.options, instance.elm.id);

		instance.decorators[dname].dom['cpLauncher'] = JAK.DOM.getElementsByClass('cp-launcher', instance.elm.parentNode)[0];
		instance.decorators[dname].dom['cont'] = cont;

		// při vybrání data vyvolat událost "change" a "input"
		instance.decorators[dname].sc.push(
			instance.addListener('colorselect', function () {
				instance.makeInputSignal();
				instance.makeEvent('change');
			}, instance._colorpicker)
		);
	}
};

/**
 * @method Metoda pro odstranení funkcionality dekorátoru
 * @param {object} instance instance JAK.HTML5Form.Element
 */
JAK.HTML5Form.Decorators.InputColor.prototype.remove = function (instance) {
	if (this.constructor.NAME in instance.decorators) {
		if (instance._colorpicker) {
			instance._colorpicker.$destructor();
			delete instance._colorpicker;
		}
		this.$super(instance);
	}
};

JAK.HTML5Form.Decorators.InputColor.prototype._validate = function () {
	try { this.$super(); } catch (e) {}
	if (this.elmType == 'color') {
		if (!JAK.HTML5Form.Decorators.InputColor.REGEXP_PATTERN.test(this.elm.value.trim())) {
			this._setValidity('typeMismatch', true);
		}
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro input typu "range"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 *
 * Dekorovaný objekt obohatí o metody "stepUp", "stepDown" a "setValue"
 */
JAK.HTML5Form.Decorators.InputRange = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.InputRange',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators,
	'_DEPEND': [{
		sClass: JAK.Slider,
		ver: '2.0'
	}]
});

/**
 * Schová input (nastaví ho jako hidden) a inicializuje slider
 */
JAK.HTML5Form.Decorators.InputRange.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		var dname = this.constructor.NAME;
		var cont = JAK.HTML5Form.Decorators.wrapElement(instance.elm);

		instance._defaultValue = instance.elm.defaultValue;

		// schovat input
		instance.elm.style.display = 'none';

		var opt = instance.owner.options.sliderOpt;
		if (instance.elm.hasAttribute('min')) { opt.min = parseFloat(instance.elm.getAttribute('min')); }
		if (instance.elm.hasAttribute('max')) { opt.max = parseFloat(instance.elm.getAttribute('max')); }
		if (instance.elm.hasAttribute('step')) { opt.step = parseFloat(instance.elm.getAttribute('step')); }
		opt.input = instance.elm;

		instance._slider = new JAK.Slider(cont, opt);
		if (instance.elm.hasAttribute('value')) {
			instance._slider.setValue(instance._defaultValue);
		}

		instance.decorators[dname].dom['cont'] = cont;

		// při resetu formuláře nastavit slideru původní hodnotu inputu
		instance.decorators[dname].ec.push(
			JAK.Events.addListener(instance.owner.form, 'reset', instance, function (e, elm) {
				instance._slider.setValue(this._defaultValue);
			})
		);

		// při změně hodnoty slideru zkopírovat hodnotu do hidden inputu a vyvolat signál "change"
		instance.decorators[dname].sc.push(
			instance.addListener('change', function () {
				instance.makeInputSignal();
				instance.makeEvent('change');
			}, instance._slider)
		);
	}

	// odekorovat instanci o metody pro programové nastavení hodnoty
	instance['stepUp'] = this['stepUp'];
	instance['stepDown'] = this['stepDown'];
	instance['setValue'] = this['setValue'];
};

/**
 * @method Metoda pro zvýšení hodnoty slideru
 * @param {int} n Počet kroků
 */
JAK.HTML5Form.Decorators.InputRange.prototype.stepUp = function (n) {
	if (this.owner.isSupported('inputrange')) {
		this.elm.stepUp(n);
	} else {
		this.decorators['JAK.HTML5Form.Decorators.InputRange'].dec.up(this, n);
	}
};

/**
 * @method Metoda pro snížení hodnoty slideru
 * @param {int} n Počet kroků
 */
JAK.HTML5Form.Decorators.InputRange.prototype.stepDown = function (n) {
	if (this.owner.isSupported('inputrange')) {
		this.elm.stepDown(n);
	} else {
		this.decorators['JAK.HTML5Form.Decorators.InputRange'].dec.down(this, n);
	}
};

/**
 * @method Metoda pro ruční nastavení hodnoty slideru
 * @param {int} value Hodnota
 */
JAK.HTML5Form.Decorators.InputRange.prototype.setValue = function (value) {
	if (this._slider) { this._slider.setValue(value); }
	this.elm.value = value;
};

/**
 * Metoda pro zvýšení hodnoty inputu o "n" kroků
 * @param {object} instance Instance třídy JAK.HTMl5Form.Element
 * @param {int} n Počet kroků, o které se má hodnota zvýšit
 */
JAK.HTML5Form.Decorators.InputRange.prototype.up = function (instance, n) {
	var data = this._getData(instance);
	var v = (parseFloat(n) * data.step) + parseFloat(instance._slider.getValue());
	if (v > data.max) { v = data.max; }
	instance._slider.setValue(v);
};

/**
 * Metoda pro snížení hodnoty inputu o "n" kroků
 * @param {object} instance Instance třídy JAK.HTMl5Form.Element
 * @param {int} n Počet kroků, o které se má hodnota zvýšit
 */
JAK.HTML5Form.Decorators.InputRange.prototype.down = function (instance, n) {
	var data = this._getData(instance);
	var v = parseFloat(instance._slider.getValue()) - (parseFloat(n) * data.step);
	if (v < data.min) { v = data.min; }
	instance._slider.setValue(v);
};

/**
 * @method Metoda pro odstranění funkcionality dekorátoru
 * @param {object} instance instance JAK.HTML5Form.Element
 */
JAK.HTML5Form.Decorators.InputRange.prototype.remove = function (instance) {
	if (this.constructor.NAME in instance.decorators) {
		if (instance._slider) {
			instance._slider.$destructor();
			delete instance._slider;
			instance.elm.style.display = '';
		}
		this.$super(instance);
	}
};

/**
 * Vrací hodnoty atributů, se kterými dekorátor pracuje při změně hodnoty
 * @param {object} instance Instance JAK.HTMl5Form.Element
 */
JAK.HTML5Form.Decorators.InputRange.prototype._getData = function (instance) {
	return attr = {
		'min': parseFloat(instance.elm.getAttribute('min')),
		'max': parseFloat(instance.elm.getAttribute('max')),
		'step': instance.elm.getAttribute('step') == 'any' ? 1 : parseFloat(instance.elm.getAttribute('step'))
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "step"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Step = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Step',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

/**
 * Validační metoda
 * Kontroluje, zda je hodnota inputu násobkem hodnoty atributu
 */
JAK.HTML5Form.Decorators.Step.prototype._validate = function () {
	try { this.$super(); } catch (e) {}
	if (this.elm.hasAttribute('step')) {
		if (this.elm.value && parseFloat(this.elm.value) % parseFloat(this.elm.getAttribute('step')) != 0) {
			this._setValidity('stepMismatch', true);
		}
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "min"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Min = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Min',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

/**
 * Validační metoda
 * Kontoluje, zda hodnota inputu není menší než hodnota atributu
 */
JAK.HTML5Form.Decorators.Min.prototype._validate = function () {
	try { this.$super(); } catch (e) {}
	if (this.elm.hasAttribute('min')) {
		if (this.elm.value && parseFloat(this.elm.value) < parseFloat(this.elm.getAttribute('min'))) {
			this._setValidity('rangeUnderflow', true);
		}
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "max"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Max = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Max',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

/**
 * Validační metoda
 * Kontroluje, zda hodnota inputu není větší než hodnota atributu
 */
JAK.HTML5Form.Decorators.Max.prototype._validate = function () {
	try { this.$super(); } catch (e) {}
	if (this.elm.hasAttribute('max')) {
		if (this.elm.value && parseFloat(this.elm.value) > parseFloat(this.elm.getAttribute('max'))) {
			this._setValidity('rangeOverflow', true);
		}
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "pattern"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Pattern = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Pattern',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

/**
 * Validační metoda
 * Kontroluje, zda formát hodnoty inputu odpovídá regulárce v hodnotě atributu
 */
JAK.HTML5Form.Decorators.Pattern.prototype._validate = function () {
	try { this.$super(); } catch (e) {}
	if (this.elm.hasAttribute('pattern')) {
		var pattern = new RegExp(this.elm.getAttribute('pattern'));
		if (this.elm.value && !pattern.test(this.elm.value)) {
			this._setValidity('patternMismatch', true);
		}
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "required"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Required = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Required',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.Required.prototype.decorate = function (instance) {
	this.$super(instance);

	// pokud se dekoruje radiobutton, je potřeba rozkopírovat atribut required na všechny radiobuttony,
	// které patří k sobě
	if (!this._isSupported(this, instance)) {
		if (instance.elmType == 'radio') {
			var r = this.getFormRadiosByName(instance);
			if (r.some(function (item) { return item.hasAttribute('required'); })) {
				r.forEach(function (item) { item.setAttribute('required', ''); });
			}
		}
	}
};

/**
 * @method Hledá radiobuttony, které patří k sobě
 * (náleží ke stejnému formuláři a mají stejný atribut name)
 */
JAK.HTML5Form.Decorators.Required.prototype.getFormRadiosByName = function (instance) {
	var r = JAK.DOM.arrayFromCollection(document.querySelectorAll('input[name='+instance.elm.name+']'));
	var fr = r.filter(function (item) {
		return (
			item.getAttribute('type') == 'radio' &&
			(item.getAttribute('form') || item.form.id == this.owner.form.id)
		);
	}, instance);

	return fr;
};

/**
 * Validační hodnota
 * Kontroluje, zda je element vyplněn/zaškrtnut
 */
JAK.HTML5Form.Decorators.Required.prototype._validate = function () {
	try { this.$super(); } catch (e) {}

	var isValid = true;
	if (this.elm.hasAttribute('required')) {
		switch (this.elmType) {
			case 'checkbox':
				if (!this.elm.checked) { isValid = false; }
				break;
			case 'radio':
				// pokud ani jeden z radiobuttonů není zaškrtnutý, jsou považovány za nevalidní
				var r = JAK.HTML5Form.Decorators.Required.getInstance().getFormRadiosByName(this);
				if (r.every(function (item) { return !item.checked; })) { isValid = false; }
				break;
			default:
				if (!this.elm.value) { isValid = false; }
				break;
		}
	}

	if (!isValid) { this._setValidity('valueMissing', true); }
};

/**
 * @method Remove metoda.
 * Pokud "oddekorováváme" radio input, je potřeba najít všechny radiobuttony,
 * které patří k sobě a odebrat jim required atribut
 */
JAK.HTML5Form.Decorators.Required.prototype.remove = function (instance) {
	if (instance.elmType == 'radio') {
		var r = this.getFormRadiosByName(instance);
		r.forEach(function (item) { item.removeAttribute('required'); });
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "autofocus"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Autofocus = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Autofocus',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.Autofocus.prototype.decorate = function (instance) {
	this.$super(instance);
	if (!this._isSupported(this, instance)) { instance.elm.focus(); }
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "maxlength"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.MaxLength = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.MaxLength',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.MaxLength.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		instance.decorators[this.constructor.NAME].sc.push(
			instance.addListener('input', (function (instance, e, elm) {

				// pokud element využívá i dekorátor placeholderu, je potřaba zkontrolovat, že hodnota v inputu
				// není hodnota vložená placeholderem. Jinak by se se mohlo stát, že se text placeholderu bude ořezávat.
				if (instance._placeholder) {
					var pvalue = instance._placeholder.getValue();
					if (!pvalue) { return; }
				}

				// oříznutí textu v inputu na maximální povolenou délku
				var maxlength = parseInt(instance.elm.getAttribute('maxlength'));
				if (instance.elm.value.length > maxlength) {
					if (e) { JAK.Events.cancelDef(e); }
					instance.elm.value = instance.elm.value.substring(0, maxlength);
				}

			}).bind(this, instance), instance)
		);
	}
};

/**
 * Validační metoda
 */
JAK.HTML5Form.Decorators.MaxLength.prototype._validate = function () {
	try { this.$super(); } catch (e) {}
	if (this.elm.hasAttribute('maxlength')) {
		if (this.elm.value.length > parseInt(this.elm.getAttribute('maxlength'))) {
			this._setValidity('tooLong', true);
		}
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "placeholder"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Placeholder = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Placeholder',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators,
	'_DEPEND': [{
		sClass: JAK.Placeholder,
		ver: '2.0'
	}]
});

JAK.HTML5Form.Decorators.Placeholder.prototype.decorate = function (instance) {
	this.$super(instance);
	if (!this._isSupported(this, instance)) {
		instance._placeholder = new JAK.Placeholder(instance.elm, instance.elm.getAttribute('placeholder'));
	}
};

/**
 * @method Metoda pro odstranění funkcionality dekorátoru
 * @param {object} instance instance JAK.HTML5Form.Element
 */
JAK.HTML5Form.Decorators.Placeholder.prototype.remove = function (instance) {
	if (this.constructor.NAME in instance.decorators) {
		instance._placeholder.$destructor();
		delete instance._placeholder;
		this.$super(instance);
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "form"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 *
 * Vytvoří ve formuláři hidden input se stejným "name" atributem a kopíruje do něj
 * hodnotu z původního inputu
 */
JAK.HTML5Form.Decorators.Form = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Form',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.Form.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		var dname = this.constructor.NAME;
		var hidden = instance.owner.form.querySelector('[name='+instance.elm.name+']');
		if (!hidden) {
			hidden = JAK.mel('input', {'type': 'hidden', 'name': instance.elm.getAttribute('name')});
			instance.owner.form.appendChild(hidden);
		}

		instance.decorators[dname].dom['clone'] = hidden;
		this._cloneValue(instance);

		// navěšení posluchačů na události, při kterých se má překopírovat hodnota do hiddenu
		var bound = this._cloneValue.bind(this, instance);
		if (instance.elmType == 'select') {
			if (instance.elm.selectedIndex == '-1') { instance.elm.selectedIndex = 0; }
			instance.elm.options[instance.elm.selectedIndex].defaultSelected = true;
			instance.decorators[dname]['_defaultValue'] = instance.elm.options[instance.elm.selectedIndex].value;
			instance.decorators[dname].ec.push(JAK.Events.addListener(instance.elm, 'change', bound));
		} else {
			var type = instance.elm.getAttribute('type');
			switch (instance.elmType) {
				case 'checkbox':
					instance.decorators[dname]['_defaultValue'] = instance.elm.checked;
					instance.decorators[dname].ec.push(JAK.Events.addListener(instance.elm, 'click', bound));
					break;
				case 'radio':
					instance.decorators[dname]['_defaultValue'] = instance.elm.checked;
					instance.decorators[dname].ec.push(
						JAK.Events.addListener(instance.elm, 'click', bound));
					break;
				default:
					instance.decorators[dname]['_defaultValue'] = instance.elm.value;
			}
		}

		// při resetu formuláře vrátit na původní hodnotu
		instance.decorators[dname].ec.push(JAK.Events.addListener(instance.owner.form, 'reset', this._reset.bind(this, instance)));
	}
};

/**
 * Kopírování hodnoty do hidden inputu
 * @param {node} elm Input, ze kterého se kopíruje
 */
JAK.HTML5Form.Decorators.Form.prototype._cloneValue = function (instance, e, elm) {
	var clone = instance.decorators[this.constructor.NAME].dom['clone'];
	clone.value = this._getValue(instance);

	if (instance.elm.nodeName.toLowerCase() == 'input') {
		if (instance.elm.type == 'checkbox' || instance.elm.type == 'radio') {
			if (instance.elm.checked) {
				clone.removeAttribute('disabled');
				clone.value = instance.elm.value;
			} else {
				clone.setAttribute('disabled', 'disabled');
			}
		}
	}
};

/**
 * Metoda pro získání hodnoty.
 * @param {node} elm Input, ze kterého se má hodnota získat
 */
JAK.HTML5Form.Decorators.Form.prototype._getValue = function (instance) {
	var nodeName = instance.elm.nodeName.toLowerCase();
	var value;

	if (nodeName == 'select') {
		value = instance.elm.options[instance.elm.selectedIndex].value;
	} else {
		var type = instance.elmType;
		switch (type) {
			case 'checkbox':
				value = instance.elm.checked;
				break;
			case 'radio':
				var formAttr = instance.elm.hasAttribute('form') ? instance.elm.getAttribute('form') : null;
				var parent = formAttr ? JAK.gel(formAttr) : instance.elm.form;
				var r = parent.querySelectorAll('[name='+instance.elm.getAttribute('name')+']');
				for (var i = 0; i < r.length; i++) {
					if (r[i].checked) { value = r[i].value; break; }
				}
				break;
			default:
				value = instance.elm.value;
				break;
		}
	}

	return value;
};

/**
 * @method Vrací hodnoty elementů na jejich původní hodnotu
 */
JAK.HTML5Form.Decorators.Form.prototype._reset = function (instance, e, elm) {
	var dname = this.constructor.NAME;
	if (instance.elmType == 'select') {
		for (var i = 0; i < instance.elm.options.length; i++)  {
			if (instance.elm.options[i].defaultSelected) {
				instance.elm.selectedIndex = i;
				break;
			}
		}
	} else {
		if (instance.elmType == 'radio' || instance.elmType == 'checkbox') {
			instance.elm.checked = instance.decorators[dname]._defaultValue;
		} else {
			instance.elm.value = instance.decorators[dname]._defaultValue;
		}
	}

	// počkat než doběhne reset a potom zkopírovat hodnotu do hidden inputu
	setTimeout(this._cloneValue.bind(this, instance), 50);
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "formtarget"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Formtarget = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Formtarget',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.Formtarget.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		instance.decorators[this.constructor.NAME].ec.push(
			JAK.Events.addListener(instance.elm, 'click', instance, function (e, elm) {
				var form = this.owner.form;
				var origValue = form.getAttribute('target');
				form.setAttribute('target', instance.elm.getAttribute('formtarget'));
				setTimeout(function () {
					if (origValue) {
						form.setAttribute('target', origValue);
					} else {
						form.removeAttribute('target');
					}
				}, 50);
			})
		);
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "formaction"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Formaction = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Formaction',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.Formaction.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		instance.decorators[this.constructor.NAME].ec.push(
			JAK.Events.addListener(instance.elm, 'click', instance, function (e, elm) {
				var form = this.owner.form;
				var origValue = form.getAttribute('action');
				form.setAttribute('action', instance.elm.getAttribute('formaction'));
				setTimeout(function (elm, origValue) {
					if (origValue) {
						form.setAttribute('action', origValue);
					} else {
						form.removeAttribute('action');
					}
				}, 50);
			})
		);
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "formmethod"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Formmethod = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Formmethod',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.Formmethod.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		instance.decorators[this.constructor.NAME].ec.push(
			JAK.Events.addListener(instance.elm, 'click', instance, function (e, elm) {
				var form = this.owner.form;
				var origValue = form.getAttribute('method');
				form.setAttribute('method', instance.elm.getAttribute('formmethod'));
				setTimeout(function () {
					if (origValue) {
						form.setAttribute('method', origValue);
					} else {
						form.removeAttribute('method');
					}
				}, 50);
			})
		);
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "formenctype"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Formenctype = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Formenctype',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.Formenctype.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		instance.decorators[this.constructor.NAME].ec.push(
			JAK.Events.addListener(instance.elm, 'click', instance, function (e, elm) {
				var form = this.owner.form;
				var origValue = form.getAttribute('enctype');
				form.setAttribute('enctype', instance.elm.getAttribute('formenctype'));
				setTimeout(function () {
					if (origValue) {
						form.setAttribute('enctype', origValue);
					} else {
						form.removeAttribute('enctype');
					}
				}, 50);
			})
		);
	}
};

/*---------------------------------------------------------------------------*/

/**
 * @class Dekorátor pro atribut "formnovalidate"
 * @group jak-utils
 * @augments JAK.HTML5Form.Decorators
 */
JAK.HTML5Form.Decorators.Formnovalidate = JAK.ClassMaker.makeSingleton({
	'NAME': 'JAK.HTML5Form.Decorators.Formnovalidate',
	'VERSION': '1.0',
	'EXTEND': JAK.HTML5Form.Decorators
});

JAK.HTML5Form.Decorators.Formnovalidate.prototype.decorate = function (instance) {
	this.$super(instance);

	if (!this._isSupported(this, instance)) {
		instance.decorators[this.constructor.NAME].ec.push(
			JAK.Events.addListener(instance.elm, 'click', instance, function (e, elm) {
				var origValue = this.owner.willValidate;
				this.owner.willValidate = false;
				setTimeout(function () { instance.owner.willValidate = origValue; }, 50);
			})
		);
	}
};
/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @class Společné rozhranní pro vizualizéry
 */
JAK.HTML5Form.IVisualizer = JAK.ClassMaker.makeInterface({
	'NAME': 'JAK.HTML5Form.IVisualizer',
	'VERSION': '1.0'
});

/**
 * @method Metoda pro zobrazení validační zprávy/zpráv
 * @param {array} invalidElements Pole instancí JAK.HTML5Form.Elements, které neprošly validací
 */
JAK.HTML5Form.IVisualizer.prototype.showValidation = function (invalidElements) {};

/**
 * @method Metoda pro schování validační zprávy/zpráv
 */
JAK.HTML5Form.IVisualizer.prototype.removeValidation = function () {};

/* ------------------------------------------------------------------------- */

/**
 * @class Vizualizace validace pomocí JAK.Tooltip
 * Simuluje chování nativní validační bubliny
 */
JAK.HTML5Form.TooltipVisualizer = JAK.ClassMaker.makeClass({
	'NAME': 'JAK.HTML5Form.TooltipVisualizer',
	'VERSION': '1.0',
	'IMPLEMENT': [JAK.ISignals, JAK.HTML5Form.IVisualizer],
	'DEPEND': [{
		sClass: JAK.Tooltip,
		ver: '1.0'
	}]
});

/**
 * konstruktor
 * @param {object} options Nastavení pro tooltip
 */
JAK.HTML5Form.TooltipVisualizer.prototype.$constructor = function (options) {

	this._tooltipOpt = {
		'imagePath': 'lib/img/tooltipSprite.png',
		'borderWidth': 25
	};

	for (var key in options) { this._tooltipOpt[key] = options[key]; }

	this._sc = [];
	this._ec = [];
	this._tooltip = null;
	this._invalidElements = [];
};

/**
 * @method Zobrazuje validační hlášku
 * @param {array} invalidElements Pole instancí JAK.HTML5Form.Elements, které neprošly validací
 */
JAK.HTML5Form.TooltipVisualizer.prototype.showValidation = function (invalidElements) {
	// odstranění případné předchozí validace
	this.removeValidation();

	// zobrazíme validaci pouze u prvního nevalidního elementu
	var elmInstance = invalidElements[0];

	// inicializace a zobrazení tooltipu
	this._tooltipOpt.content = elmInstance.validationMessage();
	this._tooltip = new JAK.Tooltip(this._tooltipOpt);
	this._tooltip.show(elmInstance.elm);

	// během psaní aktualizovat text validace
	var bound = this._updateValidation.bind(this, elmInstance);
	this._sc.push(this.addListener('input', bound, this._elmInstance));

	// na blur shovat
	this._ec.push(JAK.Events.addListener(elmInstance.elm, 'blur', this, '_removeValidation'));

	elmInstance.elm.focus();
};

/**
 * @method Schová tooltip
 */
JAK.HTML5Form.TooltipVisualizer.prototype.removeValidation = function () {
	if (this._tooltip) {
		this.removeListeners(this._sc);
		JAK.Events.removeListeners(this._ec);

		this._tooltip.hide();
		this._tooltip.$destructor();
		this._tooltip = null;

		this._sc = [];
		this._ec = [];
	}
};

/**
 * Aktualizuje text v zobrazeném tooltipu
 * @param {object} instance Instance JAK.HTML5Form.Element
 */
JAK.HTML5Form.TooltipVisualizer.prototype._updateValidation = function (instance) {
	if (instance.checkValidity()) {
		this.removeValidation();
	} else {
		this._tooltip.options.content = instance.validationMessage();
		this._tooltip.show(instance.elm);
	}
};

/**
 * Callback pro události, na které se má tooltip schovat
 */
JAK.HTML5Form.TooltipVisualizer.prototype._removeValidation = function (e, elm) {
	this.removeValidation();
};
