/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT License, its complete text is available in licence.txt file
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
	VERSION: "2.0"
});

/**
 * Vrátí textový obsah uzlu
 * @param {node} node
 * @returns {string}
 */
JAK.XML.textContent = function(node) {
	return node.textContent || node.text;
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
