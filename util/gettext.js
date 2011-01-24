/* gettext pro sosani stringu z JSON slovniku */
JAK._ = function(key) {
	var arr = key.split(".");
	var d = DICT;
	
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
	
	
	if(typeof d == "string") {
		var args = arguments;
		var index = 1;
		var clb = function(str,pos,text) {
			if(text.charAt(pos - 1) == "%"){
				return str
			} else {
				return args[index++];
			}
		}
		return d.replace(/%s/g,clb);
	} else {
		return key;
	}
};

window._ = JAK._;
