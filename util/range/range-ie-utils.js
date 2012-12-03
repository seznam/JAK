/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Pomocné utility pro range v IE 8 a níže
 * @author jerry
 */ 
 
/**
 * @class Range utility
 * @version 1.1
 */

JAK.Range.IE.Utils = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Range.IE.Utils",
	VERSION:"1.1"
});

/**
 * Vraci pozici (index) nodu
 */
JAK.Range.IE.Utils.getChildPos = function(node) {
	for (var i = 0; node = node.previousSibling; i++) { continue; }
	return i;
}

/**
 * Vrací obecný kontejner, tedy bezprostřední rodičovský uzel, ve kterém se nachází jak počáteční, tak i koncový uzel
 * Pokud se vyskytne chyba, vraci null, coz znamena, ze nejsme schopni urcit.
 */
JAK.Range.IE.Utils.getCommonContainer = function(startNode, endNode) {
	var nodes = [];
	
	/* IE7 vyhazuje vyjimku u pristupu k parentNode, kdyz je prvek odebrany z DOMu a je to textovy prvek (nodeType == 3) */
	try {
		for (var n = startNode; n; n = n.parentNode) { nodes.push(n); }
	} catch(e) {
		return null;
	}

	for (var n = endNode; n; n = n.parentNode) {
		for (var i = 0; i < nodes.length; i++) {
			if (nodes[i] == n) { return n; }
		}
	}

	return null;
}

/**
 * Zjisti, jestli je uzel (node) je umisten v jinem uzlu (parentNode) 
 */
JAK.Range.IE.Utils.isChildOf = function(node, parentNode) {
	var contextWindow = node.ownerDocument.defaultView ? node.ownerDocument.defaultView : node.ownerDocument.parentWindow;
	while(node != contextWindow.document) {
		node = node.parentNode;
		if (node == parentNode) { return true; }
	}
	
	return false;
}

/**
 * Zjisti, jestli se jedna o textovy uzel
 */
JAK.Range.IE.Utils.isTextNode = function(node) {
	var t = node.nodeType;
    return t == 3 || t == 4 || t == 8;
}

/**
 * Vytvori string ze vsech atributu, cili neco jako 'id=uzel value="neco"'... format stringu je pro IE <= 8
 */
JAK.Range.IE.Utils.getNodeAttrString = function(node) {
	var attrs = node.attributes;
	var attrName = "";
	var attrValue = "";
	var attrsText = "";
	var attrNames = "style, value, class, title, alt"; /* hodnoty techto atributu jsou v uvozovkach */
	for (var i=0, len = attrs.length; i < len; i++) {
		var attribute = attrs[i];
		attrName = attribute.nodeName;
		attrValue = attribute.nodeValue;
		if (attrNames.indexOf(attrName) != -1) { attrValue = "\"" + attrValue + "\""; }
		attrsText += (" " + (attrName + "=" + attrValue));
	}
	
	 return attrsText;
}

/**
 * Vytvori documentFragment s obsahem, ktery je zadan pomoci html
 */
JAK.Range.IE.Utils.getDocFragFromHTML = function(contextWindow, html) {
	var docFrag = contextWindow.document.createDocumentFragment();
	var div = JAK.mel("div");
	div.innerHTML = html;
	
	while(div.firstChild) { docFrag.appendChild(div.firstChild); }
	
	return docFrag;
}

/**
 * Vrati escapovane <, > a &
 */
JAK.Range.IE.Utils.escapeHTML = function(text) {
	return text.replace(/&/g, "&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

