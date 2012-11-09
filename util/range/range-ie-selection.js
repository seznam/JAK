/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Třída pro práci se selection pro IE8 a nize
 * @author jerry
 */ 
 
/**
 * @class Selection v IE8 a nize
 * @version 1.0
 */

JAK.Range.IE.Selection = JAK.ClassMaker.makeClass({
	NAME: "JAK.Range.IE.Selection",
	VERSION: "1.0"
});

JAK.Range.IE.Selection.prototype.rangeCount = 0; // pocet range v selection

/**
 * statická metoda - vrací JAK.Range.IE.Selection v rámci nastaveného okna
 * @param {object || null} contextWindow objekt window v jehož kontextu se selection získává
 * @returns {JAK.Range.IE.Selection}
 */
JAK.Range.IE.Selection.getSelection = function(contextWindow) {
	var contextWindow = contextWindow || window;
	return new JAK.Range.IE.Selection(contextWindow);
}

/**
 * constructor
 * @param {object || null} contextWindow objekt window v jehož kontextu se selection získává
 */
JAK.Range.IE.Selection.prototype.$constructor = function(contextWindow) {
	this._contextWindow = contextWindow || window;
	this._selection = this._contextWindow.document.selection;
	this._range = [JAK.Range.IE.fromSelection(this._contextWindow, this._selection)];
	this.rangeCount++;
}

/**
 * vrací range v selection dle indexu
 * @param {number} index range, které se má vrátit
 */
JAK.Range.IE.Selection.prototype.getRangeAt = function(index) {
	return this._range[index];
}

/**
 * odstraní všechny range ze selection
 */
JAK.Range.IE.Selection.prototype.removeAllRanges = function() {
	this._range = [];
	this.rangeCount = 0;
	this._selection.empty();
}

/**
 * přidá JAK.Range.IE do IE selection
 * @param {object} range JAK.Range.IE
 */
JAK.Range.IE.Selection.prototype.addRange = function(range) {
	this._range.push(range);
	range.update();
	range.getNativeRange().select();
	this.rangeCount++;
}
