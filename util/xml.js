/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Práce s XML
 * @author Zara
 */ 

/**
 * @namespace
 * @group jak-utils
 */
JAK.XML = JAK.ClassMaker.makeStatic({
	NAME: "JAK.XML",
	VERSION: "2.2"
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
 * @param {string} [name] Volitelně filtr na jména prvků
 * @returns {element[]}
 */
JAK.XML.childElements = function(node, name) {
	var arr = [];
	var ch = node.childNodes;
	for (var i=0;i<ch.length;i++) {
		var x = ch[i];
		if (x.nodeType != 1) { continue; }
		if (name && name.toLowerCase() != x.nodeName.toLowerCase()) { continue; }
		arr.push(x);
	}
	return arr;
}

/**
 * Vyrobí XML document z řetěce
 * @param {string} [xmlStr]
 * @returns {XMLDocument}
 */
JAK.XML.createDocument = function(xmlStr) {
	if(!arguments.length) {
		if (document.implementation && document.implementation.createDocument) {
			return document.implementation.createDocument("","",null);
		} else if(window.ActiveXObject) {
			return  new ActiveXObject("Microsoft.XMLDOM");
		} else {
			throw new Error("Can't create XML Document");
		}
		return
	}

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

/**
 * Vyrobí XML documentu z řetězec
 * @param {object} xmlDoc XML document
 * @returns {string}
 */
JAK.XML.serializeDocument = function(xmlDoc) {
	if(window.XMLSerializer) {
		var s = new XMLSerializer();
		return s.serializeToString(xmlDoc);
	} else if(xmlDoc.xml) {
		return xmlDoc.xml;
	} else {
		throw new Error("XML document serialization available");
	}
}

/**
 * Parsování XMLRPC
 * @namespace
 * @group jak-utils
 */
JAK.XML.RPC = JAK.ClassMaker.makeStatic({
	NAME: "JAK.XML.RPC",
	VERSION: "1.0"
});

/**
 * XML na objekt
 * @param {node} node
 * @returns {object}
 */
JAK.XML.RPC.parse = function(node) {
	return JAK.XMLRPC.parse(node);
}
