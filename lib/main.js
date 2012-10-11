/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/

/**
 * @overview Deklarace "jmenného prostoru" knihoven JAK. Dále obsahuje rozšíření
 * práce s poli dle definice JavaScriptu verze 1.6. Při použití této knihovny je
 * nutné pole vždy procházet pomocí for (var i=0; arr.length > i; i++).  
 * @author jelc 
 */ 

/**
 * @name JAK
 * @group jak
 * @namespace
 * JAK statický objekt, který se používá pro "zapouzdření"
 * všech definic a deklarací. V podmínce se nalezá pro
 * jistotu, protože může být definován ještě před svou
 * deklarací při použití slovníků, nebo konfigurací. 
 */
if (typeof(window.JAK) != 'object'){
	window.JAK = {NAME: "JAK"};
};

/**
 * generátor unikatních ID
 * @static
 * @returns {string} unikátní ID
 */
JAK.idGenerator = function(){
	this.idCnt = this.idCnt < 10000000 ? this.idCnt : 0;
	var ids = 'm' +  new Date().getTime().toString(16) +  'm' + this.idCnt.toString(16);
	this.idCnt++;
	return ids;	
};

if (!Function.prototype.bind) {
	/**
	 * ES5 Function.prototype.bind
	 * Vrací funkci zbindovanou do zadaného kontextu.
	 * Zbylé volitelné parametry jsou předány volání vnitřní funkce.
	 * @param {object} thisObj Nový kontext
	 * @returns {function}
	 */
	Function.prototype.bind = function(thisObj) { 
		var fn = this;
		var args = Array.prototype.slice.call(arguments, 1); 
		return function() { 
			return fn.apply(thisObj, args.concat(Array.prototype.slice.call(arguments))); 
		}
	}
};

if (!Date.now) {
	/** 
	 * aktuální timestamp dle ES5 - http://dailyjs.com/2010/01/07/ecmascript5-date/
	 */
	Date.now = function() { return +(new Date); }
}

if (!Object.create) {
	/** 
	 * Object.create dle ES5 - https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Object/create
	 */
	Object.create = function (o) {
		if (arguments.length > 1) { throw new Error("Object.create polyfill only accepts the first parameter"); }
		var tmp = function() {};
		tmp.prototype = o;
		return new tmp();
	};
}

/** 
 * rozšíření polí v JS 1.6 dle definice na http://dev.mozilla.org
 */
if (!Array.prototype.indexOf) { 
	Array.prototype.indexOf = function(item, from) {
	    var len = this.length;
	    var i = from || 0;
	    if (i < 0) { i += len; }
	    for (;i<len;i++) {
			if (i in this && this[i] === item) { return i; }
	    }
	    return -1;
	}
}
if (!Array.indexOf) {
	Array.indexOf = function(obj, item, from) { return Array.prototype.indexOf.call(obj, item, from); }
}

if (!Array.prototype.lastIndexOf) { 
	Array.prototype.lastIndexOf = function(item, from) {
	    var len = this.length;
		var i = (from === undefined ? len-1 : from);
		if (i < 0) { i += len; }
	    for (;i>-1;i--) {
			if (i in this && this[i] === item) { return i; }
	    }
	    return -1;
	}
}
if (!Array.lastIndexOf) {
	Array.lastIndexOf = function(obj, item, from) {
		if (arguments.length > 2) {
			return Array.prototype.lastIndexOf.call(obj, item, from);
		} else {
			return Array.prototype.lastIndexOf.call(obj, item);
		}
	}
}

if (!Array.prototype.forEach) { 
	Array.prototype.forEach = function(cb, _this) {
	    var len = this.length;
	    for (var i=0;i<len;i++) { 
			if (i in this) { cb.call(_this, this[i], i, this); }
		}
	}
}
if (!Array.forEach) { 
	Array.forEach = function(obj, cb, _this) { Array.prototype.forEach.call(obj, cb, _this); }
}

if (!Array.prototype.every) { 
	Array.prototype.every = function(cb, _this) {
	    var len = this.length;
	    for (var i=0;i<len;i++) {
			if (i in this && !cb.call(_this, this[i], i, this)) { return false; }
	    }
	    return true;
	}
}
if (!Array.every) { 
	Array.every = function(obj, cb, _this) { return Array.prototype.every.call(obj, cb, _this); }
}

if (!Array.prototype.some) { 
	Array.prototype.some = function(cb, _this) {
		var len = this.length;
		for (var i=0;i<len;i++) {
			if (i in this && cb.call(_this, this[i], i, this)) { return true; }
		}
		return false;
	}
}
if (!Array.some) { 
	Array.some = function(obj, cb, _this) { return Array.prototype.some.call(obj, cb, _this); }
}

if (!Array.prototype.map) { 
	Array.prototype.map = function(cb, _this) {
		var len = this.length;
		var res = new Array(len);
		for (var i=0;i<len;i++) {
			if (i in this) { res[i] = cb.call(_this, this[i], i, this); }
		}
		return res;
	}
}
if (!Array.map) { 
	Array.map = function(obj, cb, _this) { return Array.prototype.map.call(obj, cb, _this); }
}

if (!Array.prototype.filter) { 
	Array.prototype.filter = function(cb, _this) {
		var len = this.length;
	    var res = [];
			for (var i=0;i<len;i++) {
				if (i in this) {
					var val = this[i]; // in case fun mutates this
					if (cb.call(_this, val, i, this)) { res.push(val); }
				}
			}
	    return res;
	}
}
if (!Array.filter) { 
	Array.filter = function(obj, cb, _this) { return Array.prototype.filter.call(obj, cb, _this); }
}

/** 
 * Doplneni zadanym znakem zleva na pozadovanou delku
 */
String.prototype.lpad = function(character, count) {
	var ch = character || "0";
	var cnt = count || 2;

	var s = "";
	while (s.length < (cnt - this.length)) { s += ch; }
	s = s.substring(0, cnt-this.length);
	return s+this;
}


/** 
 * Doplneni zadanym znakem zprava na pozadovanou delku
 */
String.prototype.rpad = function(character, count) {
	var ch = character || "0";
	var cnt = count || 2;

	var s = "";
	while (s.length < (cnt - this.length)) { s += ch; }
	s = s.substring(0, cnt-this.length);
	return this+s;
}

/** 
 * Oriznuti bilych znaku ze zacatku a konce retezce
 */
String.prototype.trim = function() {
	return this.match(/^\s*([\s\S]*?)\s*$/)[1];
}
if (!String.trim) {
	String.trim = function(obj) { return String.prototype.trim.call(obj);}
}

/** 
 * Doplneni toISOString kde neni, viz https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Date/toISOString
 */
if (!Date.prototype.toISOString) {  
	(function() {  
		function pad(number) {  
			var r = String(number);  
			if ( r.length === 1 ) {  
				r = '0' + r;  
			}  
			return r;  
		}  
   
		Date.prototype.toISOString = function() {  
			return this.getUTCFullYear()  
				+ '-' + pad( this.getUTCMonth() + 1 )  
				+ '-' + pad( this.getUTCDate() )  
				+ 'T' + pad( this.getUTCHours() )  
				+ ':' + pad( this.getUTCMinutes() )  
				+ ':' + pad( this.getUTCSeconds() )  
				+ '.' + String( (this.getUTCMilliseconds()/1000).toFixed(3) ).slice( 2, 5 )  
				+ 'Z';  
		};  
	}());  
} 

Date.prototype._dayNames = ["Pondělí", "Úterý", "Středa", "Čtvrtek", "Pátek", "Sobota", "Neděle"];
Date.prototype._dayNamesShort = ["Po", "Út", "St", "Čt", "Pá", "So", "Ne"];
Date.prototype._monthNames = ["Leden", "Únor", "Březen", "Duben", "Květen", "Červen", "Červenec", "Srpen", "Září", "Říjen", "Listopad", "Prosinec"];
Date.prototype._monthNamesShort = ["Led", "Úno", "Bře", "Dub", "Kvě", "Čer", "Črc", "Srp", "Zář", "Říj", "Lis", "Pro"];

/** 
 * Formatovani data shodne s http://php.net/date
 */
Date.prototype.format = function(str) {
	var suffixes = {
		1:"st",
		2:"nd",
		3:"rd",
		21:"st",
		22:"nd",
		23:"rd",
		31:"st"
	};
	var result = "";
	var escape = false;
	for (var i=0;i<str.length;i++) {
		var ch = str.charAt(i);
		if (escape) {
			escape = false;
			result += ch;
			continue;
		}
		switch (ch) {
			case "\\":
				if (escape) {
					escape = false;
					result += ch;
				} else {
					escape = true;
				}
			break;
			case "d": result += this.getDate().toString().lpad(); break;
			case "j": result += this.getDate(); break;
			case "w": result += this.getDay(); break;
			case "N": result += this.getDay() || 7; break;
			case "S": 
				var d = this.getDate();
				result += suffixes[d] || "th";
			break;
			case "D": result += this._dayNamesShort[(this.getDay() || 7)-1]; break;
			case "l": result += this._dayNames[(this.getDay() || 7)-1]; break;
			case "z":
				var t = this.getTime();
				var d = new Date(t);
				d.setDate(1);
				d.setMonth(0);
				var diff = t - d.getTime();
				result += diff / (1000 * 60 * 60 * 24);
			break;
			
			case "W":
				var d = new Date(this.getFullYear(), this.getMonth(), this.getDate());
				var day = d.getDay() || 7;
				d.setDate(d.getDate() + (4-day));
				var year = d.getFullYear();
				var day = Math.floor((d.getTime() - new Date(year, 0, 1, -6)) / (1000 * 60 * 60 * 24));
				result += (1 + Math.floor(day / 7)).toString().lpad();
			break;

			case "m": result += (this.getMonth()+1).toString().lpad(); break;
			case "n": result += (this.getMonth()+1); break;
			case "M": result += this._monthNamesShort[this.getMonth()]; break;
			case "F": result += this._monthNames[this.getMonth()]; break;
			case "t":
				var t = this.getTime();
				var m = this.getMonth();
				var d = new Date(t);
				var day = 0;
				do {
					day = d.getDate();
					t += 1000 * 60 * 60 * 24;
					d = new Date(t);
				} while (m == d.getMonth());
				result += day;
			break;

			case "L":
				var d = new Date(this.getTime());
				d.setDate(1);
				d.setMonth(1);
				d.setDate(29);
				result += (d.getMonth() == 1 ? "1" : "0");
			break;
			case "Y": result += this.getFullYear().toString().lpad(); break;
			case "y": result += this.getFullYear().toString().lpad().substring(2); break;

			case "a": result += (this.getHours() < 12 ? "am" : "pm"); break;
			case "A": result += (this.getHours() < 12 ? "AM" : "PM"); break;
			case "G": result += this.getHours(); break;
			case "H": result += this.getHours().toString().lpad(); break;
			case "g": result += this.getHours() % 12; break;
			case "h": result += (this.getHours() % 12).toString().lpad(); break;
			case "i": result += this.getMinutes().toString().lpad(); break;
			case "s": result += this.getSeconds().toString().lpad(); break;
			
			case "Z": result += -60*this.getTimezoneOffset(); break;
			
			case "O": 
			case "P": 
				var base = this.getTimezoneOffset()/-60;
				var o = Math.abs(base).toString().lpad();
				if (ch == "P") { o += ":"; }
				o += "00";
				result += (base >= 0 ? "+" : "-")+o;
			break;

			case "U": result += this.getTime()/1000; break; 
			case "u": result += "0"; break; 
			case "c": result += arguments.callee.call(this, "Y-m-d")+"T"+arguments.callee.call(this, "H:i:sP"); break; 
			case "r": result += arguments.callee.call(this, "D, j M Y H:i:s O"); break; 

			default: result += ch; break;
		}
	}
	return result;
}

if (!window.JSON) {
	(function(){
        var escapes = {
			'\b': '\\b',
			'\t': '\\t',
			'\n': '\\n',
			'\f': '\\f',
			'\r': '\\r',
			'"' : '\\"',
			'\\': '\\\\'
        };	
        var re = "[";
        for (var p in escapes) { re += "\\"+p; }
        re += "]";
        re = new RegExp(re, "g");

		var stringifyString = function(value) {
			var v = value.replace(re, function(ch) {
				return escapes[ch];
			});
			return '"' + v + '"';
		}
		
		var stringifyValue = function(value, replacer, space, depth) {
			var indent = new Array(depth+1).join(space);
			if (value === null) { return "null"; }

			switch (typeof(value)) {
				case "string":
					return stringifyString(value);
				break;
				
				case "boolean":
				case "number":
					return value.toString();
				break;
				
				case "object":
					var result = "";
					if (value instanceof Date) {
						result = stringifyString(value.toISOString());
					} else if (value instanceof Array) {
						result += "["; /* oteviraci se neodsazuje */
						for (var i=0;i<value.length;i++) {
							var v = value[i];

							if (i > 0) {
								result += ",";
								if (space.length) { result += "\n" + indent + space; } /* polozky se odsazuji o jednu vic */
							}
							result += arguments.callee(v, replacer, space, depth+1);
						}
						if (value.length > 1 && space.length) { result += "\n" + indent; } /* zaviraci se odsazuje na aktualni uroven */
						result += "]";

					} else {
						result += "{";
						var count = 0;
						for (var p in value) {
							var v = value[p];
							
							if (count > 0) { result += ","; }
							if (space.length) { result += "\n" + indent + space; } /* polozky se odsazuji o jednu vic */
							
							result += stringifyString(p)+":"+arguments.callee(v, replacer, space, depth+1);
							count++;
						}
						if (count > 0 && space.length) { result += "\n" + indent; } /* zaviraci se odsazuje na aktualni uroven */
						result += "}";
					}

					return result;
				break;
				
				case "undefined": 
				default:
					return "undefined";
				break;
			}
		}
		
		window.JSON = {
			parse: function(text) {
				return eval("("+text+")");
			},
			stringify: function(value, replacer, space) {
				var sp = "";
				if (typeof(space) == "number" && space > 1) {
					sp = new Array(space+1).join(" ");
				} else if (typeof(space) == "string") {
					sp = space;
				}
				
				return stringifyValue(value, replacer, sp, 0);
				
			}
		};
	})();
}
