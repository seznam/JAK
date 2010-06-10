/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Prace s XML
 * @author Zara
 */ 

/**
 * @namespace
 * @group jak-utils
 */
JAK.XML = JAK.ClassMaker.makeStatic({
	NAME: "JAK.XML",
	VERSION: "2.1"
});

/**
 * Vrátí textový obsah uzlu
 * @param {node} node
 * @returns {string}
 */
JAK.XML.textContent = function(node) {
	return node.textContent || node.text || "";
}

/**
 * Vrátí pole potomků, které jsou elementy
 * @param {node} node
 * @returns {element[]}
 */
JAK.XML.childElements = function(node) {
	var arr = [];
	var ch = node.childNodes;
	for (var i=0;i<ch.length;i++) {
		var x = ch[i];
		if (x.nodeType == 1) { arr.push(x); }
	}
	return arr;
}

/**
 * Vyrobí XML document z řetěce
 * @param {string} xmlStr
 * @returns {XMLDocument}
 */
JAK.XML.createDocument = function(xmlStr) {
	if (window.DOMParser) {
		return new DOMParser().parseFromString(xmlStr, "text/xml");
	} else if (window.ActiveXObject) {
		var xml = new ActiveXObject("Microsoft.XMLDOM");
		xml.loadXML(xmlStr);
		return xml;
	} else {
		throw new Error("No XML parser available");
	}
}
