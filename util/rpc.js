/**
 * @class RPC request, určený pro komunikaci se Seznam FRPC rozhraním
 * @augments JAK.Request
 */
JAK.RPC = JAK.ClassMaker.makeClass({
	NAME: "JAK.RPC",
	VERSION: "1.0",
	EXTEND: JAK.Request
});

JAK.RPC.AUTO		= 0;
JAK.RPC.JSON		= 1;
JAK.RPC.XMLRPC		= 2;
JAK.RPC.FRPC		= 3;
JAK.RPC.FRPC_B64	= 4;

JAK.RPC.ACCEPT = {};
JAK.RPC.ACCEPT[JAK.RPC.JSON] = "application/json";
JAK.RPC.ACCEPT[JAK.RPC.XMLRPC] = "text/xml";
JAK.RPC.ACCEPT[JAK.RPC.FRPC] = "application/x-frpc";
JAK.RPC.ACCEPT[JAK.RPC.FRPC_B64] = "application/x-base64-frpc";

/**
 * @param {int} type Typ serializace; jedna z konstant JAK.RPC.*
 * @param {object} [options] Konfigurace
 * @param {int} [options.timeout=0] Timeout pro JAK.Request
 * @param {bool} [options.async=true] Asynchronnost pro JAK.Request
 * @param {string} [options.endpoint="/"] URL RPC endpointu
 */
JAK.RPC.prototype.$constructor = function(type, options) {
	this._ERROR = 5; /* novy stav pro callbacky */
	this._rpcType = type;
	
	if (this._rpcType == JAK.RPC.AUTO) { 
		this._rpcType = JAK.RPC.FRPC_B64;
		
		/* tohle bylo v dobe, kdy jsme nemeli b64 
		if (JAK.Browser.client != "opera") {
			this._rpcType = JAK.RPC.FRPC;
		} else {
			this._rpcType = JAK.RPC.JSON;
		}
		*/
	}
	
	var requestType = null;
	switch (this._rpcType) {
		case JAK.RPC.JSON:
		case JAK.RPC.FRPC_B64:
			requestType = JAK.Request.TEXT;
		break;
		
		case JAK.RPC.FRPC:
			requestType = JAK.Request.BINARY;
		break;

		case JAK.RPC.XMLRPC:
			requestType = JAK.Request.XML;
		break;

		default: 
			throw new Error("Unsupported RPC type "+this._rpcType);
		break;
	}
	
	this._rpcOptions = {
		timeout: 0,
		async: true,
		endpoint: "/"
	}
	for (var p in options) { this._rpcOptions[p] = options[p]; }
	var requestOptions = {
		timeout: this._rpcOptions.timeout,
		async: this._rpcOptions.async,
		method: "post"
	};

	this.$super(requestType, requestOptions);
}

/**
 * @param {string} method Nazev FRPC metody
 * @param {array} data Pole parametru pro FRPC metodu
 * @param {object} [hints] Volitelne typove hinty; pouziva se jen pro floaty a binarni data.
 */
JAK.RPC.prototype.send = function(method, data, hints) {
	
	if (!(data instanceof Array)) { throw new Error("RPC needs an array of data to be sent"); }
	if(this._rpcType == JAK.RPC.XMLRPC) {
		this.setHeaders({"Accept":JAK.RPC.ACCEPT[this._rpcType], "Content-Type":"text/xml"});
		var d = JAK.XMLRPC.serializeCall(method,data,hints);
		return this.$super(this._rpcOptions.endpoint,d);
	} else {
		this.setHeaders({"Accept":JAK.RPC.ACCEPT[this._rpcType], "Content-Type":"application/x-base64-frpc"});
		var d = JAK.FRPC.serializeCall(method, data, hints);
		return this.$super(this._rpcOptions.endpoint, JAK.Base64.btoa(d));
	}
}

/**
 * Nastavení callbacku pro chybu zpracování odpovědi
 */
JAK.RPC.prototype.setErrorCallback = function(obj, method) {
	this._setCallback(obj, method, this._ERROR);
	return this;
}

JAK.RPC.prototype._done = function(data, status) {
	try {
		var d = this._rpcParse(data, status);
	} catch (e) {
		this._state = this._ERROR;
		this._userCallback(e, status, this);
		this._promise.reject({type:"frpc", request:this});
		return;
	}
	this.$super(d, status);
}

JAK.RPC.prototype._rpcEscape = function(str) {
	var re = new RegExp('"', "g"); // geany nema v oblibe literalovy reg. vyraz s uvozovkami
	return str.split(/\\/g).join("\\\\").split(re).join('\\"');
}

/**
 * @deprecated
 * Serializace FRPC do x-www-form-urlencoded, obsoleted by frpc+b64
 */
JAK.RPC.prototype._rpcSerialize = function(data, hints, method) {
	if (!data) { return ""; }

	var arr = [];
	for (var p in data) {
		var name = p;
		var value = data[p];
		var floatFlag = false; /*(hints && hints.indexOf(p) != -1);*/
		
		if (value instanceof Array) {
			name += "[]";
			if (!value.length) { /* prazdne pole */
				arr.push(encodeURIComponent(name) + "=");
			} else { /* neprazdne pole */
				for (var i=0;i<value.length;i++) {
					var v = value[i];
					v = this._rpcSerializeValue(v, floatFlag);
					arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(v));
				}
			}
		} else { /* neni to pole */
			value = this._rpcSerializeValue(value, floatFlag);
			arr.push(encodeURIComponent(name) + "=" + encodeURIComponent(value));
		}
	}
	
	return arr.join("&");
}

JAK.RPC.prototype._rpcSerializeValue = function(value, floatFlag) {
	if (value === null) { return "null"; }

	switch (typeof(value)) {
		case "boolean":
			return value;
		break;
		
		case "string":
			return '"' + this._rpcEscape(value) + '"';
		break;
		
		case "number": 
			if (!floatFlag) { 
				return (value > 0 ? Math.floor(value) : Math.ceil(value)); 
			}
			var str = value.toString();
			if (str.indexOf(".") == -1) { str += ".0"; }
			return str;
		break;
		
		case "object":
			if (!(value instanceof Date)) { throw new Error("Unserializable object " + value); }
			return value.format("Y-m-d\\TH:i:sO");
		break;

		default:
			throw new Error("Unserializable value " + value);
		break;
	}
}

JAK.RPC.prototype._rpcParse = function(data) {
	switch (this._rpcType) {
		case JAK.RPC.JSON:
			var result = JSON.parse(data);
			if (!result.status && result.failure) { throw new Error("JSON/"+result.failure+": "+result.failureMessage); } 
			return result;
		break;
		
		case JAK.RPC.FRPC:
			return JAK.FRPC.parse(data);
		break;
		
		case JAK.RPC.FRPC_B64:
			var bytes = JAK.Base64.atob(data);
			return JAK.FRPC.parse(bytes);
		break;
		
		case JAK.RPC.XMLRPC:
			return this._rpcParseXML(data);
		break;
		
		default:
			throw new Error("Unimplemented RPC type " + this._rpcType);
		break;
	}
}

JAK.RPC.prototype._rpcParseXML = function(xmlDoc) {
	if (!xmlDoc) { return null; }
	var de = xmlDoc.documentElement;
	if (de.nodeName != "methodResponse") { throw new Error("Only XMLRPC method responses supported"); }
	var type = JAK.XML.childElements(de)[0];
	
	var node = null;
	if (type.nodeName == "fault") {
		var node = JAK.XML.childElements(type, "value")[0];
		throw new Error(JSON.stringify(JAK.XML.RPC.parse(node)));
	}
	
	var node = JAK.XML.childElements(type, "param")[0];
	node = JAK.XML.childElements(node, "value")[0];
	return JAK.XML.RPC.parse(node);
}
