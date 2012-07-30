/**
 * @class Rozhrani pro tridu, ktera se stara o vytvareni url z parametru a naopak o cteni parametru z url
 */
JAK.History2.IProcessor = JAK.ClassMaker.makeInterface({
	NAME: 'JAK.History2.IProcessor',
	VERSION: '1.0'
});

JAK.History2.IProcessor.prototype.parse = function(str) {
	if (typeof str == 'object') {
		return str;
	}	
	
	//... nejaka vlastni logika prevodu stringu na objekt s parametry...
	var obj = str;
	
	return obj;
}

JAK.History2.IProcessor.prototype.serialize = function(obj) {
	if (typeof obj == 'string' ) {
		return obj;
	}
	
	//... nejaka vlastni logika prevodu objektu na string ...
	var str = obj + '';
	
	return str;
}


/**
 * @class Konkretni implementace rozhrani History2.IProcessor - umi pracovat s url ve tvaru search stringu (?key=value&key2=value2&...)
 */
JAK.History2.KeyValue = JAK.ClassMaker.makeClass({
	NAME: 'JAK.History2.KeyValue',
	VERSION: '1.0',
	IMPLEMENT: JAK.History2.IProcessor
});

JAK.History2.KeyValue.prototype.$constructor = function() {
	
}

JAK.History2.KeyValue.prototype.parse = function(str) {
	if (typeof str == 'object') {
		return str;
	}
	
	var obj = {};
	
	var index = str.indexOf('#');
	str = (index != -1)? str.substring(0, index) : str;	
	
	var index = str.indexOf('?');
	str = (index != -1)? str.substring(index + 1) : '';	

	var parts = str.split('&');
	for (var i = 0; i < parts.length; i++) {
		if (!parts[i].length) {
			continue;
		}
		var tmp = parts[i].split('=');		
		var key = decodeURIComponent(tmp.shift());
		var value = decodeURIComponent(tmp.join('='));
		
		if (key in obj) { //uz tam je, bude to pole 
			if ( !(obj[key] instanceof Array) ) { //pokud to pole jeste neni, vyrobime 
				obj[key] = [obj[key]]; 
			}
			obj[key].push(value);
		} else {
			obj[key] = value;
		}
	}
	return obj;
}

JAK.History2.KeyValue.prototype.serialize = function(state) {
	if (typeof state == 'string' ) {
		return state;
	}
	
	var arr = [];
	for (var p in state) {
		var val = state[p];

		if ( !(val instanceof Array) ) {
			val = val + '';
			if (!val.length) {
				continue;
			}
			arr.push(encodeURIComponent(p) + '=' + encodeURIComponent(val));
		} else {
			for (var i = 0; i < val.length; i++) {
				arr.push(encodeURIComponent(p) + '=' + encodeURIComponent(val[i]));
			}
		}
	}
	return '?' + arr.join('&');
}
