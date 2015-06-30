/**
 * @classXMLRPC parser a serializator
 * @group jak-utils
 */
JAK.XMLRPC = JAK.ClassMaker.makeStatic({
	NAME: "JAK.XMLRPC",
	VERSION: "1.0"
});

JAK.XMLRPC.serializeCall = function(method,data,hints) {
	this._method = method;
	this._data = data;
	this._path = [];
	this._doc = JAK.XML.createDocument();
	var root = this._doc.createElement("methodCall");
	var methodName = this._doc.createElement("methodName");
	methodName.appendChild(this._doc.createTextNode(this._method));
	root.appendChild(methodName);
	this._doc.appendChild(root);
	this._params = this._doc.createElement("params");
	root.appendChild(this._params);
	this._serialize(data,hints);
	var out = JAK.XML.serializeDocument(this._doc);
	return out;
}

JAK.XMLRPC.parse = function(data) {
	return this._valueToObject(data)
}

JAK.XMLRPC._serialize = function(data, hints) {
	this._path = [];
	this._hints = hints;
	for(var i = 0; i < data.length; i++) {
		this._path.push(i);
		var param = this._doc.createElement("param");
		this._serializeValue(param,data[i]);
		this._path.pop();
		this._params.appendChild(param);
	}
	
	this._hints = null;
}

JAK.XMLRPC._serializeValue = function(result,value) {
	var valueNode = this._doc.createElement("value");
	if (value === null) {
		valueNode.appendChild(this._doc.createElement("nil"));
		result.appendChild(param);
		return;
	}
	var node;
	var content;
	switch(typeof(value)) {
		case "string":
			content = this._doc.createTextNode(value);
			node = this._doc.createElement("string");
			node.appendChild(content);
		break;
		case "number":
			content = this._doc.createTextNode(value);
			if (this._getHint() == "float") { /* float */
				node = this._doc.createElement("double");
			} else { /* int */
				node = this._doc.createElement("int");
			}
			node.appendChild(content);
		break;
		case "boolean":
			value = value ? 1 : 0;
			content = this._doc.createTextNode(value);
			node = this._doc.createElement("boolean");
			node.appendChild(content);
		break;
		case "object":
			if (value instanceof Date) {
				value = value.toISOString();
				content = this._doc.createTextNode(value);
				node = this._doc.createElement("dateTime.iso8601");
				node.appendChild(content);				
			} else if (value instanceof Array) {
				node = this._serializeArray(content,value);
			} else {
				node = this._doc.createElement('struct');
				this._serializeObject(node,value);
			}			
		break;
		
		default: /* undefined, function, ... */
			throw new Error("XMLRPC does not allow value "+value);
		break;
	}
	valueNode.appendChild(node);
	result.appendChild(valueNode);
}

JAK.XMLRPC._serializeArray = function(result,value) {
	if (this._getHint() == "binary") { /* binarni data */
		var node = this._doc.createElement("base64");
		var value = this._doc.createElement("value");
		var content = this._doc.createTextNode(JAK.Base64.btoa(value));
		value.appendChild(content);
		node.appendChild(value);
		return node;
	} else {
		var node = this._doc.createElement('array');
		var data = this._doc.createElement('data');
		node.appendChild(data);
		for(var i = 0; i < value.length; i++) {
			this._path.push(i);
			this._serializeValue(data,value[i]);
			this._path.pop();
		}
		return node;
	}
	
}

JAK.XMLRPC._serializeObject = function(result, value) {
	for(var i in value) {
		var item = this._doc.createElement('member');
		var nameNode = this._doc.createElement('name');
		var name = this._doc.createTextNode(i);
		nameNode.appendChild(name);
		item.appendChild(nameNode);
		this._path.push(i);
		this._serializeValue(item,value[i]);
		this._path.pop();
		result.appendChild(item);
	}
} 

JAK.XMLRPC._valueToObject = function(node) {
	node = JAK.XML.childElements(node)[0];
	switch (node.nodeName) {
		case "string":
			return JAK.XML.textContent(node);
		break;

		case "base64":
			return JAK.Base64.atob(JAK.XML.textContent(node).trim());
		break;

		case "i4":
		case "i8":
		case "int":
			return parseInt(node.firstChild.nodeValue);
		break;
		case "double":
			return parseFloat(node.firstChild.nodeValue);
		break;
		case "boolean":
			return (node.firstChild.nodeValue == "1");
		break;
		case "array":
			return this._arrayToObject(node);
		break;
		case "struct":
			return this._structToObject(node);
		break;
		case "nil":
			return null;
		break;
		case "dateTime.iso8601":
			var val = JAK.XML.textContent(node).trim();
			var r = val.match(/(\d{4})(\d{2})(\d{2})T(\d{2}):(\d{2}):(\d{2})(.)(\d{2})(\d{2})/);
			r[7] = (r[7] == "+" ? "1" : "-1");
			for (var i=1;i<r.length;i++) { r[i] = parseInt(r[i], 10); }
			var date = new Date(r[1], r[2]-1, r[3], r[4], r[5], r[6], 0);
			
			var offset = r[7] * (r[8]*60 + r[9]); // v minutach
			offset += date.getTimezoneOffset();

			var ts = date.getTime();
			ts -= offset * 60 * 1000;
			return new Date(ts);
		break;
		default:
			throw new Error("Unknown XMLRPC node " + node.nodeName);
		break;
	}
}

JAK.XMLRPC._arrayToObject = function(node) {
	var arr = [];
	var data = JAK.XML.childElements(node)[0];
	var values = JAK.XML.childElements(data);
	for (var i=0;i<values.length;i++) {
		arr.push(this._valueToObject(values[i]));
	}
	return arr;
}

JAK.XMLRPC._structToObject = function(node) {
	var obj = {};
	var members = JAK.XML.childElements(node);
	for (var i=0;i<members.length;i++) {
		var member = members[i];
		var name = JAK.XML.childElements(member, "name")[0];
		name = JAK.XML.textContent(name);
		
		var value = JAK.XML.childElements(member, "value")[0];
		obj[name] = this._valueToObject(value);
	}
	return obj;
}

/**
 * Vrati aktualni hint, na zaklade "_path" a "_hints"
 * @returns {string || null}
 */
JAK.XMLRPC._getHint = function() {
	if (!this._hints) { return null; }
	if (typeof(this._hints) != "object") { 
		return this._hints; 
	} /* skalarni varianta */
	return this._hints[this._path.join(".")] || null;
}
