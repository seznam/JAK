/**
 * @class Encodovani a decodovani Base64 stringu 
 * @group jak-utils
 */
JAK.Base64 = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Base64",
	VERSION: "1.0"
});

JAK.Base64.ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
JAK.Base64.INDEXED_ALPHABET = JAK.Base64.ALPHABET.split('');
JAK.Base64.ASSOCIATED_ALPHABET = {};
for(var i=0; i<JAK.Base64.ALPHABET.length; i++) {
	JAK.Base64.ASSOCIATED_ALPHABET[JAK.Base64.ALPHABET.charAt(i)] = i;
};

/**
 * Base64 decode
 */
JAK.Base64.atob = function(data) {
	/* pouzite optimalizace:
	 * - while namisto for
	 * - cachovani Alphabet v ramci redukce tecek
	 */
	var output = [];
	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var input = data.replace(/\s/g,"").split("");
	
	var len = input.length;
	var i=0;
	var A = JAK.Base64.ASSOCIATED_ALPHABET;

	while (i < len) {
		enc1 = A[input[i]];
		enc2 = A[input[i+1]];
		enc3 = A[input[i+2]];
		enc4 = A[input[i+3]];

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output.push(chr1);
		if (enc3 != 64) { output.push(chr2); }
		if (enc4 != 64) { output.push(chr3); }
		
		i += 4;
	}

	return output;
	
};

/**
 * Base64 encode
 */
JAK.Base64.btoa = function(data) {
	var output = [];

	var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i=0;
	var len = data.length;
	do {
		chr1 = (i < data.length ? data[i++] : NaN);
		chr2 = (i < data.length ? data[i++] : NaN);
		chr3 = (i < data.length ? data[i++] : NaN);

		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;

		if (isNaN(chr2)) { 
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}

		output.push(JAK.Base64.INDEXED_ALPHABET[enc1]);
		output.push(JAK.Base64.INDEXED_ALPHABET[enc2]);
		output.push(JAK.Base64.INDEXED_ALPHABET[enc3]);
		output.push(JAK.Base64.INDEXED_ALPHABET[enc4]);

	} while (i < len);

	return output.join("");
};

