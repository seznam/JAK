/**
 * @overview detekce prohlizece
 * @version 2.0
 * @author : jelc, zara
 */   


/**
 * @static
 * @name SZN.Browser
 * @class Detekce klientskeho prostredi v zavislosti na vlastnostech javascriptu
 * (pokud je to mozne jinak dle vlastnosti navigator.userAgent)
 *
 */
SZN.Browser = SZN.ClassMaker.makeClass({
	NAME: "Browser",
	VERSION: "2.0",
	CLASS: "static"
});

/** @field {string} platform system uzivatele */
SZN.Browser.platform = '';
/** @field {string} klient prohlizec uzivatele */
SZN.Browser.klient = '';
/** @field {string} version verze prohlizece */
SZN.Browser.version = 0;
/** @field {string} agent hodnota systemove promene "navigator.userAgent" */
SZN.Browser.agent = '';

/**
 * @private
 * @method zjistuje system uzivatele
 * @returns {string} ktery popisuje pouzivany system:
 * <ul>
 * <li>nix - Linux, BSD apod.</li>
 * <li>mac - Apple</li>
 * <li>win - Windows pro PC</li>
 * <li>oth - vsechno ostatni</li>  
 * </ul>    
 *
 */   
SZN.Browser._getPlatform = function(){
	if((this._agent.indexOf('X11') != -1) 
	|| (this._agent.indexOf('Linux') != -1)){
		return 'nix';
	} else if(this._agent.indexOf('Mac') != -1){
		return 'mac';
	} else if(this._agent.indexOf('Win') != -1){
		return 'win';
	} else {
		return 'oth';
	}
};

/**
 * @private
 * @method zjistuje typ prohlizece
 * @returns {string} ktery popisuje pouzivany prohlizec
 * <ul>
 * <li>opera - Opera</li>
 * <li>ie - Internet Explorer</li>
 * <li>gecko - Mozilla like</li>
 * <li>konqueror - Konqueror</li>  
 * <li>safari - Safari</li>  
 * <li>oth - vsechno ostatni/neznamy</li>  
 * </ul>  
 */   
SZN.Browser._getKlient = function(){
	if(window.opera){
		return 'opera';
	} else if(document.attachEvent 
	&& (typeof navigator.systemLanguage != 'undefined')){
		return 'ie';
	} else if (document.getAnonymousElementByAttribute){
		return 'gecko';
	} else if(this._agent.indexOf('KHTML')){
		if(this._vendor == 'KDE'){
			return 'konqueror';
		} else {
			return 'safari';
		}
	} else {
		return 'oth';
	}
};

/**
 * @private 
 * @method Nastavuje identifikaci leveho a praveho tlacitka mysi
 * @returns {object} jako asociativni pole s vlastnostmi
 * <em>left</em> a <em>right</em>, ktere obsahuji ciselny identifikator
 * stisknuteho tlacitka mysi jak ho klient vraci ve vlastnosti udalosti
 * <em>e.button</em>
 */
SZN.Browser._getMouse = function(){
	var left;
	var right;
	var middle;
	if ((SZN.Browser.klient == 'ie') || (SZN.Browser.klient == 'konqueror')){
		left = 1;
		middle = 4;
		right = 2;
	} else if((SZN.Browser.klient == 'opera') && (SZN.Browser.version > 7) && (SZN.Browser.version < 9)) {
		left = 1;
		middle = 4;
		right = 2;
	} else if (SZN.Browser.klient == 'safari'){
		if(parseInt(SZN.Browser.version) > 2){
			left = 0;
			middle = 0;
			right = 2;
		} else {
			left = 1;
			middle = 1;
			right = 2;
		}
	} else {
		left = 0;
		middle = 1;
		right = 2;
	}
	
	return {left:left,right:right, middle:middle};	
}

/**
 * @private
 * @method zjistuje verzi daneho prohlizece, detekovaneho metodou "_getKlient"
 * @returns {string} navratova hodnota metod jejich nazev je slozeny z retezcu
 * '_get_' + vlastnost <em>klient</em>  + '_ver'
 * @example  <pre>
 * pro Internet Exlporer je volana metoda <em>this._get_ie_ver()</em>
 *</pre>    
 */   
SZN.Browser._getVersion = function(){
	var out = 0;
	var fncName = '_get_' + this.klient + '_ver';
	
	if(typeof this[fncName] == 'function'){
		return this[fncName]();
	} else {
		return 0;
	}
};

/**
 * @private
 * @method detekce verze Internet Exploreru
 * @returns {string} verze prohlizece od 5.0 do 7 (IE 8 bude detekovano jako 7)
 */   
SZN.Browser._get_ie_ver = function(){
	if(typeof Function.prototype.call != 'undefined'){
		if(window.XMLHttpRequest){
			return '7';
		} else if (typeof document.doctype == 'object'){
			return '6';
		} else {
			return '5.5';
		}
	} else {
		return '5.0';
	}
};

/**
 * @private
 * @method detekce verze Opery
 * @returns {string} verze prohlizece od 6 do 9 (> 9 bude detekovano jako 9)
 */  
SZN.Browser._get_opera_ver = function(){
	if(document.designMode && document.execCommand){
		if(typeof Object.__defineGetter__ == 'function'){
			return '9.5';
		} else {
			return '9';
		}
	} else if((document.selection) && (document.createRange)){
		return '8';
	} else if(document.createComment){
		return '7';
	} else {
		return '6';
	}
};

/**
 * @private
 * @method detekce verze Gecko prohlizecu
 * @returns {string} verze prohlizece od 1.5do 2 (> 2 bude detekovano jako 2)
 */ 
SZN.Browser._get_gecko_ver = function(){
	if(window.external){
		return '2';
	} else {
		return '1.5';
	}
};

/**
 * @private
 * @method detekce verze Konqueroru
 * @returns {string} verze prohlizece na zaklade hodnot uvedenych v navigator.userAgent
 * detekuji se prvni dve cisla (3.4,3.5,3.6 atd...) 
 */ 
SZN.Browser._get_konqueror_ver = function(){
	var num = this._agent.indexOf('KHTML') + 6;
	var part =  this._agent.substring(num);
	var end = part.indexOf(' ')
	var x = part.substring(0,end - 2);
	return x;
	
};

/**
 * @private
 * @method detekce verze Safari
 * @returns {string} verze verze se nedetekuje vraci 1
 */ 
SZN.Browser._get_safari_ver = function(){
	return '1';
};

/**
 * @method implicitni konkstruktor
 */   
SZN.Browser._getBrowser = function(){
	this._agent = this.agent = navigator.userAgent;
	this._platform = navigator.platform;
	this._vendor = navigator.vendor;
	this.platform = this._getPlatform();
	this.klient = this._getKlient();
	this.version = this._getVersion();
	this.mouse = this._getMouse();
};
SZN.Browser._getBrowser();
