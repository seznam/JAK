
JAX._getCSSSuffix = function(_value){
	var value = parseFloat(_value);
	var suffix = (_value+"").replace( value, "" );
	return { "value": value, "suffix": suffix };
}

JAX._animatePXUnits = ["height","width","font-size","left","top","right","bottom"];

if( typeof(JAK.Parser) == "undefined" ){
	JAK.Parser = {};
	/**
	 * @param {string} str retezec, jenz mame naparsovat
	 * @returns {object || false} literalovy objekt, pokud lze. V opacnem pripade false
	 */
	JAK.Parser.color = function(str) {
		var obj = {r:0, g:0, b:0};

		if (str.indexOf("#") != -1) { /* hex */
			var regs = str.trim().match(/^#([a-f0-9]+)$/i);
			//console.log(str);
			if (!regs) { return false; }
			var c = regs[1];
			if (c.length == 6) {
				obj.r = parseInt(c.slice(0,2),16);
				obj.g = parseInt(c.slice(2,4),16);
				obj.b = parseInt(c.slice(4,6),16);
				return obj;
			} else if (c.length == 3) {
				obj.r = parseInt(c.charAt(0),16)*17;
				obj.g = parseInt(c.charAt(1),16)*17;
				obj.b = parseInt(c.charAt(2),16)*17;
				return obj;
			} else { return false; }
		} else { /* dec */
			var regs = str.match(/ *\( *([0-9]+) *, *([0-9]+) *, *([0-9]+)/);
			if (!regs) { return false; }
			obj.r = parseInt(regs[1],10);
			obj.g = parseInt(regs[2],10);
			obj.b = parseInt(regs[3],10);
			return obj;
		}
	}
}
