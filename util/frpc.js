/**
 * @class FRPC parser a serializator
 */
JAK.FRPC = JAK.ClassMaker.makeStatic({
	NAME: "JAK.FRPC",
	VERSION: "1.2"
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

JAK.FRPC._hints = null;
JAK.FRPC._path = [];
JAK.FRPC._data = [];
JAK.FRPC._pointer = 0;

/**
 * @param {number[]} data
 * @returns {object}
 */
JAK.FRPC.parse = function(data) {
	this._pointer = 0;
	this._data = data;
	
	var magic = this._getBytes(4);
	if (magic[0] != 0xCA || magic[1] != 0x11) { 
		this._data = [];
		throw new Error("Missing FRPC magic"); 
	}
	
	var byte = this._getInt(1);
	var type = byte >> 3;
	if (type == JAK.FRPC.TYPE_FAULT) {
		var num = this._parseValue();
		var msg = this._parseValue();
		this._data = [];
		throw new Error("FRPC/"+num+": "+msg);
	}
	
	var result = null;
	
	switch (type) {
		case JAK.FRPC.TYPE_RESPONSE:
			result = this._parseValue();
			if (this._pointer < this._data.length) { 
				this._data = [];
				throw new Error("Garbage after FRPC data"); 
			}
		break;
		
		case JAK.FRPC.TYPE_CALL:
			var nameLength = this._getInt(1);
			var name = this._decodeUTF8(nameLength);
			var params = [];
			while (this._pointer < this._data.length) { params.push(this._parseValue()); }
			this._data = [];
			return {method:name, params:params};
		break;
		
		default:
			this._data = [];
			throw new Error("Unsupported FRPC type "+type);
		break;
	}
	
	this._data = [];
	return result;
}

/**
 * @param {string} method
 * @param {array} data
 * @param {object || string} hints Napoveda datovych typu:
 * pokud string, pak typ (skalarni) hodnoty "data". Pokud objekt, 
 * pak mnozina dvojic "cesta":"datovy typ"; cesta je teckami dodelena posloupnost 
 * klicu a/nebo indexu v datech. Typ je "float" nebo "binary".
 */
JAK.FRPC.serializeCall = function(method, data, hints) {
	var result = this.serialize(data, hints);
	
	/* utrhnout hlavicku pole (dva bajty) */
	result.shift(); result.shift();
	
	var encodedMethod = this._encodeUTF8(method);
	result.unshift.apply(result, encodedMethod);
	result.unshift(encodedMethod.length);

	result.unshift(JAK.FRPC.TYPE_CALL << 3);
	result.unshift(0xCA, 0x11, 0x02, 0x01);

	return result;
}

/**
 * @param {string} method
 * @param {?} data
 * @param {object} hints hinty, ktera cisla maji byt floaty a kde jsou binarni data (klic = cesta, hodnota = "float"/"binary")
 * @returns {number[]}
 */
JAK.FRPC.serialize = function(data, hints) {
	var result = [];
	this._hints = hints;

	this._serializeValue(result, data)

	this._hints = null;
	return result;
}

JAK.FRPC._parseValue = function() {
	var byte = this._getInt(1);
	var type = byte >> 3;
	switch (type) {
		case JAK.FRPC.TYPE_STRUCT:
			var result = {};
			var lengthBytes = (byte & 7) + 1;
			var members = this._getInt(lengthBytes);
			while (members--) { this._parseMember(result); }
			return result;
		break;
		
		case JAK.FRPC.TYPE_ARRAY:
			var result = [];
			var lengthBytes = (byte & 7) + 1;
			var members = this._getInt(lengthBytes);
			while (members--) { result.push(this._parseValue()); }
			return result;
		break;
		
		case JAK.FRPC.TYPE_BOOL:
			return (byte & 1 ? true : false);
		break;
		
		case JAK.FRPC.TYPE_STRING:
			var lengthBytes = (byte & 7) + 1;
			var length = this._getInt(lengthBytes);
			return this._decodeUTF8(length);
		break;
		
		case JAK.FRPC.TYPE_INT8P:
			var length = (byte & 7) + 1;
			return this._getInt(length);
		break;
		
		case JAK.FRPC.TYPE_INT8N:
			var length = (byte & 7) + 1;
			return -this._getInt(length);
		break;
		
		case JAK.FRPC.TYPE_INT:
			var length = byte & 7;
			var max = Math.pow(2, 8*length);
			var result = this._getInt(length);
			if (result >= max/2) { result -= max; }
			return result;
		break;

		case JAK.FRPC.TYPE_DOUBLE:
			return this._getDouble();
		break;

		case JAK.FRPC.TYPE_DATETIME:
			this._getBytes(1);
			var ts = this._getInt(4);
			this._getBytes(5);
			return new Date(1000*ts);
		break;

		case JAK.FRPC.TYPE_BINARY:
			var lengthBytes = (byte & 7) + 1;
			var length = this._getInt(lengthBytes);
			return this._getBytes(length);
		break;
		
		case JAK.FRPC.TYPE_NULL:
			return null;
		break;

		default:
			throw new Error("Unkown FRPC type " + type);
		break;
	}
}

JAK.FRPC._parseMember = function(result) {
	var nameLength = this._getInt(1);
	var name = this._decodeUTF8(nameLength);
	result[name] = this._parseValue();
}

JAK.FRPC._getInt = function(bytes) {
	var buffer = this._getBytes(bytes);
	var result = 0;
	var factor = 1;
	
	while (buffer.length) {
		result += factor * buffer.shift();
		factor *= 256;
	}
	
	return result;
}

JAK.FRPC._getBytes = function(count) {
	if ((this._pointer + count) > this._data.length) { throw new Error("Cannot read "+count+" bytes from buffer"); }
	var result = this._data.slice(this._pointer, this._pointer + count);
	this._pointer += count;
	return result;
}

JAK.FRPC._decodeUTF8 = function(length) {
	var buffer = this._getBytes(length);

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

JAK.FRPC._encodeUTF8 = function(str) {
	var result = [];
	for (var i=0;i<str.length;i++) {
		var c = str.charCodeAt(i);
		if (c < 128) {
			result.push(c);
		} else if ((c > 127) && (c < 2048)) {
			result.push((c >> 6) | 192);
			result.push((c & 63) | 128);
		} else {
			result.push((c >> 12) | 224);
			result.push(((c >> 6) & 63) | 128);
			result.push((c & 63) | 128);
		}
	}
	return result;
}

JAK.FRPC._getDouble = function() {
	var bytes = this._getBytes(8).reverse();
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

JAK.FRPC._serializeValue = function(result, value) {
	if (value === null) {
		result.push(JAK.FRPC.TYPE_NULL << 3);
		return;
	} 
	
	switch (typeof(value)) {
		case "string":
			var strData = this._encodeUTF8(value);
			var intData = this._encodeInt(strData.length);

			var first = JAK.FRPC.TYPE_STRING << 3;
			first += (intData.length-1);
			
			result.push(first);
			result.push.apply(result, intData);
			result.push.apply(result, strData);
		break;
		
		case "number":
			if (this._getHint() == "float") { /* float */
				var first = JAK.FRPC.TYPE_DOUBLE << 3;
				var floatData = this._encodeDouble(value);

				result.push(first);
				result.push.apply(result, floatData);
			} else { /* int */
				var first = (value > 0 ? JAK.FRPC.TYPE_INT8P : JAK.FRPC.TYPE_INT8N);
				first = first << 3;

				var data = this._encodeInt(Math.abs(value));
				first += (data.length-1);

				result.push(first);
				result.push.apply(result, data);
				/*
				if (value < 0) { value = ~value; }
				var intData = this._encodeInt(value);
				var first = JAK.FRPC.TYPE_INT << 3;
				first += intData.length;
				
				result.push(first);
				result.push.apply(result, intData);
				*/
			}
		break;
		
		case "boolean":
			var data = JAK.FRPC.TYPE_BOOL << 3;
			if (value) { data += 1; }
			result.push(data);
		break;
		
		case "object":
			if (value instanceof Date) {
				this._serializeDate(result, value);
			} else if (value instanceof Array) {
				this._serializeArray(result, value);
			} else {
				this._serializeStruct(result, value);
			}
		break;
		
		default: /* undefined, function, ... */
			throw new Error("FRPC does not allow value "+value);
		break;
	}
}

JAK.FRPC._serializeArray = function(result, data) {
	if (this._getHint() == "binary") { /* binarni data */
		var first = JAK.FRPC.TYPE_BINARY << 3;
		var intData = this._encodeInt(data.length);
		first += (intData.length-1);
		
		result.push(first);
		result.push.apply(result, intData);
		result.push.apply(result, data);
		return;
	}
	
	var first = JAK.FRPC.TYPE_ARRAY << 3;
	var intData = this._encodeInt(data.length);
	first += (intData.length-1);
	
	result.push(first);
	result.push.apply(result, intData);
	
	for (var i=0;i<data.length;i++) { 
		this._path.push(i);
		this._serializeValue(result, data[i]);
		this._path.pop();
	}
}

JAK.FRPC._serializeStruct = function(result, data) {
	var numMembers = 0;
	for (var p in data) { numMembers++; }

	var first = JAK.FRPC.TYPE_STRUCT << 3;
	var intData = this._encodeInt(numMembers);
	first += (intData.length-1);
	
	result.push(first);
	result.push.apply(result, intData);
	
	for (var p in data) {
		var strData = this._encodeUTF8(p);
		result.push(strData.length);
		result.push.apply(result, strData);
		this._path.push(p);
		this._serializeValue(result, data[p]);
		this._path.pop();
	}
}

JAK.FRPC._serializeDate = function(result, date) {
	result.push(JAK.FRPC.TYPE_DATETIME << 3);
	
	/* 1 bajt, zona */
	var zone = date.getTimezoneOffset()/15; /* pocet ctvrthodin */
	if (zone < 0) { zone += 256; } /* dvojkovy doplnek */
	result.push(zone);
	
	/* 4 bajty, timestamp */
	var ts = Math.round(date.getTime() / 1000);
	if (ts < 0 || ts >= Math.pow(2, 31)) { ts = -1; }
	if (ts < 0) { ts += Math.pow(2, 32); } /* dvojkovy doplnek */
	var tsData = this._encodeInt(ts);
	while (tsData.length < 4) { tsData.push(0); } /* do 4 bajtu */
	result.push.apply(result, tsData);
	
	/* 5 bajtu, zbyle haluze */
	var year = date.getFullYear()-1600;
	year = Math.max(year, 0);
	year = Math.min(year, 2047);
	var month = date.getMonth()+1;
	var day = date.getDate();
	var dow = date.getDay();
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var seconds = date.getSeconds();

	result.push( (seconds & 0x1f) << 3 | (dow & 0x07) );
	result.push( ((minutes & 0x3f) << 1) | ((seconds & 0x20) >> 5) | ((hours & 0x01) << 7) );
	result.push( ((hours & 0x1e) >> 1) | ((day & 0x0f) << 4) );
	result.push( ((day & 0x1f) >> 4) | ((month & 0x0f) << 1) | ((year & 0x07) << 5) );
	result.push( (year & 0x07f8) >> 3 );
}

/**
 * Zakoduje KLADNE cele cislo, little endian
 */
JAK.FRPC._encodeInt = function(data) {
	if (!data) { return [0]; }

	var result = [];
	var remain = data;
	
	while (remain) {
		var value = remain % 256;
		remain = (remain-value)/256;
		result.push(value);
	}

	return result;
}

/**
 * Zakoduje IEEE-754 double
 */
JAK.FRPC._encodeDouble = function(num) {
	var result = [];

	var expBits = 11;
	var fracBits = 52;
    var bias = (1 << (expBits - 1)) - 1;
    
    var sign, exponent, fraction;
	if (isNaN(num)) {
		exponent = (1 << bias) - 1;
		fraction = 1;
		sign = 0;
	} else if (num === Infinity || num === -Infinity) {
		exponent = (1 << bias) - 1;
		fraction = 0;
		sign = (num < 0 ? 1 : 0);
	} else if (num === 0) {
		exponent = 0;
		fraction = 0;
		sign = (1/num === -Infinity ? 1 : 0);
	} else { /* normal number */
		sign = num < 0;
		var abs = Math.abs(num);

		if (abs >= Math.pow(2, 1 - bias)) {
			var ln = Math.min(Math.floor(Math.log(abs) / Math.LN2), bias);
			exponent = ln + bias;
			fraction = abs * Math.pow(2, fracBits - ln) - Math.pow(2, fracBits);
		} else {
			exponent = 0;
			fraction = abs / Math.pow(2, 1 - bias - fracBits);
		}
	}
	 
	var bits = [];
	for (var i = fracBits; i>0; i--) { 
		bits.push(fraction % 2 ? 1 : 0);
		fraction = Math.floor(fraction/2);
	}
	
	for (var i = expBits; i>0; i--) { 
		bits.push(exponent % 2 ? 1 : 0);
		exponent = Math.floor(exponent/2);
	}
	bits.push(sign ? 1 : 0);
	
	var num = 0;
	var index = 0;
	while (bits.length) {
		num += (1 << index) * bits.shift();
		index++;
		if (index == 8) { 
			result.push(num);
			num = 0;
			index = 0;
		}
	}
	return result;
}

/**
 * Vrati aktualni hint, na zaklade "_path" a "_hints"
 * @returns {string || null}
 */
JAK.FRPC._getHint = function() {
	if (!this._hints) { return null; }
	if (typeof(this._hints) != "object") { return this._hints; } /* skalarni varianta */
	return this._hints[this._path.join(".")] || null;
}
