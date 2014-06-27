/*
	Licencováno pod MIT Licencí, její celý text je uveden v souboru licence.txt
	Licenced under the MIT Licence, complete text is available in licence.txt file
*/


/**
 * @class Nastroj pro praci s cookie 
 * @version 1.1
 * @author jelc
 * @group jak-utils
 */   
JAK.Cookie = JAK.ClassMaker.makeSingleton({
	NAME: "JAK.Cookie",
	VERSION: "1.0"
});

/**
 * Vraci pole nazvu vsech dostupnych cookie dokumentu
 * @returns {array} pole nazvu dostupnych cookie
 */ 
JAK.Cookie.prototype.list = function() {
	var list = document.cookie.split(";").map(
		function(item){
			return item.split("=")[0].trim();
		}
	)
	return list;
};

/**
 * Vraci hodnotu cookie zadaneho jmena, pokud existuje, jinak null
 * @param {string} name nazev cookie, kterou chceme cist
 * @returns {string || null} hodnota cookie nebo null
 */ 
JAK.Cookie.prototype.get = function(name) {
	var index = this.list().indexOf(name);
	if(index == -1 ) {
		return null;
	}
	
	return document.cookie.split(";")[index].split("=").slice(1).join("=").trim();	
};

/**
 * Nastavuje nebo rusi cookie
 * @param {string} name nazev cookie
 * @param {string || null} hodnota cookie, pokud bude null, cookie se zrusi
 * @param {object} [cookieOptions] dalsi atributy cookie
 * @param {Date} [cookieOptions.expires] datum expirace cookie (instance Date)
 * @param {string} [cookieOptions.path] cesta cookie
 * @param {string} [cookieOptions.domain] domena cookie
 * @param {boolean} [cookieOptions.secure] urcuje zda cookie dstupna pouze pres https
 */ 
JAK.Cookie.prototype.set = function(name, value, cookieOptions) {
	if(value === null) {
		this._remove(name, cookieOptions);
		return;
	}
	var opt = this._makeOptions(cookieOptions);
	var ck = name + "=" + value + (opt ? ";" + opt : "");
	document.cookie = ck;		
};

/**
 * Vlastni odebrani cookie (nemusi se projevit okamzite), nastavi cookie
 * prazdnou hodnotu a datum expirace do minulosti 
 * @private 
 * @param {string} name jmeno rusene cookie
 * @param {object} [cookieOptions] dalsi atributy cookie
 * @param {string} [cookieOptions.path] cesta cookie
 * @param {string} [cookieOptions.domain] domena cookie
 */ 
JAK.Cookie.prototype._remove = function(name, cookieOptions) {
	var opt = "";
	if (!cookieOptions) {
		cookieOptions = {};
	} else {
		delete cookieOptions.secure;
	}
	cookieOptions.expires = new Date(1);
	opt = this._makeOptions(cookieOptions);
	document.cookie = name + "=;" + opt;
};

/**
 * Zpracovava (retezi) dalsi atributy cookie
 * @param {object} options dalsi atributy cookie 
 * @see JAK.Cookie#set 
 * @returns {string} zretezene atributy pripravene pro zapis
 */ 
JAK.Cookie.prototype._makeOptions = function(options) {
	var opt = [];
	for(var i in options){
		switch(i){
			case "expires":
				opt.push(i + "=" + options[i].toUTCString());
				break;
			case "secure":
				if(options[i]){
					opt.push(i);
				}
				break;
			case "domain":
			case "path":
				opt.push(i + "=" + options[i]);
				break;
			default:
				break;
		}
	
	}
	return opt.join(";");
};