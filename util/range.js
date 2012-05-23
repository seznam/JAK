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
 * @version 2.3
 */
 
/* Pozn.: pro IE se muselo nasimulovat chovani Range, protoze nektere veci nesly pres jeho Range realizovat */

JAK.Range = JAK.ClassMaker.makeClass({
	NAME: "JAK.Range",
	VERSION: "2.3"
});

JAK.Range.OLD_IE = (!document.selection || (window.getSelection && document.selection)?false:true); // testuje se, jestli jsme v IE8 a nize

JAK.Range.START = 1; /* hodnoty pro stavovy automat */
JAK.Range.SIBLING = 2;
JAK.Range.PARENT = 3;

/**
 * statická metoda - vrací {start,end} rozsah uživatelského výběru v inputu nebo textarey. V případě, že start==end, tak to znamená, že není nic vybráno, pouze umístěn kurzor. UPOZORNĚNÍ: Ke korektnímu chování pod IE8 a níže je potřeba ručně provést na input focus().
 * @param {node} input element, se kterým chceme pracovat (musí být input typu text nebo textarea)
 * @returns {object {integer start&#44 integer end}} objekt obsahující začátek a konec výběru v inputu
 */
JAK.Range.getCaret = function(inputNode) {
	var _contextWindow = inputNode.ownerDocument.defaultView?inputNode.ownerDocument.defaultView:inputNode.ownerDocument.parentWindow;
	var caret = {};
	if (JAK.Range.OLD_IE) {
		var selection = _contextWindow.document.selection.createRange();
		var bm = selection.getBookmark();
		var sel = inputNode.createTextRange();
		sel.moveToBookmark(bm);
		var sleft = inputNode.createTextRange();
		sleft.collapse(true);
		sleft.setEndPoint('EndToStart', sel);
		caret.start = sleft.text.length;
		caret.end = sleft.text.length + sel.text.length;
	} else {
		caret.start = inputNode.selectionStart;
		caret.end = inputNode.selectionEnd;
	}
	return caret;
}

/**
 * statická metoda - nastavuje kurzor v inputu nebo textarey
 * @param {node} inputNode element, se kterým chceme pracovat (musí být input typu text nebo textarea)
 * @param {integer} start povinný parametr, určuje začátek výběru (nebo pozici kursoru, pokud není uveden end parametr)
 * @param {integer} end nepovinný parametr, určuje konec výběru
 */
JAK.Range.setCaret = function(inputNode, start, end) {
	/* pokud neni nastaveno end, potom to bereme, ze hodnota se rovna start a nastavujeme tedy pouze pozici kursoru - takovy to, co blika :-P */
	var end = end || start;
	/* otestujeme, jestli jsme v rozsahu textu */
	if (start > inputNode.length) {
		start = inputNode.length;
	}	
	if (start < 0) {
		start = 0;
	}
	if (end > inputNode.length) {
		end = inputNode.length;
	}	
	if (end < 0) {
		end = 0;
	}
	/* nastavime vyber */
	if (JAK.Range.OLD_IE) {
		var range = inputNode.createTextRange();
		range.collapse(true);
		if (end >= start) { // kontroluje se, jestli hodnoty nejsou obracene - vzdy musi byt end > start
			range.moveStart('character', start);
			range.moveEnd('character', end-start);
		} else {
			range.moveStart('character', end);
			range.moveEnd('character', start-end);
		}
		range.select();
	} else {
		inputNode.selectionStart = start<end?start:end; // kontroluje se, jestli hodnoty nejsou obracene - vzdy musi byt start < end
		inputNode.selectionEnd = start<end?end:start; // kontroluje se, jestli hodnoty nejsou obracene - vzdy musi byt end > start
	}
}

/**
 * statická metoda - inicializuje Range a nastavuje rozsah z uživatelského výběru
 * @param {object || null} contextWindow objekt window v jehož kontextu se selection získává (je potřeba kvůli starším IE)
 * @returns {JAK.Range}
 */
JAK.Range.fromSelection = function(contextWindow) {
	var _contextWindow = contextWindow || window; // nacteme kontext okna, defaultne window
	var range = new JAK.Range(_contextWindow);
	range.setFromSelection();
	
	return range;
}

/**
 * @param {object || null} contextWindow objekt window v jehož kontextu se selection získává
 */
JAK.Range.prototype.$constructor = function(contextWindow) {
	this._contextWindow = contextWindow || window; // nacteme kontext okna, defaultne window
	this._nRng = null; // nativni range
	this._nSel = null; // nativni selection
	
	if (JAK.Range.OLD_IE) {
		this._resetIERange();
	}
	
	this._createRange();
}

/* privátní metody */

/**
 * vytvoří nativní rozsah a naklonuje jej, abychom s ním mohli nerušeně pracovat
 */
JAK.Range.prototype._createRange = function() {
	if (JAK.Range.OLD_IE) {
		this._nRng = this._contextWindow.document.body.createTextRange().duplicate();
	} else {
		this._nRng = this._contextWindow.document.createRange().cloneRange();
	}
}

/**
 * Podle parametru inStart vrací uzel a offset začátku/konec rozsahu. inStart == true, vrací počátek; inStart == false, vrací konec; defaultně: inStart == false
 */
JAK.Range.prototype._getBound = function(inStart) {
	var boundInfo = {};
	
	if (JAK.Range.OLD_IE) {
		if (!this._IERange.startContainer || !this._IERange.endContainer) {
			var tempNode = this._contextWindow.document.createElement('a');
			var clonedRange = this._nRng.duplicate();
			
			clonedRange.collapse(inStart);
			var parent = clonedRange.parentElement();
			do {
				try {
					parent.insertBefore(tempNode, tempNode.previousSibling);
				} catch(e) {
					/* jsme v neparovem tagu, musime jit vys */
					parent = parent.parentNode;
					parent.insertBefore(tempNode, tempNode.previousSibling);
				}
				clonedRange.moveToElementText(tempNode);
			} while (clonedRange.compareEndPoints(inStart ? 'StartToStart' : 'StartToEnd', this._nRng) >= 0 && tempNode.previousSibling);

			if (clonedRange.compareEndPoints(inStart ? 'StartToStart' : 'StartToEnd', this._nRng) == -1 && tempNode.nextSibling) {
				clonedRange.setEndPoint(inStart ? 'EndToStart' : 'EndToEnd', this._nRng);
				foundNode = tempNode.nextSibling;
				foundOffset = clonedRange.text.length;
			} else {
				foundNode = tempNode.parentNode;
				foundOffset = this._getChildPos(tempNode);
			}
			tempNode.parentNode.removeChild(tempNode);
			
			if (foundNode.tagName && (foundNode.tagName.toLowerCase("br") || foundNode.tagName.toLowerCase("img"))) {
				foundOffset = this._getChildPos(foundNode);
				foundNode = foundNode.parentNode;
			}
			
			if (inStart) {
				this._IERange.startContainer = foundNode;
				this._IERange.startOffset = foundOffset;
			} else {
				this._IERange.endContainer = foundNode;
				this._IERange.endOffset = foundOffset;
			}
		} else {
			foundNode = inStart?this._IERange.startContainer:this._IERange.endContainer;
			foundOffset = inStart?this._IERange.startOffset:this._IERange.endOffset;
		}
	} else {
		foundNode = inStart?this._nRng.startContainer:this._nRng.endContainer;
		foundOffset = inStart?this._nRng.startOffset:this._nRng.endOffset;
	}
	
	boundInfo.node = foundNode;
	boundInfo.offset = foundOffset;
	
	return boundInfo;
}

/**
 * Vrací pozici v kontextu s childNodes
 */
JAK.Range.prototype._getChildPos = function(node) {
	for (var i = 0; node = node.previousSibling; i++)
		continue;
	return i;
}

/**
 * Vrací obecný kontejner, tedy bezprostřední rodičovský uzel, ve kterém se nachází jak počáteční, tak i koncový uzel
 */
JAK.Range.prototype._getCommonContainer = function(startNode, endNode) {
	var nodes = [];
	for (var n = startNode; n; n = n.parentNode) {
		nodes.push(n);
	}

	for (var n = endNode; n; n = n.parentNode) {
		for (var i = 0; i < nodes.length; i++) {
			if (nodes[i] == n) {
				return n;
			}
		}
	}

	return null;
}

/**
 * Zjisti, jestli je uzel (node) je umisten v jinem uzlu (parentNode) 
 */
JAK.Range.prototype._isChildOf = function(node, parentNode) {
	while(node != document) {
		var node = node.parentNode;
		if (node == parentNode) {
			return true;
		}
	}
	
	return false;
}

/**
 * Zjisti, jestli se jedna o textovy uzel
 */
 
JAK.Range.prototype._isTextNode = function(node) {
	var t = node.nodeType;
    return t == 3 || t == 4 || t == 8;
}

/**
 * Prevede startContainer a endContainer na cilove uzly, se kterymi uz budeme pracovat
 */
JAK.Range.prototype._getTargetStartEndNode = function() {
	var startCont = this._IERange.startContainer;
	var startOffset = this._IERange.startOffset;
	var endCont = this._IERange.endContainer;
	var endOffset = this._IERange.endOffset;
	
	var sn = this._isTextNode(startCont) ? startCont : startCont.childNodes[startOffset < startCont.childNodes.length ? startOffset : startOffset - 1];
	var en = this._isTextNode(endCont) ? endCont : endCont.childNodes[endOffset - 1 > 0 ? endOffset - 1 : 0];
	return {
		startNode: sn, 
		endNode: en
	};
}

/**
 * Vytvori string ze vsech atributu, cili neco jako 'id=uzel value="neco"'... format stringu je pro IE <= 8
 */
JAK.Range.prototype._getNodeAttrString = function(node) {
	var attrs = node.attributes;
	var attrName = "";
	var attrValue = "";
	var attrsText = "";
	for (var i=0; i < attrs.length; i++) {
		attrName = attrs[i].nodeName;
		attrValue = attrs[i].nodeValue;
		if (attrName == "style"|| attrName == "value" || attrName == "class" || attrName == "title") {
			attrValue = "\"" + attrValue + "\"";
		}
		attrsText += (" " + ( attrName + "=" + attrValue));
	}
	
	 return attrsText;
}
/**
 * nastaví hranice rozsahu pomocí uzlu a offsetu, pokud je isEndNode == true, nastavujeme konec, jinak počátek
 */
JAK.Range.prototype._setBound = function(node, offset, isEndNode) {
	if (isEndNode == undefined) {
		isEndNode = false;
	}
	if (JAK.Range.OLD_IE) {
		if (!isEndNode) { 
			this._createRange(); /* musime znovu vytvorit range, jinak se strejda explorer chova, jak baletka po 6 pivech */ 
			this._nSel = null; 
		}
		
		var boundNode = node;
		var childPos = offset, textOffset = 0;
		
		if (this._isTextNode(boundNode)) {
			textOffset = offset;
		} else {
			childPos = offset;
		}
		
		var anchorNode;		
		if (boundNode && boundNode.nodeValue !== null && boundNode.data !== null) {
			anchorNode = boundNode;
		} else {
			if (boundNode.childNodes[childPos]) {
				anchorNode = boundNode.childNodes[childPos];
			}
		}
		
		var anchorParent = (boundNode && boundNode.nodeValue !== null && boundNode.data !== null) ? boundNode.parentNode : boundNode;
		
		var tempNode = this._contextWindow.document.createElement('a');
		tempNode.innerHTML = "&#feff;";
		
		if (anchorNode) {
			anchorParent.insertBefore(tempNode, anchorNode);
		} else {
			anchorParent.appendChild(tempNode);
		}
		
		var newRange = this._contextWindow.document.body.createTextRange();
		newRange.moveToElementText(tempNode);
		
		tempNode.parentNode.removeChild(tempNode);
		
		if (textOffset) {
			newRange[isEndNode ? "moveEnd" : "moveStart"]("character", textOffset);
		}
		this._nRng.setEndPoint(isEndNode ? "EndToEnd" : "StartToStart", newRange);
		
		if (isEndNode) {
			this._IERange.endContainer = boundNode;
			this._IERange.endOffset = offset;
		} else {
			this._IERange.startContainer = boundNode;
			this._IERange.startOffset = offset;
		}
	} else {
		if (!isEndNode) {
			this._nRng.setStart(node, offset);
		} else {
			this._nRng.setEnd(node, offset);
		}
	}
}

JAK.Range.prototype._resetIERange = function() {
	this._IERange = { //special struktura pro IE 8 a niz
		startContainer: null,
		startOffset: 0,
		endContainer: null,
		endOffset: 0
	};
}

/* veřejné metody */

/**
 * Zkolabuje rozsah
 * @param {boolean} toStart pokud je true zkolabuje na začátek rozsahu, jinak na konec
 */
JAK.Range.prototype.collapse = function(toStart){
	if (JAK.Range.OLD_IE) {
		this.getStartEnd();
		if (toStart) {
			this._IERange.endContainer = this._IERange.startContainer;
			this._IERange.endOffset = this._IERange.startOffset;
		} else {
			this._IERange.startContainer = this._IERange.endContainer;
			this._IERange.startOffset = this._IERange.endOffset;
		}
	} else {
		this._nRng.collapse(!!toStart);
	}
	
	return this;
}

/**
 * Smaže (fyzicky odstraní) vybraný obsah v rozsahu
 * @returns {JAK.Range}
 */
JAK.Range.prototype.deleteContent = function() {
	if (JAK.Range.OLD_IE) {
		this.getStartEnd();
		
		var startCont = this._IERange.startContainer;
		var startOffset = this._IERange.startOffset;
		var endCont = this._IERange.endContainer;
		var endOffset = this._IERange.endOffset;
		
		if (this.isCollapsed()) {
			/* nedelame nic */
			return this;
		}
			
		if (this._isTextNode(startCont) && this._isTextNode(endCont) && startCont == endCont) {
			/* pripad, ze mazeme jen v ramci jednoho textoveho uzlu */
			startCont.nodeValue = startCont.nodeValue.substring(0, startOffset) + "" + startCont.nodeValue.substring(endOffset, startCont.nodeValue.length);
			this.setStartEnd(startCont, startOffset, startCont, startOffset);
			return this;
		} else {
			/* mame vybran obsah prvku, takze promazeme akorat prvek */
			if (startCont == endCont && startOffset == 0 && endOffset == startCont.childNodes.length) { 
				JAK.DOM.clear(startCont);
				this.setStartEnd(startCont, 0, endCont, 0);
				return this; // jsme hotovi, vracecka
			}
			
			/* mame nastaveno na cely prvek, muzeme ho tedy odebrat */
			if (startCont == endCont && endOffset - startOffset == 1) {
				startCont.removeChild(startCont.childNodes[startOffset]);
				endOffset = startOffset;
				this.setStartEnd(startCont, startOffset, startCont, endOffset);
				return this; // mame provedeno, vracime se
			}
		}
		
		/* bohuzel start i end kontejner jsou ruzne v DOMu, nezbyva nez postupne promazavat */
		if (!this._isTextNode(startCont) && !startCont.childNodes.length) {
			/* pokud mam prazdny node, musim do nej vytvorit uzel, protoze range dovoluje mit nastaveno na obsah prazdneho uzlu  */
			startCont.appendChild(JAK.mel("span", {innerHTML:"&nbsp;"}, false, this._contextWindow.document)); 
		}
		if (!this._isTextNode(endCont) && !endCont.childNodes.length) {
			endCont.appendChild(JAK.mel("span", {innerHTML:"&nbsp;"}, false, this._contextWindow.document));
		}
		
		var nodes = this._getTargetStartEndNode();
		var startNode = nodes.startNode;
		var endNode = nodes.endNode;
		var startTextOffset = this._isTextNode(startCont) ? startOffset : -1;
		var endTextOffset = this._isTextNode(endCont) ? endOffset : -1;
		
		var commonCont = this._getCommonContainer(startNode, endNode);
		
		if (startNode != commonCont) {
			var node = startNode.nextSibling ? startNode.nextSibling : startNode.parentNode;
		} else {
			var node = startNode;
		}
		while(node != commonCont && node != endNode && !this._isChildOf(endNode, node)) {
			if (node.nextSibling) {
				var tempNode = node.nextSibling;
			} else {
				var tempNode = node.parentNode;
			}
			if (!this._isChildOf(startNode, node)) {
				node.parentNode.removeChild(node);
			}
			node = tempNode;
		}
		
		if (endNode != commonCont) {
			var node = endNode.previousSibling ? endNode.previousSibling : endNode.parentNode;
		} else {
			var node = endNode;
		}
		while(node != commonCont && node != startNode && !this._isChildOf(startNode, node)) {
			if (node.previousSibling) {
				var tempNode = node.previousSibling;
			} else {
				var tempNode = node.parentNode;
			}
			if (!this._isChildOf(endNode, node)) {
				node.parentNode.removeChild(node);
			}
			node = tempNode;
		}
		
		var newStartCont = null;
		var newStartOffset = 0;
		
		if (startTextOffset > -1) {
			startNode.nodeValue = startNode.nodeValue.substring(0, startTextOffset);
			newStartCont = startNode;
			newStartOffset = startTextOffset;
		} else {
			if (startNode != commonCont) {
				var parentNode = startNode.parentNode;
				newStartOffset = this._getChildPos(startNode);
				parentNode.removeChild(startNode);
				newStartCont = parentNode;
			} else {
				var parentNode = startNode.parentNode;
				newStartOffset = this._getChildPos(startNode);
				newStartCont = parentNode;
			}
		}
		
		if (endTextOffset > -1) {
			endNode.nodeValue = endNode.nodeValue.substring(endTextOffset, endNode.nodeValue.length);
		} else {
			if (endNode != commonCont) {
				if (endOffset != 0) {
					var parentNode = endNode.parentNode;
					parentNode.removeChild(endNode);
				}
			}
		}
		
		this.setStartEnd(newStartCont, newStartOffset, newStartCont, newStartOffset);
	} else {
		this._nRng.deleteContents();
	}
	
	return this;
}

/**
 * Vrací HTML kód rozsahu
 * @returns {string}
 */
JAK.Range.prototype.getContentHTML = function(){
	if(JAK.Range.OLD_IE){
		this.getStartEnd();
		
		var htmlText = "";
		
		var startCont = this._IERange.startContainer;
		var startOffset = this._IERange.startOffset;
		var endCont = this._IERange.endContainer;
		var endOffset = this._IERange.endOffset;
		
		if (this.isCollapsed()) {
			/* v rangi neni nic */
			return htmlText;
		}
		
		if (this._isTextNode(startCont) && this._isTextNode(endCont) && startCont == endCont) {
			/* pripad, ze pracujeme jen v ramci jednoho textoveho uzlu */
			htmlText = startCont.nodeValue.substring(startOffset, endOffset);
			return htmlText;
		} else {
			/* mame vybran obsah prvku */
			if (startCont == endCont && startOffset == 0 && endOffset == startCont.childNodes.length) { 
				htmlText = startCont.innerHTML;
				return htmlText;
			}
			
			/* mame nastaveno na cely prvek */
			if (startCont == endCont && endOffset - startOffset == 1) {
				var startNode = this._getTargetStartEndNode().startNode;
				htmlText = startNode.outerHTML;
				return htmlText;
			}
		}
		
		var nodes = this._getTargetStartEndNode();
		var startNode = nodes.startNode;
		var endNode = nodes.endNode;
		var startTextOffset = this._isTextNode(startCont) ? startOffset : -1;
		var endTextOffset = this._isTextNode(endCont) ? endOffset : -1;
		
		var node = startNode;
		var state = JAK.Range.START;
		while(node != endNode && !this._isChildOf(endNode, node)) {
			switch(state) {
				case JAK.Range.START:
					if (this._isTextNode(node)) {
						if (startTextOffset > -1) {
							htmlText = node.nodeValue.substring(startTextOffset, node.nodeValue.length);
						} else {
							htmlText = node.nodeValue;
						}
					} else {
						if (node.outerHTML) {
							htmlText = node.outerHTML;
						}
					}
				break;
				
				case JAK.Range.SIBLING:
					if (node.nodeValue || node.outerHTML) {
						htmlText = htmlText + (this._isTextNode(node) ? node.nodeValue : node.outerHTML);
					}
				break;
				
				case JAK.Range.PARENT:
					var attrsText = this._getNodeAttrString(node);
					htmlText = "<" + node.tagName + attrsText + ">" + htmlText + "</" + node.tagName + ">";
				break;
			}
			if (node.nextSibling) {
				node = node.nextSibling;
				state = JAK.Range.SIBLING;
			} else {
				node = node.parentNode;
				state = JAK.Range.PARENT;
			}
		}
		
		var endHtmlText = "";
		var node = endNode;
		state = JAK.Range.START;
		while(!this._isChildOf(startNode, node) && (this._isChildOf(endNode, node) || node == endNode)) {
			switch(state) {
				case JAK.Range.START:
					if (this._isTextNode(node)) {
						if (endTextOffset > -1) {
							endHtmlText = node.nodeValue.substring(0, endTextOffset);
						} else {
							endHtmlText = node.nodeValue;
						}
					} else {
						endHtmlText = node.outerHTML;
					}
				break;
				
				case JAK.Range.SIBLING:
					endHtmlText = (this._isTextNode(node) ? node.nodeValue : node.outerHTML) + endHtmlText;
				break;
				
				case JAK.Range.PARENT:
					var attrsText = this._getNodeAttrString(node);
					endHtmlText = "<" + node.tagName + attrsText + ">" + endHtmlText + "</" + node.tagName + ">";
				break;
			}
			if (node.previousSibling) {
				node = node.previousSibling;
				state = JAK.Range.SIBLING;
			} else {
				node = node.parentNode;
				state = JAK.Range.PARENT;
			}
		}
		
		htmlText = htmlText + endHtmlText;
		return htmlText;
	} else {
		var docFragment = this._nRng.cloneContents();
		var tmpDiv = JAK.mel('div',false,false,this._contextWindow.document);
		tmpDiv.appendChild(docFragment);
		return tmpDiv.innerHTML;
	}
}

/**
 * Vrací text vybraného obsahu v rozsahu
 * @returns {string}
 */
JAK.Range.prototype.getContentText = function() {
	if (JAK.Range.OLD_IE) {
		this.getStartEnd();
		
		var text = "";
		
		var startCont = this._IERange.startContainer;
		var startOffset = this._IERange.startOffset;
		var endCont = this._IERange.endContainer;
		var endOffset = this._IERange.endOffset;
		
		if (this.isCollapsed()) {
			/* v rangi neni nic */
			return text;
		}
		
		if (this._isTextNode(startCont) && this._isTextNode(endCont) && startCont == endCont) {
			/* pripad, ze pracujeme jen v ramci jednoho textoveho uzlu */
			text = startCont.nodeValue.substring(startOffset, endOffset);
			return text;
		} else {
			/* mame vybran obsah prvku */
			if (startCont == endCont && startOffset == 0 && endOffset == startCont.childNodes.length) { 
				text = startCont.innerText;
				return text;
			}
			
			/* mame nastaveno na cely prvek */
			if (startCont == endCont && endOffset - startOffset == 1) {
				var startNode = this._getTargetStartEndNode().startNode;
				text = startNode.innerText;
				return text;
			}
		}
		
		var nodes = this._getTargetStartEndNode();
		var startNode = nodes.startNode;
		var endNode = nodes.endNode;
		var startTextOffset = this._isTextNode(startCont) ? startOffset : -1;
		var endTextOffset = this._isTextNode(endCont) ? endOffset : -1;
		
		var node = startNode;
		var state = JAK.Range.START;
		while(node != endNode && !this._isChildOf(endNode, node)) {
			switch(state) {
				case JAK.Range.START:
					if (this._isTextNode(node)) {
						if (startTextOffset > -1) {
							text = node.nodeValue.substring(startTextOffset, node.nodeValue.length);
						} else {
							text = node.nodeValue;
						}
					} else {
						if (node.innerText) {
							text = node.innerText;
						}
					}
				break;
				
				case JAK.Range.SIBLING:
					if (node.nodeValue || node.innerText) {
						text = text + (this._isTextNode(node) ? node.nodeValue : node.innerText);
					}
				break;
			}
			if (node.nextSibling) {
				node = node.nextSibling;
				state = JAK.Range.SIBLING;
			} else {
				node = node.parentNode;
			}
		}
		
		var endText = "";
		var node = endNode;
		state = JAK.Range.START;
		while(!this._isChildOf(startNode, node) && (this._isChildOf(endNode, node) || endNode == node)) {
			switch(state) {
				case JAK.Range.START:
					if (this._isTextNode(node)) {
						if (endTextOffset > -1) {
							endText = node.nodeValue.substring(0, endTextOffset);
						} else {
							endText = node.nodeValue;
						}
					} else {
						endText = node.innerText;
					}
				break;
				
				case JAK.Range.SIBLING:
					endText = (this._isTextNode(node) ? node.nodeValue : node.innerText) + endText;
				break;
			}
			if (node.previousSibling) {
				node = node.previousSibling;
				state = JAK.Range.SIBLING;
			} else {
				node = node.parentNode;
			}
		}
		
		text = text + endText;
		
		return text;
	} else {
		return this._nRng.toString();
	}
}

/**
 * Vrací bezprostřední rodičovský uzel, ve kterém se rozsah nachází
 * @returns {node}
 */
JAK.Range.prototype.getParentNode = function() {
	if (JAK.Range.OLD_IE) {
		var nodes = this._getTargetStartEndNode();
		var startNode = nodes.startNode;
		var endNode = nodes.endNode;
		container = this._getCommonContainer(endNode, startNode);
		if (container == endNode || container == startNode) {
			container = container.parentNode;
		}
	} else {
		var container = this._nRng.commonAncestorContainer;
		if (container.nodeType == 3) {
			if(container.parentNode) {
				container = container.parentNode;
			}
		}
	}
	
	return container;
}

/**
 * Vrací počátek a konec rozsahu i s offsetem. Offset udává posun o počet znaků v případě, že uzel je textNode, jinak o počet uzlů. <b>Zatím experimentální metoda!</b>
 * @returns {object {object startContainer&#44 integer startOffset&#44 object endContainer&#44 integer endOffset}}
 */
JAK.Range.prototype.getStartEnd = function() {
	var anchorInfo = {};
	var start = {}, end = {};
	
	start = this._getBound(true);
	end = this._getBound();
	
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
		if (JAK.Range.OLD_IE) {
			this._nSel = this._nRng;
		} else {
			this._nSel = this._contextWindow.getSelection();
		}
	}
	if (JAK.Range.OLD_IE) {
		this._nSel.empty();
	} else {
		this._nSel.removeAllRanges();
	}
	
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
	div = JAK.mel('div', false, false, this._contextWindow.document);
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
	
	if (JAK.Range.OLD_IE) {
		this.getStartEnd();
		
		var startCont = this._IERange.startContainer;
		var startOffset = this._IERange.startOffset;
		var endCont = this._IERange.endContainer;
		var endOffset = this._IERange.endOffset;
		
		if (this._isTextNode(startCont)) {
			var parentNode = startCont.parentNode;
			if (startOffset != startCont.nodeValue.length) {
				var tempTextNode = JAK.ctext(startCont.nodeValue.substring(startOffset, startCont.nodeValue.length));
			}
			startCont.nodeValue = startCont.nodeValue.substring(0, startOffset);
			
			if (tempTextNode) {
				if (startCont.nextSibling) {
					parentNode.insertBefore(tempTextNode, startCont.nextSibling);
				} else {
					parentNode.appendChild(tempTextNode);
				}
				parentNode.insertBefore(node, tempTextNode);
			} else {
				if (startCont.nextSibling) {
					parentNode.insertBefore(node, startCont.nextSibling);
				} else {
					parentNode.appendChild(node);
				}
			}
			
			if (startCont.nodeValue.length == 0) { parentNode.removeChild(startCont); } 
			
			if (cursorBefore) {
				this.setStartEnd(startCont, this._getChildPos(node), startCont, this._getChildPos(node));
			} else {
				this.setStartEnd(parentNode, this._getChildPos(node) + 1, parentNode, this._getChildPos(node) + 1);
			}
		} else {
			if (!startCont.childNodes.length) {
				var tempTextNode = JAK.ctext("a");
				startCont.appendChild(tempTextNode);
			}
			
			var startNode = this._getTargetStartEndNode().startNode;
			
			if (tempTextNode) {
				tempTextNode.parentNode.removeChild(tempTextNode);
			}
			if (startOffset < startCont.childNodes.length) {
				startCont.insertBefore(node, startNode);
			} else {
				startCont.appendChild(node);
			}
			if (cursorBefore) {
				startOffset = node.previousSibling ? startOffset : 0;
				this.setStartEnd(startCont, startOffset, startCont, startOffset);
			} else {
				startOffset = node.nextSibling ? startOffset + 1 : startCont.childNodes.length;
				this.setStartEnd(startCont, startOffset, startCont, startOffset);
			}
		}
	} else {
		var spanNode = JAK.mel('span', false, false, this._contextWindow.document);
		if (!cursorBefore) {
			this._nRng.insertNode(spanNode);
			this._nRng.insertNode(node);
		} else {
			this._nRng.insertNode(node);
			this._nRng.insertNode(spanNode);
		}
		this._nRng.selectNode(spanNode);
		this.deleteContent();
		this.show();
	}
	
	return this;
}

/**
 * vrací zda je rozsah zkolabovaný (je nulový)
 * @returns {boolean} rozsah je/není zkolabovaný
 */
JAK.Range.prototype.isCollapsed = function(){
	if (JAK.Range.OLD_IE) {
		this.getStartEnd();
		var startCont = this._IERange.startContainer;
		var startOffset = this._IERange.startOffset;
		var endCont = this._IERange.endContainer;
		var endOffset = this._IERange.endOffset;
		return (startCont == endCont && startOffset == endOffset);
	} else {
		return this._nRng.collapsed;
	}
}

/**
 * Zjišťuje, jestli je rozsah nastaven uvnitř konkrétního uzlu
 * @param {node} node testovaný uzel
 * @returns {boolean}
 */
JAK.Range.prototype.isInNode = function(node) {
	var container = this.getParentNode();
	
	while(container != this._contextWindow.document && container != node) {
		if (container.parentNode) {
			container = container.parentNode;
		} else {
			break;
		}
	}
	
	if (container != node) {
		return false;
	}
	
	return true;
}

/**
 * Nastaví rozsah z uživatelského výběru
 * @returns {JAK.Range}
 */
JAK.Range.prototype.setFromSelection = function() {
	if (JAK.Range.OLD_IE) {
		this._nRng = this._contextWindow.document.selection.createRange();
		this._nSel = this._nRng;
		this._resetIERange();
		this.getStartEnd();
	} else {
		this._nSel= this._contextWindow.getSelection();
		if (this._nSel.rangeCount > 0) {
			this._nRng = this._nSel.getRangeAt(0);
		} else {
			this._createRange();
		}
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
	if (JAK.Range.OLD_IE) {
		var startOffset, endOffset;
		var startContainer = startNode.parentNode;
		var endContainer = endNode.parentNode;
		var childPosStart = this._getChildPos(startNode);
		var childPosEnd = this._getChildPos(endNode);
		
		startOffset = includedToRange ? childPosStart : childPosStart + 1;
		endOffset = includedToRange ? childPosEnd + 1 : childPosEnd;
		
		this.setStartEnd(startContainer, startOffset, endContainer, endOffset);
	} else {
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
	}
	
	return this;
}

/**
 * Nastaví rozsah na konkrétní uzel nebo jeho obsah
 * @param {node} node uzel, který má být vybrán
 * @param {boolean} onlyContent nepovinný parametr; true: když má být zahrnut pouze obsah uzlu; false: když potřebujeme obsah i včetně uzlu samotného; defaultně: false
 * @returns {JAK.Range}
 */
JAK.Range.prototype.setOnNode = function(node, onlyContent) {
	if (onlyContent) {
		if (JAK.Range.OLD_IE) {
			var startNode = node;
			var startOffset = 0;
			var endNode = node;
			var endOffset = node.childNodes.length;
			this.setStartEnd(startNode, startOffset, endNode, endOffset);
		} else {
			this._nRng.selectNodeContents(node);
		}
	} else {
		if (JAK.Range.OLD_IE) {
			if (node != this._contextWindow.document.body) { 
				var parentNode = node.parentNode;
				var childPos = this._getChildPos(node);
				var childPosNext = parentNode.childNodes.length == childPos ? childPos : childPos + 1;
				this.setStartEnd(parentNode, childPos, parentNode, childPosNext);
			} else {
				this.setOnNode(node, true);
			}
		} else {
			if (node != this._contextWindow.document.body) { // aby se to chovalo stejne jako v exploreru
				this._nRng.selectNode(node);
			} else {
				this._nRng.selectNodeContents(node);
			}
		}
	}
	
	return this;
}

/**
 * Nastaví začátek a konec rozsahu. Nastavuje se pomocí počátečního a koncového uzlu společně s offsetem (posunem). <b>Zatím experimentální metoda!</b>
 * @param {node} startContainer počáteční uzel
 * @param {integer} startOffset posun o počet znaků směrem ke konci, pokud se jedná o textNode, jinak posun o počet uzlů
 * @param {node} endContainer koncový uzel
 * @param {integer} endOffset posun o počet znaků směrem ke konci, pokud se jedná o textNode, jinak posun o počet uzlů
 * @returns {JAK.Range}
 */
 
JAK.Range.prototype.setStartEnd = function(startContainer, startOffset, endContainer, endOffset) {
	this._setBound(startContainer, startOffset);
	this._setBound(endContainer, endOffset, true);
	
	return this;
}

/**
 * Visuálně označí rozsah (provede se select)
 * @returns {JAK.Range}
 */
JAK.Range.prototype.show = function() {
	if (!this._nSel) {
		if (JAK.Range.OLD_IE) {
			this._nSel = this._nRng;
		} else {
			this._nSel = this._contextWindow.getSelection();
		}
	}
	if (JAK.Range.OLD_IE) {
		this._nSel.select();
	} else {
		this._nSel.removeAllRanges();
		this._nSel.addRange(this._nRng);
	}
	
	return this;
}
