/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Třídy pro práci s rozsahem a výběrem.
 * @author jerry
 */ 
 
/**
 * @class Rozsah
 * @version 3.01
 */

JAK.Range = JAK.ClassMaker.makeClass({
	NAME: "JAK.Range",
	VERSION: "3.01"
});

JAK.Range.USE_IE_RANGE = document.selection && !window.getSelection; // testuje se, jestli budeme pouzivat IE Range nebo W3C Range

/**
 * statická metoda - vrací {start,end} rozsah uživatelského výběru v inputu nebo textarey. V případě, že start==end, tak to znamená, že není nic vybráno, pouze umístěn kurzor. UPOZORNĚNÍ: Ke korektnímu chování pod IE8 a níže je potřeba ručně provést na input focus().
 * @param {node} elm element, se kterým chceme pracovat (musí být input typu text nebo textarea)
 * @returns {object {integer start&#44 integer end}} objekt obsahující začátek a konec výběru v inputu
 */
JAK.Range.getCaret = function(elm) {
	if (JAK.Range.USE_IE_RANGE) { return JAK.Range.IE.getCaret(elm); }
	
	return {start:elm.selectionStart, end:elm.selectionEnd};
}

/**
 * statická metoda - nastavuje kurzor v inputu nebo textarey
 * @param {node} elm element, se kterým chceme pracovat (musí být input typu text nebo textarea)
 * @param {integer} start povinný parametr, určuje začátek výběru (nebo pozici kursoru, pokud není uveden end parametr)
 * @param {integer} end nepovinný parametr, určuje konec výběru
 */
JAK.Range.setCaret = function(elm, start, end) {
	/* pokud neni nastaveno end, potom to bereme, ze hodnota se rovna start a nastavujeme tedy pouze pozici kursoru - takovy to, co blika :-P */
	var end = end || start;
	
	/* otestujeme, jestli jsme v rozsahu textu, kdyztak upravime */
	var inputLength = elm.value.length;
	start = Math.min(start, inputLength);
	start = Math.max(start, 0);
	end = Math.min(end, inputLength);
	end = Math.max(end, 0);
	
	var selStart = start<end?start:end; // kontroluje se, jestli hodnoty nejsou obracene - vzdy musi byt start < end
	var selEnd = start<end?end:start; // kontroluje se, jestli hodnoty nejsou obracene - vzdy musi byt end > start
	
	/* nastavime vyber */
	if (JAK.Range.USE_IE_RANGE) {
		JAK.Range.IE.setCaret(elm, selStart, selEnd);
		return;
	}
	
	elm.selectionStart = selStart; 
	elm.selectionEnd = selEnd; 
}

/**
 * statická metoda - inicializuje Range a nastavuje rozsah z uživatelského výběru
 * @param {object || null} contextWindow objekt window v jehož kontextu se selection získává (je potřeba kvůli starším IE)
 * @returns {JAK.Range}
 */
JAK.Range.fromSelection = function(contextWindow) {
	var contextWindow = contextWindow || window; // nacteme kontext okna, defaultne window
	var range = new JAK.Range(contextWindow);
	range.setFromSelection();
	
	return range;
}

/**
 * @param {object || null} contextWindow objekt window v jehož kontextu se selection získává
 */
JAK.Range.prototype.$constructor = function(contextWindow) {
	this._contextWindow = contextWindow || window; // nacteme kontext okna, defaultne window
	this._nRng = null; // nativni W3C / emulated IE range
	this._nSel = null; // nativni W3C selection
	this._createRange();
}

/* privátní metody */

/**
 * vytvoří nativní rozsah a naklonuje jej, abychom s ním mohli nerušeně pracovat
 */
JAK.Range.prototype._createRange = function() {
	if (JAK.Range.USE_IE_RANGE) {
		this._nRng = new JAK.Range.IE(this._contextWindow); 
		return; 
	}
	this._nRng = this._contextWindow.document.createRange().cloneRange();
}

/**
 * Podle parametru type vrací uzel a offset začátku/konec rozsahu. type == "start", vrací počátek; type == "end", vrací konec; defaultně: "end"
 */
JAK.Range.prototype._getBorderElm = function(type) {
	if (JAK.Range.USE_IE_RANGE) { this._nRng.update(); }
	var foundNode = null, foundOffset = -1;
	
	foundNode = (type == "start") ? this._nRng.startContainer : this._nRng.endContainer;
	foundOffset = (type == "start") ? this._nRng.startOffset : this._nRng.endOffset;
	
	return {node:foundNode, offset:foundOffset};
}

/**
 * nastaví hranice rozsahu pomocí uzlu a offsetu, pokud je isEndNode == true, nastavujeme konec, jinak počátek
 */
JAK.Range.prototype._setBorderElm = function(type, node, offset) {
	if (type == "start") {
		this._nRng.setStart(node, offset);
	} else {
		this._nRng.setEnd(node, offset);
	}
}

/* veřejné metody */

/**
 * Zkolabuje rozsah
 * @param {boolean} toStart pokud je true zkolabuje na začátek rozsahu, jinak na konec
 */
JAK.Range.prototype.collapse = function(toStart){
	this._nRng.collapse(toStart);
	
	return this;
}

/**
 * Smaže (fyzicky odstraní) vybraný obsah v rozsahu
 * @returns {JAK.Range}
 */
JAK.Range.prototype.deleteContent = function() {
	this._nRng.deleteContents();
	
	return this;
}

/**
 * Vrací HTML kód rozsahu
 * @returns {string}
 */
JAK.Range.prototype.getContentHTML = function(){
	var docFragment = this._nRng.cloneContents();
	var tmpDiv = JAK.mel('div',false,false,this._contextWindow.document);
	tmpDiv.appendChild(docFragment);
	return tmpDiv.innerHTML;
}

/**
 * Vrací text vybraného obsahu v rozsahu
 * @returns {string}
 */
JAK.Range.prototype.getContentText = function() {
	return this._nRng.toString();
}

/**
 * Vrací objekt window, ve kterém se range momentálně nachází
 * @returns {object window}
 */
JAK.Range.prototype.getContextWindow = function() {
	return this._contextWindow;
}

/**
 * Vrací bezprostřední rodičovský uzel, ve kterém se rozsah nachází
 * @returns {node}
 */
JAK.Range.prototype.getParentNode = function() {
	if (JAK.Range.USE_IE_RANGE) { this._nRng.update(); }
	var container = this._nRng.commonAncestorContainer;
	if (container.nodeType == 3) { container = container.parentNode ? container.parentNode : container; }
	
	return container;
}

/**
 * Vrací počátek a konec rozsahu i s offsetem. Offset udává posun o počet znaků v případě, že uzel je textNode, jinak o počet uzlů.
 * @returns {object {object startContainer&#44 integer startOffset&#44 object endContainer&#44 integer endOffset}}
 */
JAK.Range.prototype.getStartEnd = function() {
	var anchorInfo = {};
	var start = {}, end = {};
	
	start = this._getBorderElm("start");
	end = this._getBorderElm("end");
	
	anchorInfo.startContainer = start.node
	anchorInfo.startOffset = start.offset;
	anchorInfo.endContainer = end.node;
	anchorInfo.endOffset = end.offset;
	
	return anchorInfo;
}

/**
 * Visuálně odznačí rozsah (provede se unselect)
 * @returns {JAK.Range}
 */
JAK.Range.prototype.hide = function() {
	if (!this._nSel) {
		if (JAK.Range.USE_IE_RANGE) {
			this._nSel = JAK.Range.IE.Selection.getSelection();
		} else {
			this._nSel = this._contextWindow.getSelection();
		}
	}
	this._nSel.removeAllRanges();
	
	return this;
}

/**
 * Vloží HTML na místo rozsahu.
 * @param {string} html vkládaný HTML kód
 * @param {boolean} cursorBefore nepovinný parametr určující pozici kursoru po vložení - true: po vložení se kurzor umístí před vkládaný obsah, false: po vložení se kurzor umístí za vkládaný obsah, defaultně: false
 * @returns {JAK.Range}
 */
JAK.Range.prototype.insertHTML = function(html, cursorBefore) {
	var div;
	div = JAK.mel("div", false, false, this._contextWindow.document);
	div.innerHTML = html;
	for(var i=0;i<div.childNodes.length;i++) {
		this.insertNode(div.childNodes[i].cloneNode(true), cursorBefore);
	}
	
	return this;
}

/**
 * Vloží uzel na místo rozsahu.
 * @param {object [elm]} node vkládaný uzel
 * @param {boolean} cursorBefore nepovinný parametr určující pozici kursoru po vložení - true: po vložení se kurzor umístí před vkládaný obsah, false: po vložení se kurzor umístí za vkládaný obsah, defaultně: false
 * @returns {JAK.Range}
 */
JAK.Range.prototype.insertNode = function(node, cursorBefore) {
	this.deleteContent();
	if (!cursorBefore) {
		this._nRng.insertNode(node);
		this._nRng.setStartAfter(node);
		this._nRng.setEndAfter(node);
	} else {
		this._nRng.insertNode(node);
		this._nRng.setStartBefore(node);
		this._nRng.setEndBefore(node);
	}
	
	return this;
}

/**
 * vrací zda je rozsah zkolabovaný (je nulový)
 * @returns {boolean} rozsah je/není zkolabovaný
 */
JAK.Range.prototype.isCollapsed = function(){
	return this._nRng.collapsed;
}

/**
 * Zjišťuje, jestli je rozsah nastaven uvnitř konkrétního uzlu
 * @param {node} node testovaný uzel
 * @returns {boolean}
 */
JAK.Range.prototype.isInNode = function(node) {
	var container = this.getParentNode();
	while(container && container != this._contextWindow.document) {
		if (container == node) { return true; }
		container = container.parentNode;
	}
	
	return false;
}

/**
 * Nastaví rozsah z uživatelského výběru
 * @returns {JAK.Range}
 */
JAK.Range.prototype.setFromSelection = function() {
	if (JAK.Range.USE_IE_RANGE) { 
		this._nSel = JAK.Range.IE.Selection.getSelection(this._contextWindow); 
	} else {
		this._nSel = this._contextWindow.getSelection();
	}
		
	if (this._nSel.rangeCount > 0) {
		this._nRng = this._nSel.getRangeAt(0);
	} else {
		this._createRange();
	}
	
	return this;
}

/**
 * Nastaví rozsah mezi dvěma uzly (počátečním a koncovým)
 * @param {node} startNode počáteční uzel
 * @param {node} endNode koncový uzel
 * @param {boolean} includedToRange určuje, jestli uzly budou také zahrnuty do rozsahu, true: budou zahrnuty, false: nebudou, defaultně: false
 * @returns {JAK.Range}
 */
 
JAK.Range.prototype.setBetweenNodes = function(startNode, endNode, includedToRange) {
	if (includedToRange) {
		this._nRng.setStartBefore(startNode);
	} else {
		this._nRng.setStartAfter(startNode);
	}
	if (includedToRange) {
		this._nRng.setEndAfter(endNode);
	} else {
		this._nRng.setEndBefore(endNode);
	}

	if (JAK.Range.USE_IE_RANGE) { this._nRng.update(); }
	
	return this;
}

/**
 * Nastaví rozsah na konkrétní uzel nebo jeho obsah
 * @param {node} node uzel, který má být vybrán
 * @param {boolean} onlyContent nepovinný parametr; true: když má být zahrnut pouze obsah uzlu; false: když potřebujeme obsah i včetně uzlu samotného; defaultně: false
 * @returns {JAK.Range}
 */
JAK.Range.prototype.setOnNode = function(node, onlyContent) {
	if (node != this._contextWindow.document.body && !onlyContent) {
		this._nRng.selectNode(node);
	} else {
		this._nRng.selectNodeContents(node);
	}
	
	return this;
}

/**
 * Nastaví začátek a konec rozsahu. Nastavuje se pomocí počátečního a koncového uzlu společně s offsetem (posunem).
 * @param {node} startContainer počáteční uzel
 * @param {integer} startOffset posun o počet znaků směrem ke konci, pokud se jedná o textNode, jinak posun o počet uzlů
 * @param {node} endContainer koncový uzel
 * @param {integer} endOffset posun o počet znaků směrem ke konci, pokud se jedná o textNode, jinak posun o počet uzlů
 * @returns {JAK.Range}
 */
 
JAK.Range.prototype.setStartEnd = function(startContainer, startOffset, endContainer, endOffset) {
	this._setBorderElm("start", startContainer, startOffset);
	this._setBorderElm("end", endContainer, endOffset);
	if (JAK.Range.USE_IE_RANGE) { this._nRng.update(); }
	
	return this;
}

/**
 * Visuálně označí rozsah (provede se select)
 * @returns {JAK.Range}
 */
JAK.Range.prototype.show = function() {
	if (JAK.Range.USE_IE_RANGE) { 
		this._nSel = JAK.Range.IE.Selection.getSelection(this._contextWindow); 
	} else {
		this._nSel = this._contextWindow.getSelection();
	}
	this._nSel.removeAllRanges();
	this._nSel.addRange(this._nRng);
	
	return this;
}
