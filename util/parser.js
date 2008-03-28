/**
 * @overview Parsery a validatory vseho mozneho
 * @version 1.0
 * @author zara et al
 */ 
 
/**
 * @class Staticka kupa parseru
 * @static
 */     
SZN.Parser = SZN.ClassMaker.makeClass({
	NAME:"Parser",
	VERSION:"1.0",
	CLASS:"static"
});

/**
 * @method 
 * @param {string} str retezec, jenz mame naparsovat
 * @returns {date || false} datum, pokud lze. V opacnem pripade false
 */
SZN.Parser.date = function(str) {
	var separators = "[\-/\\\\:.]";
	var chars = "[0-9]";
	var patterns = [
		"^ *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2})",
		"^ *("+chars+"{4}) *"+separators+" *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2})",
		"^ *("+chars+"{1,2}) *"+separators+" *("+chars+"{1,2}) *"+separators+" *("+chars+"{4})"
	];
	var datePattern = "( +"+chars+"{1,2})?("+separators+chars+"{1,2})?("+separators+chars+"{1,2})? *$";

	var index = 0;
	while (!result && index < patterns.length) {
		var re = new RegExp(patterns[index] + datePattern);
		var result = re.exec(date);
		index++;
	}
	if (!result) { return false; }
	
	var parsedDate = new Date(0);
	var a = Math.round(parseFloat(result[1]));
	var b = Math.round(parseFloat(result[2]));
	var c = Math.round(parseFloat(result[3]));
	var yearIndex = -1;
	if (result[1].length == 4) {
		yearIndex = 0;
	} else if (result[3].length == 4) {
		yearIndex = 2;
	} else {
		if (a > 31) {
			a = a + (a > parsedDate.getFullYear()-2000 ? 1900 : 2000);
			yearIndex = 0;
		} else {
			c = c + (c > parsedDate.getFullYear()-2000 ? 1900 : 2000);
			yearIndex = 2;
		}
	}

	if (yearIndex == 0) { /* year at the beginning */
		parsedDate.setFullYear(a);
		parsedDate.setDate(1);
		var max = Math.max(b,c);
		var min = Math.min(b,c);
		if (max > 13) {
			parsedDate.setMonth(min-1);
			parsedDate.setDate(max);
		} else {
			parsedDate.setMonth(b-1);
			parsedDate.setDate(c);
		}
	} else if (yearIndex == 2) { /* year at the end */
		parsedDate.setFullYear(c);
		var max = Math.max(a,b);
		var min = Math.min(a,b);
		if (max > 13) {
			parsedDate.setMonth(min-1);
			parsedDate.setDate(max);
		} else {
			parsedDate.setMonth(b-1);
			parsedDate.setDate(a);
		}
	} /* year at the end */
	
	/* time */
	if (result[4]) {
		var h = parseInt(result[4].match(/[0-9]+/)[0],10);
		var m = (result[5] ? parseInt(result[5].match(/[0-9]+/)[0],10) : 0);
		var s = (result[6] ? parseInt(result[6].match(/[0-9]+/)[0],10) : 0);
		parsedDate.setHours(h);
		parsedDate.setMinutes(m);
		parsedDate.setSeconds(s);
	}

	return parsedDate;
};

/**
 * @method 
 * @param {string} str retezec, jenz mame naparsovat
 * @returns {array || false} trojprvkove pole [r, g, b] (kazde 0-1), pokud lze. V opacnem pripade false
 */
SZN.Parser.color = function(str) {
	if (str.indexOf("#") != -1) { /* hex */
		var regs = str.match(/ *#([0-9]+)/);
		if (!regs) { return false; }
		var c = regs[1];
		if (c.length == 6) {
			var r = parseInt(c.slice(0,2),16)/255;
			var g = parseInt(c.slice(2,4),16)/255;
			var b = parseInt(c.slice(4,6),16)/255;
			return [r,g,b];
		} else if (c.length == 3) {
			var r = parseInt(c.charAt(0),16)*17/255;
			var g = parseInt(c.charAt(1),16)*17/255;
			var b = parseInt(c.charAt(2),16)*17/255;
			return [r,g,b]
		} else { return false; }
	} else { /* dec */
		var regs = str.match(/ *\( *([0-9]+) *, *([0-9]+) *, *([0-9]+)/);
		if (!regs) { return false; }
		r = parseInt(regs[1],10)/255;
		g = parseInt(regs[2],10)/255;
		b = parseInt(regs[3],10)/255;
		return [r,g,b];
	}
}

/**
 * @method 
 * @param {string} str retezec, jenz mame naparsovat
 * @returns {string || false} cast s validni emailovou adresou, pokud lze. V opacnem pripade false
 */
SZN.Parser.email = function(str) {
	var regs = str.match(/[a-z][a-z0-9.-_]*@[a-z0-9][a-z0-9.-_]*.[a-z]{2,5}/i);
	if (regs) {
		return regs[0];
	} else { return false; }
}
