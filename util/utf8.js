/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @namespace Kódování z/do UTF8
 * @group jak-utils
 */
JAK.UTF8 = JAK.ClassMaker.makeStatic({
	NAME: "JAK.UTF8",
	VERSION: "1.0"
});

/**
 * Převede řetězec na pole čísel algoritmem UTF-8
 * @param {string} input
 * @returns {int[]}
 */
JAK.UTF8.encode = function(input) {
	var output = [];
	for (var i=0;i<input.length;i++) {
		var c = input.charCodeAt(i);
		if (c < 128) {
			output.push(c);
		} else if ((c > 127) && (c < 2048)) {
			output.push((c >> 6) | 192);
			output.push((c & 63) | 128);
		} else {
			output.push((c >> 12) | 224);
			output.push(((c >> 6) & 63) | 128);
			output.push((c & 63) | 128);
		}
	}
	return output;
}

/**
 * Převede pole čísel na řetězec algoritmem UTF-8
 * @param {int[]} bytes
 * @returns {string}
 */
JAK.UTF8.decode = function(input) {
	var output = [];
	
	var i = 0;
	var c = c1 = c2 = 0;
	
	while (i < input.length) {
		c = input[i];
		if (c < 128) {
			output.push(String.fromCharCode(c));
			i += 1;
		} else if ((c > 191) && (c < 224)) {
			c1 = input[i+1];
			output.push(String.fromCharCode(((c & 31) << 6) | (c1 & 63)));
			i += 2;
		} else {
			c1 = input[i+1];
			c2 = input[i+2];
			output.push(String.fromCharCode(((c & 15) << 12) | ((c1 & 63) << 6) | (c2 & 63)));
			i += 3;
		}
	}

	return output.join("");
}
