/**
 * Vykreslí upozornění na stáhnutí appky pro android
 * Zobrazí se jen na android zařízeních
 * Po zavření upozornění se nastaví cookie na dobu, po kterou se nemá toto upozornění zobrazovat (default 1 měsíc)
 * Ve verzi 1.1 byla pridana moznost zadat v options id, aby mohlo byt na sluzbe vice widgetu pro vice aplikaci.
 */
JAK.AndroidAppPromotion = JAK.ClassMaker.makeClass({
	NAME: "JAK.AndroidAppPromotion",
	VERSION: "1.1",
	DEPEND:[{
		sClass:JAK.Cookie,
		ver: "1.0"
	}]
});

/**
 * Konstruktor AppPromotion.
 * @example
 * var opt = { 'name': 'Seznam.cz', 'logo': '/st/img/androidAppPromotion/seznam-app-icon.png','appLink': 'https://play.google.com/store/apps/details?id=cz.seznam.sbrowser' };
 * new JAK.AndroidAppPromotion(JAK.gel('promotionWrapper'), opt, mujObjekt.metoda.bind(mujObjekt));
 
 * @param {obj} [container] DOM uzel do kterého se má vložit upozornění

 * @param {object} [options] nastavení banneru
 * @param {string} [options.id] id widgetu pro pripad, ze chceme mit notifikace vice aplikaci
 * @param {string} [options.name] název aplikace (Stream.cz)
 * @param {string} [options.developer] vývojář (Seznam.cz a.s.)
 * @param {float}  [options.rating] hodnocení - číslo v rozmezí 0-100 (procenta) (pokud není zadáno, nezobrazuje se)
 * @param {string} [options.logo] url na logo aplikace
 * @param {string} [options.appLink] url na aplikaci v google play
 * @param {Date}   [options.cookieExpire] datum expirace cookie
 * @param {string} [options.widgetsImgPath] cesta k obrázkům widgetu

 * @param {object} [callback] metoda která se provede po zavření upozornění (volitelné)
 */

JAK.AndroidAppPromotion.prototype.$constructor = function(container,options, callback) {

	this.container 				= container;
	this.opt 					= this._makeOptions(options);
	this.callback 				= callback || null;
	this.ec 					= [];

	if(JAK.Browser.platform == 'and') { // upozorneni zobrazime pouze na androidech
		if(!JAK.Cookie.getInstance().get('andAppPromotion' + this.opt.id)) { // zobrazime pokud neexistuje cookie
			this._build();
			return;	
		}		
	}

	this._hide();
};

/*
 * vytvoří nastavení
 * @returns {object} nastavení
*/
JAK.AndroidAppPromotion.prototype._makeOptions = function(options) {
	var expire = this._setCookieExpire();
	opt = { /* defaultní nastaveni */
		'id': '',
		'name': 'Název aplikace',
		'developer': 'Seznam.cz a.s',
		'rating': null,
		'logo': '',
		'appLink': '',
		'widgetsImgPath': '/static/js/lib/jak/widgets/androidAppPromotion/img',
		'cookieExpire': expire
	};

	for (var i in options) {
		opt[i] = options[i];
	}
	
	return opt;
}

/*
 * nastaví expiraci cookie za 1 mesic
 * @returns {Date} datum kdy ma vyprset cookie
*/
JAK.AndroidAppPromotion.prototype._setCookieExpire = function() {
	var expireDate = new Date();	
	expireDate.setMonth(expireDate.getMonth() + 1);
	return expireDate;
}

/*
 * vykreslí upoutávku
*/
JAK.AndroidAppPromotion.prototype._build = function() {
	JAK.DOM.addClass(this.container,'appPromotion');

	var close = JAK.mel("img", {src: this.opt.widgetsImgPath + '/close.png', alt:'zavřít', id:'apClose'});
	this.ec.push(JAK.Events.addListener(close, 'click', this, '_close'));
	this.container.appendChild(close);	

	var logo = JAK.mel("img", {src: this.opt.logo, alt:'', className:'apLogo'});
	this.container.appendChild(logo);

	var info = JAK.mel("div", {className:'apInfo'});

	/* nastavime hodnoceni pokud je definovano */
	var ratingHtml = '';
	if(this.opt.rating != null) {
		var ratingWidth = this.opt.rating;
		ratingHtml = '<li class="rating"><span class="stars" style="background: url('+ this.opt.widgetsImgPath + '/star.png) 0 0 repeat;"></span><span class="progress" style="width:'+ ratingWidth +'%"></span></li>';
	}

	info.innerHTML = '<h4>'+ this.opt.name +'</h4><ul><li>'+ this.opt.developer +'</li>'+ratingHtml+'<li class="apFree">Zadarmo v Google play</li></ul></div>';
	this.container.appendChild(info);

	//var install = JAK.cel('a', null ,'apInstall');
	var install = JAK.mel("a", {id:'apInstall'});
	install.href = this.opt.appLink;
	install.innerHTML = 'Nainstalovat';
	this.container.appendChild(install);
};

/*
 * skryje upoutávku a nastaví do cookie za jak dolouho se má znovu objevit 
*/
JAK.AndroidAppPromotion.prototype._close = function() {	
    var cookieOptions = {
    	'expires': this.opt.cookieExpire
    }
	JAK.Cookie.getInstance().set('andAppPromotion' + this.opt.id,'noShow',cookieOptions);
		
	this.container.style.height = "0px";
	setTimeout(this._hide.bind(this), 500);
	
	if(this.callback) {
		setTimeout(this._executeCallbacks.bind(this), 500);
	}
};

/*
 * skryje upoutávku
*/
JAK.AndroidAppPromotion.prototype._hide = function() {
	JAK.DOM.addClass(this.container,'noDisplay');
	this.$destructor();
};

/**
 * Zpracuje callback
 */
JAK.AndroidAppPromotion.prototype._executeCallbacks = function() {
	this.callback();
};

/**
 * Zruší navěšené posluchače a smaže DOM
 */
JAK.AndroidAppPromotion.prototype.$destructor = function() {
	this.container.innerHTML = '';
	JAK.Events.removeListeners(this.ec);
}

