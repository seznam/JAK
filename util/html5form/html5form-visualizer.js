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
