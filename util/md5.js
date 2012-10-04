/**
 * MD5 along with their supplemental sub-routines are
 * Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet, Ondrej Zara
 * Distributed under the BSD License
 */

/**
 * @namespace
 * @group jak-utils
 */
JAK.MD5 = JAK.ClassMaker.makeStatic({
	NAME : "JAK.MD5",
	VERSION : "1.0"
});

JAK.MD5._hexcase = 0;  /* hex output format. 0 - lowercase; 1 - uppercase        */
JAK.MD5._b64pad = ""; /* base-64 pad character. "=" for strict RFC compliance   */
JAK.MD5._chrsz = 8;  /* bits per input character. 8 - ASCII; 16 - Unicode      */

JAK.MD5.get = function(str){
	var input = this._utf8decode(str);
	return this._binl2hex(this._core_md5(this._str2binl(input), input.length * this._chrsz));
};

/*
* Calculate the MD5 of an array of little-endian words, and a bit length
*/
JAK.MD5._core_md5 = function(x, len){
	/* append padding */
	x[len >> 5] |= 0x80 << ((len) % 32);
	x[(((len + 64) >>> 9) << 4) + 14] = len;

	var a =  1732584193;
	var b = -271733879;
	var c = -1732584194;
	var d =  271733878;

	for(var i = 0; i < x.length; i += 16) {
		var olda = a;
		var oldb = b;
		var oldc = c;
		var oldd = d;

		a = this._ff(a, b, c, d, x[i+ 0], 7 , -680876936);
		d = this._ff(d, a, b, c, x[i+ 1], 12, -389564586);
		c = this._ff(c, d, a, b, x[i+ 2], 17,  606105819);
		b = this._ff(b, c, d, a, x[i+ 3], 22, -1044525330);
		a = this._ff(a, b, c, d, x[i+ 4], 7 , -176418897);
		d = this._ff(d, a, b, c, x[i+ 5], 12,  1200080426);
		c = this._ff(c, d, a, b, x[i+ 6], 17, -1473231341);
		b = this._ff(b, c, d, a, x[i+ 7], 22, -45705983);
		a = this._ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
		d = this._ff(d, a, b, c, x[i+ 9], 12, -1958414417);
		c = this._ff(c, d, a, b, x[i+10], 17, -42063);
		b = this._ff(b, c, d, a, x[i+11], 22, -1990404162);
		a = this._ff(a, b, c, d, x[i+12], 7 ,  1804603682);
		d = this._ff(d, a, b, c, x[i+13], 12, -40341101);
		c = this._ff(c, d, a, b, x[i+14], 17, -1502002290);
		b = this._ff(b, c, d, a, x[i+15], 22,  1236535329);

		a = this._gg(a, b, c, d, x[i+ 1], 5 , -165796510);
		d = this._gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
		c = this._gg(c, d, a, b, x[i+11], 14,  643717713);
		b = this._gg(b, c, d, a, x[i+ 0], 20, -373897302);
		a = this._gg(a, b, c, d, x[i+ 5], 5 , -701558691);
		d = this._gg(d, a, b, c, x[i+10], 9 ,  38016083);
		c = this._gg(c, d, a, b, x[i+15], 14, -660478335);
		b = this._gg(b, c, d, a, x[i+ 4], 20, -405537848);
		a = this._gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
		d = this._gg(d, a, b, c, x[i+14], 9 , -1019803690);
		c = this._gg(c, d, a, b, x[i+ 3], 14, -187363961);
		b = this._gg(b, c, d, a, x[i+ 8], 20,  1163531501);
		a = this._gg(a, b, c, d, x[i+13], 5 , -1444681467);
		d = this._gg(d, a, b, c, x[i+ 2], 9 , -51403784);
		c = this._gg(c, d, a, b, x[i+ 7], 14,  1735328473);
		b = this._gg(b, c, d, a, x[i+12], 20, -1926607734);

		a = this._hh(a, b, c, d, x[i+ 5], 4 , -378558);
		d = this._hh(d, a, b, c, x[i+ 8], 11, -2022574463);
		c = this._hh(c, d, a, b, x[i+11], 16,  1839030562);
		b = this._hh(b, c, d, a, x[i+14], 23, -35309556);
		a = this._hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
		d = this._hh(d, a, b, c, x[i+ 4], 11,  1272893353);
		c = this._hh(c, d, a, b, x[i+ 7], 16, -155497632);
		b = this._hh(b, c, d, a, x[i+10], 23, -1094730640);
		a = this._hh(a, b, c, d, x[i+13], 4 ,  681279174);
		d = this._hh(d, a, b, c, x[i+ 0], 11, -358537222);
		c = this._hh(c, d, a, b, x[i+ 3], 16, -722521979);
		b = this._hh(b, c, d, a, x[i+ 6], 23,  76029189);
		a = this._hh(a, b, c, d, x[i+ 9], 4 , -640364487);
		d = this._hh(d, a, b, c, x[i+12], 11, -421815835);
		c = this._hh(c, d, a, b, x[i+15], 16,  530742520);
		b = this._hh(b, c, d, a, x[i+ 2], 23, -995338651);

		a = this._ii(a, b, c, d, x[i+ 0], 6 , -198630844);
		d = this._ii(d, a, b, c, x[i+ 7], 10,  1126891415);
		c = this._ii(c, d, a, b, x[i+14], 15, -1416354905);
		b = this._ii(b, c, d, a, x[i+ 5], 21, -57434055);
		a = this._ii(a, b, c, d, x[i+12], 6 ,  1700485571);
		d = this._ii(d, a, b, c, x[i+ 3], 10, -1894986606);
		c = this._ii(c, d, a, b, x[i+10], 15, -1051523);
		b = this._ii(b, c, d, a, x[i+ 1], 21, -2054922799);
		a = this._ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
		d = this._ii(d, a, b, c, x[i+15], 10, -30611744);
		c = this._ii(c, d, a, b, x[i+ 6], 15, -1560198380);
		b = this._ii(b, c, d, a, x[i+13], 21,  1309151649);
		a = this._ii(a, b, c, d, x[i+ 4], 6 , -145523070);
		d = this._ii(d, a, b, c, x[i+11], 10, -1120210379);
		c = this._ii(c, d, a, b, x[i+ 2], 15,  718787259);
		b = this._ii(b, c, d, a, x[i+ 9], 21, -343485551);

		a = this._safe_add(a, olda);
		b = this._safe_add(b, oldb);
		c = this._safe_add(c, oldc);
		d = this._safe_add(d, oldd);
	}
	return [a, b, c, d];
};

/*
* These functions implement the four basic operations the algorithm uses.
*/
JAK.MD5._cmn = function(q, a, b, x, s, t){
	return this._safe_add(this._bit_rol(this._safe_add(this._safe_add(a, q), this._safe_add(x, t)), s),b);
};

JAK.MD5._ff = function(a, b, c, d, x, s, t){
	return this._cmn((b & c) | ((~b) & d), a, b, x, s, t);
};

JAK.MD5._gg = function(a, b, c, d, x, s, t){
	return this._cmn((b & d) | (c & (~d)), a, b, x, s, t);
};

JAK.MD5._hh = function(a, b, c, d, x, s, t){
	return this._cmn(b ^ c ^ d, a, b, x, s, t);
};

JAK.MD5._ii = function(a, b, c, d, x, s, t){
	return this._cmn(c ^ (b | (~d)), a, b, x, s, t);
};

/*
* Add integers, wrapping at 2^32. This uses 16-bit operations internally
* to work around bugs in some JS interpreters.
*/
JAK.MD5._safe_add = function(x, y){
	var lsw = (x & 0xFFFF) + (y & 0xFFFF);
	var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
	return (msw << 16) | (lsw & 0xFFFF);
}

/*
* Bitwise rotate a 32-bit number to the left.
*/
JAK.MD5._bit_rol = function(num, cnt){
	return (num << cnt) | (num >>> (32 - cnt));
};

/*
* Convert a string to an array of little-endian words
* If chrsz is ASCII, characters >255 have their hi-byte silently ignored.
*/
JAK.MD5._str2binl = function(str){
		var bin = [];
		var mask = (1 << this._chrsz) - 1;
		for(var i = 0; i < str.length * this._chrsz; i += this._chrsz){
			bin[i>>5] |= (str.charCodeAt(i / this._chrsz) & mask) << (i%32);
		}
		return bin;
};

/*
* Convert an array of little-endian words to a hex string.
*/
JAK.MD5._binl2hex = function(binarray){
	var hex_tab = this._hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
	var str = "";
	for(var i = 0; i < binarray.length * 4; i++) {
		str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) +
		hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
	}
	return str;
};

JAK.MD5._utf8decode = function(str) {
	var result = "";
	
	for (var i=0;i<str.length;i++) {
	
	    var c = str.charCodeAt(i);
	    if (c < 128) {
	        result += String.fromCharCode(c);
	    } else if((c > 127) && (c < 2048)) {
	        result += String.fromCharCode((c >> 6) | 192);
	        result += String.fromCharCode((c & 63) | 128);
	    }
	    else {
	        result += String.fromCharCode((c >> 12) | 224);
	        result += String.fromCharCode(((c >> 6) & 63) | 128);
	        result += String.fromCharCode((c & 63) | 128);
	    }
	}
	return result;
};
