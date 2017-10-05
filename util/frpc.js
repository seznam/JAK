/**
 * @class FRPC parser a serializator
 * @group jak-utils
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

	var magic1 = this._getByte();
	var magic2 = this._getByte();

	if (magic1 != 0xCA || magic2 != 0x11) {
		this._data = [];
		throw new Error("Missing FRPC magic");
	}

	/* zahodit zbytek hlavicky */
	this._getByte();
	this._getByte();

	var first = this._getInt(1);
	var type = first >> 3;
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
	this._path = [];
	this._hints = hints;

	this._serializeValue(result, data)

	this._hints = null;
	return result;
}

JAK.FRPC._parseValue = function() {
	/* pouzite optimalizace:
	 * - zkracena cesta ke konstantam v ramci redukce tecek
	 * - posun nejpouzivanejsich typu nahoru
	 */
	var first = this._getInt(1);
	var type = first >> 3;
	switch (type) {
		case this.TYPE_STRING:
			var lengthBytes = (first & 7) + 1;
			var length = this._getInt(lengthBytes);
			return this._decodeUTF8(length);
		break;

		case this.TYPE_STRUCT:
			var result = {};
			var lengthBytes = (first & 7) + 1;
			var members = this._getInt(lengthBytes);
			while (members--) { this._parseMember(result); }
			return result;
		break;

		case this.TYPE_ARRAY:
			var result = [];
			var lengthBytes = (first & 7) + 1;
			var members = this._getInt(lengthBytes);
			while (members--) { result.push(this._parseValue()); }
			return result;
		break;

		case this.TYPE_BOOL:
			return (first & 1 ? true : false);
		break;

		case this.TYPE_INT:
			var length = first & 7;
			var max = Math.pow(2, 8*length);
			var result = this._getInt(length);
			if (result >= max/2) { result -= max; }
			return result;
		break;

		case this.TYPE_DATETIME:
			this._getByte();
			var ts = this._getInt(4);
			for (var i=0;i<5;i++) { this._getByte(); }
			return new Date(1000*ts);
		break;

		case this.TYPE_DOUBLE:
			return this._getDouble();
		break;

		case this.TYPE_BINARY:
			var lengthBytes = (first & 7) + 1;
			var length = this._getInt(lengthBytes);
			var result = [];
			while (length--) { result.push(this._getByte()); }
			return result;
		break;

		case this.TYPE_INT8P:
			var length = (first & 7) + 1;
			return this._getInt(length);
		break;

		case this.TYPE_INT8N:
			var length = (first & 7) + 1;
			return -this._getInt(length);
		break;

		case this.TYPE_NULL:
			return null;
		break;

		default:
			throw new Error("Unkown FRPC type " + type);
		break;
	}
}

JAK.FRPC._append = function(arr1, arr2) {
	var len = arr2.length;
	for (var i=0;i<len;i++) { arr1.push(arr2[i]); }
}

JAK.FRPC._parseMember = function(result) {
	var nameLength = this._getInt(1);
	var name = this._decodeUTF8(nameLength);
	result[name] = this._parseValue();
}

/**
 * In little endian
 */
JAK.FRPC._getInt = function(bytes) {
	var result = 0;
	var factor = 1;

	for (var i=0;i<bytes;i++) {
		result += factor * this._getByte();
		factor *= 256;
	}

	return result;
}

JAK.FRPC._getByte = function() {
	if ((this._pointer + 1) > this._data.length) { throw new Error("Cannot read byte from buffer"); }
	return this._data[this._pointer++];
}

JAK.FRPC._decodeUTF8 = function(length) {
	/* pouzite optimalizace:
	 * - pracujeme nad stringem namisto pole; FF i IE to kupodivu (!) maji rychlejsi
	 * - while namisto for
	 * - cachovani fromCharcode, this._data i this._pointer
	 * - vyhozeni this._getByte
	 */
	var remain = length;
	var result = "";
	if (!length) { return result; }

	var c = 0, c1 = 0, c2 = 0;
	var SfCC = String.fromCharCode;
	var data = this._data;
	var pointer = this._pointer;

	while (1) {
		remain--;
		c = data[pointer];
		pointer += 1;  /* FIXME safari bug */
		if (c < 128) {
			result += SfCC(c);
		} else if ((c > 191) && (c < 224)) {
			c1 = data[pointer];
			pointer += 1; /* FIXME safari bug */
			result += SfCC(((c & 31) << 6) | (c1 & 63));
			remain -= 1;
		} else if (c < 240) {
			c1 = data[pointer++];
			c2 = data[pointer++];
			result += SfCC(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63));
			remain -= 2;
		} else if (c < 248) { /* 4 byte stuff */
			c1 = data[pointer++] & 63;
			c2 = data[pointer++] & 63;
			c3 = data[pointer++] & 63;
			var cp = ((c & 0x07) << 0x12) | (c1 << 0x0C) | (c2 << 0x06) | c3;

			if (cp > 0xFFFF) { /* surrogates */
				cp -= 0x10000;
				result += SfCC((cp >>> 10) & 0x3FF | 0xD800);
				cp = cp & 0x3FF | 0xDC00;
			}
			result += SfCC(cp);
			remain -= 3;
		} else if (c < 252) { /* 5 byte stuff, throw away */
			pointer += 4;
			remain -= 4;
		} else { /* 6 byte stuff, throw away */
			pointer += 5;
			remain -= 5;
		}

		/* pokud bylo na vstupu nevalidni UTF-8, mohli jsme podlezt... */
		if (remain <= 0) { break; }
	}

	/* normalne je v tuto chvili remain = 0; pokud byla ale na vstupu chyba, mohlo klesnout pod nulu. vratime pointer na spravny konec stringu */
	this._pointer = pointer + remain;

	return result;
}

JAK.FRPC._encodeUTF8 = function(str) {
	var result = [];
	for (var i=0;i<str.length;i++) {
		var c = str.charCodeAt(i);
		if (c >= 55296 && c <= 56319) { /* surrogates */
			var c2 = str.charCodeAt(++i);
			c = ((c & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
		}

		if (c < 128) {
			result.push(c);
		} else if (c < 2048) {
			result.push((c >> 6) | 192);
			result.push((c & 63) | 128);
		} else if (c < 65536) {
			result.push((c >> 12) | 224);
			result.push(((c >> 6) & 63) | 128);
			result.push((c & 63) | 128);
		} else {
			result.push((c >> 18) | 240);
			result.push(((c >> 12) & 63) | 128);
			result.push(((c >> 6) & 63) | 128);
			result.push((c & 63) | 128);
		}
	}
	return result;
}

JAK.FRPC._getDouble = function() {
	var bytes = [];
	var index = 8;
	while (index--) { bytes[index] = this._getByte(); }

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
			return Math.pow(-1, sign) * Infinity;
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
			this._append(result, intData);
			this._append(result, strData);
		break;

		case "number":
			if (this._getHint() == "float") { /* float */
				var first = JAK.FRPC.TYPE_DOUBLE << 3;
				var floatData = this._encodeDouble(value);

				result.push(first);
				this._append(result, floatData);
			} else { /* int */
				var first = (value >= 0 ? JAK.FRPC.TYPE_INT8P : JAK.FRPC.TYPE_INT8N);
				first = first << 3;

				var data = this._encodeInt(Math.abs(value));
				first += (data.length-1);

				result.push(first);
				this._append(result, data);
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
		this._append(result, intData);
		this._append(result, data);
		return;
	}

	var first = JAK.FRPC.TYPE_ARRAY << 3;
	var intData = this._encodeInt(data.length);
	first += (intData.length-1);

	result.push(first);
	this._append(result, intData);

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
	this._append(result, intData);

	for (var p in data) {
		var strData = this._encodeUTF8(p);
		result.push(strData.length);
		this._append(result, strData);
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
	this._append(result, tsData);

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
		exponent = (1 << expBits) - 1;
		fraction = 1;
		sign = 0;
	} else if (num === Infinity || num === -Infinity) {
		exponent = (1 << expBits) - 1;
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
