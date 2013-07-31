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
 * JAK statický objekt, který se používá pro zapouzdření všech definic a deklarací.
 * @namespace
 * @group jak
 */
var JAK = {NAME: "JAK", _idCnt: 0};

/**
 * generátor unikátních ID
 * @static
 * @returns {string} unikátní ID
 */
JAK.idGenerator = function() {
	this._idCnt = (this._idCnt < 10000000 ? this._idCnt : 0);
	var id = 'm' +  new Date().getTime().toString(16) +  'm' + this._idCnt.toString(16);
	this._idCnt++;
	return id;
};

/** 
 * Doplneni zadanym znakem zleva na pozadovanou delku
 * @param {string} [character]
 * @param {number} [count]
 */
String.prototype.lpad = function(character, count) {
	var ch = character || "0";
	var cnt = count || 2;

	var s = "";
	while (s.length < (cnt - this.length)) { s += ch; }
	s = s.substring(0, cnt-this.length);
	return s+this.toString();
}

/** 
 * Doplneni zadanym znakem zprava na pozadovanou delku
 * @param {string} [character]
 * @param {number} [count]
 */
String.prototype.rpad = function(character, count) {
	var ch = character || "0";
	var cnt = count || 2;

	var s = "";
	while (s.length < (cnt - this.length)) { s += ch; }
	s = s.substring(0, cnt-this.length);
	return this.toString()+s;
}

/** 
 * porovnani retezcu na zaklade znaku z ceske abecedy
 */
String.prototype.CS_ALPHABET = "0123456789AÁBCČDĎEĚÉFGHCHIÍJKLMNŇOÓPQRŘSŠTŤUÚŮVWXYÝZŽaábcčdďeěéfghchiíjklmnňoópqrřsštťuúůvwxyýzž";

String.prototype.localeCSCompare = function(value) {
	value += ""; // explicitne prevedeme na string
	if (this+"" === value) { return 0; } // pokud jsou retezce totozne, neni co resit, vracime 0

	/* chceme vzdy jako parametr zpracovavat primarne kratsi retezec */
	if (this.length < value.length) { return -value.localeCSCompare(this); }

	/* zjistime, ktery retezec je kratsi a pomoci nej se bude cyklus ridit */
	var i = 0;
	var j = 0;
	var length = value.length;
	var charValue = '';
	var charThis = '';
	var indexValue = 0;
	var indexThis = 0;

	while (i < length) {
		/* nacteme vzdy jeden znak z kazdeho z retezcu */
		charValue = value.charAt(i);
		charThis = this.charAt(j);

		/* c je podezrely znak, protoze po nem muze nasledovat h a mame najednou znak ch */
		if (charThis.toLowerCase() == 'c') {
			var tempString = this.substring(j, j + 2);
			if (tempString == "ch" || tempString == "CH") {
				j++;
				charThis = tempString;
			}
		}

		/* to stejne plati i pro druhy retezec, c je podezrely znak pouze v pripade, ze neni na konci retezce */
		if (charValue.toLowerCase() == 'c') {
			var tempString = value.substring(i, i + 2);
			if (tempString == "ch" || tempString == "CH") {
				i++;
				charValue = tempString;
			}
		}

		/* zjistime si, kde se v nasi abecede nachazi */
		indexValue = this.CS_ALPHABET.indexOf(charValue);
		indexThis = this.CS_ALPHABET.indexOf(charThis);

		/* pokud jsme narazili na ruzne znaky, koncime */
		if (charValue != charThis) { break; }

		/* jinak zvetsime o jednicku a pokracujeme */
		i++; j++;
	}
	
	if (i == length) { return 1; } /* zadny rozdil => this je nadmnozina value */

	if (indexValue == indexThis) { /* oba mimo abecedu */
		return charThis.localeCompare(charValue);
	} else if (indexThis == -1) { /* tento mimo abecedu */
		return -1;
	} else if (indexValue == -1) { /* druhy mimo abecedu */
		return 1;
	} else {
		return indexThis - indexValue; /* rozdil indexu v abecede */
	}
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
				var day = Math.floor((d.getTime() - new Date(year, 0, 1, -6).getTime()) / (1000 * 60 * 60 * 24));
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
