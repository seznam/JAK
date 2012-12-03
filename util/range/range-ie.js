/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Třída pro práci s rozsahem pro IE8 a nize
 * @author jerry
 */ 
 
/**
 * @class Rozsah v IE8 a nize
 * @version 1.01
 */

JAK.Range.IE = JAK.ClassMaker.makeClass({
	NAME: "JAK.Range.IE",
	VERSION: "1.01"
});

JAK.Range.IE.prototype.startContainer = null;
JAK.Range.IE.prototype.startOffset = 0;
JAK.Range.IE.prototype.endContainer = null;
JAK.Range.IE.prototype.endOffset = 0;
JAK.Range.IE.prototype.commonAncestorContainer = null;
JAK.Range.IE.prototype.collapsed = false;

/**
 * Zjistuje selection v inputu nebo textarey
 * @param {node} elm input nebo textarea, ve kterym se ma zjistovat pozice caretu
 * @returns {number, number} {start, end} - vraci, kde selection zacina a kde konci. Pokud start == end, pak jen blika cursor
 */
JAK.Range.IE.getCaret = function(elm) {
	var contextWindow = elm.ownerDocument.defaultView?elm.ownerDocument.defaultView:elm.ownerDocument.parentWindow;
	
	var range = contextWindow.document.selection.createRange().duplicate();
	if (range.parentElement() != elm) { return {start:0, end:0}; }
	
	var tempRange = elm.createTextRange().duplicate();
	tempRange.collapse(true);
	tempRange.setEndPoint("EndToStart", range);
	
	var start = tempRange.text.length;
	var end = start + range.text.length;
	
	return {start:start, end:end};
}

/**
 * Zjistuje selection v inputu nebo textarey
 * @param {node} elm input nebo textarea, ve kterym se ma nastavit pozice caretu
 * @param {number} start kde zacina selection
 * @param {number} end kde konci selection
 */
JAK.Range.IE.setCaret = function(elm, start, end) {
	var range = elm.createTextRange();
	range.collapse(true);
	range.moveStart('character', start);
	range.moveEnd('character', end-start);
	range.select();
}

/**
 * Zjistuje selection v inputu nebo textarey
 * @param {object window} contextWindow window objekt, v ramci ktereho se ma range vytvorit
 * @param {selection} selection nativni selection, ze ktereho se ma range vytvorit
 */
JAK.Range.IE.fromSelection = function(contextWindow, selection) {
	var contextWindow = contextWindow || window;
	var range = selection.createRange();
	var ieRange = new JAK.Range.IE(contextWindow, range);
	return ieRange;
}

/**
 * @param {object window} contextWindow window objekt, v ramci ktereho se ma range vytvorit
 * @param {Range} range nepovinny parametr, nativni range
 */
JAK.Range.IE.prototype.$constructor = function(contextWindow, range) {
	this._contextWindow = contextWindow || window;
	this._range = range;
	this._utils = JAK.Range.IE.Utils;
	if (!this._range) { this._createRange(); }
	this._resetRangeAttrs();
	this.update();
}

/**
 * Vraci nativni range
 * @param {object window} contextWindow window objekt, v ramci ktereho se ma range vytvorit
 * @returns {Range} nativni range
 */
JAK.Range.IE.prototype.getNativeRange = function() {
	return this._range;
}

/**
 * Aktualizuje a napocita range hodnoty, nutne volat po setStart* a setEnd* metodach (po zavolani obou metod)
 */
JAK.Range.IE.prototype.update = function() {
	this._getBorderElm("start");
	this._getBorderElm("end");
	this._getCommonAncestorContainer();
	this._getCollapseState();
}

/**
 * Naklonuje HTML obsah range a vrati documentFragment
 * @returns {documentFragment} doc. fragment s obsahem
 */
JAK.Range.IE.prototype.cloneContents = function() {
	this.update();
	
	var sC = this.startContainer;
	var sO = this.startOffset;
	var eC = this.endContainer;
	var eO = this.endOffset;
	var htmlText = "";
	var nodes = this._getTargetNodes();
	var sNode = nodes.startNode;
	var eNode = nodes.endNode;
	var sTextOffset = this._utils.isTextNode(sC) ? sO : -1;
	var eTextOffset = this._utils.isTextNode(eC) ? eO : -1;

	/* v rangi neni nic, vracime prazdno */
	if (this.collapsed) { return this._utils.getDocFragFromHTML(this._contextWindow, ""); }
	
	/* pripad, ze pracujeme jen v ramci jednoho textoveho uzlu */
	if (this._utils.isTextNode(sNode) && sNode == eNode) {
		htmlText = sNode.nodeValue.substring(Math.max(sTextOffset, 0), Math.max(eTextOffset, 0));
		htmlText = this._utils.escapeHTML(htmlText);
		return this._utils.getDocFragFromHTML(this._contextWindow, htmlText);
	}
	
	/* mame vybran obsah prvku */
	if (sC.childNodes && sC == eC && sO == 0 && eO == sC.childNodes.length) { 
		htmlText = sC.innerHTML;
		return this._utils.getDocFragFromHTML(this._contextWindow, htmlText);
	}
	
	/* mame nastaveno na cely prvek */
	if (sC == eC && eO - sO == 1) {
		htmlText = sNode.outerHTML;
		return this._utils.getDocFragFromHTML(this._contextWindow, htmlText);
	}
	
	var node = sNode;
	var state = "start";
	var stopNode = sNode;
	while(node != eNode && !this._utils.isChildOf(eNode, node)) {
		switch(state) {
			case "start":
				if (this._utils.isTextNode(node)) {
					var value = node.nodeValue;
					htmlText = sTextOffset > -1 ? value.substring(sTextOffset, value.length) : value;
					htmlText = this._utils.escapeHTML(htmlText);
				} else {
					if (sC.childNodes[sO] && node.outerHTML) { htmlText = node.outerHTML; }
				}
			break;
			
			case "nextSibling":
				htmlText += (this._utils.isTextNode(node) ? this._utils.escapeHTML(node.nodeValue) : node.outerHTML);
			break;
			
			case "parent":
				var attrsText = this._utils.getNodeAttrString(node);
				htmlText = "<" + node.tagName + attrsText + ">" + htmlText + "</" + node.tagName + ">";
			break;
		}
		if (node.nextSibling) {
			stopNode = node;
			node = node.nextSibling
			state = "nextSibling";
		} else {
			node = node.parentNode;
			stopNode = node;
			state = "parent";
		}
	}
	
	var endHtmlText = "";
	var node = eNode;
	state = "start";
	
	while(this._utils.isChildOf(node, stopNode) || node != stopNode)  {
		switch(state) {
			case "start":
				if (this._utils.isTextNode(node)) {
					var value = node.nodeValue;
					endHtmlText = eTextOffset > -1 ? value.substring(0, eTextOffset) : value;
					endHtmlText = this._utils.escapeHTML(endHtmlText);
				} else {
					if (node.outerHTML) { endHtmlText = node.outerHTML; }
				}
			break;
			
			case "previousSibling":
				if (node.nodeValue || node.outerHTML) {
					endHtmlText = (this._utils.isTextNode(node) ? this._utils.escapeHTML(node.nodeValue) : node.outerHTML) + endHtmlText;
				}
			break;
			
			case "parent":
				var attrsText = this._utils.getNodeAttrString(node);
				endHtmlText = "<" + node.tagName + attrsText + ">" + endHtmlText + "</" + node.tagName + ">";
			break;
		}
		if (node.previousSibling) {
			node = node.previousSibling
			state = "previousSibling";
		} else {
			node = node.parentNode;
			state = "parent";
		}
	}
	
	htmlText += endHtmlText;
	return this._utils.getDocFragFromHTML(this._contextWindow, htmlText);
}

/**
 * Zkolabuje range, tedy nastavi endContainer a startContainer, startOffset a endOffset na stejne hodnoty
 * @param {boolean} toStart kdyz true, zkolabuje na zacatek, kdyz false nebo neuvedeno, tak na konec
 */
JAK.Range.IE.prototype.collapse = function(toStart) {	
	if (toStart) {
		var sC = this.startContainer;
		var sO = this.startOffset;
		this._setBorderElm("start", sC, sO);
		this._setBorderElm("end", sC, sO);
	} else {
		var eC = this.endContainer;
		var eO = this.endOffset;
		this._setBorderElm("start", eC, eO);
		this._setBorderElm("end", eC, eO);
	}
	this.update();
	
}

/**
 * Vymaze obsah, ktery je v range, z DOMu
 */
JAK.Range.IE.prototype.deleteContents = function() {
	this.update();
	
	var sC = this.startContainer;
	var sO = this.startOffset;
	var eC = this.endContainer;
	var eO = this.endOffset;
	var nodes = this._getTargetNodes();
	var sNode = nodes.startNode;
	var eNode = nodes.endNode;
	var sTextOffset = this._utils.isTextNode(sC) ? sO : -1;
	var eTextOffset = this._utils.isTextNode(eC) ? eO : -1;
	
	/* v rangi nic neni, nedelame nic */	
	if (this.collapsed) { return; }
	
	/* pripad, ze mazeme jen v ramci jednoho textoveho uzlu */
	if (this._utils.isTextNode(sNode) && sNode == eNode) {
		var value = sNode.nodeValue;
		sNode.nodeValue = value.substring(0, Math.max(sTextOffset, 0)) + "" + value.substring(Math.max(eTextOffset, 0), value.length);
		this._setBorderElm("start", sC, sO);
		this._setBorderElm("end", eC, eO);
		this.update();
		return;
	}
	
	/* mame vybran obsah prvku, takze promazeme akorat prvek */
	if (sC.childNodes && sC == eC && sO == 0 && eO == sC.childNodes.length) { 
		JAK.DOM.clear(sC);
		this._setBorderElm("start", sC, 0);
		this._setBorderElm("end", eC, 0);
		this.update();
		return;
	}
	
	/* mame nastaveno na cely prvek, muzeme ho tedy odebrat */
	if (sC == eC && eO - sO == 1) {
		sC.removeChild(sC.childNodes[sO]);
		this._setBorderElm("start", sC, sO);
		this._setBorderElm("end", sC, sO);
		this.update();
		return;
	}
	
	/* bohuzel start i end kontejner jsou ruzne v DOMu, nezbyva nez postupne promazavat */
	var commonCont = this._utils.getCommonContainer(sNode, eNode);
	
	if (sNode != commonCont) {
		var node = sNode.nextSibling ? sNode.nextSibling : sNode.parentNode;
	} else {
		var node = sNode;
	}
	while(node != commonCont && node != eNode && !this._utils.isChildOf(eNode, node)) {
		var tempNode = node.nextSibling ? node.nextSibling : node.parentNode;
		if (!this._utils.isChildOf(sNode, node)) { node.parentNode.removeChild(node); }
		node = tempNode;
	}
	
	if (eNode != commonCont) {
		var node = eNode.previousSibling ? eNode.previousSibling : eNode.parentNode;
	} else {
		var node = eNode;
	}
	while(node != commonCont && node != sNode && !this._utils.isChildOf(sNode, node)) {
		var tempNode = node.previousSibling ? node.previousSibling : node.parentNode;
		if (!this._utils.isChildOf(eNode, node)) { node.parentNode.removeChild(node); }
		node = tempNode;
	}
	
	var newSC = null;
	var newSO = 0;
	
	if (sTextOffset > -1) {
		sNode.nodeValue = sNode.nodeValue.substring(0, sTextOffset);
		newSC = sNode;
		newSO = sTextOffset;
		if (!sNode.nodeValue.length) { 
			newSC = sNode.parentNode;
			newSO = this._utils.getChildPos(sNode);
			newSC.removeChild(sNode);
		}
	} else {
		if (sNode != commonCont) {
			newSC = sNode.parentNode;
			newSO = this._utils.getChildPos(sNode);
			newSC.removeChild(sNode);
		} else {
			newSC = sNode.parentNode;
			newSO = this._utils.getChildPos(sNode);
		}
	}
	
	if (eTextOffset > -1) {
		var value = eNode.nodeValue;
		eNode.nodeValue = value.substring(eTextOffset, value.length);
		if (!eNode.nodeValue.length) { eNode.parentNode.removeChild(eNode); }
	} else {
		if (eNode != commonCont && eO != 0) { eNode.parentNode.removeChild(eNode); }
	}
	
	this._setBorderElm("start", newSC, newSO);
	this._setBorderElm("end", newSC, newSO);
	this.update();
}

/**
 * Vlozi prvek do range
 * @param {node} node vkladany prvek
 */
JAK.Range.IE.prototype.insertNode = function(node) {
	this.update();
	
	var sC = this.startContainer;
	var sO = this.startOffset;
	var eC = this.endContainer;
	var eO = this.endOffset;
	var tempTextNode = null;
	
	if (this._utils.isTextNode(sC)) {
		var nodesToInsert = [node];
		var parentNode = sC.parentNode;
		var value = sC.nodeValue;
		if (sO != value.length) { nodesToInsert.push(JAK.ctext(value.substring(sO, value.length))); }
		sC.nodeValue = value.substring(0, sO);
		
		while(nodesToInsert.length) {
			if (sC.nextSibling) {
				parentNode.insertBefore(nodesToInsert.pop(), sC.nextSibling);
			} else {
				parentNode.appendChild(nodesToInsert.pop());
			}
		}
			
		if (sC.nodeValue.length == 0) { parentNode.removeChild(sC); } 
		
		var offset = this._utils.getChildPos(node);
		this._setBorderElm("start", parentNode, offset);
		this._setBorderElm("end", parentNode, offset);
		this.update();
		
		return;
	}
	
	if (!sC.childNodes.length) {
		var tempTextNode = JAK.ctext("a");
		sC.appendChild(tempTextNode);
	}
	
	var sNode = this._getTargetNodes().startNode;
			
	if (tempTextNode) { tempTextNode.parentNode.removeChild(tempTextNode); }
	
	if (sO < sC.childNodes.length) {
		sC.insertBefore(node, sNode);
	} else {
		sC.appendChild(node);
	}
	
	sO = node.previousSibling ? sO : 0;
	this._setBorderElm("start", sC, sO);
	this._setBorderElm("end", sC, sO);
	this.update();
}

/**
 * Nastavi range cely prvek
 * @param {node} node html element, na ktery chceme nastavit range
 */
JAK.Range.IE.prototype.selectNode = function(node) {
	var parentNode = node.parentNode;
	var childPos = this._utils.getChildPos(node);
	var childPosNext = childPos + 1;
	this._setBorderElm("start", parentNode, childPos);
	this._setBorderElm("end", parentNode, childPosNext);
	this.update();
}

/**
 * Nastavi range na obsah prvku
 * @param {node} node html element, na jehoz obsah chceme range nastavit
 */
JAK.Range.IE.prototype.selectNodeContents = function(node) {
	var sC, sO, eC, eO;
	
	if (this._utils.isTextNode(node)) {
		sC = node;
		sO = 0;
		eC = node;
		eO = node.nodeValue.length;
	} else {
		if (!node.childNodes.length && node.canHaveChildren) {
			node.innerHTML = "&#xfeff;&#xfeff;"
			sC = node.firstChild;
			sO = 1;
			eC = sC;
			eO = 1;
		} else if (node.childNodes.length) {
			sC = node;
			sO = 0;
			eC = sC;
			eO = node.childNodes.length;
		} else {
			sO = this._utils.getChildPos(node);
			eO = sO + 1;
			sC = node.parentNode;
			eC = sC;
		}
	}

	this._setBorderElm("start", sC, sO);
	this._setBorderElm("end", eC, eO);
	this.update();
}

/**
 * Nastavi zacatek range
 * @param {node} elm container
 * @param {number} offset index prvku (pokud container.nodeType == 3, pak offset urcuje pocet znaku)
 */
JAK.Range.IE.prototype.setStart = function(elm, offset) {
	this._setBorderElm("start", elm, offset);
}

/**
 * Nastavi zacatek range pred zadanym elementem
 * @param {node} elm element, pred kterym se ma range nastavit
 */
JAK.Range.IE.prototype.setStartBefore = function(elm) {;
	var sC = elm.parentNode;
	var childPosStart = this._utils.getChildPos(elm);
	this._setBorderElm("start", sC, childPosStart);
}

/**
 * Nastavi zacatek range po zadanem elementu
 * @param {node} elm element, po kterem se ma range nastavit
 */
JAK.Range.IE.prototype.setStartAfter = function(elm) {
	var sC = elm.parentNode;
	var childPosStart = this._utils.getChildPos(elm);
	this._setBorderElm("start", sC, childPosStart + 1);
}

/**
 * Nastavi konec range
 * @param {node} elm container
 * @param {number} offset index prvku (pokud container.nodeType == 3, pak offset urcuje pocet znaku)
 */
JAK.Range.IE.prototype.setEnd = function(elm, offset) {
	this._setBorderElm("end", elm, offset);
}

/**
 * Nastavi konec range pred zadanym elementem
 * @param {node} elm element, pred kterym se ma range nastavit
 */
JAK.Range.IE.prototype.setEndBefore = function(elm) {
	var eC = elm.parentNode;
	var childPosEnd = this._utils.getChildPos(elm);
	
	this._setBorderElm("end", eC, childPosEnd);	
}

/**
 * Nastavi konec range po zadanem elementu
 * @param {node} elm element, po kterem se ma range nastavit
 */
JAK.Range.IE.prototype.setEndAfter = function(elm) {
	var eC = elm.parentNode;
	var childPosEnd = this._utils.getChildPos(elm);
	
	this._setBorderElm("end", eC, childPosEnd + 1);
}

/**
 * Vrací text vybraného obsahu v rozsahu
 * @returns {string}
 */
JAK.Range.IE.prototype.toString = function() {
	this.update();
	
	var sC = this.startContainer;
	var sO = this.startOffset;
	var eC = this.endContainer;
	var eO = this.endOffset;
	var text = "";
	var nodes = this._getTargetNodes();
	var sNode = nodes.startNode;
	var eNode = nodes.endNode;
	var sTextOffset = this._utils.isTextNode(sC) ? sO : -1;
	var eTextOffset = this._utils.isTextNode(eC) ? eO : -1;
	
	/* v rangi neni nic */
	if (this.collapsed) { return text; }
	
	/* pripad, ze pracujeme jen v ramci jednoho textoveho uzlu */
	if (this._utils.isTextNode(sNode) && sNode == eNode) {
		text = sC.nodeValue.substring(Math.max(sTextOffset, 0), Math.max(eTextOffset, 0));
		return text;
	}
	
	/* mame vybran obsah prvku */
	if (sC.childNodes && sC == eC && sO == 0 && eO == sC.childNodes.length) { 
		text = sC.innerText;
		return text;
	}
	
	/* mame nastaveno na cely prvek */
	if (sC == eC && eO - sO == 1) {
		var sNode = this._getTargetNodes().startNode;
		text = sNode.innerText;
		return text;
	}

	var node = sNode;
	var state = "start";
	var stopNode = sNode;

	while(node != eNode && !this._utils.isChildOf(eNode, node)) {
		switch(state) {
			case "start":
				if (this._utils.isTextNode(node)) {
					var value = node.nodeValue;
					text = sTextOffset > -1 ? value.substring(sTextOffset, value.length) : value;
				} else {
					if (sC.childNodes[sO] && node.innerText) { text = node.innerText; }
				}
			break;
			
			case "nextSibling":
				if (node.nodeValue || node.innerText) { text += (this._utils.isTextNode(node) ? node.nodeValue : node.innerText); }
			break;
		}
		if (node.nextSibling) {
			stopNode = node;
			node = node.nextSibling;
			state = "nextSibling";
		} else {
			node = node.parentNode;
			stopNode = node;
			state = "parentNode";
		}
	}
	
	var endText = "";
	var node = eNode;
	state = "start";

	while(this._utils.isChildOf(node, stopNode) || node != stopNode) {
		switch(state) {
			case "start":
				if (this._utils.isTextNode(node)) {
					var value = node.nodeValue;
					endText = eTextOffset > -1 ? value.substring(0, eTextOffset) : value;
				} else {
					if (node.innerText) { endText = node.innerText; }
				}
			break;
			
			case "previousSibling":
				if (node.nodeValue || node.innerText) { endText = (this._utils.isTextNode(node) ? node.nodeValue : node.innerText) + endText; }
			break;
		}
		if (node.previousSibling) {
			node = node.previousSibling;
			state = "previousSibling";
		} else {
			node = node.parentNode;
			state = "parentNode";
		}
	}
		
	text += endText;
	
	return text;
}

/**
 * Vyresetuje hodnoty range
 */
JAK.Range.IE.prototype._resetRangeAttrs = function() {
	this.startContainer = null;
	this.startOffset = 0;
	this.endContainer = null;
	this.endOffset = 0;
	this.commonAncestorContainer = null;
	this.collapsed = false;
}

/**
 * Vytvori nativni range
 */
JAK.Range.IE.prototype._createRange = function() {
	this._range = this._contextWindow.document.body.createTextRange().duplicate();
}

/**
 * Vraci node, ktery je spolecnym containerem pro elementy, kde lezi range
 */
JAK.Range.IE.prototype._getCommonAncestorContainer = function() {
	var nodes = this._getTargetNodes();
	var sNode = nodes.startNode;
	var eNode = nodes.endNode;
	if (!sNode) { sNode = this.startContainer; }
	if (!eNode) { eNode = this.endContainer; }
	var container = this._utils.getCommonContainer(eNode, sNode);
	if (container == eNode || container == sNode) { container = container.parentNode; }
	
	/* failsafe nepodarilo se nam zjistit potrebne informace */
	if (!container) {
		container = this._contextWindow.document.body;
		this.startContainer = container;
		this.startOffset = 0;
		this.endContainer = container;
		this.endContainer = 0;
		this.collapsed = true;
	}
	
	this.commonAncestorContainer = container; 
}

/**
 * Vraci true, pokud je range zkolabovano, tedy pokud endContainer == startContainer && endOffset == startOffset
 */
JAK.Range.IE.prototype._getCollapseState = function() {
	var sC = this.startContainer;
	var sO = this.startOffset;
	var eC = this.endContainer;
	var eO = this.endOffset;
	this.collapsed = (sC == eC && sO == eO);
}

/**
 * Podle parametru type vrací uzel a offset začátku/konec rozsahu. type == "start", vrací počátek; type == "end", vrací konec; defaultně: "end"
 * princip byl prevzat z knihovny Rangy http://code.google.com/p/rangy/
 */
JAK.Range.IE.prototype._getBorderElm = function(type) {
	var foundNode = null, foundOffset = -1;
	var isStart = type == "start";

	if (this.startContainer && this.endContainer) { return; }
	
	if (!this._range.duplicate) {
		/* jsme v controlRange */
		foundNode = this._range.item(0).parentNode;
		foundOffset = this._utils.getChildPos(this._range.item(0)) + (isStart ? 0 : 1);
		this._setRangeContainer(type, foundNode, foundOffset);
		return;
	}
		
	/* jsme v klasickem textrange */
	var clonedRange = this._range.duplicate();
	var isCollapsed = this._range.compareEndPoints("EndToStart", this._range) == 0;
	clonedRange.collapse(isStart);

	var parent = clonedRange.parentElement();
	var ownerDocument = parent.ownerDocument;
	this._contextWindow = ownerDocument.defaultView ? ownerDocument.defaultView : ownerDocument.parentWindow;
	var tempNode = this._contextWindow.document.createElement('span');

	var comparisonType = isStart ? "StartToStart" : "StartToEnd";
	do {
		try {
			parent.insertBefore(tempNode, tempNode.previousSibling);
		} catch(e) {
			/* nevime co s tim, explorer divne vyhazuje chybu */
			break;
		}
		clonedRange.moveToElementText(tempNode);
	} while ((comparison = clonedRange.compareEndPoints(comparisonType, this._range)) > 0 && tempNode.previousSibling);

	var boundaryNode = tempNode.nextSibling;

	if (comparison == -1 && boundaryNode && this._utils.isTextNode(boundaryNode)) {
		clonedRange.setEndPoint(isStart ? "EndToStart" : "EndToEnd", this._range);
		foundNode = boundaryNode;
        if (/[\r\n]/.test(boundaryNode.data)) {
        	var tempRange = clonedRange.duplicate();
            var rangeLength = clonedRange.text.replace(/\r\n/g, "\r").length;
            foundOffset = tempRange.moveStart("character", rangeLength);

            while ( (comparison = tempRange.compareEndPoints("StartToEnd", tempRange)) == -1) {
           		foundOffset++;
            	tempRange.moveStart("character", 1);
            }
        } else {
        	foundOffset = clonedRange.text.length;
        }
	} else {
		var previousNode = (isCollapsed || !isStart) && tempNode.previousSibling;
        var nextNode = (isCollapsed || isStart) && tempNode.nextSibling;
        if (nextNode && this._utils.isTextNode(nextNode)) {
			foundNode = nextNode;
			foundOffset = 0;
		} else if (previousNode && this._utils.isTextNode(previousNode)) {
			foundNode = previousNode;
			foundOffset = previousNode.length;
		} else {
			foundNode = parent;
			foundOffset = this._utils.getChildPos(tempNode);
		}
	}
	tempNode.parentNode.removeChild(tempNode);
	
	if ((!foundNode.canHaveChildren || !foundNode.childNodes.length) && !this._utils.isTextNode(foundNode)) {
		foundOffset = this._utils.getChildPos(foundNode) + 1;
		foundNode = foundNode.parentNode;
	}
	
	this._setRangeContainer(type, foundNode, foundOffset);
}

/**
 * Ulozi start/end container a start/end offset ... type = "start" | "end"
 */
JAK.Range.IE.prototype._setRangeContainer = function(type, elm, offset) {
	if (type == "start") {
		this.startContainer = elm;
		this.startOffset = offset;
	} else if (type == "end") {
		this.endContainer = elm;
		this.endOffset = offset;
	}
}

/**
 * Prevede startContainer a endContainer na cilove uzly, se kterymi uz budeme pracovat
 */
JAK.Range.IE.prototype._getTargetNodes = function() {
	var startCont = this.startContainer;
	var startOffset = this.startOffset;
	var endCont = this.endContainer;
	var endOffset = this.endOffset - 1; 	/* endOffset saha (pokud neni range zkolabovan) az za posledni prvek v rangi, */
													/* abychom ho ziskali, je potreba snizit o 1 */

	if (!this._utils.isTextNode(startCont)) {
		startOffset = Math.min(startOffset, startCont.childNodes.length-1);
		startOffset = Math.max(startOffset, 0);
		var sn = startCont.childNodes[startOffset];
	} else {
		var sn = startCont;
	}

	if (!this._utils.isTextNode(endCont)) {
		endOffset = Math.min(endOffset, endCont.childNodes.length-1);
		endOffset = Math.max(endOffset, 0);
		var en = endCont.childNodes[endOffset];
	} else {
		var en = endCont;
	}

	return {
		startNode: sn, 
		endNode: en
	};
}

/**
 * nastaví hranice rozsahu pomocí uzlu a offsetu, pokud je isEndNode == true, nastavujeme konec, jinak počátek
 */
JAK.Range.IE.prototype._setBorderElm = function(type, node, offset) {
	var isStart = (type == "start");
	if (isStart) { this._resetRangeAttrs(); this._createRange(); } /* musime znovu vytvorit range, jinak se strejda explorer chova, jak baletka po 6 pivech */ 
	
	var boundNode = node;
	var isTextNode = this._utils.isTextNode(boundNode);
	var ownerDocument = node.ownerDocument;
	this._contextWindow = ownerDocument.defaultView ? ownerDocument.defaultView : ownerDocument.parentWindow;

	var anchorNode;
	var anchorParent;		
	if (isTextNode) {
		anchorNode = boundNode;
		anchorParent = boundNode.parentNode;
	} else {
		anchorNode = offset < boundNode.childNodes.length ? boundNode.childNodes[offset] : null;
		anchorParent = boundNode;
	}

	var tempNode = this._contextWindow.document.createElement('a');
	tempNode.innerHTML = "&#8203;";
	
	if (anchorNode) {
		anchorParent.insertBefore(tempNode, anchorNode);
	} else {
		anchorParent.appendChild(tempNode);
	}
	
	var newRange = this._contextWindow.document.body.createTextRange();
	newRange.moveToElementText(tempNode);
	tempNode.parentNode.removeChild(tempNode);
	
	if (isTextNode) { newRange[isStart ? "moveStart" : "moveEnd"]("character", offset); }
	this._range.setEndPoint(isStart ? "StartToEnd" : "EndToEnd" , newRange);
	
	this._setRangeContainer(type, boundNode, offset);
}
