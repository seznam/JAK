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

JAK.RPC.prototype.$constructor = function(type, options) {
	this._ERROR = 5; /* novy stav pro callbacky */
	this._rpcType = type;
	
	if (this._rpcType == JAK.RPC.AUTO) { /* FIXME */
		if (JAK.Browser.client != "opera") {
			this._rpcType = JAK.RPC.FRPC;
		} else {
			this._rpcType = JAK.RPC.JSON;
		}
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
		endpoint: "/rpc/"
	}
	for (var p in options) { this._rpcOptions[p] = options[p]; }
	var requestOptions = {
		timeout: this._rpcOptions.timeout,
		async: this._rpcOptions.async,
		method: "post"
	};

	this.$super(requestType, requestOptions);
}

JAK.RPC.prototype.send = function(method, data, floatNames) {
	this.setHeaders({"Accept":JAK.RPC.ACCEPT[this._rpcType]});
	
	var url = this._rpcOptions.endpoint + method;
	var d = this._rpcSerialize(data, floatNames);
	return this.$super(url, d);
}

/**
 * Nastavení callbacku pro chybu zpracování odpovědi
 */
JAK.RPC.prototype.setErrorCallback = function(obj, method) {
	this._setCallback(obj, method, this._ERROR);
	return this;
}

JAK.RPC.prototype._done = function(data, status) {
	if (status != 200) { return this.$super(data, status); }
	
	try {
		var d = this._rpcParse(data, status);
	} catch (e) {
		this._state = this._ERROR;
		return this._userCallback(e, status, this);
	}
	
	return this.$super(d, status);
}

JAK.RPC.prototype._rpcEscape = function(str) {
	var re = new RegExp('"', "g"); // geany nema v oblibe literalovy reg. vyraz s uvozovkami
	return str.replace(/\\/g, "\\\\").replace(re, '\\"');
}

JAK.RPC.prototype._rpcSerialize = function(data, floatNames) {
	if (!data) { return ""; }

	var arr = [];
	for (var p in data) {
		var name = p;
		var value = data[p];
		var floatFlag = (floatNames && floatNames.indexOf(p) != -1);
		
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
			return JSON.parse(data);
		break;
		
		case JAK.RPC.FRPC:
			return JAK.FRPC.parse(data);
		break;
		
		case JAK.RPC.FRPC_B64:
			var bytes = this._atob(data);
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

JAK.RPC.prototype._atob = function(data) {
	var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = [];
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var input = data.split("");

	do {
		enc1 = alphabet.indexOf(input.shift());
		enc2 = alphabet.indexOf(input.shift());
		enc3 = alphabet.indexOf(input.shift());
		enc4 = alphabet.indexOf(input.shift());

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output.push(chr1);
		if (enc3 != 64) { output.push(chr2); }
		if (enc4 != 64) { output.push(chr3); }
	} while (input.length);

	return output;
}

JAK.RPC.prototype._rpcParseXML = function(xmlDoc) {
	if (!xmlDoc) { return null; }
	var de = xmlDoc.documentElement;
	if (de.nodeName != "methodResponse") { throw new Error("Only XMLRPC method responses supported"); }
	var type = JAK.XML.childElements(de)[0];
	
	var node = null;
	if (type.nodeName == "fault") {
		var node = JAK.XML.childElements(type, "value")[0];
	} else {
		var node = JAK.XML.childElements(type, "param")[0];
		node = JAK.XML.childElements(node, "value")[0];
	}
	
	return JAK.XML.RPC.parse(node);
}

/* ------------------------ */

JAK.FRPC = JAK.ClassMaker.makeStatic({
	NAME: "JAK.FRPC",
	VERSION: "1.0"
});

JAK.FRPC.TYPE_MAGIC		= 25;
JAK.FRPC.TYPE_CALL		= 13;
JAK.FRPC.TYPE_RESPONSE	= 14;
JAK.FRPC.TYPE_FAULT		= 15;

JAK.FRPC.TYPE_INT		= 1;
JAK.FRPC.TYPE_BOOL		= 2;
JAK.FRPC.TYPE_DOUBLE	= 3;
JAK.FRPC.TYPE_STRING	= 4;
JAK.FRPC.TYPE_DATETIME	= 5;
JAK.FRPC.TYPE_BINARY	= 6;
JAK.FRPC.TYPE_INT8P		= 7;
JAK.FRPC.TYPE_INT8N		= 8;
JAK.FRPC.TYPE_STRUCT	= 10;
JAK.FRPC.TYPE_ARRAY		= 11;
JAK.FRPC.TYPE_NULL		= 12;

JAK.FRPC.parse = function(data) {
	var magic = this._getBytes(data, 4);
	if (magic[0] != 0xCA || magic[1] != 0x11) { throw new Error("Missing FRPC magic"); }
	
	var byte = this._getInt(data, 1);
	var type = byte >> 3;
	if (type != JAK.FRPC.TYPE_RESPONSE) { throw new Error("Only FRPC responses are supported"); }
	
	var result = this._parseValue(data);
	if (data.length) { throw new Error("Garbage after FRPC data"); }
	return result;
}

JAK.FRPC._parseValue = function(data) {
	var byte = this._getInt(data, 1);
	var type = byte >> 3;
	switch (type) {
		case JAK.FRPC.TYPE_STRUCT:
			var result = {};
			var members = this._getInt(data, 1);
			while (members--) { this._parseMember(data, result); }
			return result;
		break;
		
		case JAK.FRPC.TYPE_ARRAY:
			var result = [];
			var members = this._getInt(data, 1);
			while (members--) { result.push(this._parseValue(data)); }
			return result;
		break;
		
		case JAK.FRPC.TYPE_BOOL:
			return (byte & 1 ? true : false);
		break;
		
		case JAK.FRPC.TYPE_STRING:
			var lengthBytes = (byte & 7) + 1;
			var length = this._getInt(data, lengthBytes);
			return this._decodeUTF8(data, length);
		break;
		
		case JAK.FRPC.TYPE_INT8P:
			var length = (byte & 7) + 1;
			return this._getInt(data, length);
		break;
		
		case JAK.FRPC.TYPE_INT8N:
			var length = (byte & 7) + 1;
			return -this._getInt(data, length);
		break;
		
		case JAK.FRPC.TYPE_INT:
			var length = byte & 7;
			var max = 1 << (8*length);

			var result = this._getInt(data, length);
			if (result >= max/2) { result -= max; }

			return result;
		break;

		case JAK.FRPC.TYPE_DOUBLE:
			return this._getDouble(data);
		break;

		case JAK.FRPC.TYPE_DATETIME:
			this._getBytes(data, 1); /* FIXME zone */
			var ts = this._getInt(data, 4);
			this._getBytes(data, 5); /* FIXME garbage */
			return ts;
		break;

		case JAK.FRPC.TYPE_BINARY:
			var lengthBytes = (byte & 7) + 1;
			var length = this._getInt(data, lengthBytes);
			return this._getBytes(data, length);
		break;
		
		case JAK.FRPC.TYPE_NULL:
			return null;
		break;

		default:
			throw new Error("Unkown FRPC type " + type);
		break;
	}
}

JAK.FRPC._parseMember = function(data, result) {
	var nameLength = this._getInt(data, 1);
	var name = this._decodeUTF8(data, nameLength);
	result[name] = this._parseValue(data);
}

JAK.FRPC._getInt = function(data, bytes) {
	var buffer = this._getBytes(data, bytes);
	var result = 0;
	var factor = 1;
	
	while (buffer.length) {
		result += factor * buffer.shift();
		factor *= 256;
	}
	
	return result;
}

JAK.FRPC._getBytes = function(data, count) {
	if (count > data.length) { throw new Error("Cannot read "+count+" bytes from buffer"); }
	return data.splice(0, count);
}

JAK.FRPC._decodeUTF8 = function(data, length) {
	var buffer = this._getBytes(data, length);

	var result = [];
	var i = 0;
	var c = c1 = c2 = 0;

	while (i<buffer.length) {
		c = buffer[i];
		if (c < 128) {
			result.push(String.fromCharCode(c));
			i++;
		} else if((c > 191) && (c < 224)) {
			c2 = buffer[i+1];
			result.push(String.fromCharCode(((c & 31) << 6) | (c2 & 63)));
			i += 2;
		} else {
			c2 = buffer[i+1];
			c3 = buffer[i+2];
			result.push(String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63)));
			i += 3;
		}
	}

	return result.join("");
}

JAK.FRPC._getDouble = function(data) {
	var bytes = this._getBytes(data, 8).reverse();
	var sign = (bytes[0] & 0x80 ? 1 : 0);
	
	var exponent = (bytes[0] & 127) << 4;
	exponent += bytes[1] >> 4;
	
	if (exponent == 0) { return Math.pow(-1, sign) * 0; }
	
	var mantissa = 0;
	var byteIndex = 1;
	var bitIndex = 3;
	var index = 1;
	
	do {
		var bitValue = (bytes[byteIndex] & (1 << bitIndex) ? 1 : 0);
		mantissa += bitValue * Math.pow(2, -index);
		
		index++;
		bitIndex--;
		if (bitIndex < 0) {
			bitIndex = 7;
			byteIndex++;
		}
	} while (byteIndex < bytes.length);
	
	if (exponent == 0x7ff) {
		if (mantissa) {
			return NaN;
		} else {
			Math.pow(-1, sign) * Infinity;
		}
	}
	
	exponent -= (1 << 10) - 1;
	return Math.pow(-1, sign) * Math.pow(2, exponent) * (1+mantissa);
}
