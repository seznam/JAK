/**
 * gettext pro sosani stringu z JSON slovniku 
 * kromě klíče do slovníku je možné zadat libovolný další počet argumentů,
 * které nahradí postupně všechny výskyty řetězce '%s' v překladu
 * @param {string} key klic do slovniku umisteneho v JAK._.DICT 
 * @return {string} key nebo nalezený překlad
 */
JAK._ = function(key) {
	var arr = key.split(".");
	var d = JAK._.DICT;
	
	while (arr.length) {
		var x = arr.shift();
		if(arr.length && typeof d[x] == "string") {
			return key;
		}
		
		if(!(x in d)) {
			return key;
		}
		d = d[x];
	}
	
	
	if (typeof(d) == "string") {
		var args = arguments;
		var index = 1;
		var clb = function(str,pos,text) {
			if (text.charAt(pos - 1) == "%"){
				return str;
			} else {
				return args[index++] + ""; /* IE pri undefined vrati prazdny string */
			}
		}
		return d.replace(/%s/g, clb);
	} else {
		return key;
	}
};
JAK._.DICT = {};
window._ = JAK._;
