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
