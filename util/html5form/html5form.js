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
