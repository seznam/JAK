/**
 * @overview Třídy pro práci s rozsahem a výběrem.
 * @version 2.02b
 * @author gindar, jerry (přepis) 
 */ 

JAK.Range = JAK.ClassMaker.makeClass({
	NAME:'Range',
	VERSION:'2.02b'
});

JAK.Range.OLD_IE = (!document.selection || (window.getSelection && document.selection)?false:true); // testuje se, jestli jsme v IE8 a nize

/**
 * statická metoda - vrací {start,end} rozsah uživatelského výběru v inputu nebo textarey. V případě, že start==end, tak to znamená, že není nic vybráno, pouze umístěn kurzor. UPOZORNĚNÍ: Ke korektnímu chování pod IE8 a níže je potřeba ručně provést na input focus().
 * @param {object [elm]} input element, se kterým chceme pracovat (musí být input typu text nebo textarea)
 * @return {object {integer start&#44 integer end}} objekt obsahující začátek a konec výběru v inputu
 * @method 
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
 * @param {object [elm]} inputNode element, se kterým chceme pracovat (musí být input typu text nebo textarea)
 * @param {integer} start povinný parametr, určuje začátek výběru (nebo pozici kursoru, pokud není uveden end parametr)
 * @param {integer} end nepovinný parametr, určuje konec výběru
 * @method 
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
 * @param {object [window]} contextWindow objekt window v jehož kontextu se selection získává (je potřeba kvůli starším IE)
 * @return {JAK.Range}
 * @method 
 */

 
JAK.Range.fromSelection = function(contextWindow) {
	var _contextWindow = contextWindow || window; // nacteme kontext okna, defaultne window
	var range = new JAK.Range(_contextWindow);
	range.setFromSelection();
	
	return range;
}

/**
 * @class Virtuální rozsah mezi uzly
 * @name JAK.Range
 * @param {object [window]} contextWindow objekt window v jehož kontextu se selection získává
 * @constructor
 */
 
JAK.Range.prototype.$constructor = function(contextWindow) {
	this._contextWindow = contextWindow || window; // nacteme kontext okna, defaultne window
	this._nRng = null; // nativni range
	this._nSel = null; // nativni selection
	this._createRange();
}

/* privátní metody */

/**
 * vytvoří nativní rozsah a naklonuje jej, abychom s ním mohli nerušeně pracovat
 * @private 
 * @method 
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
 * @private 
 * @method 
 */
 
JAK.Range.prototype._getBound = function(inStart) {
	if (inStart == undefined) {
		inStart = false;
	}
	var boundInfo = {};
	
	if (JAK.Range.OLD_IE) {
		var tempNode = this._contextWindow.document.createElement('a');
		var clonedRange = this._nRng.duplicate();
		
		clonedRange.collapse(inStart);
		var parent = clonedRange.parentElement();
		do {
			parent.insertBefore(tempNode, tempNode.previousSibling);
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
 * @private 
 * @method 
 */
 
JAK.Range.prototype._getChildPos = function(node) {
	for (var i = 0; node = node.previousSibling; i++)
		continue;
	return i;
}

/**
 * Vrací obecný kontejner, tedy bezprostřední rodičovský uzel, ve kterém se nachází jak počáteční, tak i koncový uzel
 * @private 
 * @method 
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
 * nastaví hranice rozsahu pomocí uzlu a offsetu, pokud je isEndNode == true, nastavujeme konec, jinak počátek
 * @private 
 * @method 
 */

JAK.Range.prototype._setBound = function(node, offset, isEndNode) {
	if (isEndNode == undefined) {
		isEndNode = false;
	}
	if (JAK.Range.OLD_IE) {
		var boundNode = node;
		var offset = offset, textOffset = 0;
		var anchorNode = (boundNode && boundNode.nodeValue !== null && boundNode.data !== null) ? boundNode : boundNode.childNodes[offset];
		var anchorParent = (boundNode && boundNode.nodeValue !== null && boundNode.data !== null) ? boundNode.parentNode : boundNode;
		if (boundNode.nodeType == 3 || boundNode.nodeType == 4) {
			textOffset = offset;
		}
		var tempNode = this._contextWindow.document.createElement('a');
		anchorParent.insertBefore(tempNode, anchorNode);
		var newRange = this._contextWindow.document.body.createTextRange();
		newRange.moveToElementText(tempNode);
		tempNode.parentNode.removeChild(tempNode);
		this._nRng.setEndPoint(isEndNode ? 'StartToStart' : 'EndToStart', newRange);
		this._nRng.moveEnd('character', textOffset);
	} else {
		if (!isEndNode) {
			this._nRng.setStart(node, offset);
		} else {
			this._nRng.setEnd(node, offset);
		}
	}
}

/* veřejné metody */

/**
 * Zkolabuje rozsah
 * @param {boolean} toStart pokud je true zkolabuje na začátek rozsahu, jinak na konec
 * @method 
 */
JAK.Range.prototype.collapse = function(toStart){
	this._nRng.collapse(!!toStart);
	if (JAK.Range.OLD_IE) {
		this._nRng.select();
	}
	
	return this;
}

/**
 * Smaže (fyzicky odstraní) vybraný obsah v rozsahu
 * @method 
 * @return {object JAK.Range}
 */

JAK.Range.prototype.deleteContent = function() {
	if (JAK.Range.OLD_IE) {
		this._nRng.text = '';
	} else {
		this._nRng.deleteContents();
	}
	
	return this;
}

/**
 * Vrací HTML kód rozsahu
 * @method 
 * @return {string}
 */

JAK.Range.prototype.getContentHTML = function(){
	if(JAK.Range.OLD_IE){
		return this._nRng.htmlText;
	} else {
		var docFragment = this._nRng.cloneContents();
		var tmpDiv = JAK.mel('div',false,false,this._contextWindow.document);
		tmpDiv.appendChild(docFragment);
		return tmpDiv.innerHTML;
	}
}

/**
 * Vrací text vybraného obsahu v rozsahu
 * @method 
 * @return {string}
 */
 
JAK.Range.prototype.getContentText = function() {
	if (JAK.Range.OLD_IE) {
		return this._nRng.text;
	} else {
		return this._nRng.toString();
	}
}

/**
 * Vrací bezprostřední rodičovský uzel, ve kterém se rozsah nachází
 * @method 
 * @return {object [elm]}
 */
 
JAK.Range.prototype.getParentNode = function() {
	if (JAK.Range.OLD_IE) {
		var container = this._nRng.parentElement();
		var startNode = this._getBound(true).node;
		var endNode = this._getBound().node;
		var startEndCont;
		
		startEndCont = (startNode == endNode) ? startNode : this._getCommonContainer(startNode, endNode);
		container = (startEndCont == container) ? container : this._getCommonContainer(container, startEndCont);
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
 * @method 
 * @return {object {object startNode&#44 integer startOffset&#44 object endNode&#44 integer endOffset}}
 */

JAK.Range.prototype.getStartEnd = function() {
	var anchorInfo = {};
	var start = {}, end = {};
	
	start = this._getBound(true);
	end = this._getBound();
	
	anchorInfo.startNode = start.node
	anchorInfo.startOffset = start.offset;
	anchorInfo.endNode = end.node;
	anchorInfo.endOffset = end.offset;
	
	return anchorInfo;
}

/**
 * Visuálně odznačí rozsah (provede se unselect)
 * @method 
 * @return {object JAK.Range}
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
 * @method 
 * @return {object JAK.Range}
 */
 
JAK.Range.prototype.insertHTML = function(html, cursorBefore) {
	if (cursorBefore == undefined) {
		var cursorBefore = false;
	}
	
	if (JAK.Range.OLD_IE) {
		this.deleteContent();
		var tempNode;
		var spanNode;
		this._nRng.pasteHTML('<span id="JAKRangeInsertionCursorBeforeIE678"></span><div id="JAKRangeInsertionIE678HACK">' + html + '</div>'); /* bez IE by to nebylo tak zabavne :D */
		tempNode = this._contextWindow.document.getElementById("JAKRangeInsertionIE678HACK");
		spanNode = this._contextWindow.document.getElementById("JAKRangeInsertionCursorBeforeIE678");
		this._nRng.moveToElementText(cursorBefore?spanNode:tempNode);
		if (cursorBefore) {
			this._nRng.select();
		}
		tempNode.removeNode();
		spanNode.removeNode();
	} else {
		var div;
		div = JAK.mel('div',false, false, this._contextWindow.document);
		div.innerHTML = html;
		for(var i=0;i<div.childNodes.length;i++) {
			this.insertNode(div.childNodes[i], cursorBefore);
		}
	}
	
	return this;
}

/**
 * Vloží uzel na místo rozsahu.
 * @param {object [elm]} node vkládaný uzel
 * @param {boolean} cursorBefore nepovinný parametr určující pozici kursoru po vložení - true: po vložení se kurzor umístí před vkládaný obsah, false: po vložení se kurzor umístí za vkládaný obsah, defaultně: false
 * @method 
 * @return {object JAK.Range}
 */
 
JAK.Range.prototype.insertNode = function(node, cursorBefore) {
	if (cursorBefore == undefined) {
		var cursorBefore = false;
	}
	
	this.deleteContent();
	
	if (JAK.Range.OLD_IE) {
		var tempNode;
		var spanNode;
		var html;
		html = node.outerHTML;
		this._nRng.pasteHTML('<span id="JAKRangeInsertionCursorBeforeIE678"></span><div id="JAKRangeInsertionIE678HACK">' + html + '</div>');
		tempNode = this._contextWindow.document.getElementById("JAKRangeInsertionIE678HACK");
		spanNode = this._contextWindow.document.getElementById("JAKRangeInsertionCursorBeforeIE678");
		this._nRng.moveToElementText(cursorBefore?spanNode:tempNode);
		if (cursorBefore) {
			this._nRng.select();
		}
		tempNode.removeNode();
		spanNode.removeNode();
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
 * vrací zda je rozsah zkolabovaný
 * @return {boolean} rozsah je/není zkolabovaný
 * @method 
 */
 
JAK.Range.prototype.isCollapsed = function(){
	if (JAK.Range.OLD_IE) {
		/* IE nebylo obtezkano vlastnosti ke zjisteni zda je range kolabovany
		   Tato nahrada porovna polohu koncoveho a pocatecniho bodu  */
		var collIE = (this._nRng.compareEndPoints('EndToStart',this._nRng) == 0);
		return collIE;
	} else {
		return this._nRng.collapsed;
	}
}

/**
 * Zjišťuje, jestli je rozsah nastaven uvnitř konkrétního uzlu
 * @param {object [elm]} node testovaný uzel
 * @method 
 * @return {boolean}
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
 * @method 
 * @return {object JAK.Range}
 */

JAK.Range.prototype.setFromSelection = function() {
	if (JAK.Range.OLD_IE) {
		this._nRng = this._contextWindow.document.selection.createRange();
		this._nSel = this._nRng;
	} else {
		this._nSel= this._contextWindow.getSelection();
		if (this._nSel.rangeCount > 0) {
			this._nRng = this._nSel.getRangeAt(0);
		} else {
			this._nRng = null;
		}
	}
	
	return this;
}

/**
 * Nastaví rozsah mezi dvěma uzly (počátečním a koncovým)
 * @method 
 * @param {object [elm]} startNode počáteční uzel
 * @param {object [elm]} endNode koncový uzel
 * @param {boolean} includedToRange určuje, jestli uzly budou také zahrnuty do rozsahu, true: budou zahrnuty, false: nebudou, defaultně: false
 * @return {object JAK.Range}
 */
 
JAK.Range.prototype.setBetweenNodes = function(startNode, endNode, includedToRange) {
	if (includedToRange == undefined) {
		var includedToRange = false;
	}
	if (JAK.Range.OLD_IE) {
		var tempRange = this._contextWindow.document.body.createTextRange();
		this._nRng.moveToElementText(startNode);
		
		if (includedToRange) {
			this._nRng.setEndPoint("EndToStart", this._nRng);
		} else {
			this._nRng.setEndPoint("StartToEnd", this._nRng);
		}
		
		tempRange.moveToElementText(endNode);
		
		if (includedToRange) {
			this._nRng.setEndPoint("StartToEnd", tempRange);
		} else {
			this._nRng.setEndPoint("EndToStart", tempRange);
		}
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
}

/**
 * Nastaví rozsah na konkrétní uzel nebo jeho obsah
 * @method 
 * @param {object [elm]} node uzel, který má být vybrán
 * @param {boolean} onlyContent nepovinný parametr; true: když má být zahrnut pouze obsah uzlu; false: když potřebujeme obsah i včetně uzlu samotného; defaultně: false
 * @return {object JAK.Range}
 */
 
JAK.Range.prototype.setOnNode = function(node, onlyContent) {
	if (onlyContent == undefined) {
		onlyContent = false;
	}
	if (!onlyContent) {
		if (JAK.Range.OLD_IE) {
			if (node != this._contextWindow.document.body) { // to by se strejda explorer asi posral, kdybych mu tohle replacnul za div :))
				var clone = node.cloneNode(true);
				var tempNode = JAK.mel('div', false, false, this._contextWindow.document);
				tempNode.appendChild(clone);
				node.replaceNode(tempNode);
				this._nRng.moveToElementText(tempNode);
				tempNode.removeNode();
			} else {
				this._nRng.moveToElementText(node);
			}
		} else {
			if (node != this._contextWindow.document.body) { // aby se to chovalo stejne jako v exploreru
				this._nRng.selectNode(node);
			} else {
				this._nRng.selectNodeContents(node);
			}
		}
	} else {
		if (JAK.Range.OLD_IE) {
			this._nRng.moveToElementText(node);
		} else {
			this._nRng.selectNodeContents(node);
		}
	}
	return this;
}

/**
 * Nastaví začátek a konec rozsahu. Nastavuje se pomocí počátečního a koncového uzlu společně s offsetem (posunem). <b>Zatím experimentální metoda!</b>
 * @param {object [elm]} startNode počáteční uzel
 * @param {integer} startOffset posun o počet znaků směrem ke konci, pokud se jedná o textNode, jinak posun o počet uzlů
 * @param {object [elm]} endNode koncový uzel
 * @param {integer} endOffset posun o počet znaků směrem ke konci, pokud se jedná o textNode, jinak posun o počet uzlů
 * @return {object JAK.Range}
 */
 
JAK.Range.prototype.setStartEnd = function(startNode, startOffset, endNode, endOffset) {
	this._setBound(startNode, startOffset);
	this._setBound(endNode, endOffset, true);
	
	return this;
}

/**
 * Visuálně označí rozsah (provede se select)
 * @method 
 * @return {object JAK.Range}
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
